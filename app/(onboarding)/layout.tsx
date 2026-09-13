import type { ReactNode } from "react";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/onboarding/profile";
import { SITE_NAME } from "@/lib/hub/site";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseUser } from "@/lib/supabase/session";
import "../(auth)/github-ui.css";

export default async function OnboardingLayout({ children }: { children: ReactNode }) {
  const user = await getSupabaseUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const profile = await getProfile(supabase, user.id);
  if (profile?.onboarding_completed) redirect("/");

  return (
    <div className="gh flex min-h-full flex-1 flex-col">
      <header className="border-b border-gh-border-muted px-4 py-4">
        <Image src="/relay-black.png" alt={SITE_NAME} width={160} height={58} priority className="h-7 w-auto" />
      </header>
      <main className="flex flex-1 items-start justify-center px-4 py-10 sm:py-16">
        {/* Step 3 is a grid of tiles, so the shell has to be able to get wide.
            Each step sets its own width via OnboardingShell. */}
        <div className="w-full max-w-[960px]">{children}</div>
      </main>
    </div>
  );
}
