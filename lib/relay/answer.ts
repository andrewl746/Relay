import 'server-only'
import { config } from '../config.ts'
import { chainForItem, eligibleNeeds } from '../assign.ts'
import { TOP_K, type MatchTable } from '../match.ts'
import { asQuery, getProvider } from '../providers/index.ts'
import { cosine } from '../vector.ts'
import { addDays, dayLabel, daysBetween, rangeLabel, today } from './dates.ts'
import { kmBetween } from './place.ts'
import { snapshot } from './store.ts'
import type { Chain, Item, Need, Person } from '../types.ts'
import type { Me } from './me.ts'

/**
 * One typed need in, a short list of bookable answers out.
 *
 * Nothing is written. The need is added to a copy of the network as a
 * temporary row, scored with the same retrieve-and-rerank path as every other
 * need, and routed with the same per-item DP. Everyone else stays exactly as
 * they are scheduled: needs already routed to some other item are off the
 * table here. Exact within an item, greedy across items — as everywhere else.
 *
 * An answer exists only if the DP actually put you on that item's route, so
 * availability, shared pickup windows, distance and urgency all get their say
 * before anything is shown. Items that came close but didn't fit come back as
 * misses, each with the one reason it failed.
 */

const FLOOR = config.constraints.minMatchScore
const MAX_ANSWERS = 3
const MAX_MISSES = 4
/** Same weight lib/hub/matching.ts puts on a kilometre of walking. */
const W_WALK = 0.12
const PREVIEW = 'preview'

export type Answer = {
  item: Item
  owner: Person
  score: number
  reason: string
  from: string
  to: string
  days: number
  /** Price x days for a loan, the price once for a sale. */
  cost: number
  /** Who physically gives it to you: the owner, or the borrower before you. */
  collectFrom: Person
  direct: boolean
  /** Where it goes after you. Null for a sale — it's yours. */
  handTo: { person: Person; on: string; direct: boolean } | null
  walkKm: number | null
  /** People on this item's route this term, including you. */
  borrowers: number
  /** The situational reasons this works, in plain words. */
  situation: string[]
}

export type Miss = {
  item: Item
  owner: Person
  score: number
  why: string
  /** The nearest window that would clear this particular blocker. */
  retry: { from: string; to: string } | null
}

export type AnswerSet = { answers: Answer[]; misses: Miss[]; considered: number }

const first = (p: Person) => p.label.split(' ')[0]

function list(words: string[]): string {
  if (words.length <= 1) return words.join('')
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`
}

// These mirror the availability rules inside lib/assign.ts so a miss can say
// which one failed; the DP itself stays the only thing that decides.
function awayOn(p: Person, day: string): boolean {
  return Boolean(p.awayFrom && p.awayUntil && day >= p.awayFrom && day < p.awayUntil)
}

function sharedWindows(a: Person, b: Person): string[] | null {
  if (!a.pickupWindows?.length || !b.pickupWindows?.length) return null
  return a.pickupWindows.filter((w) => b.pickupWindows.includes(w))
}

export async function findAnswers(me: Me, text: string, from: string, to: string): Promise<AnswerSet> {
  const snap = snapshot()
  const provider = getProvider()
  const [vector] = await provider.embed([asQuery(text)])
  const hidden = new Set(me.profile.dismissed)
  const people = new Map(snap.data.people.map((p) => [p.id, p]))
  const mine = people.get(me.id) ?? me.person

  const ranked = snap.data.items
    .filter((item) => item.holderId !== me.id && !hidden.has(item.id))
    .map((item) => ({ item, sim: cosine(vector, item.embedding) }))
    .sort((a, b) => b.sim - a.sim)
    .slice(0, TOP_K)
  const reranked = await provider.rerank(
    text,
    ranked.map((r) => r.item.rawText),
  )

  const days = Math.max(1, daysBetween(from, to))
  const need: Need = {
    id: PREVIEW,
    personId: me.id,
    rawText: text,
    embedding: vector,
    needFrom: from,
    needUntil: to,
    // Needed within two days is what the DP's urgency multiplier exists for.
    urgency: daysBetween(today(), from) <= 2 ? 'high' : 'medium',
  }

  const table: MatchTable = { ...snap.table }
  const candidates = ranked
    .map((r, i) => {
      const s = reranked[i]
      const usable = typeof s?.score === 'number' && Number.isFinite(s.score)
      const score = usable ? s.score : r.sim
      const reason = usable ? s.reason : 'ranked on similarity'
      table[`${PREVIEW}|${r.item.id}`] = { score, reason }
      return { item: r.item, score, reason }
    })
    .filter((c) => c.score >= FLOOR)

  const claimedBy = new Map<string, string>()
  for (const chain of snap.chains) for (const hop of chain.hops) claimedBy.set(hop.needId, chain.itemId)
  const needs = [...snap.data.needs, need]

  const answers: Answer[] = []
  const misses: Miss[] = []

  for (const c of candidates) {
    const owner = people.get(c.item.holderId)
    if (!owner) continue
    // Off the table: needs routed on another item, and needs booked on another item.
    const pool = needs.filter(
      (n) =>
        (!claimedBy.has(n.id) || claimedBy.get(n.id) === c.item.id) &&
        (!snap.pinned.has(n.id) || snap.pinned.get(n.id) === c.item.id),
    )
    const chain = chainForItem(c.item, eligibleNeeds(c.item, pool, table), table, people, { pinned: snap.pinned })
    const at = chain.hops.findIndex((h) => h.needId === PREVIEW)

    if (at === -1) {
      misses.push(explain(c.item, owner, mine, chain, from, to, days, c.score, people))
      continue
    }

    const hop = chain.hops[at]
    const prev = at > 0 ? chain.hops[at - 1] : null
    const next = chain.hops[at + 1] ?? null
    const collectFrom = prev && !hop.viaOwner ? people.get(prev.personId) ?? owner : owner
    const sale = c.item.deal === 'sale'
    const handTo = sale
      ? null
      : next && !next.viaOwner
        ? { person: people.get(next.personId) ?? owner, on: to, direct: true }
        : { person: owner, on: to, direct: false }

    const situation = [
      sale
        ? `${first(owner)} can hand it over ${dayLabel(from)}, and you're both in town then.`
        : `Free ${rangeLabel(from, to)}, and you're both in town for it.`,
    ]
    const shared = sharedWindows(mine, collectFrom)
    if (shared && shared.length > 0 && shared.length < 3) {
      situation.push(`You can both do ${list(shared)} pickups.`)
    }
    if (need.urgency === 'high') {
      situation.push('You need it within two days, so it was weighted ahead of later requests.')
    }
    if (chain.hops.length > 1) {
      situation.push(`${chain.hops.length} people have it this term, you included.`)
    }

    answers.push({
      item: c.item,
      owner,
      score: c.score,
      reason: c.reason,
      from,
      to,
      days,
      cost: sale ? c.item.price : c.item.price * days,
      collectFrom,
      direct: collectFrom.id !== owner.id,
      handTo,
      walkKm: kmBetween(mine.location, collectFrom.location),
      borrowers: chain.hops.length,
      situation,
    })
  }

  const rank = (a: Answer) => a.score - W_WALK * (a.walkKm ?? 0)
  answers.sort((a, b) => rank(b) - rank(a))

  return {
    answers: answers.slice(0, MAX_ANSWERS),
    misses: misses.slice(0, MAX_MISSES),
    considered: candidates.length,
  }
}

function explain(
  item: Item,
  owner: Person,
  mine: Person,
  chain: Chain,
  from: string,
  to: string,
  days: number,
  score: number,
  people: Map<string, Person>,
): Miss {
  const base = { item, owner, score }
  const retry = (start: string): Miss['retry'] =>
    start >= today() ? { from: start, to: addDays(start, days) } : null

  if (item.deal === 'sale' && chain.hops[0]) {
    const buyer = people.get(chain.hops[0].personId)
    return {
      ...base,
      why: `Already going to ${buyer ? buyer.label : 'someone else'} on ${dayLabel(chain.hops[0].from)}.`,
      retry: null,
    }
  }
  if (from < item.freeFrom) {
    return { ...base, why: `${first(owner)} can't lend it until ${dayLabel(item.freeFrom)}.`, retry: retry(item.freeFrom) }
  }
  if (to > item.freeUntil) {
    return {
      ...base,
      why: `${first(owner)} needs it back for good on ${dayLabel(item.freeUntil)}.`,
      retry: retry(addDays(item.freeUntil, -days)),
    }
  }
  if (awayOn(owner, from)) {
    return { ...base, why: `${first(owner)} is away ${rangeLabel(owner.awayFrom, owner.awayUntil)}.`, retry: retry(owner.awayUntil) }
  }
  if (awayOn(mine, from)) {
    return { ...base, why: `You're away ${rangeLabel(mine.awayFrom, mine.awayUntil)}.`, retry: retry(mine.awayUntil) }
  }
  const shared = sharedWindows(mine, owner)
  if (shared && shared.length === 0) {
    return {
      ...base,
      why: `No part of the day works for both of you: ${first(owner)} only does ${list(owner.pickupWindows)} pickups.`,
      retry: null,
    }
  }
  const clash = chain.hops.find((h) => h.from < to && h.to > from)
  if (clash) {
    const holder = people.get(clash.personId)
    return {
      ...base,
      why: `${holder ? holder.label : 'Someone'} has it ${rangeLabel(clash.from, clash.to)}.`,
      retry: retry(clash.to),
    }
  }
  return { ...base, why: `Free then, but no pickup fits around ${first(owner)}'s other loans.`, retry: null }
}
