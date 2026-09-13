import { isFinalCall } from "./format";
import type { Listing, OfferType } from "./types";
import { effectiveExpiry, hasExpired } from "./urgency";

/** What the item is. */
export type BoardView =
  | "all"
  | "matches"
  | "furniture"
  | "school"
  | "tools"
  | "kitchen"
  | "electronics"
  | "hygiene"
  | "other";

/** How it moves. Kept separate from the category so the two compose. */
export type BoardMode = "any" | OfferType;

export const boardViews: { value: BoardView; label: string }[] = [
  { value: "all", label: "All" },
  { value: "matches", label: "Matches my list" },
  { value: "furniture", label: "Furniture" },
  { value: "school", label: "School" },
  { value: "tools", label: "Tools" },
  { value: "kitchen", label: "Kitchen" },
  { value: "electronics", label: "Electronics" },
  { value: "hygiene", label: "Hygiene" },
  { value: "other", label: "Everything else" },
];

/**
 * Grouped by the question that actually matters to a student: am I keeping
 * this, or am I giving it back? A general marketplace only has the first row.
 */
export const boardModes: { value: BoardMode; label: string; group: string }[] = [
  { value: "any", label: "Any way", group: "" },
  { value: "free", label: "Free", group: "Keep it" },
  { value: "sale", label: "Buy", group: "Keep it" },
  { value: "lend", label: "Borrow", group: "Give it back" },
  { value: "rent", label: "Rent", group: "Give it back" },
];

export function parseBoardView(value: string | undefined): BoardView {
  return boardViews.find((v) => v.value === value)?.value ?? "all";
}

export function parseBoardMode(value: string | undefined): BoardMode {
  return boardModes.find((m) => m.value === value)?.value ?? "any";
}

export function filterBoard<T extends Listing>(
  listings: T[],
  view: BoardView,
  mode: BoardMode,
  { matchedIds, keep }: { matchedIds: Set<string>; keep?: (l: T) => boolean },
) {
  return listings.filter((l) => {
    if (hasExpired(l)) return false;
    if (keep && !keep(l)) return false;
    if (mode !== "any" && l.offerType !== mode) return false;
    if (view === "all") return true;
    if (view === "matches") return matchedIds.has(l.id);
    return l.category === view;
  });
}

/**
 * Soonest to shut, first. The deadline used is the effective one, so an item
 * someone marked urgent this morning outranks one that has sat for a week with
 * a nominally later date.
 */
export function rankByUrgency<T extends Listing>(listings: T[]) {
  const deadline = (l: T) => {
    const at = effectiveExpiry(l);
    return at ? Date.parse(at) : Number.POSITIVE_INFINITY;
  };
  const sorted = [...listings].sort(
    (a, b) => deadline(a) - deadline(b) || Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
  const final = (l: T) => {
    const at = effectiveExpiry(l);
    return at !== null && isFinalCall(at);
  };
  return {
    finalCall: sorted.filter(final),
    rest: sorted.filter((l) => !final(l)),
  };
}
