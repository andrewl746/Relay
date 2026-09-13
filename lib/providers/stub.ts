import type { MatchProvider } from '../types.ts'
import { cosine } from '../vector.ts'
import { config } from '../config.ts'

/**
 * Offline stand-in for a real embedding model. No network, no keys, fully
 * deterministic — so retrieval, the DP, and the timeline can be built and
 * demoed without a provider account.
 *
 * It is a hashed bag of features, not a language model:
 *   - token hashes           exact word overlap
 *   - character trigrams     survives typos ("moniter" ~ "monitor")
 *   - concept hashes         the only semantic layer, tables below
 *
 * The concept tables are the one place this file knows what the items are.
 * They exist because pure lexical hashing makes "folding table" look unrelated
 * to "need a desk", which reads as broken matching in a demo. Swap in a real
 * provider and these tables become dead weight, which is the point of the seam.
 *
 * PHRASES is checked before CONCEPTS and matters more than it looks. Half these
 * items are two words where the head noun belongs to a different class than the
 * modifier — a "stand mixer" is not a "bike repair stand", an "air mattress" is
 * not an "air purifier", a "power bar" is not a "power drill". Single-token
 * mapping gets all three wrong.
 */

const DIM = 256

/** Adjacent word pairs, checked first and consumed so singles can't override. */
const PHRASES: Record<string, string> = {
  'power drill': 'tools',
  'cordless drill': 'tools',
  'impact driver': 'tools',
  'screwdriver set': 'tools',
  'allen key': 'tools',
  'allen keys': 'tools',
  'wrench set': 'tools',
  'stud finder': 'tools',
  'spirit level': 'tools',
  'step ladder': 'ladder',
  'step stool': 'ladder',
  'hand truck': 'moving',
  'packing tape': 'moving',
  'tape gun': 'moving',
  'moving straps': 'moving',
  'moving blankets': 'moving',
  'carpet cleaner': 'cleaning',
  'steam mop': 'cleaning',
  'shop vac': 'cleaning',
  'air mattress': 'guest',
  'air pump': 'guest',
  'folding cot': 'guest',
  'sleeping bag': 'guest',
  'stand mixer': 'party',
  'food processor': 'party',
  'punch bowl': 'party',
  'roasting pan': 'party',
  'waffle maker': 'party',
  'raclette grill': 'party',
  'serving platters': 'party',
  'folding table': 'party',
  'folding chairs': 'party',
  'ring light': 'av',
  'camera tripod': 'av',
  'karaoke mic': 'av',
  'bluetooth speaker': 'av',
  'sewing machine': 'garment',
  'ironing board': 'garment',
  'garment steamer': 'garment',
  'garment bag': 'travel',
  'luggage scale': 'travel',
  'duffel bag': 'travel',
  'large suitcase': 'travel',
  'snow shovel': 'outdoor',
  'ice scraper': 'outdoor',
  'camping stove': 'outdoor',
  'bike pump': 'bike',
  'repair stand': 'bike',
  'tire levers': 'bike',
  'patch kit': 'bike',
  'space heater': 'climate',
  'box fan': 'climate',
  'air purifier': 'climate',
  'paper shredder': 'office',
  'extension cord': 'power',
  'power bar': 'power',
  'jumper cables': 'power',
  'first aid': 'safety',
}

/** Single tokens, only where the word belongs to exactly one class. */
const CONCEPTS: Record<string, string> = {}
function concept(group: string, ...words: string[]) {
  for (const w of words) CONCEPTS[w] = group
}

concept('tools', 'drill', 'drills', 'screwdriver', 'screwdrivers', 'hammer', 'wrench', 'wrenches', 'pliers', 'toolkit', 'tools', 'hex', 'socket', 'bits', 'drilling')
concept('ladder', 'ladder', 'stepladder')
concept('moving', 'dolly', 'handtruck', 'moving', 'movein', 'moveout')
concept('cleaning', 'vacuum', 'vac', 'mop', 'swiffer', 'broom', 'shampooer', 'cleaner', 'hoover')
concept('guest', 'mattress', 'cot', 'inflatable', 'airbed')
concept('party', 'stockpot', 'roasting', 'waffle', 'raclette', 'mixer', 'ladle', 'platters', 'punch', 'pot', 'pots', 'pan', 'pans')
concept('av', 'projector', 'speaker', 'speakers', 'karaoke', 'microphone', 'tripod', 'hdmi', 'projection')
concept('garment', 'sewing', 'iron', 'ironing', 'steamer', 'hem', 'thread', 'needle', 'singer')
concept('travel', 'suitcase', 'luggage', 'duffel', 'spinner', 'carryon')
concept('outdoor', 'tent', 'camping', 'campsite', 'cooler', 'shovel', 'scraper')
concept('bike', 'bike', 'bicycle', 'tire', 'tires', 'levers', 'psi')
concept('climate', 'humidifier', 'dehumidifier', 'heater', 'purifier', 'fan')
concept('office', 'printer', 'shredder', 'toner', 'scanner')
concept('power', 'jumper', 'cables', 'charger', 'outlet')
concept('safety', 'bandages', 'thermometer')

const STOP = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'is', 'it', 'its', 'i', 'im',
  'my', 'me', 'you', 'u', 'your', 'to', 'of', 'for', 'in', 'on', 'at', 'with',
  'w', 'so', 'be', 'have', 'has', 'had', 'this', 'that', 'they', 'them',
  'can', 'still', 'just', 'really', 'very', 'some', 'any', 'all', 'no', 'not',
  'do', 'does', 'did', 'from', 'as', 'by', 'about', 'there', 'here', 'tho',
  'lol', 'tbh', 'pls', 'please', 'idk', 'sorry', 'basically', 'thing',
  'kind', 'one', 'two', 'ppl', 'bit', 'got', 'get', 'need', 'needs',
  'looking', 'borrow', 'iso', 'anyone', 'someone', 'own', 'owns', 'trying',
  'find', 'hoping', 'want', 'wants', 'ill', 'ive', 'its', 'back', 'when',
  'done', 'only', 'couple', 'hours', 'day', 'days', 'weekend', 'same',
])

/** Neighbourhood names — meaningful, but not a reason to say "shares X". */
const PLACES = new Set(
  config.locations.flatMap((l) => l.toLowerCase().split(/\s+/)),
)

function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) % DIM
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 0 && !STOP.has(t))
}

/**
 * Concept groups present in a token list. Adjacent pairs win over singles, and
 * a token used by a phrase is not reconsidered on its own.
 */
function conceptsOf(tokens: string[]): Set<string> {
  const out = new Set<string>()
  const used = new Array<boolean>(tokens.length).fill(false)
  for (let i = 0; i + 1 < tokens.length; i++) {
    const g = PHRASES[`${tokens[i]} ${tokens[i + 1]}`]
    if (g) {
      out.add(g)
      used[i] = used[i + 1] = true
    }
  }
  tokens.forEach((t, i) => {
    if (used[i]) return
    const g = CONCEPTS[t]
    if (g) out.add(g)
  })
  return out
}

function embedOne(text: string): number[] {
  const v = new Array<number>(DIM).fill(0)
  const tokens = tokenize(text)
  for (const t of tokens) {
    v[hash(t)] += 1
    if (t.length >= 4) {
      for (let i = 0; i + 3 <= t.length; i++)
        v[hash(`#${t.slice(i, i + 3)}`)] += 0.3
    }
  }
  for (const g of conceptsOf(tokens)) v[hash(`::${g}`)] += 2
  let norm = 0
  for (const x of v) norm += x * x
  norm = Math.sqrt(norm)
  if (norm === 0) return v
  return v.map((x) => x / norm)
}

export const StubProvider: MatchProvider = {
  async embed(texts: string[]): Promise<number[][]> {
    return texts.map(embedOne)
  },

  async rerank(need: string, candidates: string[]) {
    // Vectors are non-negative, so cosine is already in [0,1] and can be used
    // as the score directly. A real reranker replaces this wholesale.
    const nv = embedOne(need)
    const nt = tokenize(need)
    const nset = new Set(nt)
    const ngroups = conceptsOf(nt)

    return candidates.map((c) => {
      const score = cosine(nv, embedOne(c))
      const ct = tokenize(c)
      const shared = [...new Set(ct)].filter(
        (t) => nset.has(t) && !PLACES.has(t),
      )
      const sameArea = ct.some((t) => nset.has(t) && PLACES.has(t))
      const group = [...conceptsOf(ct)].find((g) => ngroups.has(g))

      let reason: string
      if (shared.length > 0) {
        reason = `matches on ${shared.slice(0, 3).join(', ')}`
        if (group) reason += `, same ${group} class`
      } else if (group) {
        reason = `different wording, both ${group} class`
      } else {
        reason = 'no shared terms, ranked on overall similarity'
      }
      if (sameArea) reason += '; same area'
      return { score, reason }
    })
  },
}
