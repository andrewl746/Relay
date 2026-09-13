import { NOW } from "./clock";
import { formatDate, formatWhen } from "./format";
import { formatWalk, walkKm } from "./geo";
import { listings, matches, slots, users, wants } from "./mock-data";
import { matchesTerms, searchTerms } from "./search";
import type { Listing, Match, TimeSlot, User, Want } from "./types";

/**
 * Situational matching.
 *
 * The semantic layer — "a TI-84 is the calculator first-year math allows" —
 * is authored in mock-data. This file is the part that decides whether that
 * match can actually happen, and if two people want the same object, who gets
 * it. Nothing here is a filter or a sort key for display: an infeasible pair
 * is removed from the running, and a contested object is allocated to exactly
 * one person.
 *
 * Three pieces of situation do the work:
 *
 *   availability  a slot is only usable if the buyer is physically in town for
 *                 it and the seller has not left yet
 *   urgency       how soon the window shuts, which decides what surfaces first
 *   contention    when several people can take the same thing, it goes to
 *                 whoever has the fewest alternatives, not whoever asked first
 */

const HOUR = 3_600_000;

/** Weight on a closing window when ranking. */
const W_URGENCY = 0.35;
/** Penalty per kilometre of walking. */
const W_WALK = 0.12;
/** A window this far out is not urgent at all. */
const URGENCY_HORIZON_HOURS = 72;

export type Blocker =
  | { kind: "expired"; text: string }
  | { kind: "not-in-town"; text: string }
  | { kind: "over-budget"; text: string }
  | { kind: "after-deadline"; text: string }
  | { kind: "no-slot"; text: string };

export type Contest = {
  winnerId: string;
  youWin: boolean;
  /** Everyone else who could also take it, in losing order. */
  rivals: { user: User; alternatives: number }[];
  why: string;
};

export type Plan = {
  match: Match;
  listing: Listing;
  wants: Want[];
  feasible: boolean;
  blocker: Blocker | null;
  /** Earliest slot this buyer can actually make. */
  slot: TimeSlot | null;
  usableSlots: TimeSlot[];
  allSlots: TimeSlot[];
  walkKm: number | null;
  /** Hours until this opportunity shuts for this buyer. */
  closesInHours: number | null;
  urgency: number;
  rank: number;
  contest: Contest | null;
  /** One line explaining the situational decision, not the semantic one. */
  timing: string;
};

// ---------------------------------------------------------------- presence

/**
 * Is this person physically here at that moment? An arriving student is not,
 * before they land; a leaving student is not, after they go. This is the gate
 * that makes a perfect semantic match worth nothing.
 */
export function presentAt(user: User, iso: string): boolean {
  if (user.moveStatus === "staying" || !user.moveDate) return true;
  const t = Date.parse(iso);
  const move = Date.parse(user.moveDate);
  return user.moveStatus === "arriving" ? t >= move : t <= move;
}

// ---------------------------------------------------------------- feasibility

/** Budget for a match: the matched wants' caps added up. Any uncapped want lifts the cap. */
function budgetCents(matched: Want[]): number | null {
  if (matched.some((w) => w.maxPriceCents === null)) return null;
  return matched.reduce((sum, w) => sum + (w.maxPriceCents ?? 0), 0);
}

/** The tightest deadline among the matched wants. */
function neededBy(matched: Want[]): string | null {
  const dates = matched.map((w) => w.neededBy).filter(Boolean);
  return dates.length ? dates.reduce((a, b) => (Date.parse(a) <= Date.parse(b) ? a : b)) : null;
}

/**
 * Pickup times for a listing. Items inside a bundle carry no slots of their
 * own — one desk out of a room is collected at the same door, in the same
 * window, as the whole room — so they inherit the parent's.
 */
function slotsFor(listing: Listing): TimeSlot[] {
  const own = slots.filter((s) => s.listingId === listing.id);
  const source = own.length > 0 || !listing.parentId
    ? own
    : slots.filter((s) => s.listingId === listing.parentId);
  return [...source].sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
}

export type SlotVerdict = { slot: TimeSlot; usable: boolean; why: string | null };

/**
 * Judge every pickup time the seller offered against one specific buyer.
 * Exported because the listing page needs the same verdicts the matcher used —
 * a time that is struck through with a reason is far more convincing than the
 * same time quietly missing from a list.
 */
export function pickupOptions(buyer: User, listing: Listing) {
  const seller = users.find((u) => u.id === listing.sellerId);
  const verdicts: SlotVerdict[] = slotsFor(listing).map((slot) => {
    if (Date.parse(slot.startsAt) < NOW.getTime()) {
      return { slot, usable: false, why: "already passed" };
    }
    if (seller && !presentAt(seller, slot.startsAt)) {
      return { slot, usable: false, why: `${seller.name.split(" ")[0]} has left by then` };
    }
    if (!presentAt(buyer, slot.startsAt)) {
      return {
        slot,
        usable: false,
        why: buyer.moveStatus === "arriving" ? "before you land" : "after you leave",
      };
    }
    return { slot, usable: true, why: null };
  });

  const usable = verdicts.filter((v) => v.usable).map((v) => v.slot);
  return { verdicts, usable, first: usable[0] ?? null };
}

export function evaluate(buyer: User, match: Match): Plan {
  const listing = listings.find((l) => l.id === match.listingId)!;
  const seller = users.find((u) => u.id === listing.sellerId);
  const matched = wants.filter((w) => match.wantIds.includes(w.id));
  const allSlots = slotsFor(listing);

  const base = {
    match,
    listing,
    wants: matched,
    allSlots,
    usableSlots: [] as TimeSlot[],
    slot: null as TimeSlot | null,
    walkKm: null as number | null,
    closesInHours: null as number | null,
    urgency: 0,
    contest: null as Contest | null,
  };

  const blocked = (blocker: Blocker): Plan => ({
    ...base,
    feasible: false,
    blocker,
    rank: -1,
    timing: blocker.text,
  });

  // 1. Has the seller's window already shut?
  if (listing.expiresAt && Date.parse(listing.expiresAt) <= NOW.getTime()) {
    return blocked({ kind: "expired", text: `Gone since ${formatWhen(listing.expiresAt)}.` });
  }

  // 2. Can they afford it?
  const cap = budgetCents(matched);
  if (cap !== null && listing.priceCents !== null && listing.priceCents > cap) {
    return blocked({
      kind: "over-budget",
      text: `$${(listing.priceCents - cap) / 100} over what you set aside for this.`,
    });
  }

  // 3. Is there a slot both people can physically make?
  const { verdicts, usable: buyerOk } = pickupOptions(buyer, listing);
  const live = allSlots.filter((s) => Date.parse(s.startsAt) >= NOW.getTime());
  const sellerOk = verdicts.filter((v) => v.why !== "already passed" && !v.why?.includes("has left")).map((v) => v.slot);

  if (live.length === 0) {
    return blocked({ kind: "no-slot", text: "No pickup times left." });
  }

  if (buyerOk.length === 0) {
    // The interesting failure: the object is real, the match is good, and the
    // two people are never in the same city at the same time.
    const last = sellerOk[sellerOk.length - 1] ?? live[live.length - 1];
    if (buyer.moveStatus === "arriving" && buyer.moveDate) {
      return blocked({
        kind: "not-in-town",
        text: `You land ${formatWhen(buyer.moveDate)}. The last pickup is ${formatWhen(last.startsAt)}.`,
      });
    }
    return blocked({
      kind: "not-in-town",
      text: `No pickup time works while you're both here. Last one is ${formatWhen(last.startsAt)}.`,
    });
  }

  // 4. Does any of those land before they actually need it?
  const deadline = neededBy(matched);
  const inTime = deadline
    ? buyerOk.filter((s) => Date.parse(s.startsAt) <= Date.parse(deadline))
    : buyerOk;

  if (inTime.length === 0 && deadline) {
    return blocked({
      kind: "after-deadline",
      text: `Earliest pickup is ${formatWhen(buyerOk[0].startsAt)}, after you need it (${formatDate(deadline)}).`,
    });
  }

  // Feasible. Take the earliest workable slot — for someone arriving, that is
  // the first moment after they land, which is exactly what they want.
  const slot = inTime[0];
  const km = walkKm(buyer.moveStatus === "arriving" ? buyer.destination : buyer.home, slot.place);

  const closeCandidates = [inTime[inTime.length - 1].endsAt, listing.expiresAt].filter(Boolean) as string[];
  const closesAt = closeCandidates.reduce((a, b) => (Date.parse(a) <= Date.parse(b) ? a : b));
  const closesInHours = (Date.parse(closesAt) - NOW.getTime()) / HOUR;
  const urgency = Math.max(0, Math.min(1, 1 - closesInHours / URGENCY_HORIZON_HOURS));

  const walkText = km === null ? "" : ` · ${formatWalk(km)}`;
  const firstAfterLanding =
    buyer.moveStatus === "arriving" && inTime[0] === buyerOk[0] ? ", the first one after you land" : "";

  return {
    ...base,
    feasible: true,
    blocker: null,
    slot,
    usableSlots: inTime,
    walkKm: km,
    closesInHours,
    urgency,
    rank: match.score + W_URGENCY * urgency - W_WALK * (km ?? 0),
    timing: `${formatWhen(slot.startsAt)} at ${slot.place}${firstAfterLanding}${walkText}.`,
  };
}

// ---------------------------------------------------------------- contention

/**
 * How many other feasible listings would satisfy the same want? Someone with
 * three options can afford to lose one; someone with none cannot. This is the
 * number that decides a contested object.
 */
function alternatives(plan: Plan, all: Plan[]): number {
  return all.filter(
    (p) =>
      p.feasible &&
      p.listing.id !== plan.listing.id &&
      p.match.wantIds.some((id) => plan.match.wantIds.includes(id)),
  ).length;
}

function resolveContests(byUser: Map<string, Plan[]>) {
  const claimants = new Map<string, { plan: Plan; user: User; alternatives: number }[]>();

  for (const [userId, plans] of byUser) {
    const user = users.find((u) => u.id === userId)!;
    for (const plan of plans) {
      if (!plan.feasible) continue;
      const list = claimants.get(plan.listing.id) ?? [];
      list.push({ plan, user, alternatives: alternatives(plan, plans) });
      claimants.set(plan.listing.id, list);
    }
  }

  for (const [, list] of claimants) {
    if (list.length < 2) continue;

    // Fewest alternatives first — then whoever's window shuts soonest, then
    // the better semantic fit. Order asked is never part of it.
    const ranked = [...list].sort(
      (a, b) =>
        a.alternatives - b.alternatives ||
        (a.plan.closesInHours ?? 0) - (b.plan.closesInHours ?? 0) ||
        b.plan.match.score - a.plan.match.score,
    );
    const winner = ranked[0];

    for (const entry of list) {
      const youWin = entry === winner;
      entry.plan.contest = {
        winnerId: winner.user.id,
        youWin,
        rivals: ranked.filter((r) => r !== entry).map((r) => ({ user: r.user, alternatives: r.alternatives })),
        why: youWin
          ? winner.alternatives === 0
            ? "Held for you — nothing else on the board covers this."
            : `Held for you — ${ranked[1].user.name.split(" ")[0]} has ${ranked[1].alternatives} other option${ranked[1].alternatives === 1 ? "" : "s"}.`
          : winner.alternatives === 0
            ? `${winner.user.name.split(" ")[0]} has no other option for this, and you have ${entry.alternatives}.`
            : `${winner.user.name.split(" ")[0]}'s window shuts sooner.`,
      };
    }
  }
}

// ---------------------------------------------------------------- lexical fallback

function childrenOf(listingId: string): Listing[] {
  return listings.filter((l) => l.parentId === listingId);
}

function searchableText(l: Listing): string {
  return [l.title, l.description, l.kind, ...childrenOf(l.id).map((c) => c.title)].join(" ");
}

/**
 * Every want here is one nobody has hand-authored a semantic match for (see
 * data.ts's getMatches) — either because the embedding provider found nothing,
 * or because it's a real (non-seed) want the demo dataset never anticipated.
 * Rather than leave it at zero matches, run the same literal/synonym search
 * browse's search box uses (./search.ts), against the want's own text instead
 * of a typed query. Lower confidence than an authored or embedded match, but a
 * true "no matches" beats a false one either way.
 */
export function lexicalWantMatches(wantsList: Want[], pool: Listing[]): Match[] {
  const out: Match[] = [];
  for (const want of wantsList) {
    const terms = searchTerms(want.text);
    if (terms.length === 0) continue;
    for (const listing of pool) {
      if (!matchesTerms(searchableText(listing), terms)) continue;
      out.push({
        id: `lex-${want.id}-${listing.id}`,
        userId: want.userId,
        listingId: listing.id,
        wantIds: [want.id],
        score: 0.55,
        reason: `Text match on your want for "${want.text}".`,
      });
    }
  }
  return out;
}

// ---------------------------------------------------------------- entry point

let cache: Map<string, Plan[]> | null = null;

// Removing/claiming a listing changes what evaluate() would compute for any
// match pointing at it, but planAll()'s cache doesn't know that on its own —
// call this wherever a listing's status changes.
export function resetPlanCache() {
  cache = null;
}

export function planAll(): Map<string, Plan[]> {
  if (cache) return cache;

  const byUser = new Map<string, Plan[]>();
  for (const user of users) {
    // A match authored against a listing that's no longer available (claimed
    // by someone else, or removed by its seller) isn't something to show —
    // and evaluate() assumes the listing still exists in the array at all.
    const mine = matches.filter((m) => {
      if (m.userId !== user.id) return false;
      const listing = listings.find((l) => l.id === m.listingId);
      return listing?.status === "available";
    });
    if (!mine.length) continue;
    byUser.set(
      user.id,
      mine.map((m) => evaluate(user, m)),
    );
  }

  resolveContests(byUser);

  for (const [, plans] of byUser) plans.sort((a, b) => b.rank - a.rank);

  cache = byUser;
  return cache;
}

export function plansFor(userId: string): Plan[] {
  return planAll().get(userId) ?? [];
}

export function planFor(userId: string, listingId: string): Plan | null {
  return plansFor(userId).find((p) => p.listing.id === listingId) ?? null;
}
