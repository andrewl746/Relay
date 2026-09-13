"use client";

import { useSyncExternalStore } from "react";

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

/**
 * The theme actually on screen: the data-theme attribute themeScript and
 * applyTheme set. Read from the page rather than copied into state, so every
 * toggle agrees with it, including when storage is blocked.
 */
function appliedTheme(): Theme {
  const t = document.documentElement.getAttribute("data-theme");
  return t === "light" || t === "dark" ? t : "system";
}

function onThemeChange(notify: () => void) {
  const observer = new MutationObserver(notify);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

export function ThemeToggle() {
  // The server can't see the choice, so "system" there and during hydration.
  const theme = useSyncExternalStore(onThemeChange, appliedTheme, (): Theme => "system");

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
          onClick={() => applyTheme(o.value)}
          className={`min-h-9 rounded-sm px-4 text-[14px] font-semibold transition-colors ${
            theme === o.value ? "bg-accent text-on-accent" : "text-ink-2 hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
