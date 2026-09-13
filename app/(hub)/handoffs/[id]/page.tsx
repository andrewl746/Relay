import Image from "next/image";
import { notFound } from "next/navigation";
import { BackLink, PageShell } from "@/components/hub/ui";
import { dayLabel, daysBetween } from "@/lib/relay/dates";
import { requireMe } from "@/lib/relay/me";
import { receiptFor } from "@/lib/relay/views";

export const metadata = { title: "Receipt" };

const bookedAt = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Toronto",
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function ReceiptPage({ params }: PageProps<"/handoffs/[id]">) {
  const me = await requireMe();
  const receipt = receiptFor(me, (await params).id);
  if (!receipt) notFound();

  const { accepted, item, owner, borrower } = receipt;
  const sale = item.deal === "sale";
  const days = Math.max(1, daysBetween(accepted.from, accepted.to));

  return (
    <PageShell width="narrow">
      <BackLink href="/handoffs">All handoffs</BackLink>

      <article className="rounded-2 border border-rule-strong bg-paper-raised">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-rule-strong px-5 py-5 sm:px-6">
          <div className="min-w-0">
            <p className="t-eyebrow text-ink-2">
              Receipt · <span className="data">{accepted.id}</span>
            </p>
            <h1 className="t-item mt-1 text-[20px] leading-snug">{item.rawText}</h1>
          </div>
          <span className="stamp t-eyebrow border-[1.5px] border-seal px-2 py-1 text-seal">✓ Booked</span>
        </div>

        <dl className="grid grid-cols-[6.5rem_1fr] gap-x-4 gap-y-3 px-5 py-5 sm:px-6">
          <dt className="t-eyebrow pt-1 text-ink-2">{sale ? "Handover" : "Borrowed"}</dt>
          <dd className="data text-[16px] font-semibold">
            {sale ? dayLabel(accepted.from) : `${dayLabel(accepted.from)} – ${dayLabel(accepted.to)}`}
          </dd>
          <dt className="t-eyebrow pt-1 text-ink-2">Owner</dt>
          <dd className="font-semibold">
            {owner.label} <span className="font-normal text-ink-2">· {owner.location}</span>
          </dd>
          <dt className="t-eyebrow pt-1 text-ink-2">{sale ? "Buyer" : "Borrower"}</dt>
          <dd className="font-semibold">
            {borrower.label} <span className="font-normal text-ink-2">· {borrower.location}</span>
          </dd>
          <dt className="t-eyebrow pt-1 text-ink-2">Amount</dt>
          <dd className="data">
            <span className="font-semibold text-amber">${accepted.cost}</span>{" "}
            <span className="text-ink-2">{sale ? "once" : `$${item.price}/day × ${days}`} · paid directly</span>
          </dd>
          <dt className="t-eyebrow pt-1 text-ink-2">Booked</dt>
          <dd className="data text-[13px] text-ink-2">{bookedAt.format(new Date(accepted.createdAt))}</dd>
        </dl>
      </article>

      {/* The signature stamp belongs on the receipt (docs/BRAND.md). Its paper ground is --paper, so it sits flush. */}
      <Image
        src="/brand/relay-stamp-primary-ink-crop.png"
        alt="Relay stamp: Sharing is caring."
        width={1184}
        height={892}
        unoptimized
        className="mx-auto mt-12 block h-auto w-[280px]"
      />
    </PageShell>
  );
}
