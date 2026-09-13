import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Logo } from "@/components/hub/logo";
import { getProfile } from "@/lib/onboarding/profile";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseUser } from "@/lib/supabase/session";

export default async function OnboardingLayout({ children }: { children: ReactNode }) {
  const user = await getSupabaseUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const profile = await getProfile(supabase, user.id);
  // Finished accounts only come back here to re-verify after changing university.
  if (profile?.onboarding_completed && profile.university_email_verified) redirect("/");

  return (
    <div className="flex min-h-full flex-1 flex-col font-sans text-ink">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-[var(--page-max)] items-center px-5 py-4 sm:px-6">
          <Logo className="h-8 bg-ink" />
        </div>
      </header>
      <main className="flex flex-1 items-start justify-center px-5 py-12 sm:px-6 sm:py-20">
        {/* Step 3 is a grid of tiles, so the shell has to be able to get wide.
            Each step sets its own width via OnboardingShell. */}
        <div className="w-full max-w-[960px]">{children}</div>
      </main>
    </div>
  );
}
