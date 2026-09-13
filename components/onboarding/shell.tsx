import Link from "next/link";
import type { ReactNode } from "react";

const STEPS = ["Your info", "Verify email", "Interests", "Wishlist"];

export const labelClass = "mb-1.5 block text-[14px] font-semibold text-ink";
export const hintClass = "mt-1.5 text-[13px] text-ink-2";
export const errorClass = "rounded-sm border border-accent/40 bg-accent-tint px-3.5 py-3 text-[14px] text-ink";
export const successClass = "rounded-sm border border-done/40 bg-surface-2 px-3.5 py-3 text-[14px] text-ink";

export function OnboardingShell({
  step,
  title,
  description,
  backHref,
  backLabel,
  children,
  width = "narrow",
}: {
  step: 1 | 2 | 3 | 4;
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  children: ReactNode;
  /** "wide" for the interest grid; forms stay narrow and readable. */
  width?: "narrow" | "wide";
}) {
  return (
    <div
      className={`mx-auto rounded-md border border-border bg-surface p-6 shadow-[var(--lift)] sm:p-8 ${
        width === "wide" ? "max-w-[900px]" : "max-w-[520px]"
      }`}
    >
      <ol className="mb-8 flex items-center">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const state = n < step ? "done" : n === step ? "current" : "upcoming";
          return (
            <li key={label} className="flex flex-1 items-center last:flex-none">
              <span className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className={`grid size-6 shrink-0 place-items-center rounded-full text-[12px] font-semibold ${
                    state === "done"
                      ? "bg-done text-surface"
                      : state === "current"
                        ? "bg-accent text-on-accent"
                        : "border border-border-strong text-ink-3"
                  }`}
                >
                  {state === "done" ? "✓" : n}
                </span>
                <span
                  className={`hidden text-[13px] sm:inline ${
                    state === "upcoming" ? "text-ink-3" : "font-semibold text-ink"
                  }`}
                >
                  {label}
                </span>
              </span>
              {n < STEPS.length && <span aria-hidden="true" className="mx-2 h-px flex-1 bg-border" />}
            </li>
          );
        })}
      </ol>

      {backHref && (
        <Link
          href={backHref}
          className="mb-3 -ml-2 inline-flex min-h-9 items-center gap-1 rounded-sm px-2 text-[14px] font-semibold text-ink-2 transition-colors duration-100 hover:bg-surface-2 hover:text-ink"
        >
          ← {backLabel ?? "Back"}
        </Link>
      )}
      <h1 className="text-[clamp(28px,4vw,34px)] leading-tight font-semibold tracking-[-0.02em] text-ink">{title}</h1>
      {description && <p className="mt-2 text-[15px] text-ink-2">{description}</p>}
      <div className="mt-7">{children}</div>
    </div>
  );
}
