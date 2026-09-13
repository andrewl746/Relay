import { filterBoard, rankByUrgency, type BoardMode, type BoardView } from "./feed";
import { isGoneByTonight } from "./format";
import { listingText, searchListings } from "./search";
import { effectiveExpiry } from "./urgency";
import { handoffs, listings, matches, notifications, slots, university, users, wants } from "./mock-data";
import { plansFor, type Plan } from "./matching";
import type { Handoff, Listing, Match, TimeSlot, User, Want } from "./types";

// Async on purpose: these signatures stay the same when mock data is replaced by real queries.

export async function getUniversity() {
  return university;
}

export async function getUsers() {
  return users;
}

export async function getUser(id: string) {
  return users.find((u) => u.id === id) ?? null;
}

function childrenOf(listingId: string) {
  return listings.filter((l) => l.parentId === listingId);
}

export type BoardListing = Listing & { itemCount: number; isMatch: boolean };

export async function getBoard({
  view,
  mode,
  query,
  userId,
}: {
  view: BoardView;
  mode: BoardMode;
  query?: string;
  userId: string;
}) {
  // Only things this person could actually collect count as a match on the
  // board. A listing that is gone before they land is a near miss, and putting
  // it under "Matches my list" would be a lie the rest of the app then has to
  // walk back.
  const matchedIds = new Set(
    plansFor(userId)
      .filter((p) => p.feasible && p.contest?.youWin !== false)
      .map((p) => p.listing.parentId ?? p.listing.id),
  );
  const open: BoardListing[] = listings
    .filter((l) => l.parentId === null && l.status === "available")
    .map((l) => ({ ...l, itemCount: childrenOf(l.id).length, isMatch: matchedIds.has(l.id) }));

  const textFor = (l: BoardListing) => listingText(l, childrenOf(l.id).map((c) => c.title));

  // Semantic first, substring only if the model could not be loaded.
  const hits = query ? await searchListings(query, open.map((l) => ({ id: l.id, text: textFor(l) }))) : null;
  const semantic = hits !== null;
  const rank = hits ? new Map(hits.map((h, i) => [h.id, i])) : null;

  const keep = query
    ? rank
      ? (l: BoardListing) => rank.has(l.id)
      : (l: BoardListing) => textFor(l).toLowerCase().includes(query.toLowerCase())
    : undefined;

  const shown = filterBoard(open, view, mode, { matchedIds, keep });

  const deadlines = open.flatMap((l) => {
    const at = effectiveExpiry(l);
    return at ? [at] : [];
  });

  // A search is answering a question, so relevance wins over the deadline
  // ordering the unsearched board uses.
  const ranked = rank
    ? { finalCall: [], rest: [...shown].sort((a, b) => rank.get(a.id)! - rank.get(b.id)!) }
    : rankByUrgency(shown);

  return {
    ...ranked,
    semantic,
    total: open.length,
    goneTonight: deadlines.filter(isGoneByTonight).length,
    lastDeadline: deadlines.sort().at(-1) ?? null,
  };
}

export type ListingDetail = Listing & { seller: User; slots: TimeSlot[]; items: Listing[] };

export async function getListing(id: string): Promise<ListingDetail | null> {
  const listing = listings.find((l) => l.id === id);
  const seller = listing && users.find((u) => u.id === listing.sellerId);
  if (!listing || !seller) return null;
  return {
    ...listing,
    seller,
    slots: slots
      .filter((s) => s.listingId === id)
      .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt)),
    items: childrenOf(id),
  };
}

export async function getWants(userId: string) {
  return wants.filter((w) => w.userId === userId);
}

export type MatchDetail = Match & { listing: Listing; wants: Want[]; plan: Plan };

/**
 * Matches, ordered by what this person can actually do about them.
 *
 * The semantic pairing is authored; everything about the ordering, and whether
 * a pair survives at all, is computed in lib/hub/matching.ts from when they
 * land, when the seller leaves, what pickup times exist, what they budgeted,
 * and who else is competing for the same object.
 */
export async function getMatches(userId: string): Promise<MatchDetail[]> {
  return plansFor(userId).map((plan) => ({
    ...plan.match,
    listing: plan.listing,
    wants: plan.wants,
    plan,
  }));
}

/** Just the ones they can actually act on. */
export async function getReachableMatches(userId: string): Promise<MatchDetail[]> {
  return (await getMatches(userId)).filter((m) => m.plan.feasible && m.plan.contest?.youWin !== false);
}

export type HandoffDetail = Handoff & { listing: Listing; slot: TimeSlot; buyer: User; seller: User };

function withDetail(h: Handoff): HandoffDetail | null {
  const listing = listings.find((l) => l.id === h.listingId);
  const slot = slots.find((s) => s.id === h.slotId);
  const buyer = users.find((u) => u.id === h.buyerId);
  const seller = users.find((u) => u.id === h.sellerId);
  return listing && slot && buyer && seller ? { ...h, listing, slot, buyer, seller } : null;
}

export async function getHandoffs(userId: string) {
  const mine = handoffs
    .filter((h) => h.buyerId === userId || h.sellerId === userId)
    .map(withDetail)
    .filter((h): h is HandoffDetail => h !== null)
    .sort((a, b) => Date.parse(a.slot.startsAt) - Date.parse(b.slot.startsAt));
  return {
    pickingUp: mine.filter((h) => h.buyerId === userId),
    handingOff: mine.filter((h) => h.sellerId === userId),
  };
}

export async function getHandoff(id: string) {
  const h = handoffs.find((x) => x.id === id);
  return h ? withDetail(h) : null;
}

export async function getNotifications(userId: string) {
  return notifications
    .filter((n) => n.userId === userId)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export async function getUnreadCount(userId: string) {
  return notifications.filter((n) => n.userId === userId && !n.read).length;
}
