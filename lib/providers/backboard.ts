import { BackboardClient } from 'backboard-sdk'

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
  if (!bb) return DEFAULTS

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
      console.error('[backboard] run FAILED:', String(failed.content ?? '').slice(0, 200))
      return DEFAULTS
    }

    const call = res.toolCalls?.find((t) => t?.function?.name === 'extract_metadata')
    const args: Record<string, unknown> | undefined =
      call?.function?.parsedArguments ??
      (typeof call?.function?.arguments === 'string'
        ? JSON.parse(call.function.arguments)
        : undefined)

    if (!args) return DEFAULTS

    const URGENCIES: NeedMetadata['urgency'][] = ['low', 'medium', 'high']
    const WINDOWS: NeedMetadata['pickupWindows'] = ['morning', 'afternoon', 'evening']
    const urgency = URGENCIES.find((u) => u === args.urgency) ?? 'medium'
    const mentioned: unknown[] = Array.isArray(args.pickupWindows) ? args.pickupWindows : []
    const windows = WINDOWS.filter((w) => mentioned.includes(w))

    return { urgency, pickupWindows: windows }
  } catch (err) {
    // Reset so a transient failure doesn't poison the cached assistant forever.
    assistantIdPromise = null
    console.error('[backboard] extraction failed, using defaults:', err)
    return DEFAULTS
  }
}
