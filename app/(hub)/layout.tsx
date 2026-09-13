import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/hub/site-footer";
import { SiteHeader } from "@/components/hub/site-header";
import { getProfile } from "@/lib/onboarding/profile";
import { SITE_NAME } from "@/lib/hub/site";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseUser } from "@/lib/supabase/session";
import "./hub.css";

// Self-hosted rather than next/font/google. Google Fonts is fetched at build
// time, and it timed out here and 500'd every route. More to the point, a demo
// that reaches out to fonts.gstatic.com is a demo that dies on venue wifi.
// Latin subset only, 133KB total.
const archivo = localFont({
  src: "../fonts/archivo-var.woff2",
  variable: "--font-archivo",
  weight: "100 900",
  display: "swap",
  // The wdth axis is the hierarchy channel — see docs/DESIGN.md §4.
  declarations: [{ prop: "font-stretch", value: "62% 125%" }],
});

const plex = localFont({
  variable: "--font-plex",
  display: "swap",
  src: [
    { path: "../fonts/plex-mono-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/plex-mono-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/plex-mono-600.woff2", weight: "600", style: "normal" },
  ],
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
      <SiteFooter />
    </div>
  );
}
