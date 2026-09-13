import Link from "next/link";
import type { ReactNode } from "react";
import { SITE_NAME } from "@/lib/hub/site";
import { Logo } from "./logo";

/**
 * The header for pages outside the hub — landing, sign-in, legal, onboarding.
 * The same sticky translucent bar as SiteHeader, minus the account controls.
 * One component because four hand-copied headers had drifted to different
 * heights. The row height is SiteHeader's, which its nav links set: 17px text
 * at the hub's 1.55 line height plus py-4. Change one, change the other.
 */
export function PlainHeader({ href = "/welcome", children }: { href?: string; children?: ReactNode }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/60 backdrop-blur-[14px] backdrop-saturate-150">
      <div className="mx-auto flex min-h-[calc(17px*1.55_+_2rem)] max-w-[1120px] items-center gap-3 px-4 sm:px-6">
        <Link href={href} aria-label={`${SITE_NAME} home`} className="group flex items-center self-stretch">
          <Logo className="h-8 bg-ink transition-colors duration-200 ease-out group-hover:bg-accent" />
        </Link>
        {children && <div className="ml-auto flex items-center gap-2 sm:gap-4">{children}</div>}
      </div>
    </header>
  );
}
