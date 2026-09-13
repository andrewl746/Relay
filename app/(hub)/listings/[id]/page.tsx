import Link from "next/link";
import { notFound } from "next/navigation";
import { PickupMap } from "@/components/hub/pickup-map";
import { BackLink, btnPrimary, Countdown, Eyebrow, PageShell, Thumb, VerifiedStamp, SectionTitle } from "@/components/hub/ui";
import { getListing, getUniversity } from "@/lib/hub/data";
import { pickupOptions, planFor } from "@/lib/hub/matching";
import {
  categoryLabel,
  conditionLabel,
  firstName,
  formatMoney,
  formatPrice,
  formatTimeRange,
  formatWhen,
  formatDay,
  moveLine,
  offerLabel,
} from "@/lib/hub/format";
import { getCurrentUser } from "@/lib/hub/session";

export async function generateMetadata({ params }: PageProps<"/listings/[id]">) {
  const listing = await getListing((await params).id);
  return { title: listing?.title ?? "Listing" };
}

export default async function ListingPage({ params }: PageProps<"/listings/[id]">) {
  const { id } = await params;
  const [listing, user, university] = await Promise.all([getListing(id), getCurrentUser(), getUniversity()]);
  if (!listing || listing.parentId) notFound();

  const seller = listing.seller;
  const isOwn = user.id === seller.id;

  // The situational read on this listing, for this person, right now.
  const plan = planFor(user.id, listing.id);
  const { verdicts, first } = pickupOptions(user, listing);
  const myPlace = user.moveStatus === "arriving" ? user.destination : user.home;

  // Claiming is gated on the situation, not just on the item being available.
  // There is no pickup time these two people can both make, so there is
  // nothing to claim — the button would only lead to an empty slot picker.
  const heldForOther = Boolean(plan?.contest && !plan.contest.youWin);
  const canCollect = first !== null && plan?.feasible !== false && !heldForOther;
  const partsTotal = listing.items.reduce((sum, item) => sum + (item.priceCents ?? 0), 0);

  return (
    <PageShell>
      <BackLink href="/">All listings</BackLink>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <Thumb word={listing.kind} size="hero" />

        <div>
          <Eyebrow>
            {listing.isBundle
              ? `Whole room · ${listing.items.length} items · ${offerLabel[listing.offerType]}`
              : `${categoryLabel[listing.category]} · ${offerLabel[listing.offerType]} · ${conditionLabel[listing.condition]}`}
          </Eyebrow>
          <h1 className="t-title mt-2 text-[28px] leading-[1.15]">{listing.title}</h1>

          <div className="mt-5 flex items-end justify-between gap-4 border-y border-rule py-4">
            <p className="data text-[32px] leading-none font-semibold">{formatPrice(listing)}</p>
            <div className="text-right">
              <Countdown expiresAt={listing.expiresAt} large />
              {listing.expiresAt && (
                <p className="mt-1 text-[13px] text-ink-2">Gone by {formatWhen(listing.expiresAt)}</p>
              )}
            </div>
          </div>

          <p className="mt-5 max-w-[68ch]">{listing.description}</p>

          <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2">
            <VerifiedStamp domain={university.emailDomain} />
            <p className="text-[13px] text-ink-2">
              <span className="font-semibold text-ink">{seller.name}</span> · {moveLine(seller)} ·{" "}
              {listing.pickupArea}
            </p>
          </div>

          {!isOwn && plan && (
            <div
              className={`mt-6 border-l-2 px-4 py-3 ${
                !plan.feasible
                  ? "border-signal bg-paper-raised"
                  : plan.contest && !plan.contest.youWin
                    ? "border-amber bg-paper-raised"
                    : "border-seal bg-paper-raised"
              }`}
            >
              <p className="t-eyebrow text-ink-2">
                {!plan.feasible
                  ? "Doesn't work with your dates"
                  : plan.contest && !plan.contest.youWin
                    ? "Held for someone else"
                    : "You can collect this"}
              </p>
              <p className="mt-1 font-semibold">
                {plan.contest && !plan.contest.youWin ? plan.contest.why : plan.timing}
              </p>
              {plan.feasible && plan.contest?.youWin && (
                <p className="mt-1 text-[13px] text-ink-2">{plan.contest.why}</p>
              )}
            </div>
          )}

          <div className="mt-8">
            {listing.status === "claimed" ? (
              <p className="font-semibold text-ink-2">Someone already claimed this.</p>
            ) : listing.status === "removed" ? (
              <p className="font-semibold text-ink-2">
                {isOwn ? "You removed this listing." : "This listing is no longer available."}
              </p>
            ) : isOwn ? (
              <p className="text-ink-2">
                This is your listing. Switch to another student at the top of the page to try claiming it.
              </p>
            ) : !canCollect ? (
              <>
                <span
                  aria-disabled="true"
                  className="inline-block w-full cursor-not-allowed border border-rule-strong bg-paper-sunk px-5 py-3 text-center font-semibold text-ink-3 sm:w-auto"
                >
                  {heldForOther ? "Held for someone else" : "You can’t collect this"}
                </span>
                <p className="mt-3 max-w-[52ch] text-[13px] text-ink-2">
                  {heldForOther
                    ? plan?.contest?.why
                    : plan?.blocker?.text ?? "None of the pickup times work for you."}{" "}
                  <Link href="/wants" className="font-semibold underline underline-offset-[3px]">
                    See what you can collect
                  </Link>
                  .
                </p>
              </>
            ) : (
              <>
                <Link href={`/listings/${listing.id}/claim`} className={`${btnPrimary} w-full sm:w-auto`}>
                  {listing.isBundle ? "Claim the whole room" : "Claim this"}
                </Link>
                <p className="mt-3 text-[13px] text-ink-2">
                  {first && (
                    <>
                      Soonest you can make it: <span className="font-semibold text-ink">{formatWhen(first.startsAt)}</span>.{" "}
                    </>
                  )}
                  No messaging back and forth.
                </p>
              </>
            )}
          </div>

          <section className="mt-8">
            <SectionTitle>Pickup times {firstName(seller.name)} offered</SectionTitle>
            <ul className="mt-2 border-t border-rule">
              {verdicts.map(({ slot, usable, why }) => (
                <li
                  key={slot.id}
                  className={`flex flex-wrap items-baseline justify-between gap-x-4 border-b border-rule py-2 text-[13px] ${
                    usable ? "" : "text-ink-3"
                  }`}
                >
                  <span className={`data font-medium ${usable ? "" : "line-through"}`}>
                    {formatDay(slot.startsAt)}, {formatTimeRange(slot.startsAt, slot.endsAt)}
                  </span>
                  <span className={usable ? "text-ink-2" : ""}>
                    {usable ? slot.place : why}
                  </span>
                </li>
              ))}
            </ul>
            {!isOwn && verdicts.some((v) => !v.usable) && (
              <p className="mt-2 text-[13px] text-ink-2">
                Struck-out times are ones you can&rsquo;t make. They&rsquo;re excluded from matching, not just
                from this list.
              </p>
            )}
          </section>

          {!isOwn && first && (
            <section className="mt-8">
              <SectionTitle>The walk</SectionTitle>
              <div className="mt-2">
                <PickupMap
                  from={myPlace}
                  to={first.place}
                  fromLabel={user.moveStatus === "arriving" ? "your new place" : "you"}
                  toLabel={first.place.split(",")[0]}
                />
              </div>
            </section>
          )}
        </div>
      </div>

      {listing.isBundle && (
        <section className="mt-12 rounded-2 border border-rule-strong bg-paper-raised">
          <div className="border-b border-rule-strong px-5 py-4">
            <Eyebrow strong>Whole room · {listing.pickupArea}</Eyebrow>
            <p className="mt-1 text-[13px] text-ink-2">
              {listing.items.length} items, one pickup
              {listing.expiresAt && ` · gone by ${formatWhen(listing.expiresAt)}`}
            </p>
          </div>
          <ul className="px-5">
            {listing.items.map((item) => (
              <li key={item.id} className="data flex items-baseline gap-3 border-b border-rule py-2.5 text-[14px] last:border-0">
                <span aria-hidden="true">☑</span>
                <span className="flex-1 font-sans">{item.title}</span>
                <span className="hidden text-ink-2 sm:inline">{conditionLabel[item.condition].toLowerCase()}</span>
                <span className="w-16 text-right">{item.priceCents ? formatMoney(item.priceCents) : "free"}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-baseline justify-between gap-3 border-t border-rule-strong px-5 py-4">
            <p className="t-eyebrow">Bundle</p>
            <p className="flex items-baseline gap-4">
              <span className="data text-[13px] text-ink-3 line-through">parts {formatMoney(partsTotal)}</span>
              <span className="data text-[32px] leading-none font-semibold">{formatPrice(listing)}</span>
            </p>
          </div>
          {listing.priceCents !== null && partsTotal > listing.priceCents && (
            <p className="border-t border-rule px-5 py-3 text-ink-2">
              You save {formatMoney(partsTotal - listing.priceCents)} and you don’t rent a van.
            </p>
          )}
        </section>
      )}

      <section className="mt-12 bg-paper-sunk px-5 py-4">
        <p className="max-w-[68ch]">
          Pay {firstName(seller.name)} directly when you pick it up. We never handle money, so never send anything
          before you’ve seen the item.
        </p>
      </section>
    </PageShell>
  );
}
