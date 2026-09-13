"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { safeNextPath } from "@/lib/hub/dev-login";
import { loginAction } from "@/lib/hub/actions";

type Option = { id: string; name: string; email: string; detail: string };

export function DevLogin({
  users,
  currentUserId,
  next,
}: {
  users: Option[];
  currentUserId: string;
  next: string | null;
}) {
  const router = useRouter();
  const [userId, setUserId] = useState(currentUserId);
  const [email, setEmail] = useState(users.find((u) => u.id === currentUserId)?.email ?? "");
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);

  const selected = users.find((u) => u.id === userId);
  const valid = email.includes("@") && email.length > 3;

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!valid) {
          setTouched(true);
          return;
        }
        setLoading(true);
        try {
          await loginAction(userId, email);
          router.push(safeNextPath(next) || "/onboarding");
          router.refresh();
        } catch {
          setLoading(false);
        }
      }}
      className="space-y-6"
    >
      <fieldset>
        <legend className="text-[11px] font-bold tracking-[0.14em] uppercase text-[var(--text-muted)]">Select Profile</legend>
        <div className="mt-3 border-t border-[var(--bezel)]">
          {users.map((u) => (
            <label key={u.id} className="flex min-h-12 cursor-pointer items-center gap-3 border-b border-[var(--bezel)] py-3 hover:bg-[var(--panel)] transition-colors duration-75">
              <input
                type="radio"
                name="user"
                checked={userId === u.id}
                onChange={() => {
                  setUserId(u.id);
                  setEmail(u.email);
                  setTouched(false);
                }}
                className="size-4 accent-[var(--active-route)]"
              />
              <span>
                <span className="block font-semibold text-[var(--text-primary)]">{u.name}</span>
                <span className="block text-[13px] text-[var(--text-muted)]">{u.detail}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="email" className="text-[11px] font-bold tracking-[0.14em] uppercase text-[var(--text-muted)]">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder="you@university.edu"
          aria-invalid={touched && !valid}
          className="block w-full mt-2 rounded-[2px] border border-[var(--bezel)] bg-[#1E2028] px-3 py-2.5 text-[15px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] font-[family-name:var(--font-data)] focus:border-[var(--active-route)]"
        />
        {touched && !valid && (
          <p className="mt-1.5 text-[13px] text-[var(--alert)]">Enter a valid email address.</p>
        )}
        {valid && (
          <p className="mt-1.5 text-[13px] text-[var(--secured)] font-semibold font-[family-name:var(--font-data)]">✓ Valid</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full sm:w-auto inline-flex min-h-11 items-center justify-center rounded-[2px] bg-[var(--active-route)] px-6 text-[15px] font-bold text-white transition-all duration-75 hover:brightness-110 disabled:opacity-50"
      >
        {loading ? "Authorizing..." : `Continue as ${selected?.name.split(" ")[0] ?? "user"}`}
      </button>
    </form>
  );
}
