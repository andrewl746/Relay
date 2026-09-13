import "server-only";

/**
 * Sentence embeddings from a real transformer, running in-process.
 *
 * all-MiniLM-L6-v2 via ONNX: 384 dimensions, ~25MB of weights, no API key and
 * no network call once the weights are on disk. That last part is the reason
 * it was chosen over a hosted inference endpoint — a search box that makes an
 * HTTPS round trip per keystroke is a search box that dies on conference wifi,
 * and the matcher this feeds has to stay inside a few milliseconds.
 *
 * Everything here is best-effort. If the weights cannot be loaded the caller
 * gets null and falls back to substring matching, because a demo that returns
 * worse results is survivable and one that returns a stack trace is not.
 */

export const MODEL = "Xenova/all-MiniLM-L6-v2";
export const DIMS = 384;

type Extractor = (
  texts: string[],
  opts: { pooling: "mean"; normalize: boolean },
) => Promise<{ tolist(): number[][] }>;

let loading: Promise<Extractor | null> | null = null;

function load(): Promise<Extractor | null> {
  loading ??= (async () => {
    try {
      const { pipeline } = await import("@huggingface/transformers");
      return (await pipeline("feature-extraction", MODEL)) as unknown as Extractor;
    } catch (err) {
      console.warn("[embed] transformer unavailable, falling back to text search:", err);
      return null;
    }
  })();
  return loading;
}

/** Load the weights ahead of the first real query so it does not pay for them. */
export async function warm(): Promise<boolean> {
  return (await load()) !== null;
}

/**
 * Unit-length vectors, one per input. Null means the model is unavailable —
 * never an exception, because every caller of this has a usable fallback.
 */
export async function embed(texts: string[]): Promise<number[][] | null> {
  if (texts.length === 0) return [];
  const extractor = await load();
  if (!extractor) return null;
  try {
    const out = await extractor(texts, { pooling: "mean", normalize: true });
    return out.tolist();
  } catch (err) {
    console.warn("[embed] failed:", err);
    return null;
  }
}

/** Both vectors are unit length, so the dot product is the cosine. */
export function cosine(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}
