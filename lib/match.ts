import type { Dataset, MatchProvider } from './types.ts'
import { cosine } from './vector.ts'

/** How many items survive retrieval per need. Optimizes recall, not precision. */
export const TOP_K = 10

export type Scored = { itemId: string; cosine: number }

/** `${needId}|${itemId}` -> reranked score and reason. */
export type MatchTable = Record<string, { score: number; reason: string }>

/**
 * Stage 2 — retrieve. Cosine over an in-memory array. At n=120 items this is
 * ~10k dot products, i.e. microseconds. A vector database here would be pure
 * setup cost.
 */
export function retrieve(data: Dataset, k = TOP_K): Record<string, Scored[]> {
  const out: Record<string, Scored[]> = {}
  for (const need of data.needs) {
    const scored: Scored[] = data.items.map((item) => ({
      itemId: item.id,
      cosine: cosine(need.embedding, item.embedding),
    }))
    scored.sort((a, b) => b.cosine - a.cosine)
    out[need.id] = scored.slice(0, k)
  }
  return out
}

/**
 * Stage 3 — rerank. One provider call per need over its retrieved candidates.
 * Precomputed and cached; nothing here runs during the demo.
 */
export async function rerank(
  data: Dataset,
  retrieved: Record<string, Scored[]>,
  provider: MatchProvider,
  onProgress?: (done: number, total: number) => void,
): Promise<MatchTable> {
  const itemsById = new Map(data.items.map((i) => [i.id, i]))
  const table: MatchTable = {}
  let done = 0
  for (const need of data.needs) {
    const cands = retrieved[need.id] ?? []
    const texts = cands.map((c) => itemsById.get(c.itemId)!.rawText)
    const results = await provider.rerank(need.rawText, texts)
    cands.forEach((c, idx) => {
      const r = results[idx]
      // Fall back to the retrieval cosine whenever the provider did not return
      // a usable number — missing entry, unparseable reply, NaN. A remote
      // provider having a bad minute must degrade to raw similarity, never
      // silently zero out a real candidate or poison the DP with NaN.
      const usable = typeof r?.score === 'number' && Number.isFinite(r.score)
      table[`${need.id}|${c.itemId}`] = {
        score: usable ? r.score : c.cosine,
        reason: usable ? r.reason : `${r?.reason ?? 'no reason returned'} (cosine fallback)`,
      }
    })
    onProgress?.(++done, data.needs.length)
  }
  return table
}

export function lookup(
  table: MatchTable,
  needId: string,
  itemId: string,
): { score: number; reason: string } | undefined {
  return table[`${needId}|${itemId}`]
}
