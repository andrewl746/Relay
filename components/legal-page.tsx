import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

/** Shared frame for Terms and Privacy. Plain, readable, one measure. */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-bg text-ink">
      <header className="border-b border-border px-5 py-4 sm:px-6">
        <Link href="/" aria-label="Relay home">
          <Image src="/relay-black.png" alt="Relay" width={160} height={58} className="h-7 w-auto" />
        </Link>
      </header>

      <main className="mx-auto w-full max-w-[680px] flex-1 px-5 py-14 sm:px-6">
        <h1 className="text-[34px] leading-tight font-semibold tracking-[-0.02em]">{title}</h1>
        <p className="mt-2 text-[14px] text-ink-2">Last updated {updated}</p>
        <div className="mt-10 space-y-9">{children}</div>

        <p className="mt-14 border-t border-border pt-6 text-[14px] text-ink-2">
          Plain English on purpose. If something here is unclear, that&rsquo;s a
          bug — tell us.
        </p>
      </main>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-[19px] font-semibold">{title}</h2>
      <div className="space-y-3 text-[16px] leading-relaxed text-ink-2">{children}</div>
    </section>
  );
}
