/**
 * End-to-end check of the write path. Run: npm run check:store
 *
 * Asserts that a need created at runtime is embedded, scored against the seed
 * corpus, merged into the engine's dataset, and actually routed by the DP —
 * i.e. that a user-posted row is indistinguishable from a seeded one.
 */
import assert from 'node:assert/strict'
import { cosine } from '../lib/vector.ts'
import { getProvider } from '../lib/providers/index.ts'
import { TOP_K } from '../lib/match.ts'
import { dataset } from '../lib/data.ts'
import { readRuntime, writeRuntime, clearRuntime } from '../lib/relay/runtime.ts'
import { assignAll } from '../lib/assign.ts'
import type { Need } from '../lib/types.ts'

const before = readRuntime()
try {
  clearRuntime()

  const text = 'need a power drill this saturday, putting up shelves. im in northdale'
  const [embedding] = await getProvider().embed([text])
  const need: Need = {
    id: 'test-need-1',
    personId: dataset().people[0].id,
    rawText: text,
    embedding,
    needFrom: '2026-10-02',
    needUntil: '2026-10-05',
    urgency: 'medium',
  }

  const ranked = dataset()
    .items.map((item) => ({ item, sim: cosine(need.embedding, item.embedding) }))
    .sort((a, b) => b.sim - a.sim)
    .slice(0, TOP_K)

  const scored = await getProvider().rerank(need.rawText, ranked.map((r) => r.item.rawText))
  const matches: Record<string, { score: number; reason: string }> = {}
  ranked.forEach((r, i) => {
    matches[`${need.id}|${r.item.id}`] = {
      score: scored[i]?.score ?? r.sim,
      reason: scored[i]?.reason ?? 'cosine',
    }
  })

  writeRuntime({ items: [], needs: [need], accepted: [], matches })

  const rt = readRuntime()
  assert.equal(rt.needs.length, 1, 'need did not persist')
  assert.ok(Object.keys(rt.matches).length > 0, 'no match pairs written')

  const seed = dataset()
  const merged = {
    people: seed.people,
    items: seed.items,
    needs: [...seed.needs, ...rt.needs],
  }
  const table = { ...JSON.parse(
    (await import('node:fs')).readFileSync('data/matches.json', 'utf8'),
  ), ...rt.matches }

  const chains = assignAll(merged, table, {})
  const servingUs = chains.filter((c) => c.hops.some((h) => h.needId === need.id))

  console.log(`top match: ${ranked[0].item.rawText.slice(0, 56)}`)
  console.log(`           score ${matches[`${need.id}|${ranked[0].item.id}`].score.toFixed(3)}`)
  assert.ok(/drill/i.test(ranked[0].item.rawText), 'top retrieval is not a drill')

  console.log(`routed by: ${servingUs.length} item(s)`)
  assert.ok(servingUs.length > 0, 'the DP never scheduled the new need')

  const hop = servingUs[0].hops.find((h) => h.needId === need.id)!
  const item = merged.items.find((i) => i.id === servingUs[0].itemId)!
  console.log(`got:       ${item.rawText.slice(0, 50)}`)
  console.log(`           ${hop.from} -> ${hop.to}, $${item.price}/${item.deal === 'sale' ? 'total' : 'day'}`)
  console.log('\nOK - a runtime-created need is embedded, matched and routed.')
} finally {
  writeRuntime(before)
}
