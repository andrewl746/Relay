import { CAMPUS_TIME_ZONE, NOW } from "./clock";
import { RETURNS } from "./types";
import type { Category, Condition, Listing, OfferType, Urgency, User } from "./types";

const HOUR = 3_600_000;

const dayKeyFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: CAMPUS_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const partsFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: CAMPUS_TIME_ZONE,
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hourCycle: "h23",
});

function parts(iso: string) {
  const map: Record<string, string> = {};
  for (const p of partsFormat.formatToParts(new Date(iso))) map[p.type] = p.value;
  return {
    weekday: map.weekday,
    month: map.month,
    day: map.day,
    hour: Number(map.hour),
    minute: Number(map.minute),
  };
}

function dayNumber(date: Date) {
  const [y, m, d] = dayKeyFormat.format(date).split("-").map(Number);
  return Date.UTC(y, m - 1, d) / (24 * HOUR);
}

export function daysFromNow(iso: string) {
  return dayNumber(new Date(iso)) - dayNumber(NOW);
}

export function hoursLeft(iso: string) {
  return (Date.parse(iso) - NOW.getTime()) / HOUR;
}

export function formatDate(iso: string) {
  const p = parts(iso);
  return `${p.weekday} ${p.month} ${p.day}`;
}

export function formatShortDate(iso: string) {
  const p = parts(iso);
  return `${p.month} ${p.day}`;
}

export function formatDay(iso: string) {
  const diff = daysFromNow(iso);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return formatDate(iso);
}

function clock(hour: number, minute: number) {
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return minute === 0 ? `${h12}` : `${h12}:${String(minute).padStart(2, "0")}`;
}

function meridiem(hour: number) {
  return hour < 12 ? "am" : "pm";
}

export function formatTime(iso: string) {
  const p = parts(iso);
  return `${clock(p.hour, p.minute)}${meridiem(p.hour)}`;
}

export function formatTime24(iso: string) {
  const p = parts(iso);
  return `${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`;
}

export function formatTimeRange(startIso: string, endIso: string) {
  const s = parts(startIso);
  const e = parts(endIso);
  if (meridiem(s.hour) === meridiem(e.hour)) {
    return `${clock(s.hour, s.minute)}–${clock(e.hour, e.minute)}${meridiem(e.hour)}`;
  }
  return `${formatTime(startIso)}–${formatTime(endIso)}`;
}

export function formatWhen(iso: string) {
  return `${formatDay(iso)}, ${formatTime(iso)}`;
}

export function isFinalCall(iso: string) {
  const h = hoursLeft(iso);
  return h > 0 && h < 3;
}

export function isGoneByTonight(iso: string) {
  return hoursLeft(iso) > 0 && daysFromNow(iso) === 0;
}

export type CountdownTier = "open" | "soon" | "today" | "final" | "gone";

export function countdown(iso: string): { tier: CountdownTier; text: string; label: string } {
  const h = hoursLeft(iso);
  const label = `Gone by ${formatWhen(iso)}`;
  if (h <= 0) return { tier: "gone", text: "GONE", label: `Gone since ${formatWhen(iso)}` };
  if (h < 3) {
    const whole = Math.floor(h);
    const minutes = Math.floor((h - whole) * 60);
    return {
      tier: "final",
      text: `FINAL ${whole}h ${String(minutes).padStart(2, "0")}m`,
      label: `Final call. ${label}`,
    };
  }
  if (h < 24) return { tier: "today", text: `${formatDay(iso).toUpperCase()} · ${formatTime24(iso)}`, label };
  if (h < 24 * 7) {
    const days = Math.floor(h / 24);
    const rest = Math.floor(h - days * 24);
    return { tier: "soon", text: `${days}d ${String(rest).padStart(2, "0")}h`, label };
  }
  return { tier: "open", text: formatShortDate(iso), label };
}

export function formatMoney(cents: number) {
  return cents % 100 === 0 ? `$${cents / 100}` : `$${(cents / 100).toFixed(2)}`;
}

export function formatPrice(listing: Pick<Listing, "offerType" | "priceCents">) {
  if (listing.offerType === "free") return "Free";
  if (listing.offerType === "lend") return "Free to borrow";
  if (listing.priceCents === null) return "Free";
  const amount = formatMoney(listing.priceCents);
  return listing.offerType === "rent" ? `${amount} to borrow` : amount;
}

/** "Back by Sep 20" — only the two modes that return have one. */
export function formatReturn(listing: Pick<Listing, "offerType" | "returnDays">) {
  if (!RETURNS[listing.offerType] || listing.returnDays === null) return null;
  const days = listing.returnDays;
  if (days === 1) return "Back the next day";
  if (days >= 90) return "Yours for the term";
  if (days % 7 === 0) return `Yours for ${days / 7} week${days === 7 ? "" : "s"}`;
  return `Yours for ${days} days`;
}

export const categoryLabel: Record<Category, string> = {
  furniture: "Furniture",
  school: "School materials",
  tools: "Tools",
  kitchen: "Kitchen supplies",
  electronics: "Electronics",
  hygiene: "Hygiene & toiletries",
  other: "Other",
};

export const offerLabel: Record<OfferType, string> = {
  sale: "For sale",
  rent: "Lend for money",
  free: "Give away for free",
  lend: "Lend for free",
};

/** The distinction the whole model turns on: does the owner get it back? */
export const offerGroupLabel: Record<OfferType, string> = {
  free: "Keep it",
  sale: "Keep it",
  lend: "Give it back",
  rent: "Give it back",
};

export const urgencyLabel: Record<Urgency, string> = {
  low: "No rush",
  medium: "Soon",
  high: "Urgent",
};

export const conditionLabel: Record<Condition, string> = {
  new: "New",
  "like-new": "Like new",
  good: "Good",
  fair: "Fair",
  bad: "Bad",
};

export function moveLine(user: Pick<User, "moveStatus" | "moveDate">) {
  if (user.moveStatus === "staying" || !user.moveDate) return "Staying this term";
  const verb = user.moveStatus === "leaving" ? "Leaving" : "Arriving";
  const day = formatDay(user.moveDate);
  return `${verb} ${day === "Today" || day === "Tomorrow" ? day.toLowerCase() : day}`;
}

export function firstName(name: string) {
  return name.split(" ")[0];
}

export function matchStrength(score: number) {
  if (score >= 0.85) return "Strong match";
  if (score >= 0.65) return "Good match";
  return "Partial match";
}
