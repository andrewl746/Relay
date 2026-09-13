import Link from "next/link";
import { ViewTransition, type ReactNode } from "react";
import { countdown, type CountdownTier } from "@/lib/hub/format";
import { BackIcon } from "./icons";

export const btnPrimary =
  "inline-flex min-h-11 items-center justify-center rounded-sm bg-accent px-5 text-[15px] font-semibold text-on-accent transition-colors duration-75 hover:brightness-[1.08] active:brightness-95 disabled:cursor-not-allowed disabled:opacity-40";

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
    <div className="mx-auto w-full max-w-[var(--page-max)] px-5 pt-12 pb-20 sm:px-6 sm:pt-16">
      {children}
    </div>
  );
}

/** A readable measure for forms and prose, inside the shared page frame. */
export function Column({ children }: { children: ReactNode }) {
  return <div className="max-w-[620px]">{children}</div>;
}

/**
 * The page heading. Every page in the hub uses this — pages used to roll their
 * own h1 at 28px bold, 30px semibold or a 54px clamp, so no two headings
 * matched. One size, one weight, one lede treatment.
 */
export function PageTitle({ title, lede }: { title: string; lede?: ReactNode }) {
  return (
    <div className="mb-8">
      <h1 className="text-[clamp(32px,4.5vw,42px)] leading-[1.1] font-semibold tracking-[-0.02em] text-ink">
        {title}
      </h1>
      {lede && <p className="mt-2 max-w-[68ch] text-[16px] text-ink-2">{lede}</p>}
    </div>
  );
}

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="mb-6 -ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-sm px-2 text-[16px] font-semibold text-ink-2 transition-colors duration-100 hover:bg-surface-2 hover:text-ink">
      <BackIcon className="size-5" />
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

/**
 * The listing's photo, falling back to a category glyph when it has none — a
 * word in a grey box reads as a broken image, and several stacked read as a
 * catalogue that failed to load.
 */
const THUMB_ICON: { match: RegExp; icon: EmptyIcon }[] = [
  { match: /desk|chair|shelf|table|lamp|bed|mattress|sofa|dresser|furniture/i, icon: "box" },
  { match: /book|text|coat|goggle|lab|calculator|school/i, icon: "list" },
  { match: /fridge|kettle|toaster|micro|cook|kitchen|pot|pan/i, icon: "box" },
];

export function Thumb({
  word,
  photoUrl,
  alt = "",
  size = "row",
  /**
   * Shared identity across a navigation. The board row and the listing hero
   * pass the same name, so the browser tweens the one growing into the other
   * rather than painting a new page over it. React's <ViewTransition> starts
   * the transition when the route commits, so the old page never freezes while
   * the new one is fetched. `default="none"` keeps the morph to named pairs —
   * no crossfade on every unrelated transition (search, refresh).
   */
  transitionName,
}: {
  word: string;
  photoUrl?: string | null;
  alt?: string;
  size?: "row" | "list" | "hero";
  transitionName?: string;
}) {
  const icon = THUMB_ICON.find((t) => t.match.test(word))?.icon ?? "box";
  const box = {
    row: "size-16 sm:size-[72px]",
    list: "size-[104px] sm:size-[132px]",
    hero: "aspect-[4/3] w-full",
  }[size];
  const glyph = { row: "size-7", list: "size-12", hero: "size-16" }[size];

  const thumb = (
    <div
      aria-hidden={photoUrl && alt ? undefined : "true"}
      className={`grid shrink-0 place-items-center overflow-hidden rounded-md border border-border bg-surface-2 text-ink-3 ${box}`}
    >
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- data URL, nothing for next/image to optimize
        <img src={photoUrl} alt={alt} className="size-full object-cover" />
      ) : (
        <span className={glyph}>
          <EmptyIconArt name={icon} />
        </span>
      )}
    </div>
  );

  return transitionName ? (
    <ViewTransition name={transitionName} share="auto" default="none">
      {thumb}
    </ViewTransition>
  ) : (
    thumb
  );
}

const tierClass: Record<CountdownTier, string> = {
  open: "font-medium text-ink-2",
  soon: "font-semibold text-ink",
  today: "font-semibold text-accent",
  // --on-accent is 6.2:1 light, 7.6:1 dark. It was near-black on the red fill,
  // about 2:1 — on the single most urgent thing on screen.
  final: "rounded-sm bg-accent px-1.5 py-0.5 font-semibold text-on-accent",
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

/**
 * Empty states carry an icon so a blank card reads as "nothing yet" rather
 * than "something failed to load". Line art at a heavy stroke, matching the
 * stencil glyphs elsewhere; always aria-hidden, since the text says it.
 */
export type EmptyIcon = "list" | "calendar" | "box" | "search" | "bell";

const EMPTY_PATHS: Record<EmptyIcon, ReactNode> = {
  list: <><path d="M9 6h11M9 12h11M9 18h11" /><path d="M4 6h.01M4 12h.01M4 18h.01" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  box: <><path d="M3 8h18v12H3zM3 8l3-4h12l3 4M12 4v16" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.6-3.6" /></>,
  bell: <><path d="M18 16V11a6 6 0 1 0-12 0v5l-2 3h16l-2-3Z" /><path d="M10 21h4" /></>,
};

export function EmptyIconArt({ name }: { name: EmptyIcon }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-full"
    >
      {EMPTY_PATHS[name]}
    </svg>
  );
}

export function EmptyState({
  title,
  icon = "box",
  children,
}: {
  title: string;
  icon?: EmptyIcon;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center py-14 text-center">
      <span className="mb-4 block size-14 text-ink-3">
        <EmptyIconArt name={icon} />
      </span>
      <p className="text-[17px] font-semibold">{title}</p>
      {children && <div className="mt-1.5 max-w-[46ch] text-[15px] text-ink-2">{children}</div>}
    </div>
  );
}

/** Compact empty state for inside a card, where a full one would dwarf it. */
export function CardEmpty({
  icon,
  title,
  children,
}: {
  icon: EmptyIcon;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center py-6 text-center">
      <span className="mb-3 block size-10 text-ink-3">
        <EmptyIconArt name={icon} />
      </span>
      <p className="text-[15px] font-semibold">{title}</p>
      {children && <div className="mt-1 max-w-[36ch] text-[14px] leading-snug text-ink-2">{children}</div>}
    </div>
  );
}
