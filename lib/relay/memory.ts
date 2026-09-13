import { config } from '../config.ts'
import { dataset } from '../data.ts'
import { mutate, readRuntime, type PickupWindow, type Profile } from './runtime.ts'
import type { Person } from '../types.ts'

/**
 * Per-person memory, stored next to the engine's rows in data/runtime.json.
 *
 * Everything written here exists to make the next visit shorter: where you
 * live and when you can meet feed straight into routing (lib/relay/store.ts),
 * past searches pre-fill the composer, and "not this one" keeps an item from
 * being offered again. /you shows all of it and can clear any of it.
 */

export const WINDOWS: PickupWindow[] = ['morning', 'afternoon', 'evening']

const MAX_SEARCHES = 8
const MAX_DISMISSED = 60

const now = () => new Date().toISOString()

/** Everyone the engine knows: the seed corpus plus people who joined at runtime. */
export function allPeople(): Person[] {
  return [...dataset().people, ...readRuntime().people]
}

export function findPerson(id: string): Person | undefined {
  return allPeople().find((p) => p.id === id)
}

export function getProfile(id: string): Profile | null {
  return readRuntime().profiles[id] ?? null
}

function fromPerson(person: Person, setupDone: boolean): Profile {
  const t = now()
  return {
    id: person.id,
    name: person.label,
    neighbourhood: person.location,
    pickupWindows: person.pickupWindows?.length ? [...person.pickupWindows] : [...WINDOWS],
    awayFrom: person.awayFrom || null,
    awayUntil: person.awayUntil || null,
    setupDone,
    createdAt: t,
    lastSeenAt: t,
    visits: 0,
    searches: [],
    dismissed: [],
    confirmed: [],
  }
}

/** Signing in as someone already on the network: keep what we know, count the visit. */
export function recordVisit(person: Person): Profile {
  let out: Profile | null = null
  mutate((r) => {
    const profile = r.profiles[person.id] ?? fromPerson(person, true)
    profile.visits += 1
    profile.lastSeenAt = now()
    r.profiles[person.id] = profile
    out = profile
  })
  return out!
}

/** A student the seed corpus has never seen. They finish setting up on /start. */
export function createPerson(name: string): Profile {
  const person: Person = {
    id: `u-p-${Date.now().toString(36)}`,
    label: name,
    location: config.locations[0],
    awayFrom: '',
    awayUntil: '',
    pickupWindows: [...WINDOWS],
  }
  let out: Profile | null = null
  mutate((r) => {
    r.people.push(person)
    const profile = fromPerson(person, false)
    profile.visits = 1
    r.profiles[person.id] = profile
    out = profile
  })
  return out!
}

export type ProfilePatch = Partial<
  Pick<Profile, 'name' | 'neighbourhood' | 'pickupWindows' | 'awayFrom' | 'awayUntil' | 'setupDone'>
>

export function updateProfile(id: string, patch: ProfilePatch): void {
  mutate((r) => {
    const person = [...dataset().people, ...r.people].find((p) => p.id === id)
    if (!person) throw new Error(`no person ${id}`)
    const profile = r.profiles[id] ?? fromPerson(person, false)
    Object.assign(profile, patch, { lastSeenAt: now() })
    r.profiles[id] = profile
  })
}

export function rememberSearch(id: string, search: { text: string; from: string; to: string }): void {
  mutate((r) => {
    const profile = r.profiles[id]
    if (!profile) return
    const key = search.text.trim().toLowerCase()
    profile.searches = [
      { ...search, at: now() },
      ...profile.searches.filter((s) => s.text.trim().toLowerCase() !== key),
    ].slice(0, MAX_SEARCHES)
  })
}

export function dismissItem(id: string, itemId: string): void {
  mutate((r) => {
    const profile = r.profiles[id]
    if (!profile || profile.dismissed.includes(itemId)) return
    profile.dismissed = [...profile.dismissed, itemId].slice(-MAX_DISMISSED)
  })
}

export function restoreItem(id: string, itemId: string): void {
  mutate((r) => {
    const profile = r.profiles[id]
    if (profile) profile.dismissed = profile.dismissed.filter((x) => x !== itemId)
  })
}

export function confirmSlip(id: string, key: string): void {
  mutate((r) => {
    const profile = r.profiles[id]
    if (profile && !profile.confirmed.includes(key)) profile.confirmed.push(key)
  })
}

export function forget(id: string, what: 'searches' | 'dismissed' | 'confirmed'): void {
  mutate((r) => {
    const profile = r.profiles[id]
    if (profile) profile[what] = []
  })
}
