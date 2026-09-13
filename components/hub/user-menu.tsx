"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

/**
 * The signed-in user's name, as a menu.
 *
 * Holds the things that are yours: your list, your posts, your settings. The
 * nav keeps the places you go to act on the world (Browse, Post, Handoffs), so
 * nothing has two homes. Account-shaped controls — name, university, address,
 * theme, deleting the account — all live on the Settings page.
 */
export function UserMenu({
  name,
  email,
  avatarUrl,
  signedIn,
  signOutAction,
}: {
  name: string;
  email: string;
  avatarUrl?: string | null;
  /** False in demo mode, where there is no session to end. */
  signedIn: boolean;
  signOutAction: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
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
        className="flex min-h-11 items-center gap-2 rounded-sm px-2 text-[13px] font-semibold hover:bg-surface-2"
      >
        <Avatar name={name} url={avatarUrl} />
        <span className="hidden max-w-[9rem] truncate sm:inline">{name}</span>
        <svg aria-hidden viewBox="0 0 16 16" className="size-3.5 text-ink-2">
          <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="anim-slide absolute right-0 z-50 mt-1 w-60 rounded-md border border-border-strong bg-surface py-1"
          style={{ boxShadow: "0 8px 24px -8px rgba(43,33,24,.32)" }}
        >
          <div className="border-b border-border px-3 py-2.5">
            <p className="truncate text-[14px] font-semibold">{name}</p>
            <p className="truncate text-[12px] text-ink-2">{signedIn ? email : "Demo student · not signed in"}</p>
          </div>

          {[
            { href: "/wants", label: "My list" },
            { href: "/posts", label: "My posts" },
            { href: "/settings", label: "Settings" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-3 py-2.5 text-[14px] hover:bg-surface-2"
            >
              {l.label}
            </Link>
          ))}

          <div className="my-1 border-t border-border" />

          {signedIn ? (
            <form action={signOutAction}>
              <button
                type="submit"
                role="menuitem"
                className="w-full px-3 py-2.5 text-left text-[14px] hover:bg-surface-2"
              >
                Sign out
              </button>
            </form>
          ) : (
            <Link
              href="/login"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-3 py-2.5 text-[14px] font-semibold text-accent hover:bg-surface-2"
            >
              Sign in
            </Link>
          )}

        </div>
      )}
    </div>
  );
}

/**
 * Google gives us a photo on sign-in; fall back to an initial.
 *
 * The initial is centred with flex + leading-none rather than line-height —
 * a capital letter's glyph box is taller than its ink, so line-height centring
 * left it visibly low in the circle.
 */
function Avatar({ name, url, size = 28 }: { name: string; url?: string | null; size?: number }) {
  if (url) {
    return (
      <Image
        src={url}
        alt=""
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
        unoptimized
      />
    );
  }
  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full bg-accent font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.44, lineHeight: 1 }}
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}
