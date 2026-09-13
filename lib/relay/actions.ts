'use server'

import { revalidatePath } from 'next/cache'
import { cosine } from '../vector.ts'
import { asQuery, getProvider } from '../providers/index.ts'
import { TOP_K } from '../match.ts'
import { dataset, matches } from '../data.ts'
import { config } from '../config.ts'
import { extractNeedMetadata } from '../providers/backboard.ts'
import { mutate, readRuntime, type AcceptedHop } from './runtime.ts'
import type { Deal, Item, Need } from '../types.ts'

/**
 * Every mutation in the app.
 *
 * Server Functions are reachable by direct POST, not only through our own UI,
 * so each one validates its own input. There is no auth to check yet — the
 * session is a demo user picker — but the validation has to exist regardless,
 * because these write to disk.
 */

const MAX_TEXT = 400

/** Scores a new row against the other side and returns table entries for it. */
async function scoreAgainstItems(need: Need) {
  const seed = dataset()
  const runtime = readRuntime()
  const items = [...seed.items, ...runtime.items]

  const ranked = items
    .map((item) => ({ item, sim: cosine(need.embedding, item.embedding) }))
    .sort((a, b) => b.sim - a.sim)
    .slice(0, TOP_K)

  const scored = await getProvider().rerank(
    need.rawText,
    ranked.map((r) => r.item.rawText),
  )

  const out: Record<string, { score: number; reason: string }> = {}
  ranked.forEach((r, i) => {
    const s = scored[i]
    const usable = typeof s?.score === 'number' && Number.isFinite(s.score)
    out[`${need.id}|${r.item.id}`] = {
      score: usable ? s.score : r.sim,
      reason: usable ? s.reason : 'cosine fallback',
    }
  })
  return out
}

/**
 * A newly posted item has to become visible to needs that already exist.
 *
 * Cosine only, deliberately. `rerank(need, candidates)` is oriented one way —
 * it judges objects against a request — and calling it with the item as the
 * "request" and needs as "candidates" would hand a real model an inverted
 * prompt. Reranking properly would mean one call per matching need, which is
 * free with the stub and a burst of round trips with a remote provider, on an
 * interactive action.
 *
 * So a fresh item enters at its retrieval score and competes on that. Scores
 * stay comparable because both sides are cosine over the same vector space, and
 * minMatchScore still gates a hop.
 */
async function scoreAgainstNeeds(item: Item) {
  const seed = dataset()
  const runtime = readRuntime()
  const needs = [...seed.needs, ...runtime.needs]
  const floor = config.constraints.minMatchScore

  const out: Record<string, { score: number; reason: string }> = {}
  for (const need of needs) {
    const sim = cosine(need.embedding, item.embedding)
    if (sim < floor) continue
    out[`${need.id}|${item.id}`] = {
      score: sim,
      reason: 'newly posted, ranked on similarity',
    }
  }
  return out
}

function clean(text: unknown): string {
  if (typeof text !== 'string') throw new Error('text is required')
  const t = text.trim().slice(0, MAX_TEXT)
  if (t.length < 3) throw new Error('say a bit more than that')
  return t
}

function checkWindow(from: unknown, to: unknown): [string, string] {
  const a = String(from ?? '')
  const b = String(to ?? '')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(a) || !/^\d{4}-\d{2}-\d{2}$/.test(b)) {
    throw new Error('both dates are required')
  }
  if (b <= a) throw new Error('the end date has to be after the start')
  return [a, b]
}

export async function postItem(input: {
  holderId: string
  text: string
  deal: Deal
  price: number
  freeFrom: string
  freeUntil: string
}) {
  const text = clean(input.text)
  const [freeFrom, freeUntil] = checkWindow(input.freeFrom, input.freeUntil)
  const deal: Deal = input.deal === 'sale' ? 'sale' : 'rent'
  const price = Math.max(0, Math.round(Number(input.price) || 0))

  const [embedding] = await getProvider().embed([text])
  const item: Item = {
    id: `u-i-${Date.now().toString(36)}`,
    holderId: input.holderId,
    rawText: text,
    embedding,
    freeFrom,
    freeUntil,
    deal,
    price,
  }

  const pairs = await scoreAgainstNeeds(item)
  mutate((r) => {
    r.items.push(item)
    Object.assign(r.matches, pairs)
  })

  revalidatePath('/', 'layout')
  return { id: item.id, matched: Object.keys(pairs).length }
}

export async function addNeed(input: {
  personId: string
  text: string
  needFrom: string
  needUntil: string
}) {
  const text = clean(input.text)
  const [needFrom, needUntil] = checkWindow(input.needFrom, input.needUntil)

  // Extraction and embedding are independent, so don't pay for them serially.
  // extractNeedMetadata never throws — it returns defaults when Backboard is
  // unset or down, which is the only acceptable behaviour on a form submit.
  const [[embedding], meta] = await Promise.all([
    getProvider().embed([asQuery(text)]),
    extractNeedMetadata(text),
  ])
  // Only urgency lands today. Backboard also returns the times of day the text
  // mentions ("saturday morning" -> ["morning"]), but the DP reads
  // pickupWindows off Person, not Need — availability is modelled per person,
  // not per request. Wiring request-level windows means adding the field to
  // Need and intersecting it in sharePickupWindow(); see TODO.md.
  const { urgency } = meta

  const need: Need = {
    id: `u-n-${Date.now().toString(36)}`,
    personId: input.personId,
    rawText: text,
    embedding,
    needFrom,
    needUntil,
    urgency,
  }

  const pairs = await scoreAgainstItems(need)
  mutate((r) => {
    r.needs.push(need)
    Object.assign(r.matches, pairs)
  })

  revalidatePath('/', 'layout')
  return { id: need.id, matched: Object.keys(pairs).length }
}

/**
 * Pin one computed hop. The DP keeps proposing a schedule; accepting turns one
 * proposal into a commitment the two people can see. It does not re-plan —
 * that is the engine's job on the next render.
 */
export async function acceptHop(input: {
  itemId: string
  needId: string
  personId: string
  from: string
  to: string
  cost: number
}) {
  const hop: AcceptedHop = {
    id: `u-h-${Date.now().toString(36)}`,
    itemId: String(input.itemId),
    needId: String(input.needId),
    personId: String(input.personId),
    from: String(input.from),
    to: String(input.to),
    cost: Math.max(0, Number(input.cost) || 0),
    createdAt: new Date().toISOString(),
  }
  if (!hop.itemId || !hop.needId) throw new Error('itemId and needId are required')

  mutate((r) => {
    // Accepting the same hop twice is a double-click, not a second handoff.
    if (!r.accepted.some((h) => h.itemId === hop.itemId && h.needId === hop.needId)) {
      r.accepted.push(hop)
    }
  })

  revalidatePath('/', 'layout')
  return { id: hop.id }
}
