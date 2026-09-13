import Link from "next/link";
import { ListingRow } from "@/components/hub/listing-row";
import { btnPrimary, btnSecondary, CardEmpty, PageShell, PageTitle, SectionTitle } from "@/components/hub/ui";
import { getBoard, getHandoffs, getMatches, getUniversity, getWants } from "@/lib/hub/data";
import { formatShortDate } from "@/lib/hub/format";
import { getCurrentUser } from "@/lib/hub/session";

export const metadata = { title: "Home" };

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "there";
}

export default async function HomePage() {
  const user = await getCurrentUser();
  const [university, board, wants, matches, handoffs] = await Promise.all([
    getUniversity(),
    getBoard({ view: "all", userId: user.id }),
    getWants(user.id),
    getMatches(user.id),
    getHandoffs(user.id),
  ]);

  const leavingSoon = [...board.finalCall, ...board.rest].slice(0, 4);
  const upcoming = [...handoffs.pickingUp, ...handoffs.handingOff].slice(0, 3);
  const openWants = wants.filter((w) => !w.fulfilled);

  return (
    <PageShell>
      <PageTitle
        title={`Hi ${firstName(user.name)}`}
        lede={
          matches.length > 0
            ? `${matches.length} thing${matches.length === 1 ? "" : "s"} on your list just turned up at ${university.shortName}.`
            : `Here's what's moving around ${university.shortName} right now.`
        }
      />

      <div className="mb-10 flex flex-wrap gap-3">
        <Link href="/browse" className={btnPrimary}>
          Find something
        </Link>
        <Link href="/post" className={btnSecondary}>
          Lend or sell something
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        {/* Leaving soon */}
        <section className="board overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <SectionTitle>Leaving soon</SectionTitle>
            <Link href="/browse" className="rounded-sm px-2 py-1 text-[14px] font-semibold text-accent transition-colors duration-100 hover:bg-accent-tint">
              Browse all
            </Link>
          </div>
          {leavingSoon.length > 0 ? (
            <ul>
              {leavingSoon.map((listing) => (
                <ListingRow key={listing.id} listing={listing} />
              ))}
            </ul>
          ) : (
            <div className="px-5">
              <CardEmpty icon="box" title="Nothing listed yet">
                Be the first to post something at your school.
              </CardEmpty>
            </div>
          )}
        </section>

        <div className="flex flex-col gap-6">
          {/* Your list */}
          <section className="board p-5">
            <div className="mb-3 flex items-center justify-between">
              <SectionTitle>Your list</SectionTitle>
              <Link href="/wants" className="rounded-sm px-2 py-1 text-[14px] font-semibold text-accent transition-colors duration-100 hover:bg-accent-tint">
                Edit
              </Link>
            </div>
            {openWants.length > 0 ? (
              /* Was a <ul> of grey dots and plain text — a list of nouns with
                 nothing to do. Each line is now the row it should have been:
                 what you asked for, whether anything on the board answers it,
                 and somewhere to go. */
              <ul className="-mx-2 divide-y divide-border">
                {openWants.slice(0, 5).map((want) => {
                  const count = matches.filter((m) => m.wantIds.includes(want.id)).length;
                  return (
                    <li key={want.id}>
                      <Link
                        href={count > 0 ? "/browse?view=matches" : "/wants"}
                        className="group flex items-center justify-between gap-3 rounded-sm px-2 py-2.5 transition-colors duration-100 hover:bg-surface-2"
                      >
                        <span className="min-w-0 flex-1 truncate text-[15px] transition-colors duration-100 group-hover:text-accent">
                          {want.text}
                        </span>
                        <span
                          className={`shrink-0 text-[13px] ${count > 0 ? "font-semibold text-accent" : "text-ink-3"}`}
                        >
                          {count > 0 ? `${count} match${count === 1 ? "" : "es"}` : "none yet"}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <CardEmpty icon="list" title="Nothing on your list yet">
                Tell us what you need and we&rsquo;ll watch for it.{" "}
                <Link href="/wants" className="font-semibold text-accent transition-colors duration-100 hover:text-ink">
                  Add something
                </Link>
              </CardEmpty>
            )}
          </section>

          {/* Handoffs */}
          <section className="board p-5">
            <div className="mb-3 flex items-center justify-between">
              <SectionTitle>Coming up</SectionTitle>
              <Link href="/handoffs" className="rounded-sm px-2 py-1 text-[14px] font-semibold text-accent transition-colors duration-100 hover:bg-accent-tint">
                All handoffs
              </Link>
            </div>
            {upcoming.length > 0 ? (
              <ul className="space-y-3">
                {upcoming.map((h) => (
                  <li key={h.id}>
                    <span className="block text-[15px] font-semibold">{h.listing.title}</span>
                    <span className="data block text-[13px] text-ink-2">
                      {formatShortDate(h.slot.startsAt)} · {h.slot.place}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <CardEmpty icon="calendar" title="Nothing scheduled">
                Claim something and the pickup time and place will show up here.
              </CardEmpty>
            )}
          </section>
        </div>
      </div>
    </PageShell>
  );
}
