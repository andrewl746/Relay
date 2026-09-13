import Link from "next/link";
import type { ReactNode } from "react";
import { SITE_NAME } from "@/lib/hub/site";
import "./github-ui.css";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="gh flex min-h-full flex-1 flex-col">
      <header className="border-b border-gh-border-muted px-4 py-4">
        <Link href="/" className="text-[15px] font-semibold text-gh-fg">
          {SITE_NAME}
        </Link>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-[368px]">{children}</div>
      </main>
      <footer className="border-t border-gh-border-muted px-4 py-6 text-center text-[12px] text-gh-fg-muted">
        {SITE_NAME} is a student-to-student handoff board. We never handle money.
      </footer>
    </div>
  );
}
