'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { config } from '../config.ts'
import { acceptHop, addNeed, postItem } from './actions.ts'
import { addDays, daysBetween, isDay, today } from './dates.ts'
import { getMe, PERSON_COOKIE } from './me.ts'
import {
  confirmSlip,
  createPerson,
  dismissItem,
  findPerson,
  forget,
  recordVisit,
  rememberSearch,
  restoreItem,
  updateProfile,
  WINDOWS,
  type ProfilePatch,
} from './memory.ts'
import { routes } from './routes.ts'
import { mutate, type PickupWindow } from './runtime.ts'
import { snapshot } from './store.ts'

/**
 * Relay's form actions: signing in, setup, asking, booking, lending, and the
 * controls over what Relay remembers. Where each one lands afterwards is in
 * ./routes.ts.
 *
 * Server Functions are reachable by direct POST, so each one resolves the
 * signed-in person itself and validates its own input; nothing trusts a hidden
 * field for identity.
 */

const text = (fd: FormData, key: string) => String(fd.get(key) ?? '').trim()
const query = (o: Record<string, string>) => new URLSearchParams(o).toString()

async function signInAs(id: string) {
  ;(await cookies()).set(PERSON_COOKIE, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
}

async function signedIn() {
  const me = await getMe()
  if (!me) redirect(routes.signIn)
  return me
}

function readWindow(fd: FormData) {
  const t = today()
  let from = text(fd, 'from')
  let to = text(fd, 'to')
  if (!isDay(from) || from < t) from = addDays(t, 1)
  if (!isDay(to) || to <= from) to = addDays(from, 2)
  return { from, to }
}

function readProfile(fd: FormData, fallbackName: string): ProfilePatch | { error: string } {
  const name = text(fd, 'name').slice(0, 40) || fallbackName
  const neighbourhood = text(fd, 'neighbourhood')
  if (!config.locations.includes(neighbourhood)) return { error: 'where' }
  const pickupWindows = fd
    .getAll('windows')
    .map(String)
    .filter((w): w is PickupWindow => (WINDOWS as string[]).includes(w))
  if (pickupWindows.length === 0) return { error: 'when' }
  const awayFrom = text(fd, 'awayFrom')
  const awayUntil = text(fd, 'awayUntil')
  if ((awayFrom || awayUntil) && !(isDay(awayFrom) && isDay(awayUntil) && awayUntil > awayFrom)) {
    return { error: 'away' }
  }
  return { name, neighbourhood, pickupWindows, awayFrom: awayFrom || null, awayUntil: awayUntil || null }
}

// ---------------------------------------------------------------- identity

export async function startNew(formData: FormData) {
  const name = text(formData, 'name').slice(0, 40)
  if (name.length < 2) redirect(`${routes.signIn}?error=name`)
  const profile = createPerson(name)
  await signInAs(profile.id)
  redirect(routes.setup)
}

export async function continueAs(formData: FormData) {
  const person = findPerson(text(formData, 'personId'))
  if (!person) redirect(routes.signIn)
  recordVisit(person)
  await signInAs(person.id)
  redirect(routes.need)
}

export async function signOut() {
  ;(await cookies()).delete(PERSON_COOKIE)
  redirect(routes.signIn)
}

export async function saveSetup(formData: FormData) {
  const me = await signedIn()
  const patch = readProfile(formData, me.profile.name)
  if ('error' in patch) redirect(`${routes.setup}?error=${patch.error}`)
  updateProfile(me.id, { ...patch, setupDone: true })
  redirect(routes.need)
}

export async function saveProfile(formData: FormData) {
  const me = await signedIn()
  const patch = readProfile(formData, me.profile.name)
  if ('error' in patch) redirect(`${routes.profile}?error=${patch.error}`)
  updateProfile(me.id, patch)
  revalidatePath('/', 'layout')
  redirect(`${routes.profile}?saved=1`)
}

// ---------------------------------------------------------------- need

export async function find(formData: FormData) {
  const me = await signedIn()
  const q = text(formData, 'q').slice(0, 400)
  const { from, to } = readWindow(formData)
  if (q.length < 3) redirect(`${routes.need}?${query({ from, to, error: 'short' })}`)
  rememberSearch(me.id, { text: q, from, to })
  redirect(`${routes.need}?${query({ q, from, to })}`)
}

/** Take back a booking the route couldn't carry: the accepted hop, its need, and that need's scores. */
function unbook(acceptedId: string, needId: string) {
  mutate((r) => {
    r.accepted = r.accepted.filter((a) => a.id !== acceptedId)
    r.needs = r.needs.filter((n) => n.id !== needId)
    for (const key of Object.keys(r.matches)) {
      if (key.startsWith(`${needId}|`)) delete r.matches[key]
    }
  })
}

export async function book(formData: FormData) {
  const me = await signedIn()
  const itemId = text(formData, 'itemId')
  const q = text(formData, 'q').slice(0, 400)
  const { from, to } = readWindow(formData)
  const item = snapshot().itemById(itemId)
  if (!item || item.holderId === me.id || q.length < 3) redirect(routes.need)

  const need = await addNeed({ personId: me.id, text: q, needFrom: from, needUntil: to })
  const cost = item.deal === 'sale' ? item.price : item.price * Math.max(1, daysBetween(from, to))
  const accepted = await acceptHop({ itemId, needId: need.id, personId: me.id, from, to, cost })

  // Accepting pins the need to this item, so the route keeps it here instead
  // of handing it to whichever similar item the greedy pass reaches first. If
  // it still can't be carried — someone booked an overlapping stretch between
  // the answer being shown and this click — take the booking back out rather
  // than confirm a handoff the owner will never see.
  const routed = snapshot()
    .chainOf(itemId)
    .hops.some((h) => h.needId === need.id)
  if (!routed) {
    unbook(accepted.id, need.id)
    redirect(`${routes.need}?${query({ q, from, to, error: 'taken' })}`)
  }

  rememberSearch(me.id, { text: q, from, to })
  redirect(`${routes.handoffs}?booked=${accepted.id}`)
}

export async function dismiss(formData: FormData) {
  const me = await signedIn()
  dismissItem(me.id, text(formData, 'itemId'))
  const { from, to } = readWindow(formData)
  redirect(`${routes.need}?${query({ q: text(formData, 'q'), from, to })}`)
}

// ---------------------------------------------------------------- handoffs

export async function markDone(formData: FormData) {
  const me = await signedIn()
  const key = text(formData, 'key')
  if (key) confirmSlip(me.id, key)
  revalidatePath(routes.handoffs)
}

// ---------------------------------------------------------------- shelf

export async function lend(formData: FormData) {
  const me = await signedIn()
  const description = text(formData, 'text').slice(0, 400)
  const deal = text(formData, 'deal') === 'sale' ? 'sale' : 'rent'
  const price = Number(text(formData, 'price'))
  const t = today()
  const last = config.cycleBoundaries[config.cycleBoundaries.length - 1]
  let freeFrom = text(formData, 'freeFrom')
  let freeUntil = text(formData, 'freeUntil')
  if (!isDay(freeFrom) || freeFrom < t) freeFrom = t
  if (!isDay(freeUntil) || freeUntil <= freeFrom) freeUntil = last

  if (description.length < 3) redirect(`${routes.shelf}?error=text`)
  if (!Number.isFinite(price) || price < 0) redirect(`${routes.shelf}?error=price`)

  const posted = await postItem({ holderId: me.id, text: description, deal, price, freeFrom, freeUntil })
  redirect(`${routes.shelf}?${query({ added: posted.id, matched: String(posted.matched) })}`)
}

// ---------------------------------------------------------------- memory

export async function restore(formData: FormData) {
  const me = await signedIn()
  restoreItem(me.id, text(formData, 'itemId'))
  revalidatePath(routes.profile)
}

export async function forgetMemory(formData: FormData) {
  const me = await signedIn()
  const what = text(formData, 'what')
  if (what === 'searches' || what === 'dismissed' || what === 'confirmed') forget(me.id, what)
  revalidatePath('/', 'layout')
}
