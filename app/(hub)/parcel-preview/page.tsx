// Local preview of Parcel's corner, which otherwise only shows for a signed-in
// Supabase account mid-setup: http://localhost:4287/parcel-preview. 404s outside
// `npm run dev`, so it never ships.
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell, PageTitle } from "@/components/hub/ui";
import { OnboardingCorner } from "@/components/onboarding/onboarding-corner";
import { SetupRequired } from "@/components/onboarding/setup-required";
import type { ProfileRow } from "@/lib/onboarding/profile";

const EMPTY: ProfileRow = {
  id: "preview",
  full_name: null,
  university_id: null,
  living_situation: null,
  street: null,
  city: null,
  province: null,
  country: null,
  postal_code: null,
  university_email: null,
  university_email_verified: false,
  interests: [],
  onboarding_step: "profile",
  onboarding_completed: false,
};

const FILLED: ProfileRow = {
  ...EMPTY,
  full_name: "Jordan Kim",
  university_id: "uw",
  living_situation: "on_campus",
  street: "200 University Ave W",
  city: "Waterloo",
  province: "ON",
  country: "Canada",
  postal_code: "N2L 3G1",
  onboarding_step: "verify",
};

const STATES: Record<string, { label: string; profile: ProfileRow }> = {
  "1": { label: "Step 1 · Your info", profile: EMPTY },
  "2": { label: "Step 2 · Verify email", profile: FILLED },
  "3": { label: "Step 3 · Interests", profile: { ...FILLED, university_email_verified: true, onboarding_step: "interests" } },
  "4": {
    label: "Step 4 · Wishlist",
    profile: { ...FILLED, university_email_verified: true, onboarding_step: "wants", interests: ["furniture", "kitchen-supplies"] },
  },
  reverify: { label: "Changed university", profile: { ...FILLED, onboarding_step: "complete", onboarding_completed: true } },
};

export default async function ParcelPreview({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (process.env.NODE_ENV !== "development") notFound();
  const { step = "1", gate } = await searchParams;
  const state = STATES[step] ?? STATES["1"];

  return (
    <>
      {gate === "post" ? (
        <SetupRequired step={step === "2" ? 2 : 1} action="post" title="Post an item" />
      ) : (
        <PageShell>
          <PageTitle
            title="Parcel preview"
            lede="What a signed-in account sees while setup is unfinished. The forms won't save here: saving needs a real Supabase sign-in."
          />
          <div className="flex flex-wrap gap-2">
            {Object.entries(STATES).map(([key, s]) => (
              <Link
                key={key}
                href={`/parcel-preview?step=${key}`}
                className={`rounded-sm border px-3 py-2 text-[14px] font-semibold ${
                  key === step ? "border-accent bg-accent text-on-accent" : "border-border-strong bg-surface text-ink"
                }`}
              >
                {s.label}
              </Link>
            ))}
            <Link
              href="/parcel-preview?step=1&gate=post"
              className="rounded-sm border border-border-strong bg-surface px-3 py-2 text-[14px] font-semibold text-ink"
            >
              Post page, not set up
            </Link>
          </div>
        </PageShell>
      )}
      {/* key: switching state remounts the corner open, like a fresh page load */}
      <OnboardingCorner key={step} profile={state.profile} fallbackName="Jordan Kim" />
    </>
  );
}
