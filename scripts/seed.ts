/**
 * Seed generator. Run: npm run seed
 *
 * Deterministic — same output every run, so the demo never surprises us.
 * Embeddings are left empty here; the pipeline step fills and caches them.
 *
 * The phrasing pools below are the ONE place outside config.json that is
 * allowed to know what the items actually are. A "new user group" pivot is a
 * diff against config.json plus this file's pools, budgeted at 15 minutes.
 *
 * Current audience: someone living independently for the first time. That
 * changes what an item IS — not furniture inherited at a term boundary, but
 * the drill you need for one afternoon and cannot justify owning. So the
 * windows are days-to-weeks rather than months, and people mostly stay put.
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
const TARGET_ITEMS = 90
const TARGET_NEEDS = 260

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
const span = (a: string, b: string) =>
  Math.round((new Date(b).getTime() - new Date(a).getTime()) / DAY)

const B = config.cycleBoundaries
const TERM_START = B[0]
const TERM_END = B[B.length - 1]
const TERM_DAYS = span(TERM_START, TERM_END)

// ---------------------------------------------------------------- voice
//
// Fifteen hand-written descriptions in the voice people actually use: typos,
// missing dimensions, brand names, inconsistent caps, pickup location dropped
// mid-sentence. Everything generated below clones this texture. Uniformly
// phrased synthetic data makes semantic matching look broken.
//
// Every one of these is a thing you need twice a year and would be ridiculous
// to buy. That is the pivot, expressed as data.

const HANDWRITTEN: string[] = [
  'power drill - black&decker, bits are in the case. ive used it maybe twice. northdale',
  'full screwdriver set + the allen keys, for when u inevitably build ikea stuff at 1am',
  'steam mop, my mom made me buy it. works great actually. sunnydale',
  'air mattress queen size, comes w the pump. for when ppl crash at ur place',
  'vacuum - dyson stick one, battery holds about 20 min now. lester',
  'big stockpot, like the huge kind. only needed it once for a party lol',
  'carpet cleaner. you WILL need this at move out, trust me. beechwood',
  'large suitcase, spinner wheels, one wheel is a bit sticky but rolls fine',
  'sewing machine - singer, basic model. i can show u how to thread it',
  'projector 1080p hdmi, no screen just point it at a wall. King St N',
  '6ft step ladder. its in my hallway, im on regina',
  'hand truck / dolly, folds flat. moving day essential. heavy ish',
  'waffle maker. yes really. still in the box',
  'basic red toolkit - hammer, pliers, wrench, the usual. northdale',
  'bike pump with the pressure gauge + a patch kit',
]

/**
 * Things you need occasionally and cannot justify buying. This pool is the
 * clearest statement of who the user now is.
 */
const OBJECTS: string[] = [
  'drill',
  'power drill',
  'cordless drill',
  'impact driver',
  'stud finder',
  'spirit level',
  'toolkit',
  'hammer',
  'screwdriver set',
  'allen key set',
  'wrench set',
  'step ladder',
  'ladder',
  'step stool',
  'hand truck',
  'dolly',
  'moving straps',
  'packing tape gun',
  'moving blankets',
  'carpet cleaner',
  'steam mop',
  'vacuum',
  'shop vac',
  'air mattress',
  'air pump',
  'folding cot',
  'folding chairs (4)',
  'folding table',
  'projector',
  'bluetooth speaker',
  'karaoke mic',
  'camera tripod',
  'ring light',
  'sewing machine',
  'iron',
  'ironing board',
  'garment steamer',
  'stockpot',
  'roasting pan',
  'waffle maker',
  'raclette grill',
  'stand mixer',
  'food processor',
  'punch bowl + ladle',
  'serving platters',
  'cooler',
  'camping stove',
  'tent',
  'sleeping bag',
  'snow shovel',
  'ice scraper',
  'bike pump',
  'bike repair stand',
  'tire levers + patch kit',
  'luggage scale',
  'suitcase',
  'large suitcase',
  'duffel bag',
  'garment bag',
  'humidifier',
  'dehumidifier',
  'space heater',
  'box fan',
  'printer',
  'paper shredder',
  'extension cord',
  'power bar',
  'jumper cables',
  'first aid kit',
]

const CONDITION: string[] = [
  'barely used',
  'used once honestly',
  'works perfectly',
  'has some scuffs',
  'a bit beat up but functional',
  'basically new',
  'clean',
  'missing the manual',
  'no issues',
  'ive had it since first year',
  'got it secondhand already',
  'battery is fine',
  'one part is a bit sticky but works',
]

const DIMS: string[] = [
  '~4ft',
  'the big one',
  'the small one',
  'not sure on size sorry',
  'standard size',
  'full size',
  'idk the measurements',
  'compact, fits in a closet',
]

const EXTRAS: string[] = [
  'comes with the case',
  'no box',
  'still have the original box',
  'all the bits included',
  'charger included',
  'u haul it',
  'can drop it off if ur close',
  'just bring it back when ur done',
  'pls dont lose the small parts',
  'i can show u how to use it',
]

const NEED_OPENERS: string[] = [
  'looking to borrow',
  'need',
  'anyone have',
  'ISO',
  'trying to find',
  'can i borrow',
  'does anyone own',
  'hoping someone has',
]

const NEED_TAILS: string[] = [
  'only need it for a couple hours',
  'just for the weekend',
  'nothing fancy',
  'cant justify buying one for this',
  'ill give it back same day',
  'any condition really',
  'would rather not buy one tbh',
  'i have no car so closer the better',
  'can pick up anytime',
  'moving out so its kind of urgent',
  'for one project then im done',
  'my room is tiny so i cant keep it',
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
  if (chance(0.3)) parts.push(pick(DIMS))
  if (chance(0.45)) parts.push(pick(EXTRAS))
  if (chance(0.45)) parts.push(`pickup ${pick(config.locations).toLowerCase()}`)
  else if (chance(0.25)) parts.push(`im on ${pick(STREETS)}`)
  return rough(parts.join(chance(0.5) ? ', ' : '. '))
}

function needText(): string {
  const parts: string[] = [`${pick(NEED_OPENERS)} a ${pick(OBJECTS)}`]
  if (chance(0.7)) parts.push(pick(NEED_TAILS))
  if (chance(0.3)) parts.push(`im in ${pick(config.locations).toLowerCase()}`)
  return rough(parts.join(chance(0.5) ? ', ' : '. '))
}

// ---------------------------------------------------------------- generate

const people: Person[] = []
for (let i = 0; i < TARGET_PEOPLE; i++) {
  // This audience does not rotate out every four months — they live here for
  // the term. The away window is a reading week or a trip home, and it exists
  // so the timeline still shows when someone cannot take a handoff.
  const hasBreak = chance(0.75)
  const len = hasBreak ? int(5, 14) : 0
  const start = hasBreak ? int(20, TERM_DAYS - len - 10) : TERM_DAYS
  people.push({
    id: `p${i}`,
    label: `${NAMES[i % NAMES.length]} ${pick(SURNAMES)}`,
    location: pick(config.locations),
    awayFrom: shift(TERM_START, start),
    awayUntil: shift(TERM_START, start + len),
  })
}

const items: Item[] = []
for (let i = 0; i < TARGET_ITEMS; i++) {
  const holder = people[int(0, people.length - 1)]
  // The owner keeps the thing all term and lends it out repeatedly. What the
  // chain schedules is circulation, not a one-way handoff at a term boundary.
  items.push({
    id: `i${i}`,
    holderId: holder.id,
    rawText: i < HANDWRITTEN.length ? HANDWRITTEN[i] : itemText(),
    embedding: [],
    freeFrom: TERM_START,
    freeUntil: TERM_END,
  })
}

const needs: Need[] = []
for (let i = 0; i < TARGET_NEEDS; i++) {
  const person = people[int(0, people.length - 1)]
  // Days to weeks, not months. You borrow the drill for an afternoon.
  const len = int(2, 18)
  const start = int(0, TERM_DAYS - len)
  const from = shift(TERM_START, start)
  const until = shift(TERM_START, start + len)
  // Not while they are away — they cannot receive or return it.
  if (from < person.awayUntil && until > person.awayFrom) continue
  needs.push({
    id: `n${i}`,
    personId: person.id,
    rawText: needText(),
    needFrom: from,
    needUntil: until,
    embedding: [],
  })
}

const dataset: Dataset = { people, items, needs }
writeFileSync(join(root, 'data', 'seed.json'), JSON.stringify(dataset, null, 2))

console.log(
  `seeded ${people.length} people, ${items.length} items, ${needs.length} needs -> data/seed.json`,
)
console.log('\nsample items:')
for (const it of [items[0], items[3], items[40], items[80]])
  if (it) console.log(`  ${it.id}  ${it.rawText}`)
console.log('\nsample needs:')
for (const n of [needs[0], needs[20], needs[55]])
  if (n) console.log(`  ${n.id}  ${n.rawText}`)
