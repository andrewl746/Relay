import { getProvider, providerName } from "../providers/index.ts";
import { cosine } from "../vector.ts";
import { matchesTerms, searchTerms } from "./search.ts";

/**
 * Hybrid search: literal words decide what is guaranteed, embeddings decide
 * what else is close enough to earn a place.
 *
 * Three tiers, from most to least certain:
 *
 *   title       every search term is a word in the title, kind, or one of a
 *               bundle's item titles. Always shown — if you typed "bed" and
 *               the listing says bed, no model gets to hide it.
 *   text        the terms only appear in the description. Sellers mention
 *               other objects in passing ("fits beside a desk"), so a
 *               description hit also has to be at least loosely similar.
 *   embedding   no literal hit at all. Only paraphrase lives here, so the bar
 *               is strict: close to the best hit for this query, above an
 *               absolute floor, and clearly separated from the rest of the
 *               board rather than just the top of a flat distribution.
 *
 * Every gate is relative to this query's own score distribution because
 * absolute cosine isn't comparable across queries or providers: the offline
 * stub tops out near 0.2 for "bed" and 0.6 for "lamp", and a real model has a
 * much higher baseline for unrelated text.
 *
 * If the provider fails, the lexical tiers still answer, so turning the model
 * off can only remove paraphrase results — it can't break search.
 */

/** Paraphrase must score at least this fraction of the best hit. */
const STRICT_RELATIVE = 0.75;
/** …and stand this many standard deviations above the board's mean. */
const STRICT_Z = 2;
/** …and never below this, however flat the distribution. */
const STRICT_FLOOR = 0.2;
/** A description mention needs only loose similarity to back it up. */
const TEXT_RELATIVE = 0.4;
const TEXT_FLOOR = 0.1;

const COLLECTIVE = new Set(["set", "kit", "supplies", "pack", "bundle", "pair", "lot", "collection"]);

export type SearchDoc = {
  id: string;
  /** Title, kind, and bundle item titles — what the listing IS. */
  title: string;
  /** Free text the seller wrote around it. */
  body: string;
};

export type SearchHit = { id: string; via: "title" | "text" | "embedding"; similarity: number | null };

/**
 * Run several queries against the same documents with one embedding call.
 * Returns, per query, the hits in document order.
 */
export async function hybridSearchMany(queries: string[], docs: SearchDoc[]): Promise<SearchHit[][]> {
  if (queries.length === 0) return [];
  if (docs.length === 0) return queries.map(() => []);

  let vectors: number[][] | null = null;
  try {
    vectors = await getProvider().embed([...queries, ...docs.map((d) => `${d.title}. ${d.body}`)]);
  } catch (err) {
    console.warn(`[search] ${providerName()} embed failed, lexical only:`, err);
  }

  return queries.map((query, qi) => {
    const terms = searchTerms(query);
    const sims = vectors ? docs.map((_, di) => cosine(vectors![qi], vectors![queries.length + di])) : null;

    let strictCut = Infinity;
    let textCut = -Infinity;
    if (sims && query.trim()) {
      const best = Math.max(...sims);
      const mean = sims.reduce((a, b) => a + b, 0) / sims.length;
      const sd = Math.sqrt(sims.reduce((a, b) => a + (b - mean) ** 2, 0) / sims.length);
      strictCut = Math.max(STRICT_FLOOR, best * STRICT_RELATIVE, mean + STRICT_Z * sd);
      textCut = Math.max(TEXT_FLOOR, best * TEXT_RELATIVE);
    }

    // The last term names the object ("desk LAMP", "mini FRIDGE"); earlier
    // ones modify it. A listing that shares only a modifier is a different
    // object that happens to use the same word, and similarity from that
    // shared word must not carry it in. Collective words ("cookware SET")
    // don't name anything, so the head is the last term that isn't one.
    const headIndex = terms.findLastIndex((g) => !g.some((w) => COLLECTIVE.has(w)));
    const head = headIndex >= 0 ? terms[headIndex] : terms.at(-1);
    const modifiers = terms.filter((g) => g !== head);

    const hits: SearchHit[] = [];
    docs.forEach((doc, di) => {
      const similarity = sims ? sims[di] : null;
      const text = `${doc.title} ${doc.body}`;
      if (matchesTerms(doc.title, terms)) {
        hits.push({ id: doc.id, via: "title", similarity });
      } else if (matchesTerms(text, terms) && (similarity === null || similarity >= textCut)) {
        hits.push({ id: doc.id, via: "text", similarity });
      } else if (similarity !== null && similarity >= strictCut) {
        const onlyModifier =
          head !== undefined && !matchesTerms(text, [head]) && modifiers.some((m) => matchesTerms(text, [m]));
        if (!onlyModifier) hits.push({ id: doc.id, via: "embedding", similarity });
      }
    });
    return hits;
  });
}

export async function hybridSearch(query: string, docs: SearchDoc[]): Promise<SearchHit[]> {
  return (await hybridSearchMany([query], docs))[0];
}
