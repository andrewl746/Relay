import type { ReactNode } from "react";
import { backToInterests } from "@/app/(onboarding)/actions";
import { pendingStep, type ProfileRow } from "@/lib/onboarding/profile";
import { getUniversity } from "@/lib/onboarding/universities";
import { InterestsForm } from "./interests-form";
import { ParcelCorner } from "./parcel-corner";
import { ProfileForm } from "./profile-form";
import { VerifyEmailForm } from "./verify-email-form";
import { WantsStepForm } from "./wants-step-form";

/**
 * Account setup, in Parcel's corner of whatever page you're on instead of pages
 * of its own. Each form saves and revalidates the layout, which re-renders this
 * with the next step.
 */
export function OnboardingCorner({ profile, fallbackName }: { profile: ProfileRow | null; fallbackName: string | null }) {
  const step = pendingStep(profile);
  if (!step) return null;

  const reverify = Boolean(profile?.onboarding_completed);
  const university = profile?.university_id ? getUniversity(profile.university_id) : null;

  let title: string;
  let description: string;
  let form: ReactNode;

  switch (step) {
    case 1:
      title = "Tell us about yourself";
      description = "This stays on your profile and helps match you with people nearby.";
      form = (
        <ProfileForm
          defaults={{
            fullName: profile?.full_name ?? fallbackName,
            universityId: profile?.university_id ?? null,
            livingSituation: profile?.living_situation ?? null,
            street: profile?.street ?? null,
            city: profile?.city ?? null,
            province: profile?.province ?? null,
            country: profile?.country ?? null,
            postalCode: profile?.postal_code ?? null,
          }}
        />
      );
      break;
    case 2:
      title = reverify ? "Verify your new university email" : "Verify your university email";
      description = `We'll send a code to confirm you're a student at ${university?.name}.`;
      form = <VerifyEmailForm defaultEmail={profile?.university_email ?? ""} domain={university?.emailDomain ?? ""} />;
      break;
    case 3:
      title = "What are you looking for?";
      description = "Pick as many as you like. You can change these later.";
      form = <InterestsForm defaultInterests={profile?.interests ?? []} />;
      break;
    case 4:
      title = "Anything you need?";
      description =
        "Add things you're looking for and we'll match them as people post. Totally optional — skip it and add things later.";
      form = <WantsStepForm interests={profile?.interests ?? []} />;
      break;
  }

  return (
    <ParcelCorner
      key={step}
      step={step}
      reverify={reverify}
      title={title}
      description={description}
      backToInterests={step === 4 ? backToInterests : undefined}
    >
      {form}
    </ParcelCorner>
  );
}
