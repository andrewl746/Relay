import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import type { Item, Need } from '../types.ts'

/**
 * Everything a user creates while the app is running.
 *
 * The seed corpus is precomputed into data/dataset.json at build time and never
 * changes. This file is the mutable half: items people post, needs they add,
 * and the hops they have actually agreed to. Kept as plain JSON on disk rather
 * than in memory so a dev-server restart mid-demo does not wipe what was just
 * demonstrated, and so it can be inspected with `cat` when something looks
 * wrong on stage.
 *
 * Not a database. If this outlives the hackathon, the shape below is already
 * the shape of three Postgres tables.
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

export type Runtime = {
  items: Item[]
  needs: Need[]
  accepted: AcceptedHop[]
  /** `${needId}|${itemId}` -> reranked score, for rows the seed never saw. */
  matches: Record<string, { score: number; reason: string }>
}

const EMPTY: Runtime = { items: [], needs: [], accepted: [], matches: {} }

const file = () => join(process.cwd(), 'data', 'runtime.json')

export function readRuntime(): Runtime {
  try {
    const raw = JSON.parse(readFileSync(file(), 'utf8')) as Partial<Runtime>
    return { ...EMPTY, ...raw }
  } catch {
    // Missing or corrupt: start clean rather than taking the app down. The seed
    // corpus is the source of truth for a demo; runtime is additive.
    return { ...EMPTY }
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
  writeRuntime({ ...EMPTY })
}
