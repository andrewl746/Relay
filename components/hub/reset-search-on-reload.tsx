"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Search/filter state lives in the URL (?q=, ?view=) so it survives normal
 * in-app navigation — filter chips, back button, sharing a link. But a real
 * browser refresh should drop back to the default board, not re-apply
 * whatever was last searched. The Navigation Timing API is the only way to
 * tell "the user hit refresh" apart from "the user clicked a link here."
 */
export function ResetSearchOnReload() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!searchParams.get("q") && !searchParams.get("view")) return;
    const [entry] = performance.getEntriesByType("navigation");
    const isReload = entry instanceof PerformanceNavigationTiming && entry.type === "reload";
    if (isReload) router.replace("/");
    // Only ever meant to run once, right after this navigation resolves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
