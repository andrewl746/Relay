import { NOW } from "./clock";
import type { Listing, Urgency, Want } from "./types";

/**
 * Urgency, as a constraint rather than a badge.
 *
 * A seller who marks something urgent is not asking to be shown higher up the
 * page. They are saying the object leaves with them on Sunday. So urgency is
 * expressed the only way the rest of the system already understands: as a
 * shorter life. An urgent listing expires sooner, a sooner expiry shuts the
 * pickup window earlier, and an earlier window changes which pairings are
 * possible at all — not merely the order they are drawn in.
 *
 * The buyer side is the mirror of it. A buyer's urgency does not move their
 * own deadline (that is a fact about their term, not a preference); it is what
 * separates two people who are equally stuck on the same object.
 */

const DAY = 86_400_000;

/** How long a listing stays alive, by how badly the owner wants it gone. */
export const LIFESPAN_DAYS: Record<Urgency, number> = {
  low: 14,
  medium: 5,
  high: 2,
};

/** Higher wins a tie. */
export const URGENCY_RANK: Record<Urgency, number> = {
  low: 0,
  medium: 1,
  high: 2,
};

/**
 * When this listing actually shuts.
 *
 * The seller may have typed a date, and urgency implies one. Whichever comes
 * first is the truth — marking something urgent can only shorten its life,
 * never extend it past a date the seller already committed to.
 */
export function effectiveExpiry(
  listing: Pick<Listing, "expiresAt" | "urgency" | "createdAt">,
): string | null {
  const implied = Date.parse(listing.createdAt) + LIFESPAN_DAYS[listing.urgency] * DAY;
  if (!listing.expiresAt) return new Date(implied).toISOString();
  return Math.min(Date.parse(listing.expiresAt), implied) === implied
    ? new Date(implied).toISOString()
    : listing.expiresAt;
}

/** Did urgency, rather than the seller's own date, decide when this shuts? */
export function shortenedByUrgency(
  listing: Pick<Listing, "expiresAt" | "urgency" | "createdAt">,
): boolean {
  if (listing.urgency === "low") return false;
  const implied = Date.parse(listing.createdAt) + LIFESPAN_DAYS[listing.urgency] * DAY;
  return !listing.expiresAt || implied < Date.parse(listing.expiresAt);
}

export function hasExpired(listing: Pick<Listing, "expiresAt" | "urgency" | "createdAt">): boolean {
  const at = effectiveExpiry(listing);
  return at !== null && Date.parse(at) <= NOW.getTime();
}

/** The sharpest urgency among the wants a match covers. */
export function wantUrgency(wants: Pick<Want, "urgency">[]): Urgency {
  return wants.reduce<Urgency>(
    (worst, w) => (URGENCY_RANK[w.urgency] > URGENCY_RANK[worst] ? w.urgency : worst),
    "low",
  );
}

/** Deadline for a borrowed or loaned item, from the pickup time. */
export function dueBackFrom(startsAt: string, returnDays: number | null): string | null {
  return returnDays === null ? null : new Date(Date.parse(startsAt) + returnDays * DAY).toISOString();
}
