import { filterBoard, rankByUrgency, type BoardFilters, type BoardView } from "./feed";
import { hybridSearch, hybridSearchMany, type SearchDoc, type SearchHit } from "./semantic";
import { isGoneByTonight } from "./format";
import { handoffs, listings, notifications, slots, university, users, wants } from "./mock-data";
import { evaluate, plansFor, type Plan } from "./matching";
import { createClient } from "../supabase/server";
import { readRuntime } from "@/lib/relay/runtime";
import type { Handoff, Listing, Match, TimeSlot, User, Want } from "./types";

// Supabase auth ids are UUIDs; seeded demo users (dev login) use short ids
// like "u-marcus". That difference is how we tell a real signed-in user's
// data apart from the mock-data seed used by the dev-login demo path.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

function searchDoc(l: Listing): SearchDoc {
  return {
    id: l.id,
    title: [l.title, l.kind, ...childrenOf(l.id).map((c) => c.title)].join(". "),
    body: l.description,
  };
}

function openListings() {
  return listings.filter((l) => l.parentId === null && l.status === "available");
}

export type BoardListing = Listing & { itemCount: number; isMatch: boolean; sellerName: string };

export async function getBoard({
  view,
  query,
  filters,
  user,
}: {
  view: BoardView;
  query?: string;
  filters?: BoardFilters;
  user: User;
}) {
  // Only things this person could actually collect count as a match on the
  // board. A listing that is gone before they land is a near miss, and putting
  // it under "Matches my list" would be a lie the rest of the app then has to
  // walk back.
  const matchedIds = new Set(
    (await getMatches(user))
      .filter((m) => m.plan.feasible && m.plan.contest?.youWin !== false)
      .map((m) => m.listing.parentId ?? m.listing.id),
  );
  const open: BoardListing[] = openListings().map((l) => ({
    ...l,
    itemCount: childrenOf(l.id).length,
    isMatch: matchedIds.has(l.id),
    sellerName: users.find((u) => u.id === l.sellerId)?.name ?? "A student",
  }));

  const searchableText = (l: BoardListing) =>
    [l.title, l.description, l.kind, ...childrenOf(l.id).map((c) => c.title)].join(" ");

  // Search scores against the whole board, not just the current view, so the
  // embedding gates see a real distribution even when a filter leaves five
  // listings. See ./semantic.ts for how the tiers are decided.
  const inView = filterBoard(open, view, undefined, { matchedIds, searchableText, filters });
  let shown = inView;
  const searched = Boolean(query?.trim());
  if (query?.trim()) {
    const hits = await hybridSearch(query, open.map(searchDoc));

    // Order by how well each listing answers the question. Ranking search
    // results by deadline buries the best answer under whatever expires
    // soonest, which is right for browsing and wrong for answering. The tier
    // decides first: a title match is the words the student actually typed, so
    // it outranks anything the vectors merely found similar.
    const TIER = { title: 2, text: 1, embedding: 0 } as const;
    const rank = new Map(hits.map((h) => [h.id, h]));
    shown = inView
      .filter((l) => rank.has(l.id))
      .sort((a, b) => {
        const x = rank.get(a.id)!;
        const y = rank.get(b.id)!;
        return TIER[y.via] - TIER[x.via] || (y.similarity ?? 0) - (x.similarity ?? 0);
      });
  }

  const deadlines = open.flatMap((l) => (l.expiresAt ? [l.expiresAt] : []));
  return {
    // Searching answers a question; browsing answers "what is about to be
    // thrown out". Only the second one wants the scream-and-deadline ordering.
    ...(searched ? { finalCall: [] as BoardListing[], rest: shown } : rankByUrgency(shown)),
    total: open.length,
    goneTonight: deadlines.filter(isGoneByTonight).length,
    lastDeadline: deadlines.sort().at(-1) ?? null,
  };
}

export type MyListing = Listing & { itemCount: number };

/**
 * What a seller has posted, newest first. Includes claimed listings so the
 * seller can see a handoff is pending — once both sides confirm a handoff,
 * this is where the listing will stop showing up (see lib/hub/actions.ts).
 */
export async function getMyListings(userId: string): Promise<MyListing[]> {
  return listings
    .filter((l) => l.sellerId === userId && l.parentId === null)
    .map((l) => ({ ...l, itemCount: childrenOf(l.id).length }))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
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

export async function getWants(userId: string): Promise<Want[]> {
  if (!UUID_RE.test(userId)) return wants.filter((w) => w.userId === userId);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("wants")
    .select("id, user_id, text, max_price_cents, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    userId: row.user_id,
    text: row.text,
    maxPriceCents: row.max_price_cents,
    // The wants table has no needed-by date. Empty means no deadline to
    // matching.ts — created_at would read as a deadline already missed and
    // mark every match "after you need it".
    neededBy: "",
    fulfilled: false,
  }));
}

export type MatchDetail = Match & { listing: Listing; wants: Want[]; plan: Plan };

/** Feeds matchStrength(): a title hit reads as "Good match", never "Strong" — that's for authored pairings. */
const HIT_SCORE: Record<SearchHit["via"], number> = { title: 0.8, embedding: 0.7, text: 0.6 };

function matchReason(covered: Want[], hits: SearchHit[]): string {
  const quoted = covered.map((w) => `“${w.text}”`).join(", ");
  if (hits.some((h) => h.via === "title")) return `Named in the listing: ${quoted}.`;
  if (hits.some((h) => h.via === "embedding")) return `Close in meaning to ${quoted}.`;
  return `Mentioned in the description: ${quoted}.`;
}

/**
 * Matches, ordered by what this person can actually do about them.
 *
 * Seeded demo pairings are authored; every other want is matched by running
 * its text through the same hybrid search as the browse box (./semantic.ts),
 * so what shows up here is exactly what searching for the want would show.
 * Everything about the ordering, and whether a pair survives at all, is then
 * computed in lib/hub/matching.ts from when they land, when the seller
 * leaves, what pickup times exist, what they budgeted, and who else is
 * competing for the same object.
 */
export async function getMatches(user: User): Promise<MatchDetail[]> {
  const authored = plansFor(user.id);
  const authoredWantIds = new Set(authored.flatMap((p) => p.match.wantIds));
  const authoredListingIds = new Set(authored.map((p) => p.listing.id));

  const wantsList = await getWants(user.id);
  const openWants = wantsList.filter((w) => !w.fulfilled && !authoredWantIds.has(w.id));

  let plans = authored;
  if (openWants.length > 0) {
    const pool = openListings().filter((l) => l.sellerId !== user.id);
    const hitsPerWant = await hybridSearchMany(
      openWants.map((w) => w.text),
      pool.map(searchDoc),
    );

    // One match per listing, covering every want it answers — the same shape
    // as an authored bundle match that ticks four things off a list.
    const byListing = new Map<string, { wants: Want[]; hits: SearchHit[] }>();
    openWants.forEach((want, i) => {
      for (const hit of hitsPerWant[i]) {
        if (authoredListingIds.has(hit.id)) continue;
        const entry = byListing.get(hit.id) ?? { wants: [], hits: [] };
        entry.wants.push(want);
        entry.hits.push(hit);
        byListing.set(hit.id, entry);
      }
    });

    const searched = [...byListing].map(([listingId, { wants: covered, hits }]) =>
      evaluate(user, {
        id: `search-${user.id}-${listingId}`,
        userId: user.id,
        listingId,
        wantIds: covered.map((w) => w.id),
        score: Math.max(...hits.map((h) => HIT_SCORE[h.via])),
        reason: matchReason(covered, hits),
      }, covered),
    );
    plans = [...authored, ...searched].sort((a, b) => b.rank - a.rank);
  }

  return plans.map((plan) => ({
    ...plan.match,
    listing: plan.listing,
    wants: plan.wants,
    plan,
  }));
}

/** Just the ones they can actually act on. */
export async function getReachableMatches(user: User): Promise<MatchDetail[]> {
  return (await getMatches(user)).filter((m) => m.plan.feasible && m.plan.contest?.youWin !== false);
}

export type HandoffDetail = Handoff & { listing: Listing; slot: TimeSlot; buyer: User; seller: User };

function withDetail(h: Handoff): HandoffDetail | null {
  const listing = listings.find((l) => l.id === h.listingId);
  const slot = slots.find((s) => s.id === h.slotId);
  const buyer = users.find((u) => u.id === h.buyerId);
  const seller = users.find((u) => u.id === h.sellerId);
  return listing && slot && buyer && seller ? { ...h, listing, slot, buyer, seller } : null;
}

/**
 * Claims made in the app become handoffs here.
 *
 * Without this, /handoffs only ever showed the hardcoded demo rows, which are
 * keyed to demo user ids — so a real signed-in user (a Supabase UUID) claimed
 * something, landed on the confirmation, opened Handoffs and found it empty.
 */
function runtimeHandoffs(): Handoff[] {
  return readRuntime().claims.flatMap((c) => {
    const listing = listings.find((l) => l.id === c.listingId);
    if (!listing) return [];
    return [{
      id: c.id,
      listingId: c.listingId,
      slotId: c.slotId,
      buyerId: c.buyerId,
      sellerId: listing.sellerId,
      createdAt: c.createdAt,
    }];
  });
}

export async function getHandoffs(userId: string) {
  const all = [...handoffs, ...runtimeHandoffs()];
  const mine = all
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
  const h = [...handoffs, ...runtimeHandoffs()].find((x) => x.id === id);
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
