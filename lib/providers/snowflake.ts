import type { MatchProvider } from '../types.ts'

/**
 * Snowflake Cortex provider. Two endpoints, one bearer token, no SDK.
 *
 *   embed   POST /api/v2/cortex/inference:embed
 *   rerank  POST /api/v2/cortex/v1/chat/completions   (OpenAI-compatible)
 *
 * Auth is a Programmatic Access Token — generated in Snowsight, pasted into
 * .env.local. Deliberately not keypair JWT: that needs RSA signing, a key pair
 * on disk, and a crypto dependency, to end up at the same Bearer header.
 *
 * Note we use AI_EMBED / chat-completions rather than SNOWFLAKE.CORTEX.COMPLETE
 * over the SQL API. The legacy COMPLETE function is deprecated at the end of
 * 2026, and the inference endpoints are lower latency than round-tripping SQL.
 */

const ACCOUNT = process.env.SNOWFLAKE_ACCOUNT ?? ''
const TOKEN = process.env.SNOWFLAKE_PAT ?? ''
const EMBED_MODEL = process.env.SNOWFLAKE_EMBED_MODEL ?? 'snowflake-arctic-embed-l-v2.0'
const CHAT_MODEL = process.env.SNOWFLAKE_CHAT_MODEL ?? 'claude-sonnet-4-5'

/** Dimensions per embedding model, so a mismatch fails loudly. See DIM_GUARD. */
export const EMBED_DIMS: Record<string, number> = {
  'snowflake-arctic-embed-l-v2.0': 1024,
  'snowflake-arctic-embed-m-v1.5': 768,
  'snowflake-arctic-embed-m': 768,
  'e5-base-v2': 768,
}

/** Max strings per embed request. The API allows 1280; we stay well under. */
const EMBED_BATCH = 96

function base(): string {
  if (!ACCOUNT || !TOKEN) {
    throw new Error(
      'SNOWFLAKE_ACCOUNT and SNOWFLAKE_PAT must be set. See .env.example.',
    )
  }
  // Accept either "abc-xy12345" or a full host, so a pasted URL still works.
  const host = ACCOUNT.includes('.')
    ? ACCOUNT.replace(/^https?:\/\//, '').replace(/\/$/, '')
    : `${ACCOUNT}.snowflakecomputing.com`
  return `https://${host}`
}

function headers(): Record<string, string> {
  return {
    Authorization: `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Snowflake-Authorization-Token-Type': 'PROGRAMMATIC_ACCESS_TOKEN',
  }
}

async function post(path: string, body: unknown): Promise<any> {
  const res = await fetch(`${base()}${path}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(
      `Snowflake ${path} → ${res.status} ${res.statusText}\n${text.slice(0, 400)}`,
    )
  }
  return res.json()
}

/** L2-normalize, because lib/vector.cosine is a bare dot product. */
function normalize(v: number[]): number[] {
  let n = 0
  for (const x of v) n += x * x
  n = Math.sqrt(n)
  return n === 0 ? v : v.map((x) => x / n)
}

/**
 * Cortex returns `data[i].embedding`. Some responses nest it one level deeper
 * as `[[...]]`, so unwrap defensively rather than trusting one shape.
 */
function unwrap(raw: unknown): number[] {
  const v = Array.isArray(raw) && Array.isArray(raw[0]) ? raw[0] : raw
  if (!Array.isArray(v) || typeof v[0] !== 'number') {
    throw new Error('Snowflake embed: unexpected embedding shape')
  }
  return v as number[]
}

async function embed(texts: string[]): Promise<number[][]> {
  const out: number[][] = []
  for (let i = 0; i < texts.length; i += EMBED_BATCH) {
    const batch = texts.slice(i, i + EMBED_BATCH).map((t) => t.slice(0, 4096))
    const json = await post('/api/v2/cortex/inference:embed', {
      model: EMBED_MODEL,
      text: batch,
    })
    const rows = (json?.data ?? []) as { embedding: unknown; index?: number }[]
    if (rows.length !== batch.length) {
      throw new Error(
        `Snowflake embed: asked for ${batch.length} vectors, got ${rows.length}`,
      )
    }
    // Sort by `index` when present; do not assume the API preserves order.
    const ordered = rows.every((r) => typeof r.index === 'number')
      ? [...rows].sort((a, b) => (a.index! - b.index!))
      : rows
    for (const r of ordered) out.push(normalize(unwrap(r.embedding)))
  }
  return out
}

const RERANK_SYSTEM = `You rank borrowable household objects against a request from a student who needs something for a short time.

Score each candidate 0.0-1.0 on whether it would actually solve the request:
  1.0  the exact object asked for
  0.7  a different object that does the same job (a folding table for a desk)
  0.4  same category, wrong tool for this job (a hammer when they need to drill)
  0.0  unrelated

Judge the OBJECT, not the wording. Two-word names matter: a "stand mixer" is not a "bike repair stand"; an "air mattress" is not an "air purifier".

Reply with JSON only, no prose, no code fences:
{"results":[{"i":0,"score":0.0,"reason":"under 8 words"}]}
One entry per candidate, in the order given.`

/** Pull the first JSON object out of a reply, tolerating fences or stray prose. */
function parseJson(text: string): any {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const body = fenced ? fenced[1] : text
  const start = body.indexOf('{')
  const end = body.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('no JSON object in reply')
  return JSON.parse(body.slice(start, end + 1))
}

async function rerank(
  need: string,
  candidates: string[],
): Promise<{ score: number; reason: string }[]> {
  if (candidates.length === 0) return []

  const listed = candidates.map((c, i) => `${i}. ${c}`).join('\n')
  const json = await post('/api/v2/cortex/v1/chat/completions', {
    model: CHAT_MODEL,
    max_completion_tokens: 900,
    temperature: 0,
    messages: [
      { role: 'system', content: RERANK_SYSTEM },
      { role: 'user', content: `Request: "${need}"\n\nCandidates:\n${listed}` },
    ],
  })

  const content: string = json?.choices?.[0]?.message?.content ?? ''
  let results: { i: number; score: number; reason: string }[]
  try {
    results = parseJson(content)?.results ?? []
  } catch {
    // match.ts falls back to the raw cosine when an entry is missing, which is
    // the right behaviour — a bad reply must not zero out a real candidate.
    return candidates.map(() => ({ score: NaN, reason: 'rerank reply unparseable' }))
  }

  const byIndex = new Map(results.map((r) => [r.i, r]))
  return candidates.map((_, i) => {
    const r = byIndex.get(i)
    if (!r) return { score: NaN, reason: 'no rerank entry returned' }
    const score = Math.max(0, Math.min(1, Number(r.score)))
    return {
      score: Number.isFinite(score) ? score : NaN,
      reason: String(r.reason ?? '').slice(0, 120) || 'no reason given',
    }
  })
}

export const SnowflakeProvider: MatchProvider = { embed, rerank }

/** Model + dimension this provider will produce, for the pipeline's stamp. */
export const snowflakeMeta = () => ({
  provider: 'snowflake',
  embedModel: EMBED_MODEL,
  chatModel: CHAT_MODEL,
  dim: EMBED_DIMS[EMBED_MODEL] ?? null,
})
