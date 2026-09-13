import { filterBoard, rankByUrgency, type BoardView } from "./feed";
import { isGoneByTonight } from "./format";
import { handoffs, listings, matches, notifications, slots, university, users, wants } from "./mock-data";
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

export async function getBoard({ view, query, userId }: { view: BoardView; query?: string; userId: string }) {
  const matchedIds = new Set(matches.filter((m) => m.userId === userId).map((m) => m.listingId));
  const open: BoardListing[] = listings
    .filter((l) => l.parentId === null && l.status === "available")
    .map((l) => ({ ...l, itemCount: childrenOf(l.id).length, isMatch: matchedIds.has(l.id) }));

  const shown = filterBoard(open, view, query, {
    matchedIds,
    searchableText: (l) => [l.title, l.description, l.kind, ...childrenOf(l.id).map((c) => c.title)].join(" "),
  });

  const deadlines = open.flatMap((l) => (l.expiresAt ? [l.expiresAt] : []));
  return {
    ...rankByUrgency(shown),
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

export type MatchDetail = Match & { listing: Listing; wants: Want[] };

export async function getMatches(userId: string): Promise<MatchDetail[]> {
  return matches
    .filter((m) => m.userId === userId)
    .flatMap((m) => {
      const listing = listings.find((l) => l.id === m.listingId);
      return listing ? [{ ...m, listing, wants: wants.filter((w) => m.wantIds.includes(w.id)) }] : [];
    })
    .sort((a, b) => b.score - a.score);
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
