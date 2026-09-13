/**
 * Words students type, mapped to the words listings are actually written in.
 *
 * Search was a literal substring match, so "bookshelf" returned nothing while
 * a "3-shelf bookcase" sat on the board — the two words name the same object
 * and share no substring. Groups are equivalence classes: matching any member
 * matches all of them. Expanded on the QUERY side only, so listing text stays
 * exactly what the seller wrote.
 *
 * Groups hold true synonyms only. A class ("microwave, kettle, toaster") or a
 * part ("frame" for bed) makes one search return a different object, which is
 * exactly the imprecision this is meant to avoid — paraphrase is the embedding
 * layer's job (./semantic.ts), not this table's.
 */
const SYNONYMS: string[][] = [
  ["bookshelf", "bookcase", "shelf", "shelves", "shelving", "bookshelves", "bookcases"],
  ["fridge", "refrigerator", "minifridge"],
  ["couch", "sofa", "futon", "loveseat"],
  ["desk", "workstation"],
  ["chair", "armchair", "seat", "stool"],
  ["lamp", "light", "lighting"],
  ["monitor", "screen", "display"],
  ["calculator", "ti-84", "ti84"],
  ["mattress", "bed", "topper"],
  ["hamper", "laundry", "basket"],
  ["mirror", "fulllength", "full-length"],
  ["rug", "carpet"],
  ["textbook", "book", "coursebook"],
  ["kit", "set", "supplies"],
];

/** Query words too common to be worth matching on. */
const NOISE = new Set([
  "a", "an", "the", "and", "or", "for", "my", "me", "some", "any", "need", "needs", "want", "wants",
  "looking", "i", "im", "to", "of", "in", "on", "with", "something", "somewhere", "thing", "please",
]);

/**
 * Words that describe the object rather than name it. "Comfy chair" is a
 * chair; requiring "comfy" to appear in a listing would hide every chair whose
 * seller didn't use that word.
 */
const DESCRIPTORS = new Set([
  "small", "big", "large", "little", "tiny", "huge", "tall", "short", "long", "wide",
  "comfy", "comfortable", "cheap", "affordable", "free", "good", "nice", "decent", "sturdy",
  "new", "used", "old", "clean", "quiet", "simple", "basic", "extra", "spare", "another",
  "second", "enough", "portable", "cute", "best",
]);

/**
 * A want is often a sentence: "Lab coat for chem labs", "Desk big enough for a
 * laptop and a monitor". The object is the phrase before the first connector;
 * what follows is what it's for, and shouldn't have to appear in the listing.
 */
const CONNECTORS = new Set(["for", "with", "to", "that", "so", "because", "under", "from", "which", "like"]);

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9-]+/)
    .filter(Boolean);
}

function expand(token: string): string[] {
  const group = SYNONYMS.find((g) => g.includes(token) || g.includes(singular(token)));
  return group ? [...new Set([token, ...group])] : [token];
}

function singular(word: string): string {
  if (word.length > 4 && /(ches|shes|xes|sses)$/.test(word)) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
}

/**
 * Split a query into the terms a listing has to satisfy. Every term must
 * appear (AND), but each term is satisfied by any of its synonyms (OR) — so
 * "desk lamp" still excludes a bare desk, while "bookshelf" finds the bookcase.
 */
export function searchTerms(query: string): string[][] {
  const words = tokens(query);

  let phrase: string[] = [];
  let current: string[] = [];
  for (const word of [...words, "for"]) {
    if (CONNECTORS.has(word)) {
      if (current.some((w) => w.length > 1 && !NOISE.has(w))) {
        phrase = current;
        break;
      }
      current = [];
    } else {
      current.push(word);
    }
  }

  const meaningful = phrase.filter((t) => t.length > 1 && !NOISE.has(t));
  const named = meaningful.filter((t) => !DESCRIPTORS.has(t));
  return (named.length > 0 ? named : meaningful).map(expand);
}

/**
 * Do the words of this text satisfy every term group? Whole words, not
 * substrings: "bed" must not match "bedroom", nor "light" "highlighting".
 * Plurals count either way, and hyphenated words match on each part.
 */
export function matchesTerms(text: string, terms: string[][]): boolean {
  if (terms.length === 0) return false;
  const words = new Set<string>();
  for (const w of tokens(text)) {
    words.add(w);
    words.add(singular(w));
    if (w.includes("-")) for (const part of w.split("-")) if (part) words.add(singular(part));
  }
  return terms.every((group) => group.some((w) => words.has(w) || words.has(singular(w))));
}
