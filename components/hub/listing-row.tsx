import Link from "next/link";
import type { BoardListing } from "@/lib/hub/data";
import { categoryLabel, conditionLabel, formatPrice, formatReturn, isFinalCall } from "@/lib/hub/format";
import { RETURNS } from "@/lib/hub/types";
import { effectiveExpiry, shortenedByUrgency } from "@/lib/hub/urgency";
import { Countdown, Thumb } from "./ui";

export function ListingRow({ listing }: { listing: BoardListing }) {
  const closes = effectiveExpiry(listing);
  const finalCall = closes !== null && isFinalCall(closes);
  const returns = RETURNS[listing.offerType];
  const returnText = formatReturn(listing);
  const edge = finalCall ? "bg-signal-fill" : listing.isMatch ? "bg-ink" : null;
  const meta = listing.isBundle
    ? `Whole room · ${listing.itemCount} items · ${listing.pickupArea}`
    : `${categoryLabel[listing.category]} · ${conditionLabel[listing.condition]} · ${listing.pickupArea}`;

  return (
    <li className="relative border-b border-rule">
      {edge && <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-0.5 ${edge}`} />}
      <Link
        href={`/listings/${listing.id}`}
        className="group flex items-center gap-3 py-3 pr-1 pl-3 transition-colors duration-[90ms] hover:bg-paper-raised sm:gap-4 sm:pl-4"
      >
        <Thumb word={listing.kind} />
        <div className="min-w-0 flex-1">
          <p className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            {listing.isMatch && <span className="t-eyebrow text-ink">Matches your list</span>}
            {returns && (
              <span className="inline-flex items-center rounded-1 border border-rule-strong px-1.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase">
                Give it back
              </span>
            )}
            {shortenedByUrgency(listing) && (
              <span className="t-eyebrow text-signal">Owner needs it gone</span>
            )}
          </p>
          <p className="t-listing line-clamp-2 text-[17px] leading-[1.25] group-hover:underline group-hover:underline-offset-[3px] sm:line-clamp-1">
            {listing.title}
          </p>
          <p className="mt-0.5 truncate text-[13px] font-medium text-ink-2">
            {meta}
            {returnText && ` · ${returnText}`}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1 text-right">
          <span className="data text-[15px] font-semibold">{formatPrice(listing)}</span>
          <Countdown expiresAt={closes} />
        </div>
      </Link>
    </li>
  );
}
