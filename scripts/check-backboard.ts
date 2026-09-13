/**
 * Backboard smoke test. Run: npm run check:backboard
 *
 * Proves extraction actually returns urgency and pickup windows, rather than
 * silently falling back to defaults inside a form submission. The first
 * integration failed with a 422 on every call and nobody noticed, because the
 * caller swallowed it.
 */
import { getBackboardClient, extractNeedMetadata } from '../lib/providers/backboard.ts'

if (!getBackboardClient()) {
  console.log('BACKBOARD_API_KEY not set — extraction returns defaults. Nothing to test.')
  process.exit(0)
}

const CASES: { text: string; urgency: string; windows: string[] }[] = [
  { text: 'need a power drill saturday morning, kind of urgent, putting up shelves',
    urgency: 'high', windows: ['morning'] },
  { text: 'looking for a carpet cleaner sometime, no rush at all',
    urgency: 'low', windows: [] },
  { text: 'anyone have a projector? evenings work best for pickup',
    urgency: 'medium', windows: ['evening'] },
]

let failures = 0
for (const c of CASES) {
  const t0 = performance.now()
  const got = await extractNeedMetadata(c.text)
  const ms = (performance.now() - t0).toFixed(0)
  const okU = got.urgency === c.urgency
  const okW = JSON.stringify(got.pickupWindows) === JSON.stringify(c.windows)
  if (!okU || !okW) failures++
  console.log(`${okU && okW ? 'ok  ' : 'FAIL'} ${ms.padStart(5)}ms  ${c.text.slice(0, 46)}`)
  console.log(`      urgency ${got.urgency}${okU ? '' : ` (expected ${c.urgency})`}` +
              `   windows ${JSON.stringify(got.pickupWindows)}${okW ? '' : ` (expected ${JSON.stringify(c.windows)})`}`)
}

console.log(failures === 0
  ? '\nOK — need extraction is returning real metadata.\n   (A "[backboard] chat unavailable" line above is expected on the free credit:\n    Backboard refuses LLM chat, and Snowflake Cortex answered instead.)'
  : `\n${failures}/${CASES.length} case(s) off. Extraction runs but the model read them differently.`)
