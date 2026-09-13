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
        <Image
          src="/brand/relay-stamp-single-rule.png"
          alt={SITE_NAME}
          width={748}
          height={184}
          unoptimized
          className="h-7 w-auto -rotate-[1.5deg]"
        />
      </header>
      <main className="flex flex-1 items-start justify-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-[480px]">{children}</div>
      </main>
    </div>
  );
}
