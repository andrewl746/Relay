import type { ReactNode } from "react";
import { btnPrimary, btnSecondary, btnTertiary, Notice, PageShell, PageTitle } from "@/components/hub/ui";
import { ProfileFields } from "@/components/relay/profile-fields";
import { dayLabel, rangeLabel } from "@/lib/relay/dates";
import { requireMe } from "@/lib/relay/me";
import { snapshot } from "@/lib/relay/store";
import { forgetMemory, restore, saveProfile, signOut } from "@/lib/relay/ui-actions";

export const metadata = { title: "You" };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function YouPage({ searchParams }: PageProps<"/you">) {
  const me = await requireMe();
  const params = await searchParams;
  const snap = snapshot();
  const hidden = me.profile.dismissed.flatMap((id) => {
    const item = snap.itemById(id);
    return item ? [item] : [];
  });
  const { visits, searches, confirmed, createdAt } = me.profile;

  return (
    <PageShell>
      <PageTitle title="You" lede="What Relay knows about you and what it does with it. Change or clear any of it here." />

      {one(params.saved) && (
        <Notice>
          <span className="font-semibold">Saved.</span> Your next search routes on this.
        </Notice>
      )}

      <div className="grid gap-x-14 gap-y-14 lg:grid-cols-2">
        <section aria-labelledby="profile-title">
          <h2 id="profile-title" className="t-title text-[20px]">
            Where and when you can meet
          </h2>
          <form action={saveProfile} className="mt-6 grid gap-9">
            <ProfileFields profile={me.profile} error={one(params.error)} />
            <div>
              <button type="submit" className={btnPrimary}>
                Save
              </button>
            </div>
          </form>
        </section>

        <section id="memory" aria-labelledby="memory-title">
          <h2 id="memory-title" className="t-title text-[20px]">
            What Relay remembers
          </h2>
          <p className="mt-2 max-w-[58ch] text-[13px] text-ink-2">
            Kept on the Relay server in <span className="data">data/runtime.json</span>, not in your browser. It&apos;s used for
            three things: pre-filling what you ask for, hiding things you passed on, and routing you by where and when you can
            meet. You&apos;ve signed in <span className="data">{visits}</span> {visits === 1 ? "time" : "times"} since{" "}
            <span className="data">{dayLabel(createdAt.slice(0, 10))}</span>.
          </p>

          <Memory title="Recent asks" count={searches.length} what="searches" empty="Nothing yet.">
            <ul>
              {searches.map((s) => (
                <li key={s.at} className="flex flex-wrap items-baseline justify-between gap-x-4 border-b border-rule py-2">
                  <span className="min-w-0 truncate text-[14px]">{s.text}</span>
                  <span className="data text-[12px] text-ink-2">{rangeLabel(s.from, s.to)}</span>
                </li>
              ))}
            </ul>
          </Memory>

          <Memory
            title="Hidden from your answers"
            count={hidden.length}
            what="dismissed"
            forgetLabel="Show them all again"
            empty="Nothing hidden. “Not this one” on an answer hides it here."
          >
            <ul>
              {hidden.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-4 border-b border-rule">
                  <span className="t-item min-w-0 truncate text-[14px]">{item.rawText}</span>
                  <form action={restore}>
                    <input type="hidden" name="itemId" value={item.id} />
                    <button type="submit" className={`${btnTertiary} text-[13px]`}>
                      Restore
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </Memory>

          <Memory title="Handoffs marked done" count={confirmed.length} what="confirmed" empty="None yet.">
            <p className="text-[14px] text-ink-2">
              Kept out of your handoff list. Forgetting them puts those slips back.
            </p>
          </Memory>

          <form action={signOut} className="mt-12 border-t border-rule-strong pt-6">
            <button type="submit" className={btnSecondary}>
              Sign out
            </button>
            <p className="mt-2 text-[13px] text-ink-2">Everything above stays here for the next time you sign in.</p>
          </form>
        </section>
      </div>
    </PageShell>
  );
}

function Memory({
  title,
  count,
  what,
  forgetLabel = "Forget these",
  empty,
  children,
}: {
  title: string;
  count: number;
  what: "searches" | "dismissed" | "confirmed";
  forgetLabel?: string;
  empty: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-8">
      <div className="flex items-center justify-between gap-4 border-b border-rule-strong">
        <h3 className="t-eyebrow py-2 text-ink-2">
          {title} <span className="data">{count}</span>
        </h3>
        {count > 0 && (
          <form action={forgetMemory}>
            <input type="hidden" name="what" value={what} />
            <button type="submit" className={`${btnTertiary} text-[13px]`}>
              {forgetLabel}
            </button>
          </form>
        )}
      </div>
      <div className="mt-1">{count > 0 ? children : <p className="py-2 text-[13px] text-ink-2">{empty}</p>}</div>
    </div>
  );
}
