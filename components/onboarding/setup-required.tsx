import { PageShell, PageTitle } from "@/components/hub/ui";
import { GuideBot } from "./guide-bot";
import { OpenParcelCorner } from "./parcel-corner";

const WHY = {
  post: "What you post uses your address as the pickup spot, and everyone trading on Relay has a verified university email.",
  claim: "Everyone trading on Relay has a verified university email, so the person you’re picking up from knows you’re a student.",
};

/**
 * What Post and Claim show an account that hasn't finished steps 1–2 of setup
 * (tradeBlocker in lib/onboarding/profile.ts). The page doesn't host the form:
 * the button unfolds Parcel's corner, where setup already lives.
 */
export function SetupRequired({ step, action, title }: { step: 1 | 2; action: "post" | "claim"; title: string }) {
  return (
    <PageShell>
      <PageTitle title={title} />
      <section className="board flex max-w-[620px] items-start gap-4 p-5 sm:p-6">
        <GuideBot mood="pointing" size={72} className="shrink-0" />
        <div className="min-w-0">
          <p className="text-[17px] font-semibold">
            {step === 1 ? "Finish your profile first" : "Verify your university email first"}
          </p>
          <p className="mt-1 text-[15px] text-ink-2">
            {WHY[action]} {step === 1 ? "Two quick steps" : "One quick step"} in Parcel’s corner, and you can {action}.
          </p>
          <div className="mt-4">
            <OpenParcelCorner>{step === 1 ? "Finish setting up" : "Verify my email"}</OpenParcelCorner>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
