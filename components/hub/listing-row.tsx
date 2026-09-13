import { TransitionLink } from "./transition-link";
import type { BoardListing } from "@/lib/hub/data";
import { categoryLabel, conditionLabel, formatPrice, formatReturn, isFinalCall, offerLabel } from "@/lib/hub/format";
import { RETURNS } from "@/lib/hub/types";
import { effectiveExpiry, shortenedByUrgency } from "@/lib/hub/urgency";
import { Countdown, Thumb } from "./ui";

/**
 * One listing on the board, laid out the way eBay lays out a search result:
 * a real thumbnail on the left, then title → condition → price stacked down
 * the middle in descending size, and the logistics column pinned right.
 *
 * The parts eBay has that we don't (shipping, Buy It Now, feedback score) are
 * dropped rather than faked. The parts we have that eBay doesn't — where on
 * campus you collect it, and when it stops existing — take their place, and
 * they sit in the same position shipping does, because they answer the same
 * question: what does it cost me to actually get this.
 */
export function ListingRow({ listing }: { listing: BoardListing }) {
  // The effective deadline, not the typed one: an urgent seller shortens it.
  const closes = effectiveExpiry(listing);
  const finalCall = closes !== null && isFinalCall(closes);
  const returns = RETURNS[listing.offerType];
  const returnText = formatReturn(listing);

  return (
    <li className="relative">
      {finalCall && <span aria-hidden="true" className="absolute inset-y-0 left-0 w-0.5 bg-accent" />}
      <TransitionLink
        href={`/listings/${listing.id}`}
        className="group grid grid-cols-[auto_1fr] items-start gap-4 px-4 py-4 transition-colors duration-100 hover:bg-surface-2 sm:grid-cols-[auto_1fr_auto] sm:gap-5 sm:px-5"
      >
        <Thumb
          word={listing.kind}
          photoUrl={listing.photoUrl}
          alt={listing.title}
          size="list"
          transitionName={`thumb-${listing.id}`}
        />

        <div className="min-w-0">
          <p className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] font-semibold">
            {listing.isMatch && <span className="text-accent">Matches your list</span>}
            {returns && (
              <span className="inline-flex items-center rounded-1 border border-rule-strong px-1.5 py-0.5 text-[11px] tracking-wide uppercase">
                Give it back
              </span>
            )}
            {shortenedByUrgency(listing) && <span className="text-signal">Owner needs it gone</span>}
          </p>
          <p className="line-clamp-2 text-[17px] leading-[1.3] font-semibold text-ink transition-colors duration-100 group-hover:text-accent">
            {listing.title}
          </p>
          <p className="mt-1 text-[14px] text-ink-2">
            {listing.isBundle
              ? `Whole room · ${listing.itemCount} items`
              : `${conditionLabel[listing.condition]} · ${categoryLabel[listing.category]}`}
          </p>

          <p className="data mt-2.5 text-[22px] leading-none font-semibold text-ink">
            {formatPrice(listing)}
          </p>
          <p className="mt-1 text-[14px] text-ink-2">
            {offerLabel[listing.offerType]}
            {returnText && ` · ${returnText}`}
          </p>

          {/* Where the shipping line goes on eBay. Same job: the cost of
              actually getting it, which here is a walk and a deadline. */}
          <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] sm:hidden">
            <span className="text-ink-2">{listing.pickupArea}</span>
            <Countdown expiresAt={closes} />
          </p>
        </div>

        <div className="hidden shrink-0 text-right sm:block">
          <p className="text-[14px] font-semibold text-ink">{listing.sellerName}</p>
          <p className="mt-0.5 text-[14px] text-ink-2">{listing.pickupArea}</p>
          <p className="mt-2">
            <Countdown expiresAt={closes} />
          </p>
        </div>
      </TransitionLink>
    </li>
  );
}
