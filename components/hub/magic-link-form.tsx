"use client";

import { useState } from "react";
import { isUniversityEmail } from "@/lib/hub/email";
import { createClient } from "@/lib/supabase/client";
import { btnPrimary, fieldClass } from "./ui";

/**
 * Real sign-in. Firebase comparison: this is `signInWithEmailLink()` —
 * type an email, get a link, click it, you're in. No password field exists
 * anywhere in this flow, on purpose: Supabase's email OTP is one call
 * (`signInWithOtp`) and there's nothing else to build for it.
 *
 * `next` carries the page the visitor was trying to reach through the whole
 * round trip (this form → inbox → app/auth/confirm/route.ts) so they land
 * back where they started instead of always at the homepage.
 */
export function MagicLinkForm({ domain, next }: { domain: string; next: string | null }) {
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const valid = isUniversityEmail(email, domain);

  if (status === "sent") {
    return (
      <p className="text-[15px]">
        Check <span className="font-semibold">{email}</span> for a sign-in link. It expires in an
        hour — close this tab, you don't need it.
      </p>
    );
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!valid) {
          setTouched(true);
          return;
        }
        setStatus("sending");
        const supabase = createClient();
        // emailRedirectTo becomes {{ .RedirectTo }} in the Supabase email
        // template — see the "Sign in" section of docs/PROJECT.md for the
        // template text, which embeds it as the final `next` hop after
        // app/auth/confirm/route.ts verifies the link.
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${window.location.origin}${next ?? "/"}` },
        });
        setStatus(error ? "error" : "sent");
      }}
      className="space-y-6"
    >
      <div>
        <label htmlFor="email" className="t-eyebrow text-ink-2">
          School email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
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
            <span className="font-semibold">Use your {domain} address.</span>
          ) : (
            <span className="text-ink-2">Only {domain} addresses can join this hub.</span>
          )}
        </p>
      </div>

      {status === "error" && (
        <p className="text-[13px] font-semibold text-red-700">
          Couldn't send that link. Try again in a moment.
        </p>
      )}

      <button type="submit" disabled={status === "sending"} className={`${btnPrimary} w-full sm:w-auto`}>
        {status === "sending" ? "Sending…" : "Email me a link"}
      </button>
    </form>
  );
}
