import { firstName, formatDate, formatTimeRange } from "@/lib/hub/format";
import type { Listing, TimeSlot, User } from "@/lib/hub/types";

type Props = {
  listing: Listing;
  slot: TimeSlot;
  buyer: User;
  seller: User;
  justClaimed?: boolean;
};

export function HandoffSummary({ listing, slot, buyer, seller, justClaimed = false }: Props) {
  return (
    <div className="rounded-2 border border-rule-strong bg-paper-raised">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-rule-strong px-5 py-5 sm:px-6">
        <div>
          <p className="t-eyebrow text-ink-2">Handoff</p>
          <h2 className="t-title mt-1 text-[22px] leading-tight">{listing.title}</h2>
        </div>
        <span
          className={`stamp t-eyebrow border-[1.5px] border-seal px-2 py-1 text-seal ${justClaimed ? "stamp-press" : ""}`}
        >
          ✓ Confirmed
        </span>
      </div>

      <dl className="grid grid-cols-[5rem_1fr] gap-x-4 gap-y-3 px-5 py-5 sm:px-6">
        <dt className="t-eyebrow pt-1 text-ink-2">When</dt>
        <dd className="data text-[17px] font-semibold">
          {formatDate(slot.startsAt)}, {formatTimeRange(slot.startsAt, slot.endsAt)}
        </dd>
        <dt className="t-eyebrow pt-1 text-ink-2">Where</dt>
        <dd>
          <span className="font-semibold">{slot.place}</span>
          <span className="block text-[13px] text-ink-2">
            {slot.placeKind === "campus" ? "Public spot on campus" : `${firstName(seller.name)}’s place`}
          </span>
        </dd>
        <dt className="t-eyebrow pt-1 text-ink-2">From</dt>
        <dd className="font-semibold">{seller.name}</dd>
        <dt className="t-eyebrow pt-1 text-ink-2">To</dt>
        <dd className="font-semibold">{buyer.name}</dd>
      </dl>
    </div>
  );
}
