import type { SupabaseClient } from "@supabase/supabase-js";
import { getUniversity } from "./universities";

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

/** Setup's four steps as Parcel's corner numbers them: Your info, Verify email, Interests, Wishlist. */
export type SetupStep = 1 | 2 | 3 | 4;

/**
 * The step a signed-in account still has to do, or null when setup is done.
 *
 * Same order the old /onboarding pages enforced. A finished account only comes
 * back to verify again after switching university in Settings.
 */
export function pendingStep(profile: ProfileRow | null): SetupStep | null {
  if (profile?.onboarding_completed) {
    return !profile.university_email_verified && getUniversity(profile.university_id ?? "") ? 2 : null;
  }
  if (!profile || !hasCompletedProfileStep(profile) || !getUniversity(profile.university_id ?? "")) return 1;
  if (!profile.university_email_verified) return 2;
  return profile.onboarding_step === "wants" ? 4 : 3;
}

/**
 * The step that stops this account posting or claiming, or null. Only the first
 * two block: a listing's pickup spot is the profile address, and everyone trading
 * has a verified university email. Interests and the wishlist can wait.
 */
export function tradeBlocker(profile: ProfileRow | null): 1 | 2 | null {
  const step = pendingStep(profile);
  return step === 1 || step === 2 ? step : null;
}
