import Link from "next/link";
import { WantsList } from "@/components/hub/wants-list";
import { Countdown, EmptyState, Eyebrow, PageShell, PageTitle, Thumb, SectionTitle } from "@/components/hub/ui";
import { getMatches, getUniversity, getWants, type MatchDetail } from "@/lib/hub/data";
import { formatMoney, formatPrice, matchStrength, moveLine } from "@/lib/hub/format";
import { getCurrentUser } from "@/lib/hub/session";

export const metadata = { title: "My list" };

function MatchRow({ m, muted }: { m: MatchDetail; muted?: boolean }) {
  const { plan } = m;
  return (
    <li className="relative border-b border-rule">
      <span
        aria-hidden="true"
        className={`absolute inset-y-0 left-0 w-0.5 ${muted ? "bg-rule-strong" : "bg-ink"}`}
      />
      <Link
        href={`/listings/${m.listing.id}`}
        className={`group flex gap-3 py-3 pr-1 pl-3 transition-colors duration-[90ms] hover:bg-paper-raised sm:gap-4 ${
          muted ? "opacity-70" : ""
        }`}
      >
        <Thumb word={m.listing.kind} photoUrl={m.listing.photoUrl} />
        <div className="min-w-0 flex-1">
          <p className="t-eyebrow text-ink">
            {matchStrength(m.score)} · covers {m.wants.length}
          </p>
          <p className="t-listing mt-1 truncate text-[17px] leading-[1.25] group-hover:underline group-hover:underline-offset-[3px]">
            {m.listing.title}
          </p>
          <p className="mt-1 text-[13px] text-ink-2">{m.reason}</p>
          {/* The situational line: not what it is, but whether you can get it. */}
          <p className={`data mt-1.5 text-[13px] ${muted ? "text-ink-2" : "font-semibold text-ink"}`}>
            {plan.contest && !plan.contest.youWin ? plan.contest.why : plan.timing}
          </p>
          {plan.contest?.youWin && (
            <p className="mt-1 text-[13px] font-semibold text-seal">{plan.contest.why}</p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1 text-right">
          <span className="data text-[15px] font-semibold">{formatPrice(m.listing)}</span>
          <Countdown expiresAt={m.listing.expiresAt} />
        </div>
      </Link>
    </li>
  );
}

export default async function WantsPage({ searchParams }: PageProps<"/wants">) {
  const add = (await searchParams).add;
  const user = await getCurrentUser();
  const [wants, matches, university] = await Promise.all([getWants(user.id), getMatches(user.id), getUniversity()]);

  const reachable = matches.filter((m) => m.plan.feasible && m.plan.contest?.youWin !== false);
  const lost = matches.filter((m) => m.plan.feasible && m.plan.contest?.youWin === false);
  const blocked = matches.filter((m) => !m.plan.feasible);

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
                // Only matches they can actually collect. A listing that is
                // gone before they land is not a match, it is a near miss.
                matchCount: reachable.filter((m) => m.wantIds.includes(w.id)).length,
                fulfilled: w.fulfilled,
              }))}
            />
          </div>
        </section>

        <section>
          <SectionTitle>Matches · what you can actually collect</SectionTitle>
          {reachable.length === 0 && lost.length === 0 && blocked.length === 0 ? (
            <EmptyState title="No matches yet.">
              We check every new listing against your list. Most things get posted in the last two weeks of term.
            </EmptyState>
          ) : (
            <>
              {reachable.length > 0 && (
                <ul className="mt-3 border-t border-rule">
                  {reachable.map((m) => (
                    <MatchRow key={m.id} m={m} />
                  ))}
                </ul>
              )}

              {lost.length > 0 && (
                <>
                  <p className="t-eyebrow mt-8 text-ink-2">Held for someone with fewer options</p>
                  <ul className="mt-3 border-t border-rule">
                    {lost.map((m) => (
                      <MatchRow key={m.id} m={m} muted />
                    ))}
                  </ul>
                </>
              )}

              {blocked.length > 0 && (
                <>
                  <p className="t-eyebrow mt-8 text-ink-2">Doesn&rsquo;t work with your dates</p>
                  <ul className="mt-3 border-t border-rule">
                    {blocked.map((m) => (
                      <MatchRow key={m.id} m={m} muted />
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </section>
      </div>
    </PageShell>
  );
}
