import { SITE_NAME } from "@/lib/hub/site";

/**
 * The mark, painted as a mask rather than drawn as an <img>.
 *
 * relay-black.png is black artwork on transparency: invisible on the dark
 * theme, and an <img> can't be tinted without a filter stack that guesses at
 * the result. Masking it and painting the background instead means the mark
 * takes currentColor — ink by default, accent on hover, correct in both
 * themes — from one asset.
 *
 * The colour is a real `background-color`, not `currentColor`: a transition on
 * `background-color: currentColor` has no specified-value change to
 * interpolate, so the hover tint snapped in instead of fading.
 */
export function Logo({ className = "h-8 bg-ink" }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label={SITE_NAME}
      className={`block aspect-[837/266] ${className}`}
      style={{
        maskImage: "url(/relay-black.png)",
        WebkitMaskImage: "url(/relay-black.png)",
        maskSize: "contain",
        WebkitMaskSize: "contain",
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskPosition: "center",
      }}
    />
  );
}
