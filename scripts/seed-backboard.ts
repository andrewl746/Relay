/**
 * Loads the demo wants into Backboard memory, then prints how listing titles
 * score against them so MAX_WANT_DISTANCE stays calibrated.
 *
 *   npm run seed:backboard                 reset + seed + probe
 *   npm run seed:backboard -- --probe-only  probe only
 *
 * Resets the relay-wants memories first, so running it twice doesn't double
 * every want. About $0.01 per memory op on the free credit.
 */
import { getBackboardClient, wantsAssistantId, rememberWant, whoWants, MAX_WANT_DISTANCE } from '../lib/providers/backboard.ts'
import { users, wants } from '../lib/hub/mock-data.ts'

const bb = getBackboardClient()
if (!bb) {
  console.log('BACKBOARD_API_KEY not set — nothing to seed.')
  process.exit(0)
}

if (!process.argv.includes('--probe-only')) {
  await bb.resetMemories(await wantsAssistantId(bb))
  const open = wants.filter((w) => !w.fulfilled)
  for (const w of open) {
    const first = users.find((u) => u.id === w.userId)?.name.split(' ')[0] ?? 'Someone'
    await rememberWant(first, w.text)
  }
  console.log(`Seeded ${open.length} wants.\n`)
}

// Should match: a desk, a calculator, a fridge, a bookcase. Should not: the last two.
const PROBES = [
  'IKEA desk, white, 120cm',
  'TI-84 Plus CE graphing calculator',
  'Mini fridge 1.7 cu ft',
  '5-shelf bookcase',
  'Air mattress, queen',
  'Power drill with bits',
]
for (const p of PROBES) {
  const all = await whoWants(p, 3, Infinity)
  const kept = all.filter((h) => h.score <= MAX_WANT_DISTANCE)
  const top = all.map((h) => `${h.score.toFixed(2)} ${h.name}: ${h.text}`).join('  |  ')
  console.log(`${p.padEnd(34)} kept ${kept.length}   ${top}`)
}
console.log(`\nDistances, lower is closer. MAX_WANT_DISTANCE = ${MAX_WANT_DISTANCE}`)
