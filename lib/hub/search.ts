/**
 * The literal half of search.
 *
 * Deliberately strict — every token must appear, so "desk lamp" still excludes
 * a bare desk. That precision is exactly what embeddings are worst at, which
 * is why ./semantic.ts runs alongside rather than instead. A listing survives
 * if either half likes it.
 */

/**
 * Words students type, mapped to the words listings are actually written in.
 *
 * Groups are equivalence classes: matching any member matches all of them.
 * Expanded on the QUERY side only, so listing text stays exactly what the
 * seller wrote.
 */
const SYNONYMS: string[][] = [
  ["bookshelf", "bookcase", "shelf", "shelves", "shelving", "bookshelves"],
  ["fridge", "refrigerator", "minifridge", "cooler"],
  ["couch", "sofa", "futon", "loveseat"],
  ["desk", "workstation", "table"],
  ["chair", "seat", "stool"],
  ["lamp", "light", "lighting", "lamps"],
  ["monitor", "screen", "display"],
  ["calculator", "ti-84", "ti84"],
  ["microwave", "kettle", "toaster"],
  ["mattress", "bed", "topper", "frame"],
  ["hamper", "laundry", "basket"],
  ["mirror", "fulllength"],
  ["rug", "carpet", "mat"],
  ["textbook", "book", "books", "coursebook"],
  ["kit", "set", "supplies"],
  ["heater", "fan", "purifier", "humidifier"],
  ["drill", "screwdriver", "toolkit", "tools"],
  ["pot", "pan", "saucepan", "stockpot"],
];

/** Query words too common to be worth matching on. */
const NOISE = new Set([
  "a", "an", "the", "for", "my", "some", "any", "need", "want", "looking", "i", "to", "of", "in", "with",
]);

/**
 * Split a query into the terms a listing has to satisfy. Every token must
 * appear (AND), but each token is satisfied by any of its synonyms (OR) — so
 * "desk lamp" still excludes a bare desk, while "bookshelf" finds the bookcase.
 */
export function searchTerms(query: string): string[][] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9-]+/)
    .filter((t) => t.length > 1 && !NOISE.has(t))
    .map((token) => {
      const group = SYNONYMS.find((g) => g.includes(token));
      return group ? [token, ...group] : [token];
    });
}

/** Does this text satisfy every term group? (AND across groups, OR within one.) */
export function matchesTerms(text: string, terms: string[][]): boolean {
  const haystack = text.toLowerCase();
  return terms.every((group) => group.some((w) => haystack.includes(w)));
}
