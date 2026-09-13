import type { Chain, Dataset, Hop, Item, Need, Person } from './types.ts'
import type { MatchTable } from './match.ts'
import { config } from './config.ts'

const DAY = 86400000
const days = (a: string, b: string) =>
  Math.round((new Date(b).getTime() - new Date(a).getTime()) / DAY)

/** Grace on the item's free window, in days, to absorb seed-date jitter. */
const WINDOW_GRACE = 7

const LAMBDA = config.penalties.lambdaGapPerDay
const MU = config.penalties.muDistance

/**
 * Crude location penalty: 0 if the handoff stays in one neighbourhood, 1 if it
 * crosses. A maps API would add latency and a key for a term that is already
 * dominated by the storage-gap term.
 */
function distance(a: Person | undefined, b: Person | undefined): number {
  if (!a || !b) return 0
  return a.location === b.location ? 0 : 1
}

export type AssignOptions = {
  /** People dropped from the network — the "remove this person" control. */
  excludePersonIds?: string[]
  lambda?: number
  mu?: number
}

/**
 * Weighted interval scheduling for ONE item.
 *
 * Choose a set of non-overlapping needs to cover across the timeline,
 * maximizing  sum(matchScore) - lambda*storageDays - mu*distance.
 * Exact for the single-item case; O(n^2) in candidate needs, which is dozens.
 */
export function chainForItem(
  item: Item,
  candidates: Need[],
  table: MatchTable,
  peopleById: Map<string, Person>,
  opts: AssignOptions = {},
): Chain {
  const lambda = opts.lambda ?? LAMBDA
  const mu = opts.mu ?? MU
  const holder = peopleById.get(item.holderId)

  const cands = [...candidates].sort((a, b) =>
    a.needUntil < b.needUntil ? -1 : a.needUntil > b.needUntil ? 1 : 0,
  )
  const n = cands.length
  const score = cands.map(
    (need) => table[`${need.id}|${item.id}`]?.score ?? 0,
  )

  const dp = new Array<number>(n).fill(-Infinity)
  const prev = new Array<number>(n).fill(-1)

  for (let i = 0; i < n; i++) {
    // Base case: this need is the first hop, taken straight from the holder.
    const gap0 = Math.max(0, days(item.freeFrom, cands[i].needFrom))
    const dist0 = distance(holder, peopleById.get(cands[i].personId))
    dp[i] = score[i] - lambda * gap0 - mu * dist0

    for (let j = 0; j < i; j++) {
      if (cands[j].needUntil > cands[i].needFrom) continue // overlap
      const gap = Math.max(0, days(cands[j].needUntil, cands[i].needFrom))
      const dist = distance(
        peopleById.get(cands[j].personId),
        peopleById.get(cands[i].personId),
      )
      const v = dp[j] + score[i] - lambda * gap - mu * dist
      if (v > dp[i]) {
        dp[i] = v
        prev[i] = j
      }
    }
  }

  let end = -1
  let best = 0 // the empty chain is always an option
  for (let i = 0; i < n; i++) {
    if (dp[i] > best) {
      best = dp[i]
      end = i
    }
  }

  const order: number[] = []
  for (let i = end; i !== -1; i = prev[i]) order.push(i)
  order.reverse()

  const hops: Hop[] = order.map((idx, pos) => {
    const need = cands[idx]
    const prevNeed = pos === 0 ? null : cands[order[pos - 1]]
    const gapDays = prevNeed
      ? Math.max(0, days(prevNeed.needUntil, need.needFrom))
      : Math.max(0, days(item.freeFrom, need.needFrom))
    const dist = prevNeed
      ? distance(
          peopleById.get(prevNeed.personId),
          peopleById.get(need.personId),
        )
      : distance(holder, peopleById.get(need.personId))
    const m = table[`${need.id}|${item.id}`]
    return {
      needId: need.id,
      personId: need.personId,
      from: need.needFrom,
      to: need.needUntil,
      matchScore: m?.score ?? 0,
      reason: m?.reason ?? 'no reason recorded',
      gapDays,
      distance: dist,
    }
  })

  return {
    itemId: item.id,
    hops,
    totalGapDays: hops.reduce((s, h) => s + h.gapDays, 0),
    totalDistance: hops.reduce((s, h) => s + h.distance, 0),
    totalMatchScore: hops.reduce((s, h) => s + h.matchScore, 0),
    value: hops.length === 0 ? 0 : best,
  }
}

/** Needs an item can legally cover: inside its free window, with a little grace. */
export function eligibleNeeds(
  item: Item,
  needs: Need[],
  table: MatchTable,
): Need[] {
  return needs.filter((need) => {
    if (!(`${need.id}|${item.id}` in table)) return false
    if (days(item.freeFrom, need.needFrom) < -WINDOW_GRACE) return false
    if (days(need.needUntil, item.freeUntil) < -WINDOW_GRACE) return false
    return true
  })
}

/**
 * Across items: iterate scarcest-first and run the DP per item, marking needs
 * consumed as they are claimed. Greedy across items, exact within an item.
 * Say exactly that when asked — this is not globally optimal.
 */
export function assignAll(
  data: Dataset,
  table: MatchTable,
  opts: AssignOptions = {},
): Chain[] {
  const excluded = new Set(opts.excludePersonIds ?? [])
  const peopleById = new Map(data.people.map((p) => [p.id, p]))

  const people = data.people.filter((p) => !excluded.has(p.id))
  const livePeople = new Set(people.map((p) => p.id))
  const needs = data.needs.filter((n) => livePeople.has(n.personId))
  const items = data.items.filter((i) => livePeople.has(i.holderId))

  // Scarcity: an item is scarce when the needs it could serve have few other
  // items to fall back on. Those items get first pick.
  const suppliersPerNeed = new Map<string, number>()
  for (const need of needs) {
    let count = 0
    for (const item of items) if (`${need.id}|${item.id}` in table) count++
    suppliersPerNeed.set(need.id, count)
  }

  const eligible = new Map<string, Need[]>()
  const scarcity = new Map<string, number>()
  for (const item of items) {
    const cands = eligibleNeeds(item, needs, table)
    eligible.set(item.id, cands)
    scarcity.set(
      item.id,
      cands.reduce(
        (s, need) => s + 1 / Math.max(1, suppliersPerNeed.get(need.id) ?? 1),
        0,
      ),
    )
  }

  const ordered = [...items].sort(
    (a, b) => (scarcity.get(b.id) ?? 0) - (scarcity.get(a.id) ?? 0),
  )

  const consumed = new Set<string>()
  const chains: Chain[] = []
  for (const item of ordered) {
    const cands = (eligible.get(item.id) ?? []).filter(
      (n) => !consumed.has(n.id),
    )
    const chain = chainForItem(item, cands, table, peopleById, opts)
    for (const hop of chain.hops) consumed.add(hop.needId)
    chains.push(chain)
  }

  return chains
}

/**
 * Days inside the item's free window that no one is holding it — lead-in, gaps
 * between hops, and the tail after the last hop. This is the number the product
 * exists to drive to zero, and the one that jumps when a person is removed.
 */
export function idleDays(item: Item, chain: Chain): number {
  const total = Math.max(0, days(item.freeFrom, item.freeUntil))
  const covered = chain.hops.reduce((s, h) => {
    const from = h.from < item.freeFrom ? item.freeFrom : h.from
    const to = h.to > item.freeUntil ? item.freeUntil : h.to
    return s + Math.max(0, days(from, to))
  }, 0)
  return Math.max(0, total - covered)
}
