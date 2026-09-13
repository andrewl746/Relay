"use client";

import { useId, useRef, useState } from "react";
import { getUniversity, searchUniversities, type University } from "@/lib/onboarding/universities";

export function UniversityCombobox({ defaultUniversityId }: { defaultUniversityId?: string | null }) {
  const listId = useId();
  const initial = defaultUniversityId ? getUniversity(defaultUniversityId) : null;

  const [query, setQuery] = useState(initial?.name ?? "");
  const [selected, setSelected] = useState<University | null>(initial);
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
      <label htmlFor="university" className="gh-label">
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
        className="gh-input"
      />
      <input type="hidden" name="universityId" value={selected?.id ?? ""} />

      {open && matches.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border border-gh-border bg-gh-canvas shadow-lg"
        >
          {matches.map((u, i) => (
            <li key={u.id} role="option" aria-selected={i === activeIndex}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(u)}
                className={`block w-full px-3 py-2 text-left text-[14px] ${
                  i === activeIndex ? "bg-gh-canvas-inset" : ""
                }`}
              >
                {u.name}
                <span className="ml-1 text-gh-fg-subtle">· {u.shortName}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {!selected && query && !open && (
        <p className="gh-hint text-gh-danger">Choose a university from the list.</p>
      )}
    </div>
  );
}
