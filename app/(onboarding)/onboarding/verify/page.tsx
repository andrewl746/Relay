import { redirect } from "next/navigation";
import { OnboardingShell } from "@/components/onboarding/shell";
import { VerifyEmailForm } from "@/components/onboarding/verify-email-form";
import { getProfile, hasCompletedProfileStep } from "@/lib/onboarding/profile";
import { getUniversity } from "@/lib/onboarding/universities";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseUser } from "@/lib/supabase/session";

export const metadata = { title: "Verify your university email" };

export default async function OnboardingVerifyPage() {
  const user = await getSupabaseUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const profile = await getProfile(supabase, user.id);
  if (!hasCompletedProfileStep(profile)) redirect("/onboarding/profile");
  if (profile?.university_email_verified) redirect("/onboarding/interests");

  const university = getUniversity(profile!.university_id!)!;

  return (
    <OnboardingShell
      step={2}
      title="Verify your university email"
      description={`We'll send a code to confirm you're a student at ${university.name}.`}
    >
      <VerifyEmailForm defaultEmail={profile?.university_email ?? ""} domain={university.emailDomain} />
    </OnboardingShell>
  );
}
