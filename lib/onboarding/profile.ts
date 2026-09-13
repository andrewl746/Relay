import type { SupabaseClient } from "@supabase/supabase-js";

export type OnboardingStep = "profile" | "verify" | "interests" | "wants" | "complete";
export type LivingSituation = "on_campus" | "off_campus";

export type ProfileRow = {
  id: string;
  full_name: string | null;
  university_id: string | null;
  living_situation: LivingSituation | null;
  street: string | null;
  city: string | null;
  province: string | null;
  country: string | null;
  postal_code: string | null;
  university_email: string | null;
  university_email_verified: boolean;
  interests: string[];
  onboarding_step: OnboardingStep;
  onboarding_completed: boolean;
};

export async function getProfile(supabase: SupabaseClient, userId: string): Promise<ProfileRow | null> {
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  return data as ProfileRow | null;
}

export function hasCompletedProfileStep(profile: ProfileRow | null): boolean {
  return Boolean(
    profile?.full_name &&
      profile.university_id &&
      profile.living_situation &&
      profile.street &&
      profile.city &&
      profile.province &&
      profile.country &&
      profile.postal_code,
  );
}
