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
const config: {
  locations: string[]
  cycleBoundaries: string[]
  pricing: { defaultRatePerDay: number }
} = JSON.parse(
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

/**
 * Things you keep, not things you borrow. A student moving out of residence
 * does not need their water filter, and the student arriving will not pay $50
 * for a new one. Ownership transfers once — in the engine, a chain of length 1
 * — after which the buyer owns it and can relist it themselves.
 *
 * Prices are what a used one actually goes for between students, not retail.
 * The whole point is that it beats both the dumpster and the store.
 */
const SELL_OBJECTS: [string, number][] = [
  ['brita water filter', 12],
  ['desk lamp', 8],
  ['drying rack', 10],
  ['shower caddy', 5],
  ['laundry hamper', 6],
  ['cutlery set', 8],
  ['plates and bowls, set of 4', 12],
  ['mugs, 3 of them', 5],
  ['mattress topper, twin xl', 25],
  ['mini fridge', 45],
  ['electric kettle', 14],
  ['toaster', 10],
  ['rice cooker', 18],
  ['microwave', 35],
  ['storage bins, 3 stackable', 12],
  ['full length mirror', 15],
  ['bed risers', 8],
  ['desk chair', 30],
  ['power bar with surge protection', 7],
  ['clothing rack', 14],
  ['shoe rack', 9],
  ['bedside table', 20],
]

const SELL_VOICE: string[] = [
  'brita water filter + 2 unused cartridges. im moving out friday, dont want to bin it. $12',
  'desk lamp, white, the clip on kind. works fine i just have 2. $8 beechwood',
  'drying rack. folds flat. honestly just come take it, $5',
  'mini fridge - works, freezer compartment is small but fine. $45, u haul it. lester',
  'twin xl mattress topper, washed. moving home and it wont fit in the car. $25',
  'electric kettle + a toaster, $20 for both. northdale, gone by sunday',
  'plates bowls and cutlery, enough for 4. leaving res, dont need any of it. $18',
  'full length mirror, the lean against the wall kind. no chips. $15 king st n',
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
  const pool = chance(0.3) ? SELL_OBJECTS.map(([o]) => o) : OBJECTS
  const parts: string[] = [`${pick(NEED_OPENERS)} a ${pick(pool)}`]
  if (chance(0.7)) parts.push(pick(NEED_TAILS))
  if (chance(0.3)) parts.push(`im in ${pick(config.locations).toLowerCase()}`)
  return rough(parts.join(chance(0.5) ? ', ' : '. '))
}

/** A sale listing: the object, a price, and usually a move-out deadline. */
function sellText(): [string, number] {
  const [object, base] = pick(SELL_OBJECTS)
  // Used goods between students scatter around the going rate.
  const price = Math.max(3, Math.round(base * (0.7 + rand() * 0.6)))
  const parts: string[] = [object]
  if (chance(0.6)) parts.push(pick(CONDITION))
  if (chance(0.4)) parts.push(pick(SELL_TAILS))
  parts.push(`$${price}`)
  if (chance(0.5)) parts.push(`pickup ${pick(config.locations).toLowerCase()}`)
  return [rough(parts.join(chance(0.5) ? ', ' : '. ')), price]
}

const SELL_TAILS: string[] = [
  'moving out so it needs to go',
  'leaving res, dont need it',
  'gone by sunday',
  'first come',
  'dont want to move it home',
  'u haul it',
  'can meet on campus',
]

/**
 * Daily rental rate by object class. Mirrors config.pricing.ratesByClass —
 * duplicated here as a keyword table rather than importing the provider's
 * concept logic, because seed data should not depend on a matcher.
 */
const RATE_WORDS: [RegExp, number][] = [
  [/carpet cleaner|steam mop|shop vac|vacuum|shampooer/, 12],
  [/hand truck|dolly|moving|packing tape/, 8],
  [/projector|speaker|karaoke|tripod|ring light/, 8],
  [/camping|tent|cooler|shovel|scraper|sleeping bag/, 6],
  [/stockpot|roasting|waffle|raclette|mixer|processor|punch|platters|folding/, 6],
  [/ladder|stool|air mattress|cot/, 5],
  [/sewing|iron|steamer/, 5],
  [/humidifier|dehumidifier|heater|fan/, 5],
  [/suitcase|luggage|duffel|garment bag/, 3],
  [/bike|tire|patch kit/, 3],
  [/printer|shredder/, 3],
  [/extension cord|power bar|jumper/, 2],
  [/first aid/, 2],
]

function rateFor(text: string): number {
  const t = text.toLowerCase()
  for (const [re, rate] of RATE_WORDS) if (re.test(t)) return rate
  return config.pricing.defaultRatePerDay
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
  
  const possibleWindows: ('morning' | 'afternoon' | 'evening')[] = ['morning', 'afternoon', 'evening']
  const pWins: ('morning' | 'afternoon' | 'evening')[] = []
  possibleWindows.forEach(w => { if (chance(0.6)) pWins.push(w) })
  if (pWins.length === 0) pWins.push(pick(possibleWindows)) // Ensure at least one window
  
  people.push({
    id: `p${i}`,
    label: `${NAMES[i % NAMES.length]} ${pick(SURNAMES)}`,
    location: pick(config.locations),
    awayFrom: shift(TERM_START, start),
    awayUntil: shift(TERM_START, start + len),
    pickupWindows: pWins,
  })
}

/** Share of generated items that are for sale rather than for loan. */
const SALE_SHARE = 0.3

const items: Item[] = []
for (let i = 0; i < TARGET_ITEMS; i++) {
  const holder = people[int(0, people.length - 1)]
  const hwRent = HANDWRITTEN.length
  const hwSale = hwRent + SELL_VOICE.length

  let rawText: string
  let deal: 'rent' | 'sale'
  let price: number

  if (i < hwRent) {
    rawText = HANDWRITTEN[i]
    deal = 'rent'
    price = rateFor(rawText)
  } else if (i < hwSale) {
    rawText = SELL_VOICE[i - hwRent]
    deal = 'sale'
    // Read the price back out of the text the human wrote, so the listing and
    // the data can never disagree on screen.
    price = Number(rawText.match(/\$(\d+)/)?.[1] ?? 15)
  } else if (chance(SALE_SHARE)) {
    ;[rawText, price] = sellText()
    deal = 'sale'
  } else {
    rawText = itemText()
    deal = 'rent'
    price = rateFor(rawText)
  }

  // A loan: the owner keeps the thing all term and lends it out repeatedly.
  // What the chain schedules is circulation, not a one-way handoff.
  //
  // A sale: it has to be gone before they move out. That deadline is real time
  // pressure, and it is where the original move-out framing survives — as one
  // property of one item kind, not as the whole product.
  items.push({
    id: `i${i}`,
    holderId: holder.id,
    rawText,
    embedding: [],
    freeFrom: TERM_START,
    freeUntil: deal === 'sale' ? shift(TERM_START, int(18, TERM_DAYS - 5)) : TERM_END,
    deal,
    price,
  })
}

const needs: Need[] = []
for (let i = 0; i < TARGET_NEEDS; i++) {
  const person = people[int(0, people.length - 1)]
  // You borrow a drill for an afternoon, not a fortnight. Most loans are a day
  // or two; a few run a week (a carpet cleaner before an inspection, a suitcase
  // over reading week). The old int(2,18) meant a single borrower could hold a
  // drill for 15 days, which congested the network, blocked realistic short
  // bookings, and contradicted the whole premise.
  const len = chance(0.7) ? int(1, 3) : chance(0.75) ? int(4, 7) : int(8, 14)
  const start = int(0, TERM_DAYS - len)
  const from = shift(TERM_START, start)
  const until = shift(TERM_START, start + len)
  // Not while they are away — they cannot receive or return it.
  if (from < person.awayUntil && until > person.awayFrom) continue
  
  const urgency = chance(0.2) ? 'high' : (chance(0.4) ? 'medium' : 'low');
  
  needs.push({
    id: `n${i}`,
    personId: person.id,
    rawText: needText(),
    needFrom: from,
    needUntil: until,
    embedding: [],
    urgency,
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
