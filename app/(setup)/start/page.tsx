import { btnPrimary } from "@/components/hub/ui";
import { ProfileFields } from "@/components/relay/profile-fields";
import { requireMe } from "@/lib/relay/me";
import { saveSetup } from "@/lib/relay/ui-actions";

export const metadata = { title: "Set up" };

export default async function StartPage({ searchParams }: PageProps<"/start">) {
  const me = await requireMe({ allowUnfinished: true });
  const error = (await searchParams).error;

  return (
    <div>
      <p className="t-eyebrow text-ink-2">Hi {me.profile.name.split(" ")[0]}</p>
      <h1 className="t-display mt-2 text-[clamp(32px,6vw,46px)] leading-[1.05]">Three answers, then you&apos;re in.</h1>
      <p className="mt-3 max-w-[58ch] text-[17px] text-ink-2">
        Relay only routes you to people you can actually meet: nearby, on days you&apos;re both around, at a time of day you
        both keep free. It remembers these, so you only answer once.
      </p>

      <form action={saveSetup} className="mt-10 grid gap-10">
        <ProfileFields profile={me.profile} error={Array.isArray(error) ? error[0] : error} />
        <div>
          <button type="submit" className={btnPrimary}>
            Save and find something
          </button>
        </div>
      </form>
    </div>
  );
}
