import { NOW } from "./clock";
import type { Listing, UrgencyTier } from "./types";

/**
 * How badly a seller wants something gone, measured by how loud they scream.
 *
 * The scream only counts when the deadline is close. Without that rule every
 * listing would be "very urgent" and the sort would mean nothing, so a deadline
 * more than a week out can't carry an urgency at all — on the form or here.
 */

const WEEK_MS = 7 * 24 * 3_600_000;

/**
 * Quietest to loudest. The loudness range is split into one equal band per
 * entry, so adding a tier here re-slices the meter without touching anything
 * else.
 */
export const urgencyTiers: { value: UrgencyTier; label: string }[] = [
  { value: "not-urgent", label: "Not urgent" },
  { value: "urgent", label: "Urgent" },
  { value: "very-urgent", label: "Very urgent" },
];

export const urgencyLabel = Object.fromEntries(urgencyTiers.map((t) => [t.value, t.label])) as Record<
  UrgencyTier,
  string
>;

/**
 * Loudness window in dBFS, split evenly per tier. With three tiers the cut-offs
 * are -16 and -8: talking and even a raised voice stay not urgent, yelling is
 * urgent, and only a full scream close to the mic's limit reaches very urgent.
 * Raise the floor to make it less sensitive still.
 */
export const SCREAM_FLOOR_DB = -24;
export const SCREAM_CEILING_DB = 0;

/**
 * Frames averaged before a reading counts (~500ms at 60fps), so a clap, a
 * cough, or knocking the laptop can't spike the result — the scream has to be
 * held.
 */
export const SCREAM_SUSTAIN_FRAMES = 30;

/** Root-mean-square of one frame of samples in [-1, 1], as dBFS. */
export function frameDb(samples: ArrayLike<number>) {
  let sum = 0;
  for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i];
  const rms = Math.sqrt(sum / Math.max(samples.length, 1));
  return rms > 0 ? 20 * Math.log10(rms) : -Infinity;
}

/** dBFS → 0..1 across the scream window. */
export function loudness(db: number) {
  return Math.min(1, Math.max(0, (db - SCREAM_FLOOR_DB) / (SCREAM_CEILING_DB - SCREAM_FLOOR_DB)));
}

/** 0..1 loudness → tier, one equal band per tier. */
export function tierForLoudness(level: number): UrgencyTier {
  const index = Math.min(urgencyTiers.length - 1, Math.floor(level * urgencyTiers.length));
  return urgencyTiers[Math.max(0, index)].value;
}

/** A deadline within the next week is the only kind a scream can attach to. */
export function canBeUrgent(expiresAt: string | null) {
  if (!expiresAt) return false;
  const ms = Date.parse(expiresAt) - NOW.getTime();
  return Number.isFinite(ms) && ms > 0 && ms <= WEEK_MS;
}

export function parseUrgency(raw: unknown, expiresAt: string | null): UrgencyTier | null {
  const tier = urgencyTiers.find((t) => t.value === raw)?.value ?? null;
  return tier && canBeUrgent(expiresAt) ? tier : null;
}

/** Higher sorts first. Listings nobody screamed about rank with "not urgent". */
export function urgencyRank(listing: Pick<Listing, "urgency" | "expiresAt">) {
  const tier = listing.urgency && canBeUrgent(listing.expiresAt) ? listing.urgency : "not-urgent";
  return urgencyTiers.findIndex((t) => t.value === tier);
}
