import Link from "next/link";
import type { ReactNode } from "react";
import { countdown, type CountdownTier } from "@/lib/hub/format";
import { BackIcon } from "./icons";

export const btnPrimary =
  "inline-flex min-h-11 items-center justify-center rounded-[2px] bg-[var(--amber)] px-5 text-[15px] font-bold text-[#0D0E12] transition-all duration-75 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40";

export const btnSecondary =
  "inline-flex min-h-11 items-center justify-center rounded-[2px] border border-rule-strong px-5 text-[15px] font-semibold text-ink transition-colors duration-75 hover:bg-paper-raised";

export const btnTertiary = "font-semibold text-ink-2 hover:text-ink underline underline-offset-[3px]";

export const fieldClass =
  "block w-full rounded-[2px] border border-rule-strong bg-paper-sunk px-3 py-2.5 text-[15px] text-ink placeholder:text-ink-3 focus:border-[var(--amber)]";

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
  today: "font-semibold text-signal",
  final: "bg-signal-fill px-1 font-semibold text-[#0D0E12]",
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
