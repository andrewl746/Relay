import { getProvider, providerName } from "../providers/index.ts";
import { cosine } from "../vector.ts";
import { embed as minilm } from "./embed";

/**
 * Search that isn't Ctrl-F.
 *
 * The board's text filter is a lookup table (./search.ts) — it knows that a
 * bookshelf is a bookcase because someone wrote that down. This is the other
 * half: an embedding of the query, so something nobody wrote a synonym for
 * still finds things. "Something to keep my milk cold" shares no word with
 * "Danby mini fridge, 3.1 cu ft", and only a vector closes that gap.
 *
 * Two models, in order of preference:
 *
 *   minilm    all-MiniLM-L6-v2 through ONNX, in-process, 384 dimensions. A
 *             real sentence transformer, no API key and no network call once
 *             the weights are on disk.
 *   provider  the same seam the routing engine uses (MATCH_PROVIDER=stub is
 *             the offline hashed bag, =snowflake is Cortex). Used when the
 *             weights cannot be loaded at all.
 *
 * Two guards, both measured rather than assumed:
 *
 *   relative cut   absolute cosine is not comparable across queries. Against
 *                  this corpus MiniLM puts "lamp" at 0.68 and "milk cold" at
 *                  0.32, so one fixed threshold either drops the second query
 *                  or floods the first. Keep what is close to the best hit for
 *                  THIS query instead.
 *   floor          if even the best hit is weak, the query is about something
 *                  the board doesn't have. Return nothing and let the lexical
 *                  half answer, rather than ranking noise.
 *
 * The cuts are per-model because the two score on different scales. Results
 * are unioned with the lexical hits, never substituted for them, so turning
 * the model off can only remove results — it can't break search.
 */

/** Measured on the real board: correct hits 0.32-0.68, noise under 0.25. */
const MINILM = { relative: 0.7, floor: 0.2 };
/** The hashed bag scores lower and flatter, so it needs a looser cut. */
const FALLBACK = { relative: 0.5, floor: 0.12 };

export async function semanticHits(
  query: string,
  items: { id: string; text: string }[],
): Promise<Set<string>> {
  if (items.length === 0 || !query.trim()) return new Set();

  const texts = items.map((i) => i.text);

  // Preferred path: a real sentence transformer, in-process.
  const local = await minilm([query, ...texts]);
  if (local) return select(items, local, MINILM);

  try {
    const vectors = await getProvider().embed([query, ...texts]);
    return select(items, vectors, FALLBACK);
  } catch (err) {
    // A search box is not worth taking the board down for. Whatever the
    // provider did — no key, rate limit, network — the lexical half still
    // answered, so log it and return nothing.
    console.warn(`[search] ${providerName()} embed failed, lexical only:`, err);
    return new Set();
  }
}

function select(
  items: { id: string }[],
  vectors: number[][],
  { relative, floor }: { relative: number; floor: number },
): Set<string> {
  const [q, ...rest] = vectors;
  const scored = items.map((item, i) => ({ id: item.id, score: cosine(q, rest[i]) }));
  const best = Math.max(...scored.map((s) => s.score));
  if (best < floor) return new Set();
  const cut = Math.max(best * relative, floor);
  return new Set(scored.filter((s) => s.score >= cut).map((s) => s.id));
}
