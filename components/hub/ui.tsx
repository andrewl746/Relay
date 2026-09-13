import Link from "next/link";
import type { ReactNode } from "react";
import { countdown, type CountdownTier } from "@/lib/hub/format";
import { BackIcon } from "./icons";

export const btnPrimary =
  "inline-flex min-h-11 items-center justify-center rounded-sm bg-accent px-5 text-[15px] font-semibold text-white transition-colors duration-75 hover:brightness-[1.08] active:brightness-95 disabled:cursor-not-allowed disabled:opacity-40";

export const btnSecondary =
  "inline-flex min-h-11 items-center justify-center rounded-sm border border-border-strong bg-surface px-5 text-[15px] font-semibold text-ink transition-colors duration-75 hover:bg-surface-2";

export const btnTertiary = "font-semibold text-ink-2 hover:text-ink underline underline-offset-[3px]";

export const fieldClass =
  "block w-full rounded-sm border border-border-strong bg-surface px-3 py-2.5 text-[15px] text-ink placeholder:text-ink-3 focus:border-accent";

/**
 * Every page in the hub uses the same frame and the same gutters. Pages used to
 * pass "wide" or "narrow" ad hoc, so Post was narrower than My list for no
 * reason anyone could name. Content that needs to be narrow constrains itself
 * INSIDE the frame with <Column>, so the page edges always line up.
 */
export function PageShell({ children }: { children: ReactNode; width?: "wide" | "narrow" }) {
  return (
    <div className="mx-auto w-full max-w-[var(--page-max)] px-5 pt-8 pb-20 sm:px-6">
      {children}
    </div>
  );
}

/** A readable measure for forms and prose, inside the shared page frame. */
export function Column({ children }: { children: ReactNode }) {
  return <div className="max-w-[620px]">{children}</div>;
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

/** Card/section heading. Reads as a heading, unlike the 11px eyebrow. */
export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-[19px] font-semibold tracking-[-0.01em] text-ink">{children}</h2>;
}

export function Eyebrow({ children, strong = false }: { children: ReactNode; strong?: boolean }) {
  return <p className={`t-eyebrow ${strong ? "text-ink" : "text-ink-2"}`}>{children}</p>;
}

export function Thumb({ word, size = "row" }: { word: string; size?: "row" | "hero" }) {
  return (
    <div
      aria-hidden="true"
      className={`grid shrink-0 place-items-center overflow-hidden bg-paper-sunk border border-rule-strong ${
        size === "row" ? "size-16 sm:size-[76px]" : "aspect-[4/3] w-full"
      }`}
    >
      <span className={`t-display text-ink-3 ${size === "row" ? "text-[13px]" : "text-[clamp(40px,8vw,76px)]"}`}>
        {word}
      </span>
    </div>
  );
}

const tierClass: Record<CountdownTier, string> = {
  open: "font-medium text-ink-2",
  soon: "font-semibold text-ink",
  today: "font-semibold text-accent",
  // White on --accent is 6.0:1. It was near-black on the red fill, which is
  // about 2:1 and fails AA badly — on the single most urgent thing on screen.
  final: "rounded-sm bg-accent px-1.5 py-0.5 font-semibold text-white",
  gone: "font-medium text-ink-3 line-through",
};

export function Countdown({ expiresAt, large = false }: { expiresAt: string | null; large?: boolean }) {
  if (!expiresAt) {
    return <span className={`text-ink-2 ${large ? "text-[15px]" : "text-[13px]"}`}>No deadline</span>;
  }
  const c = countdown(expiresAt);
  return (
    <span className={`data whitespace-nowrap ${large ? "text-[22px] leading-none" : "text-[14px]"} ${tierClass[c.tier]}`}>
      <span aria-hidden="true">{c.text}</span>
      <span className="sr-only">{c.label}</span>
    </span>
  );
}

export function VerifiedStamp({ domain }: { domain: string }) {
  return (
    <span className="stamp t-eyebrow border-[1.5px] border-rule-strong px-2 py-1 text-[10px] text-ink">
      ✓ {domain.split(".")[0]}
    </span>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="py-10">
      <p className="text-[17px] font-semibold">{title}</p>
      {children && <div className="mt-2 max-w-[52ch] text-ink-2">{children}</div>}
    </div>
  );
}
