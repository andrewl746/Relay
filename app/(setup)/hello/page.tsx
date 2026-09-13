import Link from "next/link";
import { btnPrimary, btnSecondary, fieldClass } from "@/components/hub/ui";
import { getMe } from "@/lib/relay/me";
import { continueAs, startNew } from "@/lib/relay/ui-actions";
import { featuredPeople } from "@/lib/relay/views";

export const metadata = { title: "Who’s using Relay?" };

export default async function HelloPage({ searchParams }: PageProps<"/hello">) {
  const params = await searchParams;
  const me = await getMe();
  const people = featuredPeople();

  return (
    <div className="grid gap-12">
      <section>
        <h1 className="t-display text-[clamp(32px,6vw,50px)] leading-[1.03]">Borrow the thing you need once.</h1>
        <p className="mt-4 max-w-[58ch] text-[17px] text-ink-2">
          Someone near you already owns it and isn&apos;t using it. Say what you need and when. Relay works out who has it,
          what it costs, and who you pass it to next.
        </p>
        {me && (
          <p className="mt-6 flex flex-wrap items-center gap-4">
            <Link href={me.profile.setupDone ? "/" : "/start"} className={btnPrimary}>
              Continue as {me.profile.name.split(" ")[0]}
            </Link>
            <span className="text-[13px] text-ink-2">Or pick someone else below.</span>
          </p>
        )}
      </section>

      <section aria-labelledby="new-title" className="border-t border-rule-strong pt-6">
        <h2 id="new-title" className="t-title text-[20px]">
          New here
        </h2>
        <form action={startNew} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="name" className="t-eyebrow text-ink-2">
              Your name, as people nearby will see it
            </label>
            <input
              id="name"
              name="name"
              required
              minLength={2}
              maxLength={40}
              autoComplete="name"
              placeholder="Priya S."
              className={`${fieldClass} mt-2`}
            />
          </div>
          <button type="submit" className={me ? btnSecondary : btnPrimary}>
            Start
          </button>
        </form>
        {params.error === "name" && (
          <p role="alert" className="mt-2 text-[13px] font-semibold">
            Add at least two letters, so people know who to look for.
          </p>
        )}
      </section>

      <section aria-labelledby="demo-title" className="border-t border-rule-strong pt-6">
        <h2 id="demo-title" className="t-title text-[20px]">
          Or continue as someone already here
        </h2>
        <p className="mt-1 text-[13px] text-ink-2">
          Neighbours from the seeded network. Relay remembers what you do as them, the same as a real account.
        </p>
        <ul className="mt-4 border-t border-rule">
          {people.map(({ person, profile, lends, asks }) => (
            <li key={person.id} className="border-b border-rule">
              <form action={continueAs}>
                <input type="hidden" name="personId" value={person.id} />
                <button
                  type="submit"
                  className="flex min-h-14 w-full items-center justify-between gap-4 px-1 py-2 text-left transition-colors duration-[90ms] hover:bg-paper-raised"
                >
                  <span className="min-w-0">
                    <span className="block font-semibold">{profile?.name ?? person.label}</span>
                    <span className="block text-[13px] text-ink-2">
                      {profile?.neighbourhood ?? person.location} · lends <span className="data">{lends}</span> · asked for{" "}
                      <span className="data">{asks}</span>
                      {profile && profile.visits > 0 && ` · signed in ${profile.visits} ${profile.visits === 1 ? "time" : "times"}`}
                    </span>
                  </span>
                  <span className="shrink-0 text-[13px] font-semibold">Continue →</span>
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
