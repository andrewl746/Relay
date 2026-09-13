import { hoursLeft, isFinalCall } from "./format";
import { searchTerms } from "./search";
import type { Category, Listing, OfferType } from "./types";

export type BoardFilters = {
  categories: Category[];
  offers: OfferType[];
  minCents: number | null;
  maxCents: number | null;
};

export const filterCategories: { value: Category; label: string }[] = [
  { value: "furniture", label: "Furniture" },
  { value: "school", label: "School materials" },
  { value: "kitchen", label: "Kitchen" },
  { value: "electronics", label: "Electronics" },
  { value: "hygiene", label: "Hygiene" },
  { value: "other", label: "Other" },
];

// Worded for the person browsing; offerLabel in ./format is worded for the seller.
export const filterOffers: { value: OfferType; label: string }[] = [
  { value: "sale", label: "Buy" },
  { value: "rent", label: "Rent" },
  { value: "free", label: "Free" },
  { value: "lend", label: "Borrow" },
];

type Params = Record<string, string | string[] | undefined>;

function all(value: string | string[] | undefined) {
  return value === undefined ? [] : Array.isArray(value) ? value : [value];
}

function dollarsToCents(value: string | undefined) {
  if (!value?.trim()) return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
}

export function parseBoardFilters(params: Params): BoardFilters {
  const categories = filterCategories.map((c) => c.value).filter((c) => all(params.cat).includes(c));
  const offers = filterOffers.map((o) => o.value).filter((o) => all(params.offer).includes(o));
  let minCents = dollarsToCents(all(params.min)[0]);
  let maxCents = dollarsToCents(all(params.max)[0]);
  if (minCents !== null && maxCents !== null && minCents > maxCents) [minCents, maxCents] = [maxCents, minCents];
  return { categories, offers, minCents, maxCents };
}

export function activeFilterCount(f: BoardFilters) {
  return f.categories.length + f.offers.length + (f.minCents !== null || f.maxCents !== null ? 1 : 0);
}

export function appendFilters(search: URLSearchParams, f: BoardFilters) {
  for (const c of f.categories) search.append("cat", c);
  for (const o of f.offers) search.append("offer", o);
  if (f.minCents !== null) search.set("min", String(f.minCents / 100));
  if (f.maxCents !== null) search.set("max", String(f.maxCents / 100));
}

function passesFilters(l: Listing, f: BoardFilters) {
  if (f.categories.length > 0 && !f.categories.includes(l.category)) return false;
  if (f.offers.length > 0 && !f.offers.includes(l.offerType)) return false;
  const price = l.offerType === "free" || l.offerType === "lend" ? 0 : (l.priceCents ?? 0);
  if (f.minCents !== null && price < f.minCents) return false;
  if (f.maxCents !== null && price > f.maxCents) return false;
  return true;
}

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
  {
    matchedIds,
    searchableText,
    filters,
  }: { matchedIds: Set<string>; searchableText: (l: T) => string; filters?: BoardFilters },
) {
  const terms = query?.trim() ? searchTerms(query) : [];
  return listings.filter((l) => {
    if (l.expiresAt && hoursLeft(l.expiresAt) <= 0) return false;
    if (filters && !passesFilters(l, filters)) return false;
    if (terms.length > 0) {
      const text = searchableText(l).toLowerCase();
      if (!terms.every((group) => group.some((w) => text.includes(w)))) return false;
    }
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
