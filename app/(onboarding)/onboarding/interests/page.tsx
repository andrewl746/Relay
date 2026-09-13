import { redirect } from "next/navigation";
import { InterestsForm } from "@/components/onboarding/interests-form";
import { OnboardingShell } from "@/components/onboarding/shell";
import { getProfile } from "@/lib/onboarding/profile";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseUser } from "@/lib/supabase/session";

export const metadata = { title: "What are you looking for?" };

export default async function OnboardingInterestsPage() {
  const user = await getSupabaseUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const profile = await getProfile(supabase, user.id);
  if (!profile?.university_email_verified) redirect("/onboarding/verify");

  return (
    <OnboardingShell step={3} title="What are you looking for?" description="Pick as many as you like. You can change these later.">
      <InterestsForm defaultInterests={profile.interests ?? []} />
    </OnboardingShell>
  );
}
