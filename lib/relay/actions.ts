'use server'

import { revalidatePath } from 'next/cache'
import { cosine } from '../vector.ts'
import { getProvider } from '../providers/index.ts'
import { TOP_K } from '../match.ts'
import { dataset, matches } from '../data.ts'
import { config } from '../config.ts'
import { mutate, readRuntime, type AcceptedHop } from './runtime.ts'
import type { Deal, Item, Need } from '../types.ts'

/**
 * Every mutation in the app.
 *
 * Server Functions are reachable by direct POST, not only through our own UI,
 * so each one validates its own input. There is no auth to check yet — the
 * session is a demo user picker — but the validation has to exist regardless,
 * because these write to disk.
 */

const MAX_TEXT = 400

/** Scores a new row against the other side and returns table entries for it. */
async function scoreAgainstItems(need: Need) {
  const seed = dataset()
  const runtime = readRuntime()
  const items = [...seed.items, ...runtime.items]

  const ranked = items
    .map((item) => ({ item, sim: cosine(need.embedding, item.embedding) }))
    .sort((a, b) => b.sim - a.sim)
    .slice(0, TOP_K)

  const scored = await getProvider().rerank(
    need.rawText,
    ranked.map((r) => r.item.rawText),
  )

  const out: Record<string, { score: number; reason: string }> = {}
  ranked.forEach((r, i) => {
    const s = scored[i]
    const usable = typeof s?.score === 'number' && Number.isFinite(s.score)
    out[`${need.id}|${r.item.id}`] = {
      score: usable ? s.score : r.sim,
      reason: usable ? s.reason : 'cosine fallback',
    }
  })
  return out
}

/**
 * A newly posted item has to become visible to needs that already exist.
 *
 * Cosine only, deliberately. `rerank(need, candidates)` is oriented one way —
 * it judges objects against a request — and calling it with the item as the
 * "request" and needs as "candidates" would hand a real model an inverted
 * prompt. Reranking properly would mean one call per matching need, which is
 * free with the stub and a burst of round trips with a remote provider, on an
 * interactive action.
 *
 * So a fresh item enters at its retrieval score and competes on that. Scores
 * stay comparable because both sides are cosine over the same vector space, and
 * minMatchScore still gates a hop.
 */
async function scoreAgainstNeeds(item: Item) {
  const seed = dataset()
  const runtime = readRuntime()
  const needs = [...seed.needs, ...runtime.needs]
  const floor = config.constraints.minMatchScore

  const out: Record<string, { score: number; reason: string }> = {}
  for (const need of needs) {
    const sim = cosine(need.embedding, item.embedding)
    if (sim < floor) continue
    out[`${need.id}|${item.id}`] = {
      score: sim,
      reason: 'newly posted, ranked on similarity',
    }
  }
  return out
}

function clean(text: unknown): string {
  if (typeof text !== 'string') throw new Error('text is required')
  const t = text.trim().slice(0, MAX_TEXT)
  if (t.length < 3) throw new Error('say a bit more than that')
  return t
}

function checkWindow(from: unknown, to: unknown): [string, string] {
  const a = String(from ?? '')
  const b = String(to ?? '')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(a) || !/^\d{4}-\d{2}-\d{2}$/.test(b)) {
    throw new Error('both dates are required')
  }
  if (b <= a) throw new Error('the end date has to be after the start')
  return [a, b]
}

export async function postItem(input: {
  holderId: string
  text: string
  deal: Deal
  price: number
  freeFrom: string
  freeUntil: string
}) {
  const text = clean(input.text)
  const [freeFrom, freeUntil] = checkWindow(input.freeFrom, input.freeUntil)
  const deal: Deal = input.deal === 'sale' ? 'sale' : 'rent'
  const price = Math.max(0, Math.round(Number(input.price) || 0))

  const [embedding] = await getProvider().embed([text])
  const item: Item = {
    id: `u-i-${Date.now().toString(36)}`,
    holderId: input.holderId,
    rawText: text,
    embedding,
    freeFrom,
    freeUntil,
    deal,
    price,
  }

  const pairs = await scoreAgainstNeeds(item)
  mutate((r) => {
    r.items.push(item)
    Object.assign(r.matches, pairs)
  })

  revalidatePath('/', 'layout')
  return { id: item.id, matched: Object.keys(pairs).length }
}

export async function addNeed(input: {
  personId: string
  text: string
  needFrom: string
  needUntil: string
}) {
  const text = clean(input.text)
  const [needFrom, needUntil] = checkWindow(input.needFrom, input.needUntil)

  const [embedding] = await getProvider().embed([text])
  let urgency: 'low' | 'medium' | 'high' = 'medium';
  try {
    const { getBackboardClient, extractMetadataTool } = await import('../providers/backboard.ts');
    const bb = getBackboardClient();
    if (bb) {
      // Create a temporary thread for extraction
      const thread = await bb.createThread(`extract-${Date.now()}`);
      const res = await bb.addMessage(thread.id, {
        content: `Extract metadata from: "${text}"`,
        // @ts-ignore - backboard-sdk simplified tools in 1.3.3
        tools: [extractMetadataTool]
      });
      if ((res as any).toolCalls && (res as any).toolCalls.length > 0) {
        const tc = (res as any).toolCalls.find((t: any) => t.function.name === 'extract_metadata');
        if (tc && tc.function.parsedArguments) {
          if (['low', 'medium', 'high'].includes(tc.function.parsedArguments.urgency)) {
            urgency = tc.function.parsedArguments.urgency;
          }
        }
      }
      // Also persist the need as a memory for this user (assistantId mapped to personId for demo)
      try {
        await bb.addMemory(input.personId, { content: `User needs: ${text} from ${needFrom} to ${needUntil}` });
      } catch (e) {
        // Ignore memory errors if assistant doesn't exist
      }
    }
  } catch (err) {
    console.error('Backboard extraction failed, falling back to defaults', err);
  }

  const need: Need = {
    id: `u-n-${Date.now().toString(36)}`,
    personId: input.personId,
    rawText: text,
    embedding,
    needFrom,
    needUntil,
    urgency,
  }

  const pairs = await scoreAgainstItems(need)
  mutate((r) => {
    r.needs.push(need)
    Object.assign(r.matches, pairs)
  })

  revalidatePath('/', 'layout')
  return { id: need.id, matched: Object.keys(pairs).length }
}

/**
 * Pin one computed hop. The DP keeps proposing a schedule; accepting turns one
 * proposal into a commitment the two people can see. It does not re-plan —
 * that is the engine's job on the next render.
 */
export async function acceptHop(input: {
  itemId: string
  needId: string
  personId: string
  from: string
  to: string
  cost: number
}) {
  const hop: AcceptedHop = {
    id: `u-h-${Date.now().toString(36)}`,
    itemId: String(input.itemId),
    needId: String(input.needId),
    personId: String(input.personId),
    from: String(input.from),
    to: String(input.to),
    cost: Math.max(0, Number(input.cost) || 0),
    createdAt: new Date().toISOString(),
  }
  if (!hop.itemId || !hop.needId) throw new Error('itemId and needId are required')

  mutate((r) => {
    // Accepting the same hop twice is a double-click, not a second handoff.
    if (!r.accepted.some((h) => h.itemId === hop.itemId && h.needId === hop.needId)) {
      r.accepted.push(hop)
    }
  })

  revalidatePath('/', 'layout')
  return { id: hop.id }
}
