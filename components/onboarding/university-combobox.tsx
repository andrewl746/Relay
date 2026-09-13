"use client";

import { useId, useRef, useState } from "react";
import { fieldClass } from "@/components/hub/ui";
import { getUniversity, searchUniversities, type University } from "@/lib/onboarding/universities";
import { hintClass, labelClass } from "./shell";

export function UniversityCombobox({
  defaultUniversityId,
  onSelect,
}: {
  defaultUniversityId?: string | null
  /** Lets the parent react to the choice — the profile form needs its residences. */
  onSelect?: (university: University | null) => void
}) {
  const listId = useId();
  const initial = defaultUniversityId ? getUniversity(defaultUniversityId) : null;

  const [query, setQuery] = useState(initial?.name ?? "");
  const [selected, setSelectedRaw] = useState<University | null>(initial);
  const setSelected = (u: University | null) => {
    setSelectedRaw(u);
    onSelect?.(u);
  };
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const matches = searchUniversities(query);

  const choose = (university: University) => {
    setSelected(university);
    setQuery(university.name);
    setOpen(false);
    inputRef.current?.blur();
  };

  return (
    <div className="relative">
      <label htmlFor="university" className={labelClass}>
        University
      </label>
      <input
        ref={inputRef}
        id="university"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setSelected(null);
          setOpen(true);
          setActiveIndex(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (!open) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((i) => Math.min(i + 1, matches.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter" && matches[activeIndex]) {
            e.preventDefault();
            choose(matches[activeIndex]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        placeholder="Start typing your school's name"
        className={fieldClass}
      />
      <input type="hidden" name="universityId" value={selected?.id ?? ""} />

      {open && matches.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-10 mt-1 w-full overflow-hidden rounded-sm border border-border-strong bg-surface shadow-[var(--lift-2)]"
        >
          {matches.map((u, i) => (
            <li key={u.id} role="option" aria-selected={i === activeIndex}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(u)}
                className={`block w-full px-3 py-2.5 text-left text-[15px] text-ink ${
                  i === activeIndex ? "bg-surface-2" : ""
                }`}
              >
                {u.name}
                <span className="ml-1 text-ink-3">· {u.shortName}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {!selected && query && !open && (
        <p className={`${hintClass} font-semibold text-accent`}>Choose a university from the list.</p>
      )}
    </div>
  );
}
