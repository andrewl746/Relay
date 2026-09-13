import { hoursLeft, isFinalCall } from "./format";
import type { Listing } from "./types";

export type BoardView = "all" | "furniture" | "school" | "free" | "rent" | "matches";

export const boardViews: { value: BoardView; label: string }[] = [
  { value: "all", label: "All" },
  { value: "furniture", label: "Furniture" },
  { value: "school", label: "School materials" },
  { value: "free", label: "Free" },
  { value: "rent", label: "For rent" },
  { value: "matches", label: "Matches my list" },
];

export function parseBoardView(value: string | undefined): BoardView {
  return boardViews.find((v) => v.value === value)?.value ?? "all";
}

export function filterBoard<T extends Listing>(
  listings: T[],
  view: BoardView,
  query: string | undefined,
  { matchedIds, searchableText }: { matchedIds: Set<string>; searchableText: (l: T) => string },
) {
  const q = query?.trim().toLowerCase();
  return listings.filter((l) => {
    if (l.expiresAt && hoursLeft(l.expiresAt) <= 0) return false;
    if (q && !searchableText(l).toLowerCase().includes(q)) return false;
    switch (view) {
      case "furniture":
      case "school":
        return l.category === view;
      case "free":
      case "rent":
        return l.offerType === view;
      case "matches":
        return matchedIds.has(l.id);
      default:
        return true;
    }
  });
}

export function rankByUrgency<T extends Listing>(listings: T[]) {
  const deadline = (l: T) => (l.expiresAt ? Date.parse(l.expiresAt) : Number.POSITIVE_INFINITY);
  const sorted = [...listings].sort(
    (a, b) => deadline(a) - deadline(b) || Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
  return {
    finalCall: sorted.filter((l) => l.expiresAt && isFinalCall(l.expiresAt)),
    rest: sorted.filter((l) => !(l.expiresAt && isFinalCall(l.expiresAt))),
  };
}
