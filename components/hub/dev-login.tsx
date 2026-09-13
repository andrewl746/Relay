"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { safeNextPath, setDevUser } from "@/lib/hub/dev-login";
import { isUniversityEmail } from "@/lib/hub/email";
import { btnPrimary, fieldClass } from "./ui";

type Option = { id: string; name: string; email: string; detail: string };

export function DevLogin({
  users,
  currentUserId,
  domain,
  next,
}: {
  users: Option[];
  currentUserId: string;
  domain: string;
  next: string | null;
}) {
  const router = useRouter();
  const [userId, setUserId] = useState(currentUserId);
  const [email, setEmail] = useState(users.find((u) => u.id === currentUserId)?.email ?? "");
  const [touched, setTouched] = useState(false);

  const selected = users.find((u) => u.id === userId);
  const valid = isUniversityEmail(email, domain);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) {
          setTouched(true);
          return;
        }
        setDevUser(userId);
        router.push(safeNextPath(next));
        router.refresh();
      }}
      className="space-y-8"
    >
      <fieldset>
        <legend className="t-eyebrow text-ink-2">Student</legend>
        <div className="mt-2 border-t border-rule">
          {users.map((u) => (
            <label key={u.id} className="flex min-h-12 cursor-pointer items-center gap-3 border-b border-rule py-2">
              <input
                type="radio"
                name="user"
                checked={userId === u.id}
                onChange={() => {
                  setUserId(u.id);
                  setEmail(u.email);
                  setTouched(false);
                }}
                className="size-4 accent-[var(--ink)]"
              />
              <span>
                <span className="block font-semibold">{u.name}</span>
                <span className="block text-[13px] text-ink-2">{u.detail}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="email" className="t-eyebrow text-ink-2">
          School email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched(true)}
          aria-describedby="email-status"
          aria-invalid={touched && !valid}
          className={`${fieldClass} data mt-2`}
        />
        <p id="email-status" aria-live="polite" className="mt-1.5 text-[13px]">
          {valid ? (
            <span className="font-semibold text-seal">✓ Verified {domain}</span>
          ) : touched ? (
            <span className="font-semibold">
              Use your {domain} address. You need a school email to claim things, so listings stay on campus.
            </span>
          ) : (
            <span className="text-ink-2">Only {domain} addresses can join this hub.</span>
          )}
        </p>
      </div>

      <button type="submit" className={`${btnPrimary} w-full sm:w-auto`}>
        Continue as {selected?.name.split(" ")[0] ?? "this student"}
      </button>
    </form>
  );
}
