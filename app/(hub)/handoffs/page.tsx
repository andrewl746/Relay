import Link from "next/link";
import type { ReactNode } from "react";
import { EmptyState, Notice, PageShell, PageTitle } from "@/components/hub/ui";
import { Slip } from "@/components/relay/slip";
import { dayLabel } from "@/lib/relay/dates";
import { requireMe } from "@/lib/relay/me";
import { slipsFor, type Slip as SlipData, type SlipKind } from "@/lib/relay/views";

export const metadata = { title: "Handoffs" };

const GIVING: SlipKind[] = ["handoff", "return", "lend"];

export default async function HandoffsPage({ searchParams }: PageProps<"/handoffs">) {
  const me = await requireMe();
  const booked = (await searchParams).booked;
  const bookedId = Array.isArray(booked) ? booked[0] : booked;
  const { due, done } = slipsFor(me);

  const toGive = due.filter((s) => GIVING.includes(s.kind));
  const toCollect = due.filter((s) => !GIVING.includes(s.kind));
  const fresh = bookedId ? due.find((s) => s.kind === "pickup" && s.receiptId === bookedId) : undefined;
  const linkClass = "font-semibold text-ink underline underline-offset-[3px]";

  return (
    <PageShell>
      <PageTitle title="Handoffs" lede="What you owe and when. Every slip names a date, a person and what changes hands." />

      {fresh && (
        <Notice>
          <span className="font-semibold">Booked.</span> Collect it from {fresh.counterpart.label} on{" "}
          <span className="data">{dayLabel(fresh.date)}</span>. You pay ${fresh.cost ?? 0} directly then; Relay never touches
          the money.
        </Notice>
      )}

      <div className="grid gap-x-10 gap-y-12 lg:grid-cols-2">
        <Stack title="To give" slips={toGive} freshId={bookedId}>
          <EmptyState title="Nothing to hand over.">
            When someone books something on your shelf, or you borrow something, the handover lands here.{" "}
            <Link href="/shelf" className={linkClass}>
              Lend something
            </Link>
          </EmptyState>
        </Stack>
        <Stack title="To collect" slips={toCollect} freshId={bookedId}>
          <EmptyState title="Nothing to pick up.">
            Ask for what you need and book the answer.{" "}
            <Link href="/" className={linkClass}>
              What do you need?
            </Link>
          </EmptyState>
        </Stack>
      </div>

      {done.length > 0 && (
        <section aria-labelledby="done-title" className="mt-14">
          <h2 id="done-title" className="t-eyebrow border-b border-rule-strong pb-2 text-ink-2">
            Done
          </h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {done.map((slip) => (
              <Slip key={slip.key} slip={slip} />
            ))}
          </div>
        </section>
      )}
    </PageShell>
  );
}

function Stack({
  title,
  slips,
  freshId,
  children,
}: {
  title: string;
  slips: SlipData[];
  freshId: string | undefined;
  children: ReactNode;
}) {
  return (
    <section aria-label={title}>
      <h2 className="t-eyebrow border-b border-rule-strong pb-2 text-ink-2">
        {title} <span className="data">{slips.length}</span>
      </h2>
      {slips.length === 0 ? (
        children
      ) : (
        <div className="mt-4 grid gap-4">
          {slips.map((slip) => (
            <Slip key={slip.key} slip={slip} fresh={slip.kind === "pickup" && slip.receiptId === freshId} />
          ))}
        </div>
      )}
    </section>
  );
}
