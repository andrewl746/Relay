import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { HandoffSummary } from "@/components/hub/handoff-summary";
import { btnPrimary, btnTertiary, PageShell, PageTitle } from "@/components/hub/ui";
import { getListing } from "@/lib/hub/data";
import { firstName, formatDate, formatTime } from "@/lib/hub/format";
import { getCurrentUser } from "@/lib/hub/session";

export const metadata = { title: "Handoff confirmed" };

export default async function ConfirmedPage({ params, searchParams }: PageProps<"/listings/[id]/claim/confirmed">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [listing, user] = await Promise.all([getListing(id), getCurrentUser()]);
  if (!listing) notFound();

  const slot = listing.slots.find((s) => s.id === query.slot);
  if (!slot) redirect(`/listings/${listing.id}/claim`);

  const seller = firstName(listing.seller.name);

  return (
    <PageShell width="narrow">
      <PageTitle
        title="Claimed"
        lede={`Meet ${seller} at ${slot.place}, ${formatDate(slot.startsAt)} at ${formatTime(slot.startsAt)}. ${seller} got the same confirmation.`}
      />

      <HandoffSummary listing={listing} slot={slot} buyer={user} seller={listing.seller} justClaimed />

      {listing.isBundle && (
        <p className="mt-4 text-ink-2">
          That’s {listing.items.length} items in one trip. Bring a friend and a car.
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-5">
        <Link href="/handoffs" className={btnPrimary}>
          See my handoffs
        </Link>
        <Link href="/" className={btnTertiary}>
          Keep browsing
        </Link>
      </div>
    </PageShell>
  );
}
