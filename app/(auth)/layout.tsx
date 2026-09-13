import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/hub/logo";
import { SITE_NAME } from "@/lib/hub/site";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col font-sans text-ink">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-[var(--page-max)] items-center px-5 py-4 sm:px-6">
          <Link href="/welcome" className="group flex items-center" aria-label={`${SITE_NAME} home`}>
            <Logo className="h-8 bg-ink transition-colors duration-200 ease-out group-hover:bg-accent" />
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-start justify-center px-5 py-12 sm:px-6 sm:py-20">
        <div className="w-full max-w-[420px]">{children}</div>
      </main>

      <footer className="border-t border-border px-5 py-6 text-center text-[13px] text-ink-2">
        {SITE_NAME} is a student-to-student handoff board. We never handle money —{" "}
        <Link href="/terms" className="underline underline-offset-[3px] hover:text-ink">
          terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline underline-offset-[3px] hover:text-ink">
          privacy
        </Link>
        .
      </footer>
    </div>
  );
}
