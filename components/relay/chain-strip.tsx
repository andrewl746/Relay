import { config } from "@/lib/config";
import { dayLabel, daysBetween, today } from "@/lib/relay/dates";
import type { Chain, Item, Person } from "@/lib/types";

const START = config.cycleBoundaries[0];
const END = config.cycleBoundaries[config.cycleBoundaries.length - 1];
const SPAN = daysBetween(START, END);

const pct = (day: string) => Math.max(0, Math.min(100, (daysBetween(START, day) / SPAN) * 100));

/**
 * The chain strip — docs/DESIGN.md §7. Held spans in seal, idle stretches in
 * signal, a tick at every handoff, proportional to real time. The words under
 * it carry the same facts for anyone who can't see the colour.
 */
export function ChainStrip({ item, chain, people }: { item: Item; chain: Chain; people: Map<string, Person> }) {
  const held = chain.hops.map((h) => ({
    from: h.from < item.freeFrom ? item.freeFrom : h.from,
    to: h.to > item.freeUntil ? item.freeUntil : h.to,
    who: people.get(h.personId)?.label ?? "Someone",
  }));

  const gaps: { from: string; to: string }[] = [];
  let cursor = item.freeFrom;
  for (const h of held) {
    if (h.from > cursor) gaps.push({ from: cursor, to: h.from });
    if (h.to > cursor) cursor = h.to;
  }
  // A sold thing stops being idle the day it sells.
  const end = item.deal === "sale" && held.length > 0 ? cursor : item.freeUntil;
  if (end > cursor) gaps.push({ from: cursor, to: end });

  const long = gaps.filter((g) => daysBetween(g.from, g.to) >= 5);
  const summary =
    `Held by ${held.length} ${held.length === 1 ? "person" : "people"} this term. ` +
    (long.length
      ? long.map((g) => `${daysBetween(g.from, g.to)} idle days from ${dayLabel(g.from)}`).join("; ") + "."
      : "No long idle stretches.");
  const t = today();

  return (
    <figure className="mt-3">
      <div role="img" aria-label={summary} className="relative h-7 bg-paper-sunk shadow-[inset_0_0_0_1px_var(--rule)]">
        {gaps.map((g, i) => (
          <span
            key={`gap-${i}`}
            className="absolute inset-y-2.5 bg-signal-fill"
            style={{ left: `${pct(g.from)}%`, width: `${Math.max(0.3, pct(g.to) - pct(g.from))}%` }}
          />
        ))}
        {held.map((h, i) => (
          <span
            key={`held-${i}`}
            title={`${h.who} · ${dayLabel(h.from)} – ${dayLabel(h.to)}`}
            className="absolute inset-y-1.5 bg-seal-fill"
            style={{ left: `${pct(h.from)}%`, width: `${Math.max(0.4, pct(h.to) - pct(h.from))}%` }}
          />
        ))}
        {held.map((h, i) => (
          <span key={`tick-${i}`} className="absolute inset-y-0 w-px bg-ink" style={{ left: `${pct(h.from)}%` }} />
        ))}
        {t >= START && t <= END && (
          <span aria-hidden="true" className="absolute -inset-y-1 w-0.5 bg-ink" style={{ left: `${pct(t)}%` }} />
        )}
      </div>
      <figcaption className="mt-1 flex flex-wrap justify-between gap-x-4 text-[12px] text-ink-2">
        <span className="data">{dayLabel(START)}</span>
        <span className="min-w-0 flex-1 text-center">{summary}</span>
        <span className="data">{dayLabel(END)}</span>
      </figcaption>
    </figure>
  );
}
