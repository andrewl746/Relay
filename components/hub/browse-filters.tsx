"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { filterCategories, filterOffers, type BoardFilters } from "@/lib/hub/feed";
import { FilterIcon } from "./icons";
import { btnPrimary, btnTertiary, fieldClass } from "./ui";

const chip =
  "inline-flex min-h-9 cursor-pointer items-center rounded-full border border-border-strong bg-surface-2 px-3.5 text-[14px] font-medium text-ink-2 transition-colors duration-[90ms] select-none hover:border-ink-3 hover:text-ink has-checked:border-ink has-checked:bg-ink has-checked:text-bg has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent";

/**
 * Lives inside the board's search <Form>, so its fields submit with the query.
 * The panel is hidden rather than unmounted when closed — hidden inputs still
 * submit, so pressing Enter in the search box keeps the chosen filters.
 */
export function BrowseFilters({
  filters,
  activeCount,
  clearHref,
}: {
  filters: BoardFilters;
  activeCount: number;
  clearHref: string;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="board-filters"
        aria-label={activeCount > 0 ? `Filters, ${activeCount} active` : "Filters"}
        title="Filters"
        className={`absolute top-1/2 right-1 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-sm transition-colors duration-75 ${
          open || activeCount > 0 ? "text-ink" : "text-ink-2"
        } hover:bg-surface-2 hover:text-ink`}
      >
        <FilterIcon className="size-[18px]" />
        {activeCount > 0 && (
          <span
            aria-hidden="true"
            className="data absolute -top-0.5 -right-0.5 grid size-4 place-items-center rounded-full bg-accent text-[10px] leading-none font-semibold text-on-accent"
          >
            {activeCount}
          </span>
        )}
      </button>

      <div
        id="board-filters"
        role="group"
        aria-label="Filters"
        hidden={!open}
        className="board board-thick absolute top-full right-0 z-30 mt-2 w-[min(360px,calc(100vw-2rem))] p-5"
      >
        <fieldset>
          <legend className="text-[15px] font-semibold text-ink">Category</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {filterCategories.map((c) => (
              <label key={c.value} className={chip}>
                <input
                  type="checkbox"
                  name="cat"
                  value={c.value}
                  defaultChecked={filters.categories.includes(c.value)}
                  className="sr-only"
                />
                {c.label}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-5">
          <legend className="text-[15px] font-semibold text-ink">Type</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {filterOffers.map((o) => (
              <label key={o.value} className={chip}>
                <input
                  type="checkbox"
                  name="offer"
                  value={o.value}
                  defaultChecked={filters.offers.includes(o.value)}
                  className="sr-only"
                />
                {o.label}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-5">
          <legend className="text-[15px] font-semibold text-ink">Price</legend>
          <div className="mt-2 flex items-center gap-2">
            <label className="relative flex-1">
              <span className="sr-only">Minimum price</span>
              <span aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-3">
                $
              </span>
              <input
                type="number"
                name="min"
                min={0}
                step="any"
                inputMode="decimal"
                placeholder="Min"
                defaultValue={filters.minCents !== null ? filters.minCents / 100 : undefined}
                className={`${fieldClass} pl-7`}
              />
            </label>
            <span aria-hidden="true" className="text-ink-3">
              –
            </span>
            <label className="relative flex-1">
              <span className="sr-only">Maximum price</span>
              <span aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-3">
                $
              </span>
              <input
                type="number"
                name="max"
                min={0}
                step="any"
                inputMode="decimal"
                placeholder="Max"
                defaultValue={filters.maxCents !== null ? filters.maxCents / 100 : undefined}
                className={`${fieldClass} pl-7`}
              />
            </label>
          </div>
          <p className="mt-1.5 text-[13px] text-ink-2">Rentals are priced per term. Free and borrow count as $0.</p>
        </fieldset>

        <div className="mt-5 flex items-center justify-between gap-4 border-t border-border pt-4">
          <Link href={clearHref} scroll={false} onClick={() => setOpen(false)} className={`${btnTertiary} text-[14px]`}>
            Clear filters
          </Link>
          <button type="submit" onClick={() => setOpen(false)} className={btnPrimary}>
            Show results
          </button>
        </div>
      </div>
    </div>
  );
}
