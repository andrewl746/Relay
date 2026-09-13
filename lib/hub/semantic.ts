import { getProvider, providerName } from "../providers/index.ts";
import { cosine } from "../vector.ts";

/**
 * Search that isn't Ctrl-F.
 *
 * The board's text filter is a lookup table (./search.ts) — it knows that a
 * bookshelf is a bookcase because someone wrote that down. This is the other
 * half: the same embedding provider the routing engine uses to match a need to
 * an item, pointed at the search box, so a query that nobody wrote a synonym
 * for still finds things.
 *
 * It is the same seam as everywhere else — MATCH_PROVIDER=stub is the offline
 * hashed-bag model, MATCH_PROVIDER=snowflake embeds through Cortex — so the
 * search box gets better the moment the provider does, with no change here.
 *
 * Two guards, both learned rather than assumed:
 *
 *   relative cut   absolute cosine is not comparable across queries. "fridge"
 *                  tops out at 0.63 against this corpus and "bookshelf" at
 *                  0.25, so one fixed threshold either drops the second query
 *                  or floods the first. Keep what is close to the best hit for
 *                  THIS query instead.
 *   floor          if even the best hit is weak, the query is about something
 *                  the board doesn't have. Return nothing and let the lexical
 *                  half answer, rather than ranking noise.
 *
 * Results are unioned with the lexical hits, never substituted for them, so
 * turning the model off can only remove results — it can't break search.
 */

/** Keep hits within this fraction of the best score for the query. */
const RELATIVE_CUT = 0.5;
/** Below this, even the best hit is noise. */
const FLOOR = 0.12;

export async function semanticHits(
  query: string,
  items: { id: string; text: string }[],
): Promise<Set<string>> {
  if (items.length === 0 || !query.trim()) return new Set();

  try {
    const [q, ...vectors] = await getProvider().embed([query, ...items.map((i) => i.text)]);
    const scored = items.map((item, i) => ({ id: item.id, score: cosine(q, vectors[i]) }));
    const best = Math.max(...scored.map((s) => s.score));
    if (best < FLOOR) return new Set();
    const cut = Math.max(best * RELATIVE_CUT, FLOOR);
    return new Set(scored.filter((s) => s.score >= cut).map((s) => s.id));
  } catch (err) {
    // A search box is not worth taking the board down for. Whatever the
    // provider did — no key, rate limit, network — the lexical half still
    // answered, so log it and return nothing.
    console.warn(`[search] ${providerName()} embed failed, lexical only:`, err);
    return new Set();
  }
}
