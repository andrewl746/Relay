/**
 * Seed generator. Run: npm run seed
 *
 * Deterministic — same output every run, so the demo never surprises us.
 * Embeddings are left empty here; the embed step fills and caches them.
 *
 * The phrasing pools below are the ONE place outside config.json that is
 * allowed to know what the items actually are. A "new user group" pivot is a
 * diff against config.json plus this file's pools, budgeted at 15 minutes.
 */
import { writeFileSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import type { Person, Item, Need, Dataset } from '../lib/types.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const config: { locations: string[]; cycleBoundaries: string[] } = JSON.parse(
  readFileSync(join(root, 'config.json'), 'utf8'),
)

const TARGET_PEOPLE = 60
const TARGET_ITEMS = 120
const TARGET_NEEDS = 100

// ---------------------------------------------------------------- rng

function mulberry32(a: number) {
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(20260913)

const pick = <T>(xs: T[]): T => xs[Math.floor(rand() * xs.length)]
const chance = (p: number) => rand() < p
const int = (lo: number, hi: number) => lo + Math.floor(rand() * (hi - lo + 1))

// ---------------------------------------------------------------- dates

const DAY = 86400000
const iso = (d: Date) => d.toISOString().slice(0, 10)
const shift = (isoDate: string, days: number) =>
  iso(new Date(new Date(isoDate).getTime() + days * DAY))

const B: string[] = config.cycleBoundaries
/** [start, end) of each cycle. */
const CYCLES = B.slice(0, -1).map((start: string, i: number) => ({
  start,
  end: B[i + 1],
}))

// ---------------------------------------------------------------- voice
//
// Fifteen hand-written descriptions in the voice people actually use: typos,
// missing dimensions, brand names, inconsistent caps, pickup location dropped
// mid-sentence. Everything generated below clones this texture. Uniformly
// phrased synthetic data makes semantic matching look broken.

const HANDWRITTEN: string[] = [
  'IKEA MICKE desk, white, ~55in wide. small scratch on the top left corner but solid. pickup northdale, im on hickory',
  'selling my monitor - dell 24 inch 1080p, comes w/ the hdmi cable. works fine, no dead pixels',
  'Queen memory foam mattress topper, barely used, kept in the bag it came in. Lester, can meet by the plaza',
  'MINI FRIDGE. 3.2 cu ft i think? makes a bit of noise but it gets cold. u haul it, im on sunnydale',
  'office chair w/ arms, black mesh back, hydraulic still works. pickup beechwood',
  '2 monitor arms, vesa mount. one is missing a screw but it still clamps fine',
  'microwave 900w panasonic, clean inside. King St N near the bridge',
  'bed frame - full size, metal, no headboard. comes apart with an allen key which i still have',
  'standing desk converter thing, the kind that sits on top of your desk. VIVO brand. its heavy',
  'space heater, small ceramic one. ran it all winter no issues',
  'Full length mirror, the kind that leans on the wall. its glass so bring a car pls. northdale',
  'kitchen starter pack basically - 2 pots, a pan, cutting board, some utensils. all in one box',
  'TV 43in TCL roku tv, remote included. no stand tho, i had it wall mounted',
  'desk lamp, cheap amazon one, usb powered. works',
  'portable air conditioner 8000 btu, hose included. HEAVY, needs 2 ppl. lester',
]

/** Object phrasings, deliberately inconsistent. */
const OBJECTS: string[] = [
  'desk',
  'small desk',
  'writing desk',
  'folding table',
  'card table',
  'computer desk (glass top)',
  'ikea LINNMON desk top + legs',
  'monitor',
  '27in monitor',
  'ultrawide monitor (LG 29in)',
  'second monitor',
  'old 1080p monitor',
  'office chair',
  'desk chair',
  'gaming chair',
  'bar stool',
  'dining chair',
  'IKEA MARKUS chair',
  'bed frame',
  'twin bed frame',
  'futon',
  'mattress',
  'mattress topper',
  'bookshelf',
  'billy bookcase',
  'shelf unit',
  'nightstand',
  'dresser',
  'mini fridge',
  'microwave',
  'kettle',
  'rice cooker',
  'instant pot',
  'air fryer',
  'toaster oven',
  'blender',
  'pots and pans',
  'plates and bowls',
  'space heater',
  'fan',
  'tower fan',
  'humidifier',
  'air purifier',
  'portable AC',
  'vacuum',
  'swiffer + mop bucket',
  'drying rack',
  'lamp',
  'floor lamp',
  'desk lamp',
  'led strip lights',
  'mirror',
  'rug',
  'curtains + rod',
  'shower caddy',
  'laundry hamper',
  'TV',
  '32in tv',
  'tv stand',
  'monitor arm',
  'keyboard + mouse',
  'printer (brother laser)',
  'router',
  'extension cord + power bar',
  'bike',
  'bike lock',
  'winter tires (nobody wants these but theyre free)',
  'suitcase',
  'storage bins',
  'ironing board + iron',
]

const CONDITION: string[] = [
  'barely used',
  'used but fine',
  'works perfectly',
  'has some scuffs',
  'honestly a bit beat up but functional',
  'basically new',
  'clean',
  'one leg is wobbly but it stands',
  'missing the manual',
  'no issues',
  'a little wobbly',
  'theres a stain on one side',
  'like new tbh',
  'i only had it 4 months',
  'got it secondhand already',
]

const DIMS: string[] = [
  '~48in wide',
  'about 4 feet long',
  '60x30 i think',
  'not sure on dimensions sorry',
  'roughly 3ft tall',
  'standard size',
  'full size',
  'idk the measurements',
]

const EXTRAS: string[] = [
  'comes with the cable',
  'no box',
  'still have the original box',
  'includes the allen key',
  'remote included',
  'all screws included',
  'have the receipt somewhere',
  'u haul it',
  'needs 2 ppl to move',
  'can help you carry it down',
]

const NEED_OPENERS: string[] = [
  'looking for',
  'need',
  'anyone have',
  'ISO',
  'trying to find',
  'want',
  'in the market for',
  'hoping someone has',
]

const NEED_TAILS: string[] = [
  'doesnt have to be nice',
  'nothing fancy',
  'budget is basically zero',
  'ideally something i can carry myself',
  'any condition really',
  'would love to not buy new',
  'preferably free lol',
  'can pick up anytime',
  'i have a car so distance is fine',
  'no car so closer the better',
]

const STREETS: string[] = [
  'hickory',
  'phillip st',
  'albert',
  'university ave',
  'columbia',
  'lester',
  'regina',
  'weber',
  'king st',
  'sunview',
]

const NAMES: string[] = [
  'Amara', 'Ben', 'Chidi', 'Dana', 'Eli', 'Farah', 'Grace', 'Hassan',
  'Imani', 'Jae', 'Kiran', 'Lena', 'Mateo', 'Nadia', 'Omar', 'Priya',
  'Quinn', 'Rosa', 'Sam', 'Tomas', 'Uma', 'Viktor', 'Wen', 'Xiomara',
  'Yusuf', 'Zara', 'Aditi', 'Bruno', 'Cleo', 'Dev', 'Esme', 'Finn',
  'Gita', 'Hugo', 'Ines', 'Jonas', 'Keiko', 'Luca', 'Mira', 'Noor',
  'Otto', 'Pia', 'Rafi', 'Sana', 'Theo', 'Ugo', 'Vera', 'Wes', 'Yara',
  'Zane', 'Anika', 'Bo', 'Cato', 'Dalia', 'Ezra', 'Fiona', 'Gil',
  'Hana', 'Ivo', 'Jules',
]

const SURNAMES: string[] = [
  'A.', 'B.', 'C.', 'D.', 'E.', 'F.', 'G.', 'H.', 'K.', 'L.', 'M.',
  'N.', 'O.', 'P.', 'R.', 'S.', 'T.', 'V.', 'W.', 'Z.',
]

/** Roughen a clean string the way a real post would be. */
function rough(s: string): string {
  if (chance(0.18)) s = s.toLowerCase()
  else if (chance(0.08)) s = s.toUpperCase()
  if (chance(0.12)) s = s.replace(/\band\b/g, '&')
  if (chance(0.1)) s = s.replace(/\byou\b/g, 'u')
  if (chance(0.1)) s += '.'
  return s
}

function itemText(): string {
  const parts: string[] = [pick(OBJECTS)]
  if (chance(0.55)) parts.push(pick(CONDITION))
  if (chance(0.35)) parts.push(pick(DIMS))
  if (chance(0.4)) parts.push(pick(EXTRAS))
  if (chance(0.45)) parts.push(`pickup ${pick(config.locations).toLowerCase()}`)
  else if (chance(0.25)) parts.push(`im on ${pick(STREETS)}`)
  return rough(parts.join(chance(0.5) ? ', ' : '. '))
}

function needText(): string {
  const parts: string[] = [`${pick(NEED_OPENERS)} a ${pick(OBJECTS)}`]
  if (chance(0.6)) parts.push(pick(NEED_TAILS))
  if (chance(0.3)) parts.push(`im in ${pick(config.locations).toLowerCase()}`)
  return rough(parts.join(chance(0.5) ? ', ' : '. '))
}

// ---------------------------------------------------------------- generate

const people: Person[] = []
for (let i = 0; i < TARGET_PEOPLE; i++) {
  // Away for one cycle (sometimes two), in-location the rest. Jitter the
  // boundaries by a few days so chains have realistic small gaps rather than
  // suspiciously perfect zero-day handoffs.
  const c = int(0, CYCLES.length - 1)
  const span = chance(0.2) && c < CYCLES.length - 1 ? 2 : 1
  const from = CYCLES[c].start
  const until = CYCLES[Math.min(c + span - 1, CYCLES.length - 1)].end
  people.push({
    id: `p${i}`,
    label: `${NAMES[i % NAMES.length]} ${pick(SURNAMES)}`,
    location: pick(config.locations),
    awayFrom: shift(from, int(-4, 4)),
    awayUntil: shift(until, int(-4, 4)),
  })
}

const items: Item[] = []
for (let i = 0; i < TARGET_ITEMS; i++) {
  const holder = people[int(0, people.length - 1)]
  // Free from the moment the holder leaves. Most people are done with the
  // thing for good; the rest want it back when they return.
  const keepsIt = chance(0.4)
  items.push({
    id: `i${i}`,
    holderId: holder.id,
    rawText: i < HANDWRITTEN.length ? HANDWRITTEN[i] : itemText(),
    embedding: [],
    freeFrom: holder.awayFrom,
    freeUntil: keepsIt ? holder.awayUntil : B[B.length - 1],
  })
}

const needs: Need[] = []
for (let i = 0; i < TARGET_NEEDS; i++) {
  const person = people[int(0, people.length - 1)]
  // A need only exists while its owner is actually in the location, i.e. in a
  // cycle that does not overlap their away window.
  const open = CYCLES.filter(
    (cy: { start: string; end: string }) =>
      cy.end <= person.awayFrom || cy.start >= person.awayUntil,
  )
  if (open.length === 0) continue
  const cy = pick(open)
  needs.push({
    id: `n${i}`,
    personId: person.id,
    rawText: needText(),
    needFrom: shift(cy.start, int(-3, 3)),
    needUntil: shift(cy.end, int(-3, 3)),
    embedding: [],
  })
}

const dataset: Dataset = { people, items, needs }
writeFileSync(join(root, 'data', 'seed.json'), JSON.stringify(dataset, null, 2))

console.log(
  `seeded ${people.length} people, ${items.length} items, ${needs.length} needs -> data/seed.json`,
)
console.log('\nsample items:')
for (const it of [items[0], items[3], items[40], items[90]]) {
  if (it) console.log(`  ${it.id}  ${it.rawText}`)
}
console.log('\nsample needs:')
for (const n of [needs[0], needs[20], needs[55]]) {
  if (n) console.log(`  ${n.id}  ${n.rawText}`)
}
