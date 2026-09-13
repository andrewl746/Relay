/**
 * Stage 1 (embed) + stage 2 (retrieve) + stage 3 (rerank), all precomputed and
 * cached to disk. Run: npm run prepare
 *
 * Nothing in this file runs during the demo. The only live work at request time
 * is the DP in lib/assign.ts, which is what makes "remove this person" instant.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import type { Dataset } from '../lib/types.ts'
import { asQuery, getProvider } from '../lib/providers/index.ts'
import { retrieve, rerank, TOP_K } from '../lib/match.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dataDir = join(root, 'data')

const data: Dataset = JSON.parse(
  readFileSync(join(dataDir, 'seed.json'), 'utf8'),
)
const provider = getProvider()
console.log(`provider: ${process.env.MATCH_PROVIDER ?? 'stub'}`)

// ---- stage 1: embed
const t0 = Date.now()
const itemVecs = await provider.embed(data.items.map((i) => i.rawText))
const needVecs = await provider.embed(data.needs.map((n) => asQuery(n.rawText)))
data.items.forEach((it, i) => (it.embedding = itemVecs[i]))
data.needs.forEach((n, i) => (n.embedding = needVecs[i]))
console.log(
  `embedded ${data.items.length + data.needs.length} texts in ${Date.now() - t0}ms`,
)

// ---- stage 2: retrieve
const t1 = Date.now()
const retrieved = retrieve(data, TOP_K)
console.log(
  `retrieved top-${TOP_K} for ${data.needs.length} needs in ${Date.now() - t1}ms`,
)

// ---- stage 3: rerank
const t2 = Date.now()
const table = await rerank(data, retrieved, provider)
console.log(
  `reranked ${Object.keys(table).length} pairs in ${Date.now() - t2}ms`,
)

writeFileSync(join(dataDir, 'dataset.json'), JSON.stringify(data))
writeFileSync(join(dataDir, 'matches.json'), JSON.stringify(table))
console.log('wrote data/dataset.json and data/matches.json')

// ---- eyeball it
const itemsById = new Map(data.items.map((i) => [i.id, i]))
console.log('\ntop matches for three needs:')
for (const need of [data.needs[0], data.needs[7], data.needs[19]]) {
  if (!need) continue
  console.log(`\n  NEED  ${need.rawText}`)
  for (const c of retrieved[need.id].slice(0, 3)) {
    const m = table[`${need.id}|${c.itemId}`]
    console.log(
      `    ${m.score.toFixed(3)}  ${itemsById.get(c.itemId)!.rawText.slice(0, 58)}`,
    )
    console.log(`           ^ ${m.reason}`)
  }
}
