import "server-only";

import { cosine, embed } from "./embed";
import type { Listing } from "./types";

/**
 * Search that understands what a thing is for.
 *
 * "Something to keep my milk cold" contains none of the words in "Danby mini
 * fridge, 3.1 cu ft", so substring matching returns an empty board and the
 * student concludes we have no fridges. Embedding both sides fixes that, but
 * introduces the opposite failure: a hashed sentence vector is good at
 * concepts and bad at identifiers, and "BIOL 130" is an identifier. So both
 * run, and a listing survives if either one likes it.
 *
 * Calibrated against the real board: a correct hit scores 0.32-0.68 and noise
 * sits under 0.25. Rather than one fixed cut, results are kept relative to the
 * best hit for the query, so a vague question ("somewhere to put my books",
 * top score 0.38) keeps its near misses and a precise one ("lamp", top score
 * 0.68) does not drag in the desk at 0.28.
 */

/** Nothing below this is ever a real hit. */
const FLOOR = 0.2;
/** Keep anything within this fraction of the best score for the query. */
const RELATIVE = 0.7;

export type SearchHit = { id: string; score: number; exact: boolean };

/** Everything about a listing worth matching against, as one string. */
export function listingText(l: Listing, childTitles: string[] = []): string {
  return [l.title, l.kind, l.description, ...childTitles].filter(Boolean).join(". ");
}

// Vectors are expensive and listing text rarely changes, so they are cached by
// the exact text they were computed from. A listing edited or newly posted
// simply misses the cache and gets embedded on the next search.
const vectors = new Map<string, number[]>();

async function vectorsFor(texts: string[]): Promise<Map<string, number[]> | null> {
  const missing = [...new Set(texts)].filter((t) => !vectors.has(t));
  if (missing.length > 0) {
    const fresh = await embed(missing);
    if (!fresh) return null;
    missing.forEach((t, i) => vectors.set(t, fresh[i]));
  }
  return vectors;
}

function substringHit(text: string, query: string): boolean {
  return text.toLowerCase().includes(query.toLowerCase());
}

/**
 * Rank listings against a free-text query.
 *
 * Returns null if the model is unavailable, which tells the caller to fall
 * back to plain text filtering rather than showing an empty board.
 */
export async function searchListings(
  query: string,
  items: { id: string; text: string }[],
): Promise<SearchHit[] | null> {
  const q = query.trim();
  if (!q) return null;

  const exact = new Set(items.filter((i) => substringHit(i.text, q)).map((i) => i.id));

  const known = await vectorsFor(items.map((i) => i.text));
  if (!known) return null;
  const queryVec = await embed([q]);
  if (!queryVec) return null;

  const scored = items.map((item) => ({
    id: item.id,
    score: cosine(queryVec[0], known.get(item.text)!),
    exact: exact.has(item.id),
  }));

  const top = Math.max(...scored.map((s) => s.score));
  const cut = Math.max(FLOOR, top * RELATIVE);

  return scored
    .filter((s) => s.exact || s.score >= cut)
    // A literal match is what the student typed, so it leads regardless of
    // what the vectors think of it.
    .sort((a, b) => Number(b.exact) - Number(a.exact) || b.score - a.score);
}
