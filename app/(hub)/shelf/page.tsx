import { btnPrimary, chipClass, EmptyState, fieldClass, Notice, PageShell, PageTitle } from "@/components/hub/ui";
import { ChainStrip } from "@/components/relay/chain-strip";
import { config } from "@/lib/config";
import { relativeDay, today } from "@/lib/relay/dates";
import { requireMe } from "@/lib/relay/me";
import { snapshot } from "@/lib/relay/store";
import { lend } from "@/lib/relay/ui-actions";
import { shelfFor, typicalRates } from "@/lib/relay/views";

export const metadata = { title: "Your shelf" };

const ERRORS: Record<string, string> = {
  text: "Describe the thing. A few words is enough.",
  price: "Set a price of $0 or more.",
};

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function ShelfPage({ searchParams }: PageProps<"/shelf">) {
  const me = await requireMe();
  const params = await searchParams;
  const snap = snapshot();
  const shelf = shelfFor(me, snap);
  const rates = typicalRates(snap);
  const people = new Map(snap.data.people.map((p) => [p.id, p]));
  const added = shelf.entries.find((e) => e.item.id === one(params.added));
  const error = ERRORS[one(params.error) ?? ""];
  const lastDay = config.cycleBoundaries[config.cycleBoundaries.length - 1];

  return (
    <PageShell>
      <PageTitle title="Your shelf" lede="The things you lend or sell, and where the route sends each one this term." />

      {added && (
        <Notice>
          <span className="font-semibold">On your shelf.</span>{" "}
          {added.next
            ? `The route already has ${added.chain.hops.length} ${added.chain.hops.length === 1 ? "person" : "people"} for it, starting with ${added.next.person.label} ${relativeDay(added.next.on)}.`
            : "Nobody has asked for anything like it yet. It's offered the moment someone does."}
        </Notice>
      )}

      <div className="grid gap-x-12 gap-y-12 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section aria-labelledby="things-title" className="min-w-0">
          <h2 id="things-title" className="sr-only">
            Your things
          </h2>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-y border-rule-strong py-4 sm:grid-cols-4">
            <Stat label="earned this term" value={`$${shelf.earned}`} tone="money" />
            <Stat label="people helped" value={String(shelf.borrowers)} />
            <Stat label="days in a closet" value={String(shelf.idle)} tone={shelf.idle > 0 ? "idle" : undefined} />
            <Stat label="on your shelf" value={String(shelf.entries.length)} />
          </dl>

          {shelf.entries.length === 0 ? (
            <EmptyState title="Nothing on your shelf yet.">
              The drill you&apos;ve used twice, a suitcase between trips. Add it here and Relay routes it to people nearby who
              need it.
            </EmptyState>
          ) : (
            <ul className="mt-6 grid gap-6">
              {shelf.entries.map((entry) => (
                <li key={entry.item.id} className="border-b border-rule pb-6">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                    <p className="t-item min-w-0 flex-1 text-[16px] leading-snug">{entry.item.rawText}</p>
                    <p className="data text-[14px] font-semibold text-amber">
                      {entry.item.deal === "sale" ? `$${entry.item.price}` : `$${entry.item.price} /day`}
                    </p>
                  </div>
                  <ChainStrip item={entry.item} chain={entry.chain} people={people} />
                  <p className="mt-2 text-[14px]">
                    {entry.next ? (
                      <>
                        Next out: <span className="font-semibold">{entry.next.person.label}</span>,{" "}
                        {relativeDay(entry.next.on)}.
                      </>
                    ) : entry.item.deal === "sale" && entry.chain.hops.length > 0 ? (
                      "Sold."
                    ) : (
                      "Nobody booked in yet."
                    )}{" "}
                    <span className="data text-[13px] text-ink-2">
                      · <span className="text-amber">${entry.earned}</span> this term ·{" "}
                      <span className={entry.idle > 0 ? "text-signal" : ""}>{entry.idle} idle days</span>
                    </span>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="lend-title">
          <h2 id="lend-title" className="t-title text-[20px]">
            Lend something
          </h2>
          <p className="mt-1 text-[13px] text-ink-2">
            Most things here go for{" "}
            <span className="data">
              ${rates.low}–{rates.high}
            </span>{" "}
            a day. You keep all of it.
          </p>

          {error && (
            <p role="alert" className="mt-4 border border-ink bg-paper-raised px-4 py-3 font-semibold">
              {error}
            </p>
          )}

          <form action={lend} className="mt-5 grid gap-6">
            <div>
              <label htmlFor="text" className="t-eyebrow text-ink-2">
                What is it
              </label>
              <textarea
                id="text"
                name="text"
                rows={3}
                required
                minLength={3}
                maxLength={400}
                placeholder="power drill, bits are in the case. used it twice"
                className={`${fieldClass} mt-2`}
              />
              <p className="mt-1.5 text-[13px] text-ink-2">Write it like you&apos;d text a friend. That&apos;s what the matcher reads.</p>
            </div>

            <fieldset>
              <legend className="t-eyebrow text-ink-2">How</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                <label>
                  <input type="radio" name="deal" value="rent" defaultChecked className="peer sr-only" />
                  <span className={chipClass}>Lend by the day</span>
                </label>
                <label>
                  <input type="radio" name="deal" value="sale" className="peer sr-only" />
                  <span className={chipClass}>Sell it once</span>
                </label>
              </div>
            </fieldset>

            <div>
              <label htmlFor="price" className="t-eyebrow text-ink-2">
                Price in dollars, per day if lending
              </label>
              <input
                id="price"
                name="price"
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                required
                defaultValue={config.pricing.defaultRatePerDay}
                className={`${fieldClass} data mt-2 w-32`}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="freeFrom" className="t-eyebrow text-ink-2">
                  Free from
                </label>
                <input id="freeFrom" name="freeFrom" type="date" min={today()} defaultValue={today()} className={`${fieldClass} data mt-2`} />
              </div>
              <div>
                <label htmlFor="freeUntil" className="t-eyebrow text-ink-2">
                  Until
                </label>
                <input id="freeUntil" name="freeUntil" type="date" defaultValue={lastDay} className={`${fieldClass} data mt-2`} />
              </div>
            </div>

            <div>
              <button type="submit" className={btnPrimary}>
                Put it on my shelf
              </button>
            </div>
          </form>
        </section>
      </div>
    </PageShell>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "money" | "idle" }) {
  return (
    <div>
      <dt className="text-[12px] text-ink-2">{label}</dt>
      <dd
        className={`data mt-1 text-[26px] leading-none font-semibold ${tone === "money" ? "text-amber" : tone === "idle" ? "text-signal" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}
