import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Dataset } from './types.ts'
import type { MatchTable } from './match.ts'

/**
 * The entire "database". Loaded once into memory at boot. n is in the low
 * hundreds; a real database would be setup cost with no demo value.
 *
 * Run `npm run prepare` if these files are missing.
 */
const dataDir = join(process.cwd(), 'data')

let _data: Dataset | null = null
let _table: MatchTable | null = null

/**
 * Caching is switched off in development on purpose. Reseeding is the first
 * half of every pivot response, and a cache that survives it means the screen
 * quietly shows the old world while you believe you shipped the new one.
 */
const cache = process.env.NODE_ENV === 'production'

export function dataset(): Dataset {
  if (!cache || !_data) {
    _data = JSON.parse(readFileSync(join(dataDir, 'dataset.json'), 'utf8'))
  }
  return _data!
}

export function matches(): MatchTable {
  if (!cache || !_table) {
    _table = JSON.parse(readFileSync(join(dataDir, 'matches.json'), 'utf8'))
  }
  return _table!
}
