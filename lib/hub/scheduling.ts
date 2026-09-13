import { formatDate } from "./format";
import type { TimeSlot, User } from "./types";

// Naive stand-in: first slot after the buyer arrives. The interval DP in lib/assign.ts is the real version.
export function suggestSlot(slots: TimeSlot[], buyer: User) {
  if (buyer.moveStatus !== "arriving" || !buyer.moveDate) return null;
  const arrival = Date.parse(buyer.moveDate);
  const next = slots.find((s) => Date.parse(s.startsAt) >= arrival);
  if (!next) return null;
  return {
    slotId: next.id,
    reason: `It’s the first time after you arrive on ${formatDate(buyer.moveDate)}, so nothing has to sit in storage.`,
  };
}

export function isBeforeArrival(slot: TimeSlot, buyer: User) {
  return buyer.moveStatus === "arriving" && !!buyer.moveDate && Date.parse(slot.endsAt) <= Date.parse(buyer.moveDate);
}
