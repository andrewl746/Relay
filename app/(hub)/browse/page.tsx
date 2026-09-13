import Form from "next/form";
import { Suspense } from "react";
import { ResetSearchOnReload } from "@/components/hub/reset-search-on-reload";
import Link from "next/link";
import { SearchIcon } from "@/components/hub/icons";
import { ListingRow } from "@/components/hub/listing-row";
import { VoiceInput } from "@/components/hub/voice-input";
import { btnSecondary, btnTertiary, EmptyState, Eyebrow, fieldClass, SectionTitle } from "@/components/hub/ui";
import { getBoard, getMatches, getUniversity, getWants, type BoardListing } from "@/lib/hub/data";
import { boardModes, boardViews, parseBoardMode, parseBoardView } from "@/lib/hub/feed";
import { formatShortDate, moveLine } from "@/lib/hub/format";
import { getCurrentUser } from "@/lib/hub/session";

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function BrowsePage({ searchParams }: PageProps<"/browse">) {
  const params = await searchParams;
  const view = parseBoardView(one(params.view));
  const mode = parseBoardMode(one(params.mode));
  const query = one(params.q)?.trim() || undefined;

  const user = await getCurrentUser();
  const [university, board, wants, matches] = await Promise.all([
    getUniversity(),
    getBoard({ view, mode, query, user }),
    getWants(user.id),
    getMatches(user),
  ]);
  const shown = board.finalCall.length + board.rest.length;

  const href = (next: { view?: string; mode?: string }) => {
    const search = new URLSearchParams();
    const v = next.view ?? view;
    const m = next.mode ?? mode;
    if (v !== "all") search.set("view", v);
    if (m !== "any") search.set("mode", m);
    if (query) search.set("q", query);
    const qs = search.toString();
    return qs ? `/browse?${qs}` : "/browse";
  };
  const chip = (active: boolean) =>
    `inline-flex min-h-9 items-center rounded-full border px-3.5 text-[14px] font-medium whitespace-nowrap transition-colors duration-[90ms] ${
      active
        ? "border-ink bg-ink text-bg"
        : "border-border-strong bg-surface-2 text-ink-2 hover:border-ink-3 hover:text-ink"
    }`;

  return (
    <div className="mx-auto max-w-[1120px] px-4 pt-12 pb-16 sm:px-6 sm:pt-16">
      <div className="grid gap-x-12 gap-y-10 lg:grid-cols-[1fr_320px]">
        <section aria-labelledby="board-title" className="min-w-0">
          <h1 id="board-title" className="text-[clamp(32px,4.5vw,42px)] leading-[1.1] font-semibold tracking-[-0.02em] text-ink">
            Everything here is leaving
          </h1>
          <p className="mt-2 text-[16px] text-ink-2">
            {board.total} listings at {university.shortName}
            {board.goneTonight > 0 && (
              <>
                {" · "}
                <span className="font-semibold text-accent">{board.goneTonight} gone by tonight</span>
              </>
            )}
            {board.lastDeadline && ` · last deadline ${formatShortDate(board.lastDeadline)}`}
          </p>

          <Form action="/browse" className="mt-6 flex flex-wrap gap-2">
            {view !== "all" && <input type="hidden" name="view" value={view} />}
            {mode !== "any" && <input type="hidden" name="mode" value={mode} />}
            <label className="relative flex-1">
              <span className="sr-only">Search listings</span>
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-2" />
              <input
                key={query ?? ""}
                id="board-search"
                name="q"
                defaultValue={query}
                placeholder="What do you need? Try “lamp” or “BIOL 130”"
                className={`${fieldClass} min-h-11 pl-9`}
              />
            </label>
            <button type="submit" className={btnSecondary}>
              Search
            </button>
            {/* Say what you need and the search runs — no typing, no form. */}
            <VoiceInput targetId="board-search" submitOnFinish label="Say it" />
          </Form>

          <nav aria-label="Filter listings" className="-mx-4 mt-4 space-y-2 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0">
            <ul className="flex gap-2">
              {boardViews.map((v) => (
                <li key={v.value}>
                  <Link href={href({ view: v.value })} scroll={false} aria-current={v.value === view ? "true" : undefined} className={chip(v.value === view)}>
                    {v.label}
                  </Link>
                </li>
              ))}
            </ul>
            {/* The axis a general marketplace has no row for: am I keeping it? */}
            <ul className="flex items-center gap-2">
              {boardModes.map((m, i) => (
                <li key={m.value} className="flex items-center gap-2">
                  {m.group && m.group !== boardModes[i - 1]?.group && (
                    <span className="pl-1 text-[12px] font-semibold tracking-wide text-ink-3 uppercase">{m.group}</span>
                  )}
                  <Link href={href({ mode: m.value })} scroll={false} aria-current={m.value === mode ? "true" : undefined} className={chip(m.value === mode)}>
                    {m.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-6">
            {shown === 0 ? (
              <div className="board px-5">
              <EmptyState title={query ? `Nothing matches “${query}” right now.` : "Nothing here right now."}>
                <p>
                  Add it to your list and we’ll tell you the moment someone posts. Most things show up in the last
                  two weeks of term.
                </p>
                <Link
                  href={query ? `/wants?add=${encodeURIComponent(query)}` : "/wants"}
                  className={btnTertiary}
                >
                  {query ? `Add “${query}” to my list` : "Go to my list"}
                </Link>
              </EmptyState>
              </div>
            ) : (
              <>
                {board.finalCall.length > 0 && (
                  <BoardSection
                    title={`Final call · ${board.finalCall.length} ${board.finalCall.length === 1 ? "item" : "items"}`}
                    urgent
                    listings={board.finalCall}
                  />
                )}
                <BoardSection title="Soonest deadline first" listings={board.rest} />
              </>
            )}
          </div>
        </section>

        <aside className="space-y-6">
          {user.moveStatus === "leaving" ? (
            <section className="board p-5">
              <SectionTitle>Moving out</SectionTitle>
              <p className="mt-2 text-[17px] font-semibold">Post your whole room in one go</p>
              <p className="mt-1 text-ink-2">
                One incoming student claims all of it in a single pickup. No eight separate conversations.
              </p>
              <Link href="/post/room" className={`${btnSecondary} mt-4 w-full`}>
                Post my room
              </Link>
              <Link href="/post" className={`${btnTertiary} mt-3 inline-block text-[13px]`}>
                Or post a single item
              </Link>
            </section>
          ) : (
            <section className="board p-5">
              <SectionTitle>Your list · {moveLine(user)}</SectionTitle>
              {wants.length === 0 ? (
                <p className="mt-2 text-ink-2">
                  Write down what you need before you arrive and we’ll match it as people post.
                </p>
              ) : (
                <ul className="mt-3 border-t border-rule">
                  {wants.map((w) => {
                    const count = matches.filter((m) => m.wantIds.includes(w.id)).length;
                    return (
                      <li key={w.id} className="flex items-baseline justify-between gap-3 border-b border-rule py-2">
                        <span className={w.fulfilled ? "text-ink-3 line-through" : ""}>{w.text}</span>
                        <span className={`shrink-0 text-[13px] ${count > 0 && !w.fulfilled ? "font-semibold" : "text-ink-2"}`}>
                          {w.fulfilled ? "found it" : count > 0 ? `● ${count} ${count === 1 ? "match" : "matches"}` : "○ none yet"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <Link href="/browse?view=matches" className={btnSecondary}>
                  Show my matches
                </Link>
                <Link href="/wants" className={`${btnTertiary} text-[13px]`}>
                  Edit list
                </Link>
              </div>
            </section>
          )}

          <section className="board p-5">
            <SectionTitle>How it works</SectionTitle>
            <ol className="mt-3 space-y-3">
              {[
                ["Find it", "Everything is sorted by when it has to be gone, so nothing gets thrown out first."],
                ["Pick a time", "The owner already set pickup times. Choose one, no messaging."],
                ["Pick it up", "Meet at the time and place on your confirmation. Pay in person."],
              ].map(([title, body], i) => (
                <li key={title} className="grid grid-cols-[1.5rem_1fr] gap-x-2">
                  <span className="data font-semibold">{i + 1}</span>
                  <span>
                    <span className="block font-semibold">{title}</span>
                    <span className="block text-ink-2">{body}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </div>
  );
}

function BoardSection({ title, listings, urgent = false }: { title: string; listings: BoardListing[]; urgent?: boolean }) {
  if (listings.length === 0) return null;
  return (
    <section className="board mb-6 overflow-hidden">
      <h2
        className={`border-b border-border px-5 py-3.5 text-[15px] font-semibold ${urgent ? "text-accent" : "text-ink-2"}`}
      >
        {title}
      </h2>
      <ul className="divide-y divide-border">
        {listings.map((l) => (
          <ListingRow key={l.id} listing={l} />
        ))}
      </ul>
    </section>
  );
}
