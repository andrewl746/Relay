import Link from "next/link";
import type { ReactNode } from "react";

const STEPS = ["Your info", "Verify email", "Interests", "Wishlist"];

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
      className={`gh-card mx-auto p-6 sm:p-8 ${width === "wide" ? "max-w-[900px]" : "max-w-[480px]"}`}
    >
      <ol className="mb-6 flex items-center">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const state = n < step ? "done" : n === step ? "current" : "upcoming";
          return (
            <li key={label} className="flex flex-1 items-center last:flex-none">
              <span className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className={`grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-semibold ${
                    state === "done"
                      ? "bg-gh-success text-white"
                      : state === "current"
                        ? "bg-gh-accent text-white"
                        : "border border-gh-border text-gh-fg-subtle"
                  }`}
                >
                  {state === "done" ? "✓" : n}
                </span>
                <span
                  className={`hidden text-[12px] sm:inline ${
                    state === "upcoming" ? "text-gh-fg-subtle" : "font-medium text-gh-fg"
                  }`}
                >
                  {label}
                </span>
              </span>
              {n < STEPS.length && <span aria-hidden="true" className="mx-2 h-px flex-1 bg-gh-border" />}
            </li>
          );
        })}
      </ol>

      {backHref && (
        <Link
          href={backHref}
          className="mb-3 inline-flex items-center gap-1 text-[13px] font-semibold text-gh-fg-muted hover:text-gh-fg"
        >
          ← {backLabel ?? "Back"}
        </Link>
      )}
      <h1 className="text-[28px] leading-tight font-semibold text-gh-fg">{title}</h1>
      {description && <p className="mt-1 text-[13px] text-gh-fg-muted">{description}</p>}
      <div className="mt-6">{children}</div>
    </div>
  );
}
