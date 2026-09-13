"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, type ComponentProps, type MouseEvent } from "react";

/**
 * A <Link> that morphs shared elements across the navigation.
 *
 * The browser's View Transitions API does the actual work: any two elements
 * carrying the same `view-transition-name` on the old and new page get tweened
 * into each other, so a board thumbnail grows into the listing hero instead of
 * being replaced by it.
 *
 * The only awkward part is timing. startViewTransition freezes the old frame
 * until the callback's promise settles, and router.push returns long before
 * React has committed the new route — resolving immediately snapshots the page
 * we are leaving and nothing animates. So the resolver is parked in a ref and
 * fired by the effect that runs when the pathname has actually changed.
 *
 * React's own <ViewTransition> would replace all of this, but it only exists in
 * the experimental React channel; this is stable React 19.
 */
export function TransitionLink({ href, onClick, ...rest }: ComponentProps<typeof Link>) {
  const router = useRouter();
  const pathname = usePathname();
  const pending = useRef<(() => void) | null>(null);

  useEffect(() => {
    pending.current?.();
    pending.current = null;
  }, [pathname]);

  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    // Let the browser do its normal thing for new tabs, modified clicks, and
    // anywhere the API is missing (Firefox, Safari < 18).
    if (
      e.defaultPrevented ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey ||
      typeof document.startViewTransition !== "function"
    ) {
      return;
    }
    e.preventDefault();
    document.startViewTransition(
      () =>
        new Promise<void>((resolve) => {
          pending.current = resolve;
          router.push(String(href));
        }),
    );
  };

  return <Link href={href} onClick={handle} {...rest} />;
}
