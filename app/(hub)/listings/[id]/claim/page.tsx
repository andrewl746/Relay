import Link from "next/link";
import { notFound } from "next/navigation";
import { ClaimForm, type SlotOption } from "@/components/hub/claim-form";
import { BackLink, btnSecondary, PageShell, PageTitle } from "@/components/hub/ui";
import { getListing } from "@/lib/hub/data";
import { firstName, formatDate, formatDay, formatPrice, formatTime, formatTimeRange } from "@/lib/hub/format";
import { isBeforeArrival, suggestSlot } from "@/lib/hub/scheduling";
import { SetupRequired } from "@/components/onboarding/setup-required";
import { getCurrentUser, getTradeBlocker } from "@/lib/hub/session";

export const metadata = { title: "Pick a pickup time" };

export default async function ClaimPage({ params }: PageProps<"/listings/[id]/claim">) {
  const { id } = await params;
  const [listing, user, blocker] = await Promise.all([getListing(id), getCurrentUser(), getTradeBlocker()]);
  if (!listing || listing.parentId) notFound();
  if (blocker) return <SetupRequired step={blocker} action="claim" title="Pick a pickup time" />;

  const seller = firstName(listing.seller.name);
  const back = <BackLink href={`/listings/${listing.id}`}>{listing.title}</BackLink>;

  if (user.id === listing.sellerId || listing.status !== "available") {
    return (
      <PageShell>
        {back}
        <PageTitle
          title={
            listing.status === "claimed"
              ? "Someone already claimed this"
              : listing.status === "removed"
                ? "This listing was removed"
                : "This is your listing"
          }
          lede={
            listing.status !== "available"
              ? "Try searching for something similar, or add it to your list."
              : "Switch to another student at the top of the page to try the claim flow."
          }
        />
        <Link href="/" className={btnSecondary}>
          Back to all listings
        </Link>
      </PageShell>
    );
  }

  const suggestion = suggestSlot(listing.slots, user);
  const options: SlotOption[] = listing.slots.map((slot) => ({
    id: slot.id,
    placeKind: slot.placeKind,
    day: formatDay(slot.startsAt),
    time: formatTimeRange(slot.startsAt, slot.endsAt),
    sentence: `${formatDate(slot.startsAt)} at ${formatTime(slot.startsAt)}, ${slot.place}`,
    place: slot.place,
    suggested: suggestion?.slotId === slot.id,
    beforeArrival: isBeforeArrival(slot, user),
  }));

  return (
    <PageShell>
      {back}
      <PageTitle
        title="Pick a pickup time"
        lede={`${listing.title}, ${formatPrice(listing).toLowerCase()}. ${seller} already chose these times, so there’s nothing to negotiate.`}
      />
      <ClaimForm
        listingId={listing.id}
        sellerFirstName={seller}
        buyerName={user.name}
        options={options}
        suggestionReason={suggestion?.reason ?? null}
        defaultSlotId={suggestion?.slotId ?? null}
        isBundle={listing.isBundle}
      />
    </PageShell>
  );
}
