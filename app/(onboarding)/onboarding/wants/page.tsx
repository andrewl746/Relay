import { redirect } from "next/navigation";
import { OnboardingShell } from "@/components/onboarding/shell";
import { WantsStepForm } from "@/components/onboarding/wants-step-form";
import { getProfile } from "@/lib/onboarding/profile";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseUser } from "@/lib/supabase/session";

export const metadata = { title: "Anything you need?" };

export default async function OnboardingWantsPage() {
  const user = await getSupabaseUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const profile = await getProfile(supabase, user.id);
  if (!profile?.university_email_verified) redirect("/onboarding/verify");

  return (
    <OnboardingShell
      step={4}
      title="Anything you need?"
      description="Add things you're looking for and we'll match them as people post. Totally optional — skip it and add things later."
      backHref="/onboarding/interests"
      backLabel="Back to interests"
    >
      <WantsStepForm interests={profile.interests ?? []} />
    </OnboardingShell>
  );
}
