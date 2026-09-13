import type { SetupStep } from "@/lib/onboarding/profile";
import type { Mood } from "./guide-bot";

export type OnboardingStep = SetupStep;
export type GuideTip = { mood: Mood; text: string };

/**
 * What Parcel says in the corner on each setup step, in order.
 *
 * A guide that says something untrue is worse than none, so every claim here is
 * backed by the step's code. If one of these changes, change the tip with it:
 * - campus address: profile-form.tsx submits the university's campus address as hidden fields
 * - pickup spot: lib/hub/actions.ts posts with `pickupArea: user.home`
 * - change it later: settings-form.tsx and lib/hub/settings-actions.ts edit living situation and address
 * - 10 minutes, "Resend code": CODE_TTL_MINUTES in lib/onboarding/otp.ts, verify-email-form.tsx
 * - quick-add suggestions: lib/onboarding/interests.ts seeds the wishlist step's chips
 * - "Your Active Needs": app/(hub)/account/page.tsx
 * - post and claim after verifying: tradeBlocker in lib/onboarding/profile.ts gates
 *   app/(hub)/post, app/(hub)/listings/[id]/claim and their actions on steps 1–2 only
 * The wishlist step's "we'll match them as people post" (onboarding-corner.tsx) is
 * getMatches in lib/hub/data.ts, which runs every open want through hybrid search.
 */
const TIPS: Record<OnboardingStep, GuideTip[]> = {
  1: [
    { mood: "hi", text: "Hi, I’m Parcel. Four quick steps and you’re set up. Relay stays open behind me the whole time." },
    {
      mood: "pointing",
      text: "Living on campus? Pick your university, choose On campus, and Relay fills in the campus address for you.",
    },
    { mood: "thinking", text: "Your address becomes the pickup spot on things you post. You can change it later in Settings." },
  ],
  2: [
    { mood: "pointing", text: "Use your university email. It’s how Relay knows everyone here is a student." },
    { mood: "thinking", text: "The code lasts 10 minutes. Nothing in your inbox? Check spam, then press Resend code." },
    { mood: "cheer", text: "Once you’re verified you can post and claim. Interests and Wishlist can wait." },
  ],
  3: [
    { mood: "hi", text: "Tap every kind of thing you might borrow or buy." },
    { mood: "pointing", text: "Each pick becomes a quick-add suggestion on the next step, so there’s less to type." },
  ],
  4: [
    { mood: "thinking", text: "This step is optional. Add things you need, or press Skip for now." },
    {
      mood: "pointing",
      text: "Leave the price as “any”, or set a limit. What you add shows under Your Active Needs on your account page.",
    },
    { mood: "cheer", text: "That’s everything. Press Finish (or Skip for now) and I’ll get out of your way." },
  ],
};

/** After changing university in Settings, only the email step comes back. */
const REVERIFY: GuideTip[] = [
  { mood: "pointing", text: "You changed university, so verify your email there too. Everything else is already set." },
  TIPS[2][1],
];

export function tipsFor(step: OnboardingStep, reverify: boolean): GuideTip[] {
  return step === 2 && reverify ? REVERIFY : TIPS[step];
}
