/**
 * End-to-end check of the write path. Run: npm run check:store
 *
 * Asserts that a need created at runtime is embedded, scored against the seed
 * corpus, merged into the engine's dataset, and actually routed by the DP —
 * i.e. that a user-posted row is indistinguishable from a seeded one. Then that
 * booking it pins it: the need stays on the item it was booked on.
 */
import assert from 'node:assert/strict'
import { cosine } from '../lib/vector.ts'
import { getProvider } from '../lib/providers/index.ts'
import { TOP_K } from '../lib/match.ts'
import { dataset } from '../lib/data.ts'
import { readRuntime, writeRuntime, clearRuntime } from '../lib/relay/runtime.ts'
import { assignAll, eligibleNeeds } from '../lib/assign.ts'
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

  writeRuntime({ items: [], needs: [need], accepted: [], claims: [], matches, people: [], profiles: {} })

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

  // Booking pins the need to the item it was booked on. The asker above can
  // only meet one drill's owner, so book as someone who can meet anyone, on
  // every item that could carry the need: each time the route has to keep it
  // there, not move it to whichever similar item the greedy pass reaches first.
  const booker = {
    id: 'test-booker',
    label: 'Test B.',
    location: 'Lester',
    awayFrom: '',
    awayUntil: '',
    pickupWindows: ['morning', 'afternoon', 'evening'] as ('morning' | 'afternoon' | 'evening')[],
  }
  const booked: Need = { ...need, id: 'test-need-2', personId: booker.id }
  const bookedTable = { ...table }
  for (const [key, m] of Object.entries(matches)) bookedTable[key.replace(need.id, booked.id)] = m
  const network = { people: [...seed.people, booker], items: seed.items, needs: [...seed.needs, booked] }
  const peopleById = new Map(network.people.map((p) => [p.id, p]))
  // Could carry it: it matches, and the owner is around and shares a part of the
  // day. Not "worth routing by itself" — a lone loan a month into term loses to
  // its idle lead-in, which is exactly when a booking has to hold anyway.
  const carriers = network.items.filter((i) => {
    const owner = peopleById.get(i.holderId)
    if (!owner || eligibleNeeds(i, [booked], bookedTable).length === 0) return false
    const around = !owner.awayFrom || booked.needFrom < owner.awayFrom || booked.needFrom >= owner.awayUntil
    return around && (!owner.pickupWindows || owner.pickupWindows.length > 0)
  })
  for (const target of carriers) {
    const routedOn = assignAll(network, bookedTable, { pinned: new Map([[booked.id, target.id]]) })
      .filter((c) => c.hops.some((h) => h.needId === booked.id))
      .map((c) => c.itemId)
    assert.deepEqual(routedOn, [target.id], `booked on ${target.id}, routed on ${routedOn.join(', ') || 'nothing'}`)
  }
  assert.ok(carriers.length > 1, 'only one item can carry this need, so pinning proves nothing')
  console.log(`pinned:    booked on each of ${carriers.length} items, it stayed on that item every time`)

  console.log('\nOK - a runtime-created need is embedded, matched, routed, and stays where it is booked.')
} finally {
  writeRuntime(before)
}
