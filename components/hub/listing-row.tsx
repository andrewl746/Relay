import Link from "next/link";
import type { BoardListing } from "@/lib/hub/data";
import { categoryLabel, conditionLabel, formatPrice, isFinalCall } from "@/lib/hub/format";
import { Countdown, Thumb } from "./ui";

export function ListingRow({ listing }: { listing: BoardListing }) {
  const finalCall = listing.expiresAt !== null && isFinalCall(listing.expiresAt);
  const edge = finalCall ? "bg-signal-fill" : listing.isMatch ? "bg-ink" : null;
  const meta = listing.isBundle
    ? `Whole room · ${listing.itemCount} items · ${listing.pickupArea}`
    : `${categoryLabel[listing.category]} · ${conditionLabel[listing.condition]} · ${listing.pickupArea}`;

  return (
    <li className="relative">
      {edge && <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-0.5 ${edge}`} />}
      <Link
        href={`/listings/${listing.id}`}
        className="group flex items-center gap-3 px-4 py-3.5 transition-colors duration-[90ms] hover:bg-surface-2 sm:gap-4 sm:px-5"
      >
        <Thumb word={listing.kind} />
        <div className="min-w-0 flex-1">
          {listing.isMatch && <p className="t-eyebrow mb-1 text-ink">Matches your list</p>}
          <p className="t-listing line-clamp-2 text-[17px] leading-[1.25] group-hover:underline group-hover:underline-offset-[3px] sm:line-clamp-1">
            {listing.title}
          </p>
          <p className="mt-0.5 truncate text-[13px] font-medium text-ink-2">{meta}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1 text-right">
          <span className="data text-[15px] font-semibold">{formatPrice(listing)}</span>
          <Countdown expiresAt={listing.expiresAt} />
        </div>
      </Link>
    </li>
  );
}
