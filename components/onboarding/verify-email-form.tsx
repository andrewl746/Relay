"use client";

import { useActionState } from "react";
import { confirmVerificationCode, sendVerificationCode, type ActionState } from "@/app/(onboarding)/actions";
import { btnPrimary, btnTertiary, fieldClass } from "@/components/hub/ui";
import { CODE_LENGTH } from "@/lib/onboarding/otp";
import { errorClass, hintClass, labelClass, successClass } from "./shell";

const initialState: ActionState = { status: "idle" };

export function VerifyEmailForm({ defaultEmail, domain }: { defaultEmail: string; domain: string }) {
  const [sendState, sendAction, sendPending] = useActionState(sendVerificationCode, initialState);
  const [confirmState, confirmAction, confirmPending] = useActionState(confirmVerificationCode, initialState);

  const sentTo = sendState.status === "sent" ? sendState.message : null;

  if (!sentTo) {
    return (
      <form action={sendAction} className="space-y-5">
        <div>
          <label htmlFor="email" className={labelClass}>
            University email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            defaultValue={defaultEmail}
            placeholder={`you@${domain}`}
            className={fieldClass}
          />
          <p className={hintClass}>Use your @{domain} address so we can confirm you&rsquo;re a student there.</p>
        </div>

        {sendState.status === "error" && <p className={errorClass}>{sendState.message}</p>}

        <button type="submit" disabled={sendPending} className={`${btnPrimary} w-full`}>
          {sendPending ? "Sending…" : "Verify"}
        </button>
      </form>
    );
  }

  return (
    <div className="space-y-5">
      {sendState.devCode ? (
        <div className={`${errorClass} space-y-1`}>
          <p>We couldn&rsquo;t email this code (delivery isn&rsquo;t set up yet). Use this one instead:</p>
          <p className="text-lg font-semibold tracking-[0.2em]">{sendState.devCode}</p>
        </div>
      ) : (
        <p className={successClass}>Code sent to {sentTo}. Check your inbox.</p>
      )}

      <form action={confirmAction} className="space-y-5">
        <div>
          <label htmlFor="code" className={labelClass}>
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
            className={`${fieldClass} text-center text-lg tracking-[0.3em]`}
          />
        </div>

        {confirmState.status === "error" && <p className={errorClass}>{confirmState.message}</p>}

        <button type="submit" disabled={confirmPending} className={`${btnPrimary} w-full`}>
          {confirmPending ? "Checking…" : "Confirm"}
        </button>
      </form>

      <form action={sendAction}>
        <input type="hidden" name="email" defaultValue={sentTo} />
        <button type="submit" disabled={sendPending} className={`${btnTertiary} text-[14px]`}>
          Resend code
        </button>
      </form>
    </div>
  );
}
