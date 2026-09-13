import Link from "next/link";
import { btnTertiary } from "@/components/hub/ui";
import { dayLabel } from "@/lib/relay/dates";
import { walkLabel } from "@/lib/relay/place";
import { markDone } from "@/lib/relay/ui-actions";
import type { Slip as SlipData, SlipKind } from "@/lib/relay/views";

const COPY: Record<SlipKind, { eyebrow: string; prep: string; action: string }> = {
  pickup: { eyebrow: "Pick up", prep: "from", action: "Mark collected" },
  handoff: { eyebrow: "Hand off by", prep: "to", action: "Mark handed off" },
  return: { eyebrow: "Return by", prep: "to", action: "Mark returned" },
  lend: { eyebrow: "Hand off", prep: "to", action: "Mark handed off" },
  back: { eyebrow: "Collect back", prep: "from", action: "Mark returned" },
};

const first = (label: string) => label.split(" ")[0];

function when(slip: SlipData) {
  if (slip.overdue) return ` · ${-slip.inDays} ${slip.inDays === -1 ? "day" : "days"} late`;
  if (slip.inDays === 0) return " · today";
  if (slip.inDays === 1) return " · tomorrow";
  return "";
}

/**
 * A handoff slip — docs/DESIGN.md §8. A small agreement between two people;
 * the date is the largest thing on it, and lateness is carried by the number,
 * never a banner.
 */
export function Slip({ slip, fresh = false }: { slip: SlipData; fresh?: boolean }) {
  const copy = COPY[slip.kind];
  const walk = walkLabel(slip.walkKm);

  return (
    <article
      className={`rounded-2 border bg-paper-raised ${fresh ? "enter border-ink" : "border-rule-strong"} ${slip.done ? "opacity-55" : ""}`}
    >
      <div className="flex items-start justify-between gap-4 border-b border-rule-strong px-5 py-3">
        <div>
          <p className={`t-eyebrow ${slip.overdue ? "text-signal" : "text-ink-2"}`}>
            {copy.eyebrow}
            {when(slip)}
          </p>
          <p className={`data mt-1 text-[26px] leading-none font-semibold ${slip.overdue ? "text-signal" : ""}`}>
            {dayLabel(slip.date)}
          </p>
        </div>
        {slip.done ? (
          <span className="stamp t-eyebrow border-[1.5px] border-seal px-2 py-1 text-seal">✓ Done</span>
        ) : fresh ? (
          <span className="stamp stamp-press t-eyebrow border-[1.5px] border-seal px-2 py-1 text-seal">✓ Booked</span>
        ) : (
          <span className="t-eyebrow pt-1 text-ink-2">{slip.booked ? "Booked" : "On the route"}</span>
        )}
      </div>

      <div className="px-5 py-4">
        <p className="t-item text-[16px] leading-snug">{slip.item.rawText}</p>
        <p className="mt-2 text-[14px]">
          <span className="text-ink-2">{copy.prep} </span>
          <span className="font-semibold">{slip.counterpart.label}</span>
          <span className="text-ink-2">
            {" "}
            · {slip.counterpart.location}
            {walk && ` · ${walk}`}
          </span>
        </p>
        {slip.cost !== null && (
          <p className="data mt-2 text-[13px]">
            <span className="font-semibold text-amber">${slip.cost}</span>{" "}
            <span className="text-ink-2">
              {slip.kind === "pickup"
                ? `you pay ${first(slip.owner.label)} when you collect`
                : `${first(slip.counterpart.label)} pays you at the handoff`}
            </span>
          </p>
        )}
        {!slip.booked && (
          <p className="mt-2 text-[12px] text-ink-2">
            Proposed by the route. {first(slip.counterpart.label)} hasn&apos;t booked it yet.
          </p>
        )}
      </div>

      {!slip.done && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-rule px-5 py-1">
          <form action={markDone}>
            <input type="hidden" name="key" value={slip.key} />
            <button type="submit" className={`${btnTertiary} text-[14px]`}>
              {copy.action}
            </button>
          </form>
          {slip.receiptId && (
            <Link href={`/handoffs/${slip.receiptId}`} className={`${btnTertiary} text-[13px] text-ink-2`}>
              Receipt
            </Link>
          )}
        </div>
      )}
    </article>
  );
}
