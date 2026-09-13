"use client";

import { useActionState } from "react";
import { confirmVerificationCode, sendVerificationCode, type ActionState } from "@/app/(onboarding)/actions";
import { CODE_LENGTH } from "@/lib/onboarding/otp";

const initialState: ActionState = { status: "idle" };

export function VerifyEmailForm({ defaultEmail, domain }: { defaultEmail: string; domain: string }) {
  const [sendState, sendAction, sendPending] = useActionState(sendVerificationCode, initialState);
  const [confirmState, confirmAction, confirmPending] = useActionState(confirmVerificationCode, initialState);

  const sentTo = sendState.status === "sent" ? sendState.message : null;

  if (!sentTo) {
    return (
      <form action={sendAction} className="space-y-5">
        <div>
          <label htmlFor="email" className="gh-label">
            University email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            defaultValue={defaultEmail}
            placeholder={`you@${domain}`}
            className="gh-input"
          />
          <p className="gh-hint">Use your @{domain} address so we can confirm you&rsquo;re a student there.</p>
        </div>

        {sendState.status === "error" && <p className="gh-flash-error">{sendState.message}</p>}

        <button type="submit" disabled={sendPending} className="gh-btn gh-btn-primary">
          {sendPending ? "Sending…" : "Verify"}
        </button>
      </form>
    );
  }

  return (
    <div className="space-y-5">
      {sendState.devCode ? (
        <div className="gh-flash-error flex-col items-start gap-1">
          <p>We couldn&rsquo;t email this code (delivery isn&rsquo;t set up yet). Use this one instead:</p>
          <p className="text-lg font-semibold tracking-[0.2em]">{sendState.devCode}</p>
        </div>
      ) : (
        <p className="gh-flash-success">Code sent to {sentTo}. Check your inbox.</p>
      )}

      <form action={confirmAction} className="space-y-5">
        <div>
          <label htmlFor="code" className="gh-label">
            Verification code
          </label>
          <input
            id="code"
            name="code"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={CODE_LENGTH}
            autoComplete="one-time-code"
            required
            autoFocus
            placeholder="000000"
            className="gh-input text-center text-lg tracking-[0.3em]"
          />
        </div>

        {confirmState.status === "error" && <p className="gh-flash-error">{confirmState.message}</p>}

        <button type="submit" disabled={confirmPending} className="gh-btn gh-btn-primary">
          {confirmPending ? "Checking…" : "Confirm"}
        </button>
      </form>

      <form action={sendAction}>
        <input type="hidden" name="email" defaultValue={sentTo} />
        <button type="submit" disabled={sendPending} className="gh-link text-[13px]">
          Resend code
        </button>
      </form>
    </div>
  );
}
