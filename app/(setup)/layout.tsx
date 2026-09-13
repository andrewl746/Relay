import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export default function SetupLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <main className="mx-auto w-full max-w-[720px] flex-1 px-4 pt-10 pb-16 sm:px-6 sm:pt-14">
        {/* Stacked lockup: signing in is where the city matters (docs/BRAND.md).
            Much below 300px wide the "WATERLOO ON" line stops being readable. */}
        <Link href="/hello" className="mb-10 block w-fit">
          <Image
            src="/brand/relay-stamp-stacked.png"
            alt="Relay, Waterloo ON"
            width={836}
            height={268}
            unoptimized
            className="h-auto w-[300px] max-w-full -rotate-[1.5deg]"
          />
        </Link>
        {children}
      </main>
      <footer className="border-t border-rule">
        <p className="mx-auto max-w-[720px] px-4 py-6 text-[13px] text-ink-2 sm:px-6">
          Relay never handles money. You pay the owner directly, when you collect.
        </p>
      </footer>
    </div>
  );
}
