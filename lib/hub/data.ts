import { filterBoard, rankByUrgency, type BoardMode, type BoardView } from "./feed";
import { isGoneByTonight } from "./format";
import { matchesTerms, searchTerms } from "./search";
import { semanticHits } from "./semantic";
import { effectiveExpiry } from "./urgency";
import { handoffs, listings, matches, notifications, slots, university, users, wants } from "./mock-data";
import { plansFor, type Plan } from "./matching";
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

export type BoardListing = Listing & { itemCount: number; isMatch: boolean; sellerName: string };

export async function getBoard({
  view,
  mode,
  query,
  userId,
}: {
  view: BoardView;
  mode?: BoardMode;
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
    .map((l) => ({
      ...l,
      itemCount: childrenOf(l.id).length,
      isMatch: matchedIds.has(l.id),
      sellerName: users.find((u) => u.id === l.sellerId)?.name ?? "A student",
    }));

  const searchableText = (l: BoardListing) =>
    [l.title, l.description, l.kind, ...childrenOf(l.id).map((c) => c.title)].join(" ");

  // Filter the view first, then search inside it. Search is the union of a
  // literal/synonym match and an embedding match (./semantic.ts) — the model
  // can add results a table never would, and if it is unavailable the lexical
  // half still answers, so search degrades instead of breaking.
  const inView = filterBoard(open, view, mode ?? "any", { matchedIds });
  let shown = inView;
  let semantic = false;
  let searched = false;

  if (query?.trim()) {
    searched = true;
    const terms = searchTerms(query);
    const hits = await semanticHits(
      query,
      inView.map((l) => ({ id: l.id, text: searchableText(l) })),
    );
    semantic = hits.size > 0;

    // A literal match is the words the student actually typed, so it outranks
    // anything the vectors merely found similar. Everything else is ordered by
    // how well it answers the question — never by deadline, which would bury
    // the best answer under whatever happens to expire soonest.
    const relevance = (l: BoardListing) =>
      (matchesTerms(searchableText(l), terms) ? 1 : 0) + (hits.get(l.id) ?? 0);

    shown = inView
      .filter((l) => relevance(l) > 0)
      .sort((a, b) => relevance(b) - relevance(a));
  }

  const deadlines = open.flatMap((l) => {
    const at = effectiveExpiry(l);
    return at ? [at] : [];
  });

  return {
    // Searching answers a question; browsing answers "what is about to be
    // thrown out". Only the second one wants a deadline ordering.
    ...(searched ? { finalCall: [] as BoardListing[], rest: shown } : rankByUrgency(shown)),
    semantic,
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
    urgency: "medium" as const,
    // Real users' wants aren't run through the matching/urgency pipeline
    // yet (only the seeded demo users have authored matches), so this
    // isn't consumed downstream — it exists only to satisfy the Want type.
    neededBy: row.created_at,
    fulfilled: false,
  }));
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
      buyerName: "",
      buyerContact: "",
      payment: null,
      urgency: "medium" as const,
      dueBack: null,
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
