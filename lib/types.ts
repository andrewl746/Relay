// No domain vocabulary lives in this file. Every user-facing noun comes from
// config.json. If a type name here would only make sense for one audience,
// it is the wrong name.

export type Person = {
  id: string
  label: string
  location: string
  /** ISO date — absent from `location` from this date... */
  awayFrom: string
  /** ...until this one. */
  awayUntil: string
  pickupWindows: ('morning' | 'afternoon' | 'evening')[]
}

/**
 * Whether the object comes back to its owner. Structural, not domain
 * vocabulary: `rent` returns after each loan and can be scheduled repeatedly,
 * `sale` transfers ownership once. A sold item is not gone — its new owner can
 * relist it, which starts a fresh chain. The words a user sees come from
 * config.json.
 */
export type Deal = 'rent' | 'sale'

export type Item = {
  id: string
  /** Person who physically has it right now. */
  holderId: string
  /** How a human actually wrote it, typos and all. */
  rawText: string
  embedding: number[]
  freeFrom: string
  freeUntil: string
  deal: Deal
  /** Per day for `rent`; the whole price for `sale`. */
  price: number
  /**
   * Reserved. A `place` is an item that does not move: distance penalty is
   * always 0, idle days are vacant days, price is rent. The engine needs no
   * change to route one. Not built — see docs/PROJECT.md §11.
   */
  kind?: 'thing' | 'place'
}

export type Need = {
  id: string
  personId: string
  rawText: string
  embedding: number[]
  needFrom: string
  needUntil: string
  urgency: 'low' | 'medium' | 'high'
}

export type Dataset = {
  people: Person[]
  items: Item[]
  needs: Need[]
}

// ---- pipeline ----

export type Candidate = {
  needId: string
  /** Raw cosine from the retrieve stage. Kept for the "no rerank" fallback. */
  cosine: number
  /** Reranked score in [0,1]. Falls back to `cosine` when rerank is off. */
  matchScore: number
  reason: string
}

/** One leg of a chain: person `personId` holds the item for this window. */
export type Hop = {
  needId: string
  personId: string
  from: string
  to: string
  matchScore: number
  reason: string
  /** Days between the previous loan ending and this one starting. */
  gapDays: number
  /**
   * True when the item went back to the owner before this loan; false when the
   * previous borrower handed it straight over. A direct handoff saves the owner
   * two trips and is the thing the schedule is actually optimizing for.
   */
  viaOwner: boolean
  /** Location penalty against the previous hop. 0 for the first hop. */
  distance: number
}

export type Chain = {
  itemId: string
  hops: Hop[]
  totalGapDays: number
  totalDistance: number
  totalMatchScore: number
  /** The DP objective: sum(match) - lambda*gap - mu*distance. */
  value: number
}

export interface MatchProvider {
  embed(texts: string[]): Promise<number[][]>
  rerank(
    need: string,
    candidates: string[],
  ): Promise<{ score: number; reason: string }[]>
}
