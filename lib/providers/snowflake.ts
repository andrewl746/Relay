import type { MatchProvider } from '../types.ts'

/**
 * Snowflake Cortex provider, over the SQL API.
 *
 *   POST /api/v2/statements   AI_EMBED(...) and AI_COMPLETE(...)
 *
 * Auth is a Programmatic Access Token — generated in Snowsight, pasted into
 * .env.local. Deliberately not keypair JWT: that needs RSA signing, a key pair
 * on disk, and a crypto dependency, to end up at the same Bearer header.
 *
 * NOT the Cortex REST inference endpoints (/api/v2/cortex/inference:embed and
 * /api/v2/cortex/v1/chat/completions). Those are a separately entitled service
 * surface and this account is not on it — they answer 403 "This account is not
 * allowed to access this endpoint" with a token that the SQL API accepts on the
 * same request. The SQL functions are entitled and are what the data sits next
 * to anyway, which is the whole reason to be on Snowflake rather than an LLM
 * API. If you get a 403 on embed, do not go hunting for a token problem — check
 * which endpoint you are calling.
 *
 * Two more things that will cost you an hour each if you don't know them:
 *   - A warehouse is required. Without one every statement fails 422 "You must
 *     specify the warehouse to use", including ones that never touch a table.
 *   - Model names go legacy and are then rejected outright. claude-3-5-sonnet,
 *     claude-4-sonnet, mistral-large2 and openai-gpt-4.1 are all dead already.
 *     A bad name fails as a 422 on the external function, not as a bad answer.
 */

const ACCOUNT = process.env.SNOWFLAKE_ACCOUNT ?? ''
const TOKEN = process.env.SNOWFLAKE_PAT ?? ''
const WAREHOUSE = process.env.SNOWFLAKE_WAREHOUSE ?? 'SNOWFLAKE_LEARNING_WH'
const EMBED_MODEL = process.env.SNOWFLAKE_EMBED_MODEL ?? 'snowflake-arctic-embed-m-v1.5'
const CHAT_MODEL = process.env.SNOWFLAKE_CHAT_MODEL ?? 'claude-sonnet-4-5'

/** Dimensions per embedding model, so a mismatch fails loudly. See check-provider. */
export const EMBED_DIMS: Record<string, number> = {
  'snowflake-arctic-embed-l-v2.0': 1024,
  'snowflake-arctic-embed-m-v1.5': 768,
  'snowflake-arctic-embed-m': 768,
  'e5-base-v2': 768,
}

/** Strings per statement. One round trip embeds the whole board. */
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

type Binding = { type: 'TEXT'; value: string }

type StatementResponse = {
  statementHandle?: string
  data?: string[][]
  resultSetMetaData?: { partitionInfo?: unknown[] }
}

function headers(): Record<string, string> {
  return {
    Authorization: `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Snowflake-Authorization-Token-Type': 'PROGRAMMATIC_ACCESS_TOKEN',
  }
}

async function read(res: Response): Promise<StatementResponse> {
  const text = await res.text()
  if (!res.ok) {
    throw new Error(`Snowflake SQL → ${res.status} ${res.statusText}\n${text.slice(0, 400)}`)
  }
  return JSON.parse(text) as StatementResponse
}

/**
 * Run one statement and hand back ALL of its rows as arrays of strings.
 *
 * The POST only returns partition 0. Snowflake splits a result by response
 * SIZE, not row count, so this is invisible until the rows get big: four
 * 768-float embeddings come back whole, nineteen come back as two rows and a
 * promise. Every remaining partition has to be fetched by handle, or you
 * silently embed a fraction of the board.
 */
async function sql(statement: string, bindings: string[] = []): Promise<string[][]> {
  const first = await read(
    await fetch(`${base()}/api/v2/statements`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        statement,
        timeout: 60,
        warehouse: WAREHOUSE,
        bindings: Object.fromEntries(
          bindings.map((value, i): [string, Binding] => [String(i + 1), { type: 'TEXT', value }]),
        ),
      }),
    }),
  )

  const rows = first.data ?? []
  const partitions = first.resultSetMetaData?.partitionInfo?.length ?? 1
  for (let p = 1; p < partitions; p++) {
    const next = await read(
      await fetch(`${base()}/api/v2/statements/${first.statementHandle}?partition=${p}`, {
        headers: headers(),
      }),
    )
    rows.push(...(next.data ?? []))
  }
  return rows
}

/** L2-normalize, because lib/vector.cosine is a bare dot product. */
function normalize(v: number[]): number[] {
  let n = 0
  for (const x of v) n += x * x
  n = Math.sqrt(n)
  return n === 0 ? v : v.map((x) => x / n)
}

/**
 * AI_EMBED returns a VECTOR, which the SQL API cannot serialise — hence the
 * ::ARRAY cast, which arrives as a JSON string. FLATTEN over a bound JSON array
 * embeds the whole batch in one statement; INDEX carries the original position,
 * because row order off a warehouse is not the order you sent.
 */
async function embed(texts: string[]): Promise<number[][]> {
  const out: number[][] = []
  for (let i = 0; i < texts.length; i += EMBED_BATCH) {
    const batch = texts.slice(i, i + EMBED_BATCH).map((t) => t.slice(0, 4096))
    const rows = await sql(
      `SELECT f.index, AI_EMBED('${EMBED_MODEL}', f.value::VARCHAR)::ARRAY
         FROM TABLE(FLATTEN(input => PARSE_JSON(?))) f
        ORDER BY f.index`,
      [JSON.stringify(batch)],
    )
    if (rows.length !== batch.length) {
      throw new Error(`Snowflake embed: asked for ${batch.length} vectors, got ${rows.length}`)
    }
    // Sort on the carried index rather than trusting the order rows arrive in
    // across partitions.
    for (const [, vector] of [...rows].sort((a, b) => Number(a[0]) - Number(b[0]))) {
      const v = JSON.parse(vector) as number[]
      if (!Array.isArray(v) || typeof v[0] !== 'number') {
        throw new Error('Snowflake embed: unexpected embedding shape')
      }
      out.push(normalize(v))
    }
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

type RerankRow = { i: number; score: number; reason: string }

/**
 * One prompt in, the model's text out, through Cortex.
 *
 * AI_COMPLETE's VARCHAR arrives already JSON-serialised: the cell literally
 * starts with a quote character and carries \n and \" as escape sequences, so
 * it has to be unwrapped once before it is text at all. SHOW's text columns do
 * NOT do this, so don't assume one rule for every column.
 */
export async function complete(prompt: string): Promise<string> {
  const rows = await sql(`SELECT AI_COMPLETE('${CHAT_MODEL}', ?)`, [prompt])
  const cell = rows[0]?.[0] ?? ''
  return cell.startsWith('"') ? (JSON.parse(cell) as string) : cell
}

/** Pull the first JSON object out of a reply, tolerating fences or stray prose. */
function parseJson(text: string): unknown {
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
  const content = await complete(
    `${RERANK_SYSTEM}\n\nRequest: "${need}"\n\nCandidates:\n${listed}`,
  )
  let results: RerankRow[]
  try {
    results = (parseJson(content) as { results?: RerankRow[] } | null)?.results ?? []
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
