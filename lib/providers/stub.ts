import type { MatchProvider } from '../types.ts'
import { cosine } from '../vector.ts'

/**
 * Offline stand-in for a real embedding model. No network, no keys, fully
 * deterministic — so retrieval, the DP, and the timeline can be built and
 * demoed without a provider account.
 *
 * It is a hashed bag of features, not a language model:
 *   - token hashes           exact word overlap
 *   - character trigrams     survives typos ("moniter" ~ "monitor")
 *   - concept hashes         the only semantic layer, table below
 *
 * The concept table is the one place this file knows what the items are. It
 * exists because pure lexical hashing makes "folding table" look unrelated to
 * "need a desk", which reads as broken matching in a demo. Swap in a real
 * provider and this table becomes dead weight, which is the point of the seam.
 */

const DIM = 256

const CONCEPTS: Record<string, string> = {}
function concept(group: string, ...words: string[]) {
  for (const w of words) CONCEPTS[w] = group
}

concept('surface', 'desk', 'desks', 'table', 'tables', 'workstation', 'micke', 'linnmon', 'standing', 'converter')
concept('display', 'monitor', 'monitors', 'screen', 'display', 'tv', 'television', 'ultrawide', 'roku', 'tcl', '1080p', 'inch', 'in')
concept('seating', 'chair', 'chairs', 'stool', 'seat', 'seating', 'markus', 'gaming')
concept('sleep', 'bed', 'frame', 'mattress', 'topper', 'futon', 'queen', 'twin', 'memory', 'foam')
concept('storage', 'shelf', 'shelves', 'bookshelf', 'bookcase', 'billy', 'dresser', 'nightstand', 'bins', 'storage', 'hamper')
concept('cold', 'fridge', 'refrigerator', 'freezer', 'mini', 'cooler')
concept('cooking', 'microwave', 'kettle', 'cooker', 'rice', 'instant', 'pot', 'pots', 'pan', 'pans', 'fryer', 'toaster', 'oven', 'blender', 'plates', 'bowls', 'utensils', 'kitchen', 'cutting')
concept('climate', 'heater', 'fan', 'humidifier', 'purifier', 'ac', 'conditioner', 'air', 'btu', 'tower')
concept('light', 'lamp', 'lamps', 'light', 'lights', 'led', 'lighting')
concept('cleaning', 'vacuum', 'swiffer', 'mop', 'broom', 'bucket', 'drying', 'rack', 'iron', 'ironing')
concept('decor', 'mirror', 'rug', 'curtains', 'rod', 'poster')
concept('computer', 'keyboard', 'mouse', 'printer', 'router', 'laser', 'brother', 'cable', 'hdmi', 'vesa', 'arm', 'arms', 'power', 'extension', 'cord')
concept('transport', 'bike', 'bicycle', 'lock', 'tires', 'suitcase', 'luggage')

const STOP = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'is', 'it', 'its', 'i', 'im',
  'my', 'me', 'you', 'u', 'your', 'to', 'of', 'for', 'in', 'on', 'at', 'with',
  'w', 'so', 'be', 'have', 'has', 'had', 'this', 'that', 'they', 'them',
  'can', 'still', 'just', 'really', 'very', 'some', 'any', 'all', 'no', 'not',
  'do', 'does', 'did', 'from', 'as', 'by', 'about', 'there', 'here', 'tho',
  'lol', 'tbt', 'tbh', 'pls', 'please', 'idk', 'sorry', 'basically', 'thing',
  'kind', 'one', 'two', 'ppl', 'bit', 'got', 'get',
])

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

function embedOne(text: string): number[] {
  const v = new Array<number>(DIM).fill(0)
  const tokens = tokenize(text)
  for (const t of tokens) {
    v[hash(t)] += 1
    const c = CONCEPTS[t]
    if (c) v[hash(`::${c}`)] += 1.5
    if (t.length >= 4) {
      for (let i = 0; i + 3 <= t.length; i++) v[hash(`#${t.slice(i, i + 3)}`)] += 0.3
    }
  }
  let norm = 0
  for (const x of v) norm += x * x
  norm = Math.sqrt(norm)
  if (norm === 0) return v
  return v.map((x) => x / norm)
}

/** Words the two texts share, for a human-readable reason string. */
function overlap(need: string, candidate: string): string[] {
  const a = new Set(tokenize(need))
  const shared: string[] = []
  for (const t of new Set(tokenize(candidate))) if (a.has(t)) shared.push(t)
  return shared
}

function sharedConcept(need: string, candidate: string): string | null {
  const a = new Set(tokenize(need).map((t) => CONCEPTS[t]).filter(Boolean))
  for (const t of tokenize(candidate)) {
    const c = CONCEPTS[t]
    if (c && a.has(c)) return c
  }
  return null
}

export const StubProvider: MatchProvider = {
  async embed(texts: string[]): Promise<number[][]> {
    return texts.map(embedOne)
  },

  async rerank(need: string, candidates: string[]) {
    // Vectors are non-negative, so cosine is already in [0,1] and can be used
    // as the score directly. A real reranker replaces this wholesale.
    const nv = embedOne(need)
    return candidates.map((c) => {
      const score = cosine(nv, embedOne(c))
      const shared = overlap(need, c)
      const group = sharedConcept(need, c)
      let reason: string
      if (shared.length > 0) {
        reason = `shares ${shared.slice(0, 3).join(', ')}`
        if (group) reason += `; same ${group} class`
      } else if (group) {
        reason = `no shared wording, but both ${group}`
      } else {
        reason = 'weak overlap, retained only for recall'
      }
      return { score, reason }
    })
  },
}
