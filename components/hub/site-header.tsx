import Image from "next/image";
import Link from "next/link";
import { NavLinks } from "./nav-links";

export function SiteHeader({ name, due }: { name: string; due: number }) {
  return (
    <header className="border-b border-rule-strong">
      <div className="mx-auto flex max-w-[1120px] flex-wrap items-center gap-x-6 px-4 sm:px-6 lg:flex-nowrap">
        <Link href="/" className="flex min-h-14 items-center">
          {/* The everyday lockup (docs/BRAND.md). The file is drawn straight; .stamp adds the −1.5° press. */}
          <Image
            src="/brand/relay-stamp-single-rule.png"
            alt="Relay"
            width={748}
            height={184}
            unoptimized
            className="stamp h-7 w-auto"
          />
        </Link>

        <Link
          href="/you"
          className="ml-auto flex min-h-11 items-center gap-2 rounded-1 px-2 text-[13px] font-semibold hover:bg-paper-raised lg:order-last"
        >
          <span className="text-ink-2">You</span>
          <span className="max-w-[10rem] truncate">{name}</span>
        </Link>

        <NavLinks due={due} />
      </div>
    </header>
  );
}
