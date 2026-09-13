import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Logo } from "@/components/hub/logo";
import { getProfile } from "@/lib/onboarding/profile";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseUser } from "@/lib/supabase/session";
import "../(auth)/github-ui.css";

export default async function OnboardingLayout({ children }: { children: ReactNode }) {
  const user = await getSupabaseUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const profile = await getProfile(supabase, user.id);
  // Finished accounts only come back here to re-verify after changing university.
  if (profile?.onboarding_completed && profile.university_email_verified) redirect("/");

  return (
    <div className="gh flex min-h-full flex-1 flex-col">
      <header className="border-b border-gh-border-muted px-4 py-4">
        {/* .gh is a light-only theme, so the mark stays dark ink even in dark mode. */}
        <Logo className="h-7 bg-gh-fg" />
      </header>
      <main className="flex flex-1 items-start justify-center px-4 py-10 sm:py-16">
        {/* Step 3 is a grid of tiles, so the shell has to be able to get wide.
            Each step sets its own width via OnboardingShell. */}
        <div className="w-full max-w-[960px]">{children}</div>
      </main>
    </div>
  );
}
