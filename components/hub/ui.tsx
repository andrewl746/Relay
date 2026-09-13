import Link from "next/link";
import type { ReactNode } from "react";
import { BackIcon } from "./icons";

/** One per screen. */
export const btnPrimary =
  "inline-flex min-h-11 items-center justify-center rounded-1 bg-ink px-5 text-[15px] font-semibold text-paper transition-colors duration-[90ms] hover:bg-ink/85 disabled:cursor-not-allowed disabled:bg-ink-3";

export const btnSecondary =
  "inline-flex min-h-11 items-center justify-center rounded-1 border border-rule-strong px-5 text-[15px] font-semibold text-ink transition-colors duration-[90ms] hover:bg-paper-raised";

export const btnTertiary =
  "inline-flex min-h-11 items-center font-semibold underline underline-offset-[3px] hover:text-ink-2";

export const fieldClass =
  "block w-full rounded-t-1 border-0 border-b border-rule bg-paper-sunk px-3 py-2.5 text-[15px] text-ink placeholder:text-ink-3 focus-visible:shadow-[inset_0_-2px_0_var(--ink)]";

/** For a label wrapping a `peer sr-only` radio or checkbox. */
export const chipClass =
  "inline-flex min-h-11 cursor-pointer items-center rounded-1 border border-rule px-4 text-[13px] font-semibold transition-colors duration-[90ms] hover:border-rule-strong peer-checked:border-ink peer-checked:bg-ink peer-checked:text-paper peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink";

export function PageShell({ children, width = "wide" }: { children: ReactNode; width?: "wide" | "narrow" }) {
  return (
    <div className={`mx-auto px-4 pt-8 pb-16 sm:px-6 ${width === "wide" ? "max-w-[1120px]" : "max-w-[760px]"}`}>
      {children}
    </div>
  );
}

export function PageTitle({ title, lede }: { title: string; lede?: ReactNode }) {
  return (
    <div className="mb-8">
      <h1 className="t-title text-[28px] leading-[1.15]">{title}</h1>
      {lede && <p className="mt-2 max-w-[68ch] text-ink-2">{lede}</p>}
    </div>
  );
}

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="mb-6 inline-flex min-h-11 items-center gap-1 text-[13px] font-semibold text-ink-2 hover:text-ink">
      <BackIcon className="size-4" />
      {children}
    </Link>
  );
}

export function Eyebrow({ children, strong = false }: { children: ReactNode; strong?: boolean }) {
  return <p className={`t-eyebrow ${strong ? "text-ink" : "text-ink-2"}`}>{children}</p>;
}

/** A calm, permanent status line: what just happened, in words. */
export function Notice({ children }: { children: ReactNode }) {
  return (
    <p role="status" className="enter mb-8 border border-ink bg-paper-raised px-5 py-4 text-[15px]">
      {children}
    </p>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="py-8">
      <p className="text-[17px] font-semibold">{title}</p>
      {children && <div className="mt-2 max-w-[52ch] text-ink-2">{children}</div>}
    </div>
  );
}
