import { BackboardClient } from 'backboard-sdk'
import { providerName } from './index.ts'
import { complete } from './snowflake.ts'

/**
 * Backboard — pulls urgency and pickup windows out of what someone actually
 * typed, so "need a drill saturday morning, kind of urgent" becomes constraints
 * the DP can schedule against.
 *
 * The SDK's shape matters and the first integration got it wrong:
 *   - createThread(assistantId) takes an ASSISTANT ID, not a thread name.
 *     Passing a made-up string produced POST /assistants/extract-123/threads
 *     -> 422 on every call. Because the caller wrapped it in try/catch, it
 *     silently fell back to urgency='medium' forever and looked like it worked.
 *   - Tools are declared on the ASSISTANT, not passed per message.
 *
 * So: one assistant, created once and reused, then a thread per extraction.
 */

const ASSISTANT_NAME = 'relay-need-extractor'

const SYSTEM_PROMPT = `You read one short message from a student who needs to borrow something, and you call extract_metadata exactly once.

urgency:
  high    they say it is urgent, or they need it today/tomorrow
  medium  no signal either way (this is the default)
  low     they say there is no rush

pickupWindows: only the times of day they actually mention. "saturday morning"
-> ["morning"]. No mention of a time of day -> [].

Never guess beyond what the text says.`

export const extractMetadataTool = {
  type: 'function',
  function: {
    name: 'extract_metadata',
    description: 'Extract urgency and pickup windows from a user request',
    parameters: {
      type: 'object',
      properties: {
        urgency: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
          description: 'Urgency of the request. Defaults to medium if unspecified.',
        },
        pickupWindows: {
          type: 'array',
          items: { type: 'string', enum: ['morning', 'afternoon', 'evening'] },
          description: 'Times of day the user mentioned. Empty if none.',
        },
      },
      required: ['urgency', 'pickupWindows'],
    },
  },
}

export function getBackboardClient() {
  const apiKey = process.env.BACKBOARD_API_KEY
  if (!apiKey) return null
  return new BackboardClient({ apiKey })
}

export type NeedMetadata = {
  urgency: 'low' | 'medium' | 'high'
  pickupWindows: ('morning' | 'afternoon' | 'evening')[]
}

const DEFAULTS: NeedMetadata = { urgency: 'medium', pickupWindows: [] }

/** Coerce whatever a model returned into the only two fields we trust. */
function coerce(args: Record<string, unknown>): NeedMetadata {
  const URGENCIES: NeedMetadata['urgency'][] = ['low', 'medium', 'high']
  const WINDOWS: NeedMetadata['pickupWindows'] = ['morning', 'afternoon', 'evening']
  const mentioned: unknown[] = Array.isArray(args.pickupWindows) ? args.pickupWindows : []
  return {
    urgency: URGENCIES.find((u) => u === args.urgency) ?? 'medium',
    pickupWindows: WINDOWS.filter((w) => mentioned.includes(w)),
  }
}

/**
 * Second try, through Snowflake Cortex.
 *
 * Backboard's free credit covers Memory & RAG and refuses LLM chat outright, so
 * on the free tier the primary path above ALWAYS returns the defaults — every
 * need silently comes out urgency:medium with no pickup window, and the DP then
 * schedules against constraints nobody expressed. Cortex is already configured
 * for matching and its AI_COMPLETE is not separately billed here, so it covers
 * the gap. Backboard keeps the job its free tier is actually good at — the
 * wants memory in the second half of this file, which is live.
 *
 * Returns null (not the defaults) when it can't answer, so the caller can tell
 * "no signal" from "we never asked".
 */
async function viaCortex(text: string): Promise<NeedMetadata | null> {
  if (providerName() !== 'snowflake') return null
  try {
    const reply = await complete(
      `${SYSTEM_PROMPT}\n\nReply with JSON only, no prose, no code fences: ` +
        `{"urgency":"low|medium|high","pickupWindows":["morning"]}\n\nMessage: "${text}"`,
    )
    const start = reply.indexOf('{')
    const end = reply.lastIndexOf('}')
    if (start === -1 || end === -1) return null
    return coerce(JSON.parse(reply.slice(start, end + 1)) as Record<string, unknown>)
  } catch (err) {
    console.error('[cortex] need extraction failed, using defaults:', err)
    return null
  }
}

/** Cached per process. Creating one assistant per extraction would be wrong and slow. */
let assistantIdPromise: Promise<string> | null = null

async function ensureAssistant(bb: BackboardClient): Promise<string> {
  // Note the field names: the SDK camel-cases the API's snake_case, so it is
  // `assistantId` / `threadId`, not `id`. Getting this wrong yields a URL with
  // `undefined` in it and another silent 422.
  const existing = await bb.listAssistants({ name: ASSISTANT_NAME, limit: 1 })
  if (Array.isArray(existing) && existing[0]?.assistantId) return existing[0].assistantId

  const created = await bb.createAssistant({
    name: ASSISTANT_NAME,
    description: 'Extracts urgency and pickup windows from Relay need requests',
    system_prompt: SYSTEM_PROMPT,
    tools: [extractMetadataTool],
  })
  return created.assistantId
}

/**
 * Returns what the text says about urgency and pickup windows.
 *
 * Never throws: a need must still be postable when a third party is down, so
 * every failure path returns the defaults. The caller does not need its own
 * try/catch — and should not have one, because that is what hid the 422.
 */
export async function extractNeedMetadata(text: string): Promise<NeedMetadata> {
  const bb = getBackboardClient()
  if (!bb) return (await viaCortex(text)) ?? DEFAULTS

  try {
    assistantIdPromise ??= ensureAssistant(bb)
    const assistantId = await assistantIdPromise

    const thread = await bb.createThread(assistantId)
    const res = await bb.addMessage(thread.threadId, {
      content: `Extract metadata from: "${text}"`,
    })
    // Without `stream: true` this is a response object, never a generator.
    if (!res || !('messages' in res)) return DEFAULTS

    // A run can come back 200 with status FAILED and a human-readable reason —
    // e.g. "free credit is reserved for Memory & RAG, so it can't cover LLM
    // chat". Surface that instead of silently returning defaults, which is how
    // the previous 422 went unnoticed for so long.
    const failed = res.messages?.find((m) => m?.status === 'FAILED')
    if (failed) {
      console.warn('[backboard] chat unavailable, falling back to Cortex:', String(failed.content ?? '').slice(0, 120))
      return (await viaCortex(text)) ?? DEFAULTS
    }

    const call = res.toolCalls?.find((t) => t?.function?.name === 'extract_metadata')
    const args: Record<string, unknown> | undefined =
      call?.function?.parsedArguments ??
      (typeof call?.function?.arguments === 'string'
        ? JSON.parse(call.function.arguments)
        : undefined)

    if (!args) return (await viaCortex(text)) ?? DEFAULTS

    return coerce(args)
  } catch (err) {
    // Reset so a transient failure doesn't poison the cached assistant forever.
    assistantIdPromise = null
    console.error('[backboard] extraction failed, trying Cortex:', err)
    return (await viaCortex(text)) ?? DEFAULTS
  }
}

/**
 * Memory — every student's wants list, kept in Backboard, so a new listing can
 * be checked against what people have already asked for.
 *
 * Memory rather than chat on purpose: the account's free credit covers Memory
 * & RAG and refuses LLM calls, which is why extractNeedMetadata above returns
 * defaults. Search results come back as content + score with no metadata, so
 * the student's first name is written into the content itself.
 */
const WANTS_ASSISTANT = 'relay-wants'
const WANTED_BY = ' — wanted by '
/**
 * searchMemories' `score` is a DISTANCE: lower is closer. Calibrated by
 * npm run seed:backboard: right object 0.44–0.52, bookcase→shelving 0.57,
 * desk→chair 0.62, unrelated 0.7+. It also ignores `limit`, so we trim.
 */
export const MAX_WANT_DISTANCE = 0.58

let wantsAssistantPromise: Promise<string> | null = null

export function wantsAssistantId(bb: BackboardClient): Promise<string> {
  wantsAssistantPromise ??= (async () => {
    const [existing] = await bb.listAssistants({ name: WANTS_ASSISTANT, limit: 1 })
    if (existing?.assistantId) return existing.assistantId
    const created = await bb.createAssistant({
      name: WANTS_ASSISTANT,
      description: 'What Relay students have said they need',
      system_prompt: 'Stores what students need to borrow or buy.',
    })
    return created.assistantId
  })()
  return wantsAssistantPromise
}

export type WantMemory = { name: string; text: string; score: number }

/** Never throws: a want still saves when Backboard is down or unconfigured. */
export async function rememberWant(firstName: string, text: string): Promise<void> {
  const bb = getBackboardClient()
  if (!bb) return
  try {
    await bb.addMemory(await wantsAssistantId(bb), { content: `${text}${WANTED_BY}${firstName}` })
  } catch (err) {
    wantsAssistantPromise = null
    console.error('[backboard] rememberWant failed:', err)
  }
}

/** Students whose list matches this text by meaning, best first. [] on any failure. */
export async function whoWants(text: string, limit = 5, maxDistance = MAX_WANT_DISTANCE): Promise<WantMemory[]> {
  const bb = getBackboardClient()
  if (!bb || !text.trim()) return []
  try {
    const res = await bb.searchMemories(await wantsAssistantId(bb), text, limit)
    const rows: { content?: string; score?: number }[] = res?.memories ?? []
    return rows
      .filter((m) => typeof m.score === 'number' && m.score <= maxDistance && m.content?.includes(WANTED_BY))
      .sort((a, b) => a.score! - b.score!)
      .slice(0, limit)
      .map((m) => {
        const [want, name] = m.content!.split(WANTED_BY)
        return { name, text: want, score: m.score! }
      })
  } catch (err) {
    wantsAssistantPromise = null
    console.error('[backboard] whoWants failed:', err)
    return []
  }
}
