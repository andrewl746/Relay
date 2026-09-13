/**
 * Provider smoke test. Run: npm run check
 *
 * Exists because the Snowflake path cannot be verified without credentials —
 * so the moment a PAT lands, this answers "does it work" in five seconds
 * instead of via a four-minute pipeline run that fails at 80%.
 */
import { getProvider, providerName, providerMeta } from '../lib/providers/index.ts'
import { cosine } from '../lib/vector.ts'

const NEED = 'need a drill saturday, hanging some shelves. im in northdale'
const ITEMS = [
  'power drill - black&decker, bits are in the case. ive used it maybe twice. northdale',
  'full screwdriver set + the allen keys, for when u inevitably build ikea',
  'large suitcase, the hard shell kind. pickup king st n',
]

const meta = providerMeta()
console.log(`provider   ${providerName()}`)
console.log(`embed      ${meta.embedModel}${meta.dim ? ` (${meta.dim}d)` : ''}`)
if (meta.chatModel) console.log(`chat       ${meta.chatModel}`)
console.log()

const provider = getProvider()

const t0 = performance.now()
const [nv, ...ivs] = await provider.embed([NEED, ...ITEMS])
console.log(`embed      ${(performance.now() - t0).toFixed(0)}ms, ${nv.length} dims`)

if (meta.dim && nv.length !== meta.dim) {
  console.error(`\n!! expected ${meta.dim} dims, got ${nv.length}. Fix EMBED_DIMS.`)
  process.exit(1)
}

console.log('\ncosine (retrieval):')
ivs.forEach((v, i) =>
  console.log(`  ${cosine(nv, v).toFixed(3)}  ${ITEMS[i].slice(0, 58)}`),
)

const t1 = performance.now()
const ranked = await provider.rerank(NEED, ITEMS)
console.log(`\nrerank     ${(performance.now() - t1).toFixed(0)}ms`)
ranked.forEach((r, i) =>
  console.log(`  ${String(r.score).padEnd(6)} ${ITEMS[i].slice(0, 40)}  | ${r.reason}`),
)

const best = ranked.indexOf(ranked.reduce((a, b) => (b.score > a.score ? b : a)))
console.log(
  best === 0
    ? '\nOK - the actual drill ranked first.'
    : `\n!! candidate ${best} outranked the drill. See PROJECT.md risk table.`,
)
