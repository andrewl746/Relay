"use client";

import { useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";
const KEY = "relay-theme";

/** Read once, before paint, from the inline script below. */
export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  const v = window.localStorage.getItem(KEY);
  return v === "light" || v === "dark" ? v : "system";
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
  try {
    if (theme === "system") window.localStorage.removeItem(KEY);
    else window.localStorage.setItem(KEY, theme);
  } catch {
    // Private mode or blocked storage: the choice just won't persist.
  }
}

/**
 * Runs before first paint so a dark-mode user never sees a white flash.
 * Inline and synchronous on purpose — anything deferred is too late.
 */
export const themeScript = `(function(){try{var t=localStorage.getItem("${KEY}");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`;

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");
  useEffect(() => setTheme(getStoredTheme()), []);

  const options: { value: Theme; label: string }[] = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "system", label: "System" },
  ];

  return (
    <div role="radiogroup" aria-label="Theme" className="inline-flex rounded-md border border-border-strong p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={theme === o.value}
          onClick={() => {
            setTheme(o.value);
            applyTheme(o.value);
          }}
          className={`min-h-9 rounded-sm px-4 text-[14px] font-semibold transition-colors ${
            theme === o.value ? "bg-accent text-white" : "text-ink-2 hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
