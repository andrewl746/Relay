import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import type { Item, Need, Person } from '../types.ts'

/**
 * Everything a user creates while the app is running.
 *
 * The seed corpus is precomputed into data/dataset.json at build time and never
 * changes. This file is the mutable half: items people post, needs they add,
 * the hops they have actually agreed to, and what Relay remembers about each
 * person. Kept as plain JSON on disk rather than in memory so a dev-server
 * restart mid-demo does not wipe what was just demonstrated, and so it can be
 * inspected with `cat` when something looks wrong on stage.
 *
 * Not a database. If this outlives the hackathon, the shape below is already
 * the shape of a handful of Postgres tables.
 */

export type AcceptedHop = {
  id: string
  itemId: string
  needId: string
  /** Who holds it during this hop. */
  personId: string
  from: string
  to: string
  /** ratePerDay x days for a loan, the price once for a sale. */
  cost: number
  createdAt: string
}

export type PickupWindow = 'morning' | 'afternoon' | 'evening'

/**
 * What Relay remembers about one person, so the next visit starts where the
 * last one left off. All of it is shown back to them on /you and can be
 * changed or cleared there; none of it is used for anything they can't see.
 */
export type Profile = {
  id: string
  name: string
  /** One of config.locations. Laid over the person's location before routing. */
  neighbourhood: string
  pickupWindows: PickupWindow[]
  /** A stretch this term they can't meet anyone, e.g. reading week. */
  awayFrom: string | null
  awayUntil: string | null
  setupDone: boolean
  createdAt: string
  lastSeenAt: string
  visits: number
  /** Newest first. Pre-fills the composer and its date range. */
  searches: { text: string; from: string; to: string; at: string }[]
  /** Items they said "not this one" to; not offered again until restored. */
  dismissed: string[]
  /** Keys of handoff slips they have marked done. */
  confirmed: string[]
}

export type Runtime = {
  items: Item[]
  needs: Need[]
  accepted: AcceptedHop[]
  /** `${needId}|${itemId}` -> reranked score, for rows the seed never saw. */
  matches: Record<string, { score: number; reason: string }>
  /** People who joined while the app was running. Seed people live in dataset.json. */
  people: Person[]
  profiles: Record<string, Profile>
}

// A function rather than one shared constant: spreading a shared EMPTY object
// copied references to the same arrays, so the first push into a fresh
// runtime also mutated the default every later read started from.
const empty = (): Runtime => ({
  items: [],
  needs: [],
  accepted: [],
  matches: {},
  people: [],
  profiles: {},
})

const file = () => join(process.cwd(), 'data', 'runtime.json')

export function readRuntime(): Runtime {
  try {
    const raw = JSON.parse(readFileSync(file(), 'utf8')) as Partial<Runtime>
    return { ...empty(), ...raw }
  } catch {
    // Missing or corrupt: start clean rather than taking the app down. The seed
    // corpus is the source of truth for a demo; runtime is additive.
    return empty()
  }
}

export function writeRuntime(next: Runtime): void {
  mkdirSync(join(process.cwd(), 'data'), { recursive: true })
  writeFileSync(file(), JSON.stringify(next, null, 2))
}

export function mutate(fn: (r: Runtime) => void): Runtime {
  const r = readRuntime()
  fn(r)
  writeRuntime(r)
  return r
}

/** Reset to empty. Used by `npm run reset` before a demo run. */
export function clearRuntime(): void {
  writeRuntime(empty())
}
