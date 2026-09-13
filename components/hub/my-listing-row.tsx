import Link from "next/link";
import { removeListing } from "@/lib/hub/actions";
import type { MyListing } from "@/lib/hub/data";
import { categoryLabel, conditionLabel, formatPrice } from "@/lib/hub/format";
import { Countdown, Thumb } from "./ui";

const statusLabel = {
  available: "Live on the board",
  claimed: "Claimed · pickup pending",
  removed: "Removed · no longer listed",
};

export function MyListingRow({ listing }: { listing: MyListing }) {
  const live = listing.status === "available";
  const meta = listing.isBundle
    ? `Whole room · ${listing.itemCount} items · ${listing.pickupArea}`
    : `${categoryLabel[listing.category]} · ${conditionLabel[listing.condition]} · ${listing.pickupArea}`;

  return (
    <li className="relative border-b border-rule">
      <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-0.5 ${live ? "bg-ink" : "bg-ink-3"}`} />
      <Link
        href={`/listings/${listing.id}`}
        className={`group flex items-center gap-3 py-3 pr-1 pl-3 transition-colors duration-[90ms] hover:bg-paper-raised sm:gap-4 sm:pl-4 ${
          live ? "" : "opacity-70"
        }`}
      >
        <Thumb word={listing.kind} />
        <div className="min-w-0 flex-1">
          <p className="t-eyebrow mb-1 text-ink-2">{statusLabel[listing.status]}</p>
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
      {live && (
        <form action={removeListing.bind(null, listing.id)} className="pb-3 pl-3 sm:pl-4">
          <button
            type="submit"
            className="text-[13px] font-medium text-ink-2 underline underline-offset-[3px] hover:text-signal"
          >
            Remove this listing
          </button>
        </form>
      )}
    </li>
  );
}
