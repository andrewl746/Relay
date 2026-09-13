"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

/**
 * The signed-in user's name, as a menu.
 *
 * Deliberately a <details>-free custom popover so it can close on Escape and on
 * outside click, and so focus behaves. Delete account is separated by a rule
 * and needs a second, explicit confirmation — it is irreversible.
 */
export function UserMenu({
  name,
  email,
  signOutAction,
  deleteAction,
}: {
  name: string;
  email: string;
  signOutAction: () => Promise<void>;
  deleteAction: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) {
        setOpen(false);
        setConfirming(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setConfirming(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex min-h-11 items-center gap-2 rounded-1 px-2 text-[13px] font-semibold hover:bg-paper-raised"
      >
        <span
          aria-hidden
          className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--kand-blue)] text-[12px] font-bold text-[var(--kraft-50)]"
        >
          {name.trim().charAt(0).toUpperCase() || "?"}
        </span>
        <span className="hidden max-w-[9rem] truncate sm:inline">{name}</span>
        <svg aria-hidden viewBox="0 0 16 16" className="size-3.5 text-ink-2">
          <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="anim-slide absolute right-0 z-50 mt-1 w-64 rounded-[4px] border border-rule-strong bg-paper-raised py-1"
          style={{ boxShadow: "0 8px 24px -8px rgba(43,33,24,.32)" }}
        >
          <div className="border-b border-rule px-3 py-2.5">
            <p className="truncate text-[14px] font-semibold">{name}</p>
            <p className="truncate text-[12px] text-ink-2">{email}</p>
          </div>

          {[
            { href: "/account", label: "Account & stats" },
            { href: "/wants", label: "My list" },
            { href: "/handoffs", label: "Handoffs" },
            { href: "/post", label: "Post an item" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-[14px] hover:bg-paper-sunk"
            >
              {l.label}
            </Link>
          ))}

          <div className="my-1 border-t border-rule" />

          <form action={signOutAction}>
            <button
              type="submit"
              role="menuitem"
              className="w-full px-3 py-2 text-left text-[14px] hover:bg-paper-sunk"
            >
              Sign out
            </button>
          </form>

          <div className="my-1 border-t border-rule" />

          {!confirming ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => setConfirming(true)}
              className="w-full px-3 py-2 text-left text-[14px] text-[var(--signal)] hover:bg-paper-sunk"
            >
              Delete account
            </button>
          ) : (
            <div className="px-3 py-2">
              <p className="mb-2 text-[13px] leading-snug text-ink-2">
                This permanently deletes your profile, your list and your
                listings. It can&rsquo;t be undone.
              </p>
              <form action={deleteAction} className="flex gap-2">
                <button
                  type="submit"
                  className="min-h-9 flex-1 rounded-[2px] bg-[var(--signal)] px-3 text-[13px] font-bold text-[var(--kraft-50)]"
                >
                  Delete for good
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="min-h-9 rounded-[2px] border border-rule-strong px-3 text-[13px] font-semibold"
                >
                  Cancel
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
