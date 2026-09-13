import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/hub/site-header";
import { getProfile } from "@/lib/onboarding/profile";
import { SITE_NAME } from "@/lib/hub/site";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseUser } from "@/lib/supabase/session";
import "./hub.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
});

const plex = IBM_Plex_Mono({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: "Hand your furniture and school stuff to the student arriving as you leave.",
};

export default async function HubLayout({ children }: { children: ReactNode }) {
  const supabaseUser = await getSupabaseUser();
  if (supabaseUser) {
    const supabase = await createClient();
    const profile = await getProfile(supabase, supabaseUser.id);
    if (!profile?.onboarding_completed) redirect("/onboarding/profile");
  }

  return (
    <div className={`${archivo.variable} ${plex.variable} hub flex min-h-full flex-1 flex-col font-sans`}>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-rule">
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-baseline justify-between gap-x-6 gap-y-2 px-4 py-6 text-[13px] text-ink-2 sm:px-6">
          <p>{SITE_NAME} never handles money. Pay when you pick something up, never before you’ve seen it.</p>
          <Link href="/chains" className="underline underline-offset-[3px] hover:text-ink">
            Handoff chain engine
          </Link>
        </div>
      </footer>
    </div>
  );
}
