import 'server-only'
import type { Chain, Dataset, Item, Need, Person } from '../types.ts'
import type { MatchTable } from '../match.ts'
import { dataset, matches } from '../data.ts'
import { assignAll, earnings, idleDays } from '../assign.ts'
import { readRuntime, type Profile } from './runtime.ts'

/**
 * The single source of truth for every screen.
 *
 * Seed corpus (build-time, immutable) + runtime rows (what users posted) are
 * merged here and handed to the engine as one Dataset. Nothing downstream knows
 * which rows came from which side, which is the point: a posted item competes
 * for needs on exactly the same terms as a seeded one.
 *
 * Replaces lib/hub/mock-data.ts, which was a second, disconnected world.
 */

export type Snapshot = {
  data: Dataset
  table: MatchTable
  chains: Chain[]
  chainOf: (itemId: string) => Chain
  itemById: (id: string) => Item | undefined
  personById: (id: string) => Person | undefined
  needById: (id: string) => Need | undefined
  /** What the owner makes across the whole computed chain. */
  earnedOn: (item: Item) => number
  /** Days inside the item's window that nobody has it. */
  idleOn: (item: Item) => number
}

const EMPTY_CHAIN = (itemId: string): Chain => ({
  itemId,
  hops: [],
  totalGapDays: 0,
  totalDistance: 0,
  totalMatchScore: 0,
  value: 0,
})

/**
 * Built per request. The DP is ~12ms over the whole network and runtime rows
 * change under us on every write, so caching would buy nothing and would serve
 * a stale board straight after someone posts something.
 */
/**
 * Lay what a person told Relay about themselves over what the corpus assumed,
 * so the engine routes on where they actually live and when they can meet.
 */
function withProfile(person: Person, profile: Profile | undefined): Person {
  if (!profile) return person
  return {
    ...person,
    label: profile.name || person.label,
    location: profile.neighbourhood || person.location,
    pickupWindows: profile.pickupWindows.length ? profile.pickupWindows : person.pickupWindows,
    awayFrom: profile.awayFrom ?? '',
    awayUntil: profile.awayUntil ?? '',
  }
}

export function snapshot(): Snapshot {
  const seed = dataset()
  const runtime = readRuntime()

  const data: Dataset = {
    people: [...seed.people, ...runtime.people].map((p) => withProfile(p, runtime.profiles[p.id])),
    items: [...seed.items, ...runtime.items],
    needs: [...seed.needs, ...runtime.needs],
  }
  const table: MatchTable = { ...matches(), ...runtime.matches }

  const chains = assignAll(data, table, {})
  const byItem = new Map(chains.map((c) => [c.itemId, c]))
  const items = new Map(data.items.map((i) => [i.id, i]))
  const people = new Map(data.people.map((p) => [p.id, p]))
  const needs = new Map(data.needs.map((n) => [n.id, n]))

  return {
    data,
    table,
    chains,
    chainOf: (id) => byItem.get(id) ?? EMPTY_CHAIN(id),
    itemById: (id) => items.get(id),
    personById: (id) => people.get(id),
    needById: (id) => needs.get(id),
    earnedOn: (item) => earnings(item, byItem.get(item.id) ?? EMPTY_CHAIN(item.id)),
    idleOn: (item) => idleDays(item, byItem.get(item.id) ?? EMPTY_CHAIN(item.id)),
  }
}

/** Network totals for the board header. */
export function networkStats(s: Snapshot) {
  let earned = 0
  let idle = 0
  let earning = 0
  for (const item of s.data.items) {
    const e = s.earnedOn(item)
    if (e > 0) earning++
    earned += e
    idle += s.idleOn(item)
  }
  return {
    items: s.data.items.length,
    earning,
    earned,
    idleDays: idle,
    handoffs: s.chains.reduce((n, c) => n + c.hops.length, 0),
  }
}
