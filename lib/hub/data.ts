import { filterBoard, rankByUrgency, type BoardView } from "./feed";
import { matchesTerms, searchTerms } from "./search";
import { semanticHits } from "./semantic";
import { isGoneByTonight } from "./format";
import { handoffs, listings, matches, notifications, slots, university, users, wants } from "./mock-data";
import { evaluate, lexicalWantMatches, plansFor, type Plan } from "./matching";
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

export async function getBoard({ view, query, userId }: { view: BoardView; query?: string; userId: string }) {
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
  const inView = filterBoard(open, view, undefined, { matchedIds, searchableText });
  let shown = inView;
  if (query?.trim()) {
    const terms = searchTerms(query);
    const semantic = await semanticHits(
      query,
      inView.map((l) => ({ id: l.id, text: searchableText(l) })),
    );
    shown = inView.filter((l) => matchesTerms(searchableText(l), terms) || semantic.has(l.id));
  }

  const deadlines = open.flatMap((l) => (l.expiresAt ? [l.expiresAt] : []));
  return {
    ...rankByUrgency(shown),
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
 * The semantic pairing is authored (or, once it's wired up, embedded);
 * everything about the ordering, and whether a pair survives at all, is
 * computed in lib/hub/matching.ts from when they land, when the seller
 * leaves, what pickup times exist, what they budgeted, and who else is
 * competing for the same object.
 *
 * Any want nobody has authored a pairing for — every real (non-seed) want,
 * since the embedding provider isn't wired into this flow yet — would
 * otherwise sit at zero matches even when a plainly matching listing exists.
 * Those fall back to a literal/synonym search of the want's own text against
 * listing title/description (the same one browse's search box uses), so "my
 * list" never reports nothing just because nobody hand-authored that pairing.
 */
export async function getMatches(user: User): Promise<MatchDetail[]> {
  const authored = plansFor(user.id);
  const authoredWantIds = new Set(authored.flatMap((p) => p.match.wantIds));

  const wantsList = await getWants(user.id);
  const openWants = wantsList.filter((w) => !w.fulfilled && !authoredWantIds.has(w.id));

  let plans = authored;
  if (openWants.length > 0) {
    const pool = listings.filter(
      (l) => l.status === "available" && l.parentId === null && l.sellerId !== user.id,
    );
    const lexical = lexicalWantMatches(openWants, pool).map((m) => evaluate(user, m));
    plans = [...authored, ...lexical].sort((a, b) => b.rank - a.rank);
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
