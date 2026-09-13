"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { btnPrimary } from "@/components/hub/ui";
import { GuideBot } from "./guide-bot";
import { tipsFor, type OnboardingStep } from "./guide-tips";

const STEPS = ["Your info", "Verify email", "Interests", "Wishlist"];

/** Anything on the page can unfold the corner: see OpenParcelCorner. */
const OPEN_EVENT = "relay:open-parcel-corner";

/**
 * Parcel's corner: account setup as a panel over the site, not pages that
 * replace it. The rest of Relay stays usable behind it, and "Hide" (or Escape)
 * folds it down to Parcel with a reminder of the step that's left.
 *
 * The forms keep their gh-* classes (app/(auth)/github-ui.css), which map onto
 * the site palette, so it follows dark mode. From `sm` up it sits bottom-right;
 * on phones it's a sheet along the bottom that never gets taller than 70% of
 * the screen.
 */
export function ParcelCorner({
  step,
  reverify,
  title,
  description,
  backToInterests,
  children,
}: {
  step: OnboardingStep;
  reverify: boolean;
  title: string;
  description: string;
  backToInterests?: () => Promise<void>;
  children: ReactNode;
}) {
  const tips = tipsFor(step, reverify);
  const [open, setOpen] = useState(true);
  const [tipIndex, setTipIndex] = useState(0);
  const toggled = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const pill = useRef<HTMLButtonElement>(null);

  // Keyboard focus follows the fold, but not on page load: the page keeps focus.
  useEffect(() => {
    if (!toggled.current) return;
    (open ? heading.current : pill.current)?.focus();
  }, [open]);

  useEffect(() => {
    const unfold = () => {
      toggled.current = true;
      setOpen(true);
      // Already open: the effect above won't run, so move focus here.
      heading.current?.focus();
    };
    window.addEventListener(OPEN_EVENT, unfold);
    return () => window.removeEventListener(OPEN_EVENT, unfold);
  }, []);

  const setFolded = (folded: boolean) => {
    toggled.current = true;
    setOpen(!folded);
  };

  if (!open) {
    return (
      <div className="fixed right-3 bottom-3 z-50 sm:right-6 sm:bottom-6">
        <button
          ref={pill}
          type="button"
          onClick={() => setFolded(false)}
          aria-expanded={false}
          className="anim-slide flex items-center gap-2 rounded-full border border-gh-border bg-gh-canvas py-1 pr-4 pl-1 text-[14px] font-semibold text-gh-fg shadow-(--lift-2) hover:bg-gh-canvas-inset"
        >
          <GuideBot mood="hi" size={44} />
          {reverify ? "Verify your new email" : `Finish setting up · ${step} of ${STEPS.length}`}
        </button>
      </div>
    );
  }

  const tip = tips[tipIndex];

  return (
    <section
      id="parcel-corner"
      aria-labelledby="parcel-corner-title"
      onKeyDown={(event: KeyboardEvent) => {
        // A field that used Escape itself (the university list closing) marks it handled.
        if (event.key === "Escape" && !event.defaultPrevented) setFolded(true);
      }}
      className="gh anim-slide fixed inset-x-3 bottom-3 z-50 flex max-h-[70dvh] flex-col overflow-hidden rounded-md border border-gh-border bg-gh-canvas-subtle shadow-(--lift-2) sm:inset-x-auto sm:right-6 sm:bottom-6 sm:max-h-[calc(100dvh-7rem)] sm:w-[420px]"
    >
      <div className="px-4 pt-3 pb-1">
        <div className="flex items-center justify-between gap-3">
          {reverify ? (
            <p className="text-[13px] font-medium text-gh-fg-muted">One more check</p>
          ) : (
            <ol aria-label={`Step ${step} of ${STEPS.length}: ${STEPS[step - 1]}`} className="flex items-center gap-1.5">
              {STEPS.map((label, i) => {
                const n = i + 1;
                const state = n < step ? "done" : n === step ? "current" : "upcoming";
                return (
                  <li key={label}>
                    <span
                      aria-hidden="true"
                      className={`grid size-5 place-items-center rounded-full text-[11px] font-semibold ${
                        state === "done"
                          ? "bg-gh-success text-on-accent"
                          : state === "current"
                            ? "bg-gh-accent text-on-accent"
                            : "border border-gh-border text-gh-fg-subtle"
                      }`}
                    >
                      {state === "done" ? "✓" : n}
                    </span>
                  </li>
                );
              })}
              <li aria-hidden="true" className="ml-1 text-[13px] font-medium text-gh-fg">
                {STEPS[step - 1]}
              </li>
            </ol>
          )}
          <button
            type="button"
            onClick={() => setFolded(true)}
            aria-expanded={true}
            aria-controls="parcel-corner"
            className="gh-link text-[14px]"
          >
            Hide
          </button>
        </div>

        <div className="mt-2 flex items-end gap-2">
          <span key={`${tipIndex}-${tip.mood}`} className="anim-slide shrink-0">
            <GuideBot mood={tip.mood} size={64} />
          </span>
          <div className="relative mb-3 min-w-0 flex-1 rounded-md border border-gh-border bg-gh-canvas px-3 py-2">
            <p className="text-[14px] leading-snug text-gh-fg">{tip.text}</p>
            {tipIndex < tips.length - 1 && (
              <button type="button" onClick={() => setTipIndex(tipIndex + 1)} className="gh-link mt-1 text-[13px]">
                Next tip
              </button>
            )}
            {/* The bubble's tail, pointing at Parcel. */}
            <span
              aria-hidden="true"
              className="absolute bottom-3 -left-[7px] size-3 rotate-45 border-b border-l border-gh-border bg-gh-canvas"
            />
          </div>
        </div>
        <p className="sr-only" aria-live="polite">
          {`Parcel says: ${tip.text}`}
        </p>
      </div>

      {/* data-lenis-prevent: Lenis (components/motion/smooth-scroll.tsx) takes every
          wheel event for the page, so without it the form never scrolls. Overscroll
          stays contained so reaching the end of the form doesn't scroll the page. */}
      <div data-lenis-prevent className="min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-gh-border bg-gh-canvas p-4">
        {backToInterests && (
          <form action={backToInterests}>
            <button
              type="submit"
              className="mb-2 inline-flex items-center gap-1 text-[14px] font-semibold text-gh-fg-muted hover:text-gh-fg"
            >
              ← Back to interests
            </button>
          </form>
        )}
        <h2 ref={heading} id="parcel-corner-title" tabIndex={-1} className="text-[20px] leading-tight font-semibold text-gh-fg">
          {title}
        </h2>
        {description && <p className="mt-1 text-[14px] text-gh-fg-muted">{description}</p>}
        <div className="mt-4">{children}</div>
      </div>
    </section>
  );
}

/** A button anywhere on the site that unfolds Parcel's corner and moves focus into it. */
export function OpenParcelCorner({ children }: { children: ReactNode }) {
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))} className={btnPrimary}>
      {children}
    </button>
  );
}
