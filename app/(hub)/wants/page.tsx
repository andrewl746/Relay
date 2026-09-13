import Link from "next/link";
import { WantsList } from "@/components/hub/wants-list";
import { Countdown, EmptyState, Eyebrow, PageShell, PageTitle, Thumb } from "@/components/hub/ui";
import { getMatches, getUniversity, getWants } from "@/lib/hub/data";
import { formatMoney, formatPrice, matchStrength, moveLine } from "@/lib/hub/format";
import { getCurrentUser } from "@/lib/hub/session";

export const metadata = { title: "My list" };

export default async function WantsPage({ searchParams }: PageProps<"/wants">) {
  const add = (await searchParams).add;
  const user = await getCurrentUser();
  const [wants, matches, university] = await Promise.all([getWants(user.id), getMatches(user.id), getUniversity()]);

  return (
    <PageShell>
      <PageTitle
        title="My list"
        lede="Write down what you need before you move in. When someone posts something close, it shows up here and in your notifications."
      />

      <div className="grid gap-x-12 gap-y-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section>
          <Eyebrow>
            Your list · {moveLine(user)} · {university.shortName}
          </Eyebrow>
          <div className="mt-3">
            <WantsList
              prefill={typeof add === "string" ? add : ""}
              initial={wants.map((w) => ({
                id: w.id,
                text: w.text,
                budget: w.maxPriceCents ? `under ${formatMoney(w.maxPriceCents)}` : null,
                matchCount: matches.filter((m) => m.wantIds.includes(w.id)).length,
                fulfilled: w.fulfilled,
              }))}
            />
          </div>
        </section>

        <section>
          <Eyebrow>Matches · best first</Eyebrow>
          {matches.length === 0 ? (
            <EmptyState title="No matches yet.">
              We check every new listing against your list. Most things get posted in the last two weeks of term.
            </EmptyState>
          ) : (
            <ul className="mt-3 border-t border-rule">
              {matches.map((m) => (
                <li key={m.id} className="relative border-b border-rule">
                  <span aria-hidden="true" className="absolute inset-y-0 left-0 w-0.5 bg-ink" />
                  <Link
                    href={`/listings/${m.listing.id}`}
                    className="group flex gap-3 py-3 pr-1 pl-3 transition-colors duration-[90ms] hover:bg-paper-raised sm:gap-4"
                  >
                    <Thumb word={m.listing.kind} />
                    <div className="min-w-0 flex-1">
                      <p className="t-eyebrow text-ink">
                        {matchStrength(m.score)} · covers {m.wants.length} of your {wants.filter((w) => !w.fulfilled).length}
                      </p>
                      <p className="t-listing mt-1 truncate text-[17px] leading-[1.25] group-hover:underline group-hover:underline-offset-[3px]">
                        {m.listing.title}
                      </p>
                      <p className="mt-1 text-[13px] text-ink-2">{m.reason}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                      <span className="data text-[15px] font-semibold">{formatPrice(m.listing)}</span>
                      <Countdown expiresAt={m.listing.expiresAt} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </PageShell>
  );
}
