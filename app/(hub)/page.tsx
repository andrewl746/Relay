import Form from "next/form";
import Link from "next/link";
import { SearchIcon } from "@/components/hub/icons";
import { ListingRow } from "@/components/hub/listing-row";
import { btnSecondary, btnTertiary, EmptyState, Eyebrow, fieldClass } from "@/components/hub/ui";
import { getBoard, getMatches, getUniversity, getWants, type BoardListing } from "@/lib/hub/data";
import { boardViews, parseBoardView } from "@/lib/hub/feed";
import { formatShortDate, moveLine } from "@/lib/hub/format";
import { getCurrentUser } from "@/lib/hub/session";

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function BrowsePage({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const view = parseBoardView(one(params.view));
  const query = one(params.q)?.trim() || undefined;

  const user = await getCurrentUser();
  const [university, board, wants, matches] = await Promise.all([
    getUniversity(),
    getBoard({ view, query, userId: user.id }),
    getWants(user.id),
    getMatches(user.id),
  ]);
  const shown = board.finalCall.length + board.rest.length;

  const viewHref = (value: string) => {
    const search = new URLSearchParams();
    if (value !== "all") search.set("view", value);
    if (query) search.set("q", query);
    const qs = search.toString();
    return qs ? `/?${qs}` : "/";
  };

  return (
    <div className="mx-auto max-w-[1120px] px-4 pt-8 pb-16 sm:px-6">
      <div className="grid gap-x-12 gap-y-10 lg:grid-cols-[1fr_320px]">
        <section aria-labelledby="board-title" className="min-w-0">
          {board.lastDeadline && (
            <p className="t-eyebrow text-signal">Move-out week · last deadline {formatShortDate(board.lastDeadline)}</p>
          )}
          <h1 id="board-title" className="t-display mt-2 text-[clamp(34px,5.5vw,54px)] leading-[1.02]">
            Everything here is leaving
          </h1>
          <p className="mt-3 text-[17px] text-ink-2">
            {board.total} listings at {university.shortName}
            {board.goneTonight > 0 && ` · ${board.goneTonight} gone by tonight`}
          </p>

          <Form action="/" className="mt-6 flex gap-2">
            {view !== "all" && <input type="hidden" name="view" value={view} />}
            <label className="relative flex-1">
              <span className="sr-only">Search listings</span>
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-2" />
              <input
                key={query ?? ""}
                name="q"
                defaultValue={query}
                placeholder="What do you need? Try “lamp” or “BIOL 130”"
                className={`${fieldClass} min-h-11 pl-9`}
              />
            </label>
            <button type="submit" className={btnSecondary}>
              Search
            </button>
          </Form>

          <nav
            aria-label="Filter listings"
            className="-mx-4 mt-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0"
          >
            <ul className="flex gap-2">
              {boardViews.map((v) => {
                const active = v.value === view;
                return (
                  <li key={v.value}>
                    <Link
                      href={viewHref(v.value)}
                      scroll={false}
                      aria-current={active ? "true" : undefined}
                      className={`inline-flex min-h-11 items-center rounded-1 border px-3 text-[13px] font-semibold whitespace-nowrap transition-colors duration-[90ms] ${
                        active ? "border-ink bg-ink text-paper" : "border-rule hover:border-rule-strong hover:bg-paper-raised"
                      }`}
                    >
                      {v.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="mt-6">
            {shown === 0 ? (
              <EmptyState title={query ? `Nothing matches “${query}” right now.` : "Nothing here right now."}>
                <p>
                  Add it to your list and we’ll tell you the moment someone posts. Most things show up in the last
                  two weeks of term.
                </p>
                <Link
                  href={query ? `/wants?add=${encodeURIComponent(query)}` : "/wants"}
                  className={`${btnSecondary} mt-4`}
                >
                  {query ? `Add “${query}” to my list` : "Go to my list"}
                </Link>
              </EmptyState>
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

        <aside className="space-y-10 lg:pt-2">
          {user.moveStatus === "leaving" ? (
            <section>
              <Eyebrow>Moving out</Eyebrow>
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
            <section>
              <Eyebrow>Your list · {moveLine(user)}</Eyebrow>
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
                <Link href="/?view=matches" className={btnSecondary}>
                  Show my matches
                </Link>
                <Link href="/wants" className={`${btnTertiary} text-[13px]`}>
                  Edit list
                </Link>
              </div>
            </section>
          )}

          <section>
            <Eyebrow>How it works</Eyebrow>
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
    <section className="mb-8">
      <h2 className={`t-eyebrow border-b border-rule-strong pb-2 ${urgent ? "text-signal" : "text-ink-2"}`}>{title}</h2>
      <ul className="-mx-4 sm:mx-0">
        {listings.map((l) => (
          <ListingRow key={l.id} listing={l} />
        ))}
      </ul>
    </section>
  );
}
