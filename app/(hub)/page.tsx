import Link from "next/link";
import { btnPrimary, btnSecondary, fieldClass, PageShell } from "@/components/hub/ui";
import { AnswerCard } from "@/components/relay/answer-card";
import { findAnswers, type Miss } from "@/lib/relay/answer";
import { addDays, isDay, rangeLabel, relativeDay, today } from "@/lib/relay/dates";
import { requireMe } from "@/lib/relay/me";
import { find } from "@/lib/relay/ui-actions";
import { defaultWindow, slipsFor, type Slip, type SlipKind } from "@/lib/relay/views";

export const metadata = { title: "What do you need?" };

const EXAMPLES = [
  "need a drill saturday, putting up shelves",
  "carpet cleaner before my inspection",
  "air mattress, a friend is visiting",
];

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const href = (q: string, from: string, to: string) => `/?${new URLSearchParams({ q, from, to })}`;

export default async function NeedPage({ searchParams }: PageProps<"/">) {
  const me = await requireMe();
  const params = await searchParams;

  const q = (one(params.q) ?? "").trim().slice(0, 400);
  const fallback = defaultWindow(me.profile);
  const askedFrom = one(params.from);
  const askedTo = one(params.to);
  const from = isDay(askedFrom) && askedFrom >= today() ? askedFrom : fallback.from;
  const to = isDay(askedTo) && askedTo > from ? askedTo : addDays(from, fallback.days);

  const result = q.length >= 3 ? await findAnswers(me, q, from, to) : null;
  const next = slipsFor(me).due[0] ?? null;
  const firstName = me.profile.name.split(" ")[0];
  const returning = me.profile.visits > 1 || me.profile.searches.length > 0;
  const recents = me.profile.searches.filter((s) => s.text !== q).slice(0, 5);

  return (
    <PageShell>
      <div className="grid gap-x-12 gap-y-12 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section aria-labelledby="need-title" className="min-w-0">
          <p className="t-eyebrow text-ink-2">
            {returning ? "Welcome back" : "Welcome"}, {firstName} · {me.profile.neighbourhood}
          </p>
          <h1 id="need-title" className="t-display mt-2 text-[clamp(34px,5.5vw,52px)] leading-[1.02]">
            What do you need?
          </h1>

          <form key={`${q}|${from}|${to}`} action={find} className="mt-6 grid gap-4">
            <div>
              <label htmlFor="q" className="t-eyebrow text-ink-2">
                In your own words
              </label>
              <textarea
                id="q"
                name="q"
                rows={2}
                required
                minLength={3}
                maxLength={400}
                defaultValue={q}
                placeholder={EXAMPLES[0]}
                className={`${fieldClass} mt-2 resize-y text-[17px]`}
              />
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label htmlFor="from" className="t-eyebrow text-ink-2">
                  From
                </label>
                <input id="from" name="from" type="date" min={today()} defaultValue={from} className={`${fieldClass} data mt-2`} />
              </div>
              <div>
                <label htmlFor="to" className="t-eyebrow text-ink-2">
                  Until
                </label>
                <input id="to" name="to" type="date" min={addDays(today(), 1)} defaultValue={to} className={`${fieldClass} data mt-2`} />
              </div>
              <button type="submit" className={`${result ? btnSecondary : btnPrimary} sm:ml-auto`}>
                Find it
              </button>
            </div>
            {one(params.error) === "short" && (
              <p role="alert" className="text-[13px] font-semibold">
                Say a little more. Even &ldquo;a drill&rdquo; is enough.
              </p>
            )}
          </form>

          {!result && (
            <p className="mt-4 text-[13px] text-ink-2">
              People nearby write things like{" "}
              {EXAMPLES.map((example, i) => (
                <span key={example}>
                  {i > 0 && " · "}
                  <Link href={href(example, from, to)} className="underline underline-offset-[3px] hover:text-ink">
                    &ldquo;{example}&rdquo;
                  </Link>
                </span>
              ))}
            </p>
          )}

          {result && (
            <section aria-labelledby="results-title" className="mt-10">
              <h2 id="results-title" className="t-eyebrow border-b border-rule-strong pb-2 text-ink-2">
                <span className="data">{rangeLabel(from, to)}</span> ·{" "}
                {result.answers.length > 0
                  ? `${result.answers.length} ${result.answers.length === 1 ? "route" : "routes"} to you`
                  : "nothing routes to you yet"}
              </h2>

              {result.answers.length > 0 ? (
                <div className="mt-4 grid gap-4">
                  {result.answers.map((answer, i) => (
                    <AnswerCard key={answer.item.id} answer={answer} q={q} lead={i === 0} />
                  ))}
                </div>
              ) : (
                <div className="mt-4">
                  <p className="text-[19px] font-semibold">Nobody near you can lend that for those days.</p>
                  <p className="mt-1 max-w-[58ch] text-ink-2">
                    {result.misses.length > 0
                      ? "These came close. Each says what got in the way, and the nearest dates that would work."
                      : `Nothing on the network looks like “${q}” yet. Try naming the object itself.`}
                  </p>
                </div>
              )}

              {result.misses.length > 0 &&
                (result.answers.length > 0 ? (
                  <details className="mt-6 border-t border-rule pt-2">
                    <summary className="flex min-h-11 cursor-pointer items-center text-[13px] font-semibold">
                      Why not the others ({result.misses.length})
                    </summary>
                    <Misses misses={result.misses} q={q} />
                  </details>
                ) : (
                  <Misses misses={result.misses} q={q} />
                ))}
            </section>
          )}
        </section>

        <aside className="grid content-start gap-10 lg:pt-7">
          {next && <NextUp slip={next} />}

          <section aria-labelledby="recent-title">
            <h2 id="recent-title" className="t-eyebrow text-ink-2">
              Your recent asks
            </h2>
            {recents.length === 0 ? (
              <p className="mt-2 text-[13px] text-ink-2">What you look for shows up here, so asking again is one tap.</p>
            ) : (
              <>
                <ul className="mt-2 border-t border-rule">
                  {recents.map((s) => (
                    <li key={s.at} className="border-b border-rule">
                      <Link href={href(s.text, s.from, s.to)} className="block px-1 py-2 hover:bg-paper-raised">
                        <span className="block truncate text-[14px] font-semibold">{s.text}</span>
                        <span className="data block text-[12px] text-ink-2">{rangeLabel(s.from, s.to)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link href="/you#memory" className="mt-2 inline-flex min-h-11 items-center text-[13px] text-ink-2 underline underline-offset-[3px] hover:text-ink">
                  What Relay remembers
                </Link>
              </>
            )}
          </section>

          <section aria-labelledby="how-title">
            <h2 id="how-title" className="t-eyebrow text-ink-2">
              How the answer is chosen
            </h2>
            <ol className="mt-3 grid gap-2 text-[13px] text-ink-2">
              <li>
                <span className="font-semibold text-ink">It has to fit.</span> Free on your days, both of you in town, and a
                part of the day you share.
              </li>
              <li>
                <span className="font-semibold text-ink">Then it has to be close.</span> A shorter walk wins a tie.
              </li>
              <li>
                <span className="font-semibold text-ink">Then it has to keep moving.</span> The route plans who has it after
                you, so it never sits in a closet.
              </li>
            </ol>
          </section>
        </aside>
      </div>
    </PageShell>
  );
}

function Misses({ misses, q }: { misses: Miss[]; q: string }) {
  return (
    <ul className="mt-2 border-t border-rule">
      {misses.map((m) => (
        <li key={m.item.id} className="grid gap-1 border-b border-rule py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-x-6">
          <div className="min-w-0">
            <p className="t-item truncate text-[15px]">{m.item.rawText}</p>
            <p className="text-[13px] text-ink-2">
              {m.owner.label} · {m.why}
            </p>
          </div>
          {m.retry && (
            <Link
              href={href(q, m.retry.from, m.retry.to)}
              className="inline-flex min-h-11 items-center self-center text-[13px] font-semibold underline underline-offset-[3px]"
            >
              Ask for <span className="data ml-1">{rangeLabel(m.retry.from, m.retry.to)}</span>
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}

const NEXT_VERB: Record<SlipKind, string> = {
  pickup: "Collect it from",
  handoff: "Hand it to",
  return: "Return it to",
  lend: "Hand it to",
  back: "Collect it back from",
};

function NextUp({ slip }: { slip: Slip }) {
  return (
    <Link href="/handoffs" className="block rounded-2 border border-rule-strong bg-paper-raised px-4 py-3 hover:border-ink">
      <p className={`t-eyebrow ${slip.overdue ? "text-signal" : "text-ink-2"}`}>Next up · {relativeDay(slip.date)}</p>
      <p className="mt-1 font-semibold">
        {NEXT_VERB[slip.kind]} {slip.counterpart.label}
      </p>
      <p className="t-item truncate text-[14px] text-ink-2">{slip.item.rawText}</p>
    </Link>
  );
}
