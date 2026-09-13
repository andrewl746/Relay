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
            <Link href="/browse" className="text-[13px] font-semibold text-accent hover:underline">
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
              <Link href="/wants" className="text-[13px] font-semibold text-accent hover:underline">
                Edit
              </Link>
            </div>
            {openWants.length > 0 ? (
              <ul className="space-y-2">
                {openWants.slice(0, 5).map((want) => (
                  <li key={want.id} className="flex items-start gap-2 text-[15px]">
                    <span aria-hidden className="mt-[7px] size-1.5 shrink-0 rounded-full bg-ink-3" />
                    <span className="min-w-0 flex-1 truncate">{want.text}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <CardEmpty icon="list" title="Nothing on your list yet">
                Tell us what you need and we&rsquo;ll watch for it.{" "}
                <Link href="/wants" className="font-semibold text-accent hover:underline">
                  Add something
                </Link>
              </CardEmpty>
            )}
          </section>

          {/* Handoffs */}
          <section className="board p-5">
            <div className="mb-3 flex items-center justify-between">
              <SectionTitle>Coming up</SectionTitle>
              <Link href="/handoffs" className="text-[13px] font-semibold text-accent hover:underline">
                All handoffs
              </Link>
            </div>
            {upcoming.length > 0 ? (
              <ul className="space-y-3">
                {upcoming.map((h) => (
                  <li key={h.id}>
                    <Link href={`/handoffs/${h.id}`} className="block hover:underline">
                      <span className="block text-[15px] font-semibold">{h.listing.title}</span>
                      <span className="data block text-[13px] text-ink-2">
                        {formatShortDate(h.slot.startsAt)} · {h.slot.place}
                      </span>
                    </Link>
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
