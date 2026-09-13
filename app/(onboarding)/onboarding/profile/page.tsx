import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/onboarding/profile-form";
import { OnboardingShell } from "@/components/onboarding/shell";
import { getProfile } from "@/lib/onboarding/profile";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseUser } from "@/lib/supabase/session";

export const metadata = { title: "Tell us about yourself" };

export default async function OnboardingProfilePage() {
  const user = await getSupabaseUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const profile = await getProfile(supabase, user.id);

  return (
    <OnboardingShell step={1} title="Tell us about yourself" description="This stays on your profile and helps match you with people nearby.">
      <ProfileForm
        defaults={{
          fullName: profile?.full_name ?? user?.user_metadata?.full_name ?? null,
          universityId: profile?.university_id ?? null,
          livingSituation: profile?.living_situation ?? null,
          street: profile?.street ?? null,
          city: profile?.city ?? null,
          province: profile?.province ?? null,
          country: profile?.country ?? null,
          postalCode: profile?.postal_code ?? null,
        }}
      />
    </OnboardingShell>
  );
}
