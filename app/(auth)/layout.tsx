import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { SITE_NAME } from "@/lib/hub/site";
import "./github-ui.css";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="gh flex min-h-full flex-1 flex-col">
      <main className="flex flex-1 items-start justify-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-[368px]">
          {/* Stacked lockup: sign-in is where the city matters (docs/BRAND.md).
              Much below 300px wide the "WATERLOO ON" line stops being readable. */}
          <Link href="/" className="mx-auto mb-8 block w-fit">
            <Image
              src="/brand/relay-stamp-stacked.png"
              alt={`${SITE_NAME}, Waterloo ON`}
              width={836}
              height={268}
              unoptimized
              className="h-auto w-[300px] -rotate-[1.5deg]"
            />
          </Link>
          {children}
        </div>
      </main>
      <footer className="border-t border-gh-border-muted px-4 py-6 text-center text-[12px] text-gh-fg-muted">
        {SITE_NAME} is a student-to-student handoff board. We never handle money.
      </footer>
    </div>
  );
}
