import Link from "next/link";
import { btnTertiary, EmptyState, PageShell, PageTitle, SectionTitle } from "@/components/hub/ui";
import { getHandoffs, type HandoffDetail } from "@/lib/hub/data";
import { formatDay, formatTimeRange } from "@/lib/hub/format";
import { getCurrentUser } from "@/lib/hub/session";

export const metadata = { title: "Handoffs" };

export default async function HandoffsPage() {
  const user = await getCurrentUser();
  const { pickingUp, handingOff } = await getHandoffs(user.id);

  return (
    <PageShell>
      <PageTitle title="Handoffs" lede="Every pickup you’ve agreed to, with the time and place already set." />

      <div className="grid gap-12 lg:grid-cols-2">
        <HandoffList
          title="You’re picking up"
          handoffs={pickingUp}
          person={(h) => `From ${h.seller.name}`}
          empty={
            <EmptyState title="Nothing to pick up yet.">
              <Link href="/" className={btnTertiary}>
                Browse what’s leaving
              </Link>
            </EmptyState>
          }
        />
        <HandoffList
          title="You’re handing off"
          handoffs={handingOff}
          person={(h) => `To ${h.buyer.name}`}
          empty={
            <EmptyState title="Nobody has claimed your things yet.">
              <Link href="/post" className={btnTertiary}>
                Post something
              </Link>
            </EmptyState>
          }
        />
      </div>
    </PageShell>
  );
}

function HandoffList({
  title,
  handoffs,
  person,
  empty,
}: {
  title: string;
  handoffs: HandoffDetail[];
  person: (h: HandoffDetail) => string;
  empty: React.ReactNode;
}) {
  return (
    <section className="board overflow-hidden">
      {/* A section heading, not a 13px grey label. It names half the page. */}
      <div className="border-b border-border px-5 py-4">
        <SectionTitle>{title}</SectionTitle>
      </div>
      {handoffs.length === 0 ? (
        <div className="px-5">{empty}</div>
      ) : (
        <ul className="divide-y divide-border">
          {handoffs.map((h) => (
            <li key={h.id}>
              <Link
                href={`/handoffs/${h.id}`}
                className="group grid grid-cols-[7.5rem_1fr] gap-4 px-5 py-4 transition-colors duration-100 hover:bg-surface-2"
              >
                <span className="data">
                  <span className="block text-[13px] text-ink-2">{formatDay(h.slot.startsAt)}</span>
                  <span className="block font-semibold">{formatTimeRange(h.slot.startsAt, h.slot.endsAt)}</span>
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[17px] font-semibold transition-colors duration-100 group-hover:text-accent">
                    {h.listing.title}
                  </span>
                  <span className="block text-[13px] text-ink-2">
                    {person(h)} · {h.slot.place}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
