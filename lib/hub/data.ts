import { filterBoard, rankByUrgency, type BoardView } from "./feed";
import { isGoneByTonight } from "./format";
import type { Handoff, Listing, Match, TimeSlot, User, Want, UserNotification } from "./types";
import { snapshot } from "../relay/store";
import { getProvider } from "../providers/index";
import { cosine } from "../vector";

// Hardcoded university fallback
export async function getUniversity() {
  return { id: "uwaterloo", name: "University of Waterloo", shortName: "Waterloo", emailDomain: "uwaterloo.ca" };
}

export async function getUsers(): Promise<User[]> {
  const snap = snapshot();
  return snap.data.people.map(p => ({
    id: p.id,
    name: p.label,
    email: p.id.replace(/\s+/g, '').toLowerCase() + "@uwaterloo.ca",
    universityId: "uwaterloo",
    home: p.location,
    moveStatus: "staying",
    moveDate: null,
    note: `Away: ${p.awayFrom} to ${p.awayUntil}`
  }));
}

export async function getUser(id: string) {
  const users = await getUsers();
  return users.find((u) => u.id === id) ?? null;
}

function itemToListing(item: any): Listing {
  return {
    id: item.id,
    universityId: "uwaterloo",
    sellerId: item.holderId,
    title: item.rawText.split('\n')[0].slice(0, 50),
    description: item.rawText,
    kind: item.kind ?? "thing",
    category: "furniture",
    offerType: item.deal === "sale" ? "sale" : "rent",
    priceCents: item.price * 100,
    condition: "good",
    pickupArea: "Campus",
    expiresAt: item.freeUntil,
    isBundle: false,
    parentId: null,
    status: "available",
    createdAt: new Date().toISOString(),
  };
}

export type BoardListing = Listing & { itemCount: number; isMatch: boolean; score?: number };

export async function getBoard({ view, query, userId }: { view: BoardView; query?: string; userId: string }) {
  const snap = snapshot();
  const allItems = snap.data.items;

  let queryEmbedding: number[] | null = null;
  if (query && query.trim().length > 0) {
    const provider = getProvider();
    [queryEmbedding] = await provider.embed([query]);
  }

  const openListings = allItems.map(itemToListing);
  let boardListings: BoardListing[] = openListings.map(l => ({ ...l, itemCount: 1, isMatch: false, score: 0 }));

  if (queryEmbedding) {
    // Semantic search over items
    boardListings = boardListings.map(l => {
      const item = allItems.find(i => i.id === l.id);
      const score = item ? cosine(queryEmbedding!, item.embedding) : 0;
      return { ...l, score };
    }).filter(l => l.score! > 0.4).sort((a, b) => b.score! - a.score!);
  }

  const shown = filterBoard(boardListings, view, undefined, { // Pass undefined for query to skip simple string search
    matchedIds: new Set(),
    searchableText: (l) => l.description,
  });

  const deadlines = openListings.flatMap((l) => (l.expiresAt ? [l.expiresAt] : []));
  return {
    ...rankByUrgency(shown),
    total: openListings.length,
    goneTonight: deadlines.filter(isGoneByTonight).length,
    lastDeadline: deadlines.sort().at(-1) ?? null,
  };
}

export type ListingDetail = Listing & { seller: User; slots: TimeSlot[]; items: Listing[] };

export async function getListing(id: string): Promise<ListingDetail | null> {
  const snap = snapshot();
  const item = snap.itemById(id);
  if (!item) return null;
  const seller = await getUser(item.holderId);
  if (!seller) return null;
  const listing = itemToListing(item);

  const chain = snap.chainOf(id);
  const slots: TimeSlot[] = chain.hops.map((hop, i) => ({
    id: `slot-${i}`,
    listingId: item.id,
    startsAt: hop.from,
    endsAt: hop.to,
    place: "Campus",
    placeKind: "seller",
  }));

  return {
    ...listing,
    seller,
    slots,
    items: [],
  };
}

export async function getWants(userId: string): Promise<Want[]> {
  const snap = snapshot();
  return snap.data.needs.filter(n => n.personId === userId).map(n => ({
    id: n.id,
    userId: n.personId,
    text: n.rawText,
    maxPriceCents: null,
    neededBy: n.needFrom,
    fulfilled: false
  }));
}

export type MatchDetail = Match & { listing: Listing; wants: Want[] };

export async function getMatches(userId: string): Promise<MatchDetail[]> {
  return [];
}

export type HandoffDetail = Handoff & { listing: Listing; slot: TimeSlot; buyer: User; seller: User };

export async function getHandoffs(userId: string): Promise<{ pickingUp: HandoffDetail[], handingOff: HandoffDetail[] }> {
  return { pickingUp: [], handingOff: [] };
}

export async function getHandoff(id: string): Promise<HandoffDetail | null> {
  return null;
}

export async function getNotifications(userId: string): Promise<UserNotification[]> {
  return [];
}

export async function getUnreadCount(userId: string) {
  return 0;
}
