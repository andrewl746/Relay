import { btnPrimary, btnSecondary, btnTertiary } from "@/components/hub/ui";
import type { Answer } from "@/lib/relay/answer";
import { dayLabel } from "@/lib/relay/dates";
import { walkLabel } from "@/lib/relay/place";
import { book, dismiss } from "@/lib/relay/ui-actions";

const first = (label: string) => label.split(" ")[0];

function Carry({ answer, q }: { answer: Answer; q: string }) {
  return (
    <>
      <input type="hidden" name="itemId" value={answer.item.id} />
      <input type="hidden" name="q" value={q} />
      <input type="hidden" name="from" value={answer.from} />
      <input type="hidden" name="to" value={answer.to} />
    </>
  );
}

/**
 * The answer card — docs/DESIGN.md §6. The product; everything else supports
 * it. The band that says who you hand it to next is the line no marketplace
 * can print, so it gets its own box.
 */
export function AnswerCard({ answer, q, lead = false }: { answer: Answer; q: string; lead?: boolean }) {
  const a = answer;
  const owner = first(a.owner.label);
  const walk = walkLabel(a.walkKm);
  const sale = a.item.deal === "sale";

  return (
    <article className={`enter rounded-2 border border-rule-strong bg-paper-raised ${lead ? "p-5 sm:p-6" : "p-4 sm:p-5"}`}>
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          {lead && <span className="stamp t-eyebrow border-[1.5px] border-seal px-2 py-1 text-seal">✓ Routed to you</span>}
          <h3 className={`t-title leading-tight ${lead ? "mt-4 text-[22px]" : "text-[18px]"}`}>{owner} has one.</h3>
          <p className="mt-1 text-[13px] text-ink-2">
            {a.owner.label} · {a.owner.location}
            {walk && ` · ${walk}`}
          </p>
        </div>
        <div className="text-right">
          <p className="data text-[14px] font-semibold text-amber">{sale ? "for sale" : `$${a.item.price} /day`}</p>
          <p className="data mt-1 text-[22px] leading-none font-semibold">${a.cost}</p>
          <p className="mt-1 text-[12px] text-ink-2">{sale ? "paid once" : `for ${a.days} ${a.days === 1 ? "day" : "days"}`}</p>
        </div>
      </div>

      <p className="t-item mt-4 text-[16px] leading-snug text-ink-2">{a.item.rawText}</p>

      <p className="data mt-4 flex items-center gap-3 text-[14px] font-medium">
        <span>{dayLabel(a.from)}</span>
        <span
          aria-hidden="true"
          className="relative h-px flex-1 bg-ink after:absolute after:-top-[3px] after:right-0 after:border-y-[3.5px] after:border-l-[6px] after:border-y-transparent after:border-l-ink"
        />
        <span>{sale ? "yours" : dayLabel(a.to)}</span>
      </p>

      {a.direct && (
        <p className="mt-3 text-[14px]">
          Collect it from <span className="font-semibold">{a.collectFrom.label}</span>, who has it just before you.
        </p>
      )}

      <p className="mt-4 border border-rule-strong bg-paper-sunk px-4 py-3 text-[15px] font-semibold">
        <span aria-hidden="true">▸ </span>
        {a.handTo === null
          ? "It's yours once you collect it."
          : a.handTo.direct
            ? `You hand it to ${a.handTo.person.label} on ${dayLabel(a.handTo.on)}.`
            : `Nobody's booked it right after you, so it goes back to ${owner} on ${dayLabel(a.handTo.on)}.`}
      </p>

      {lead && a.situation.length > 0 && (
        <ul className="mt-4 grid gap-1 text-[13px] text-ink-2">
          {a.situation.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}

      <p className="data mt-3 text-[12px] text-ink-2">
        {a.reason} · {a.score.toFixed(3)}
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
        <form action={book}>
          <Carry answer={a} q={q} />
          <button type="submit" className={lead ? btnPrimary : btnSecondary}>
            Book it · ${a.cost}
          </button>
        </form>
        <form action={dismiss}>
          <Carry answer={a} q={q} />
          <button type="submit" className={`${btnTertiary} text-[13px] text-ink-2`}>
            Not this one
          </button>
        </form>
      </div>
      {lead && (
        <p className="mt-2 text-[12px] text-ink-2">You pay {owner} directly when you collect. Relay never touches the money.</p>
      )}
    </article>
  );
}
