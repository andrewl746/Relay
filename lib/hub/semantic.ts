import { getProvider, providerName } from "../providers/index.ts";
import { cosine } from "../vector.ts";
import { embed as minilm } from "./embed";
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
 *
 * The vectors come from all-MiniLM-L6-v2 running in-process — a real sentence
 * transformer, 384 dimensions, no API key and no network call once the weights
 * are on disk. The provider seam (MATCH_PROVIDER=stub | snowflake) is the
 * fallback when those weights cannot load, which is why the cuts below are
 * per-model: the stub tops out near 0.2 for "bed" where MiniLM sits at 0.32
 * for a correct hit and 0.68 for an obvious one.
 */

type Cuts = {
  /** Paraphrase must score at least this fraction of the best hit. */
  strictRelative: number;
  /** …and stand this many standard deviations above the board's mean. */
  strictZ: number;
  /** …and never below this, however flat the distribution. */
  strictFloor: number;
  /** A description mention needs only loose similarity to back it up. */
  textRelative: number;
  textFloor: number;
};

/** Measured on the real board: correct hits 0.32-0.68, noise under 0.25. */
const MINILM: Cuts = { strictRelative: 0.7, strictZ: 1.6, strictFloor: 0.25, textRelative: 0.4, textFloor: 0.12 };
/** The hashed bag scores lower and flatter, so it needs a looser cut. */
const PROVIDER: Cuts = { strictRelative: 0.75, strictZ: 2, strictFloor: 0.2, textRelative: 0.4, textFloor: 0.1 };

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

  const texts = [...queries, ...docs.map((d) => `${d.title}. ${d.body}`)];

  // Preferred: a real sentence transformer, in-process. The provider seam is
  // the fallback, so search still works with no weights and no network.
  let vectors: number[][] | null = await minilm(texts);
  let cuts = MINILM;
  if (!vectors) {
    cuts = PROVIDER;
    try {
      vectors = await getProvider().embed(texts);
    } catch (err) {
      console.warn(`[search] ${providerName()} embed failed, lexical only:`, err);
    }
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
      strictCut = Math.max(cuts.strictFloor, best * cuts.strictRelative, mean + cuts.strictZ * sd);
      textCut = Math.max(cuts.textFloor, best * cuts.textRelative);
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
