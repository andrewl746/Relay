"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { GoogleIcon } from "./google-icon";

export function GoogleOAuthButton({ label }: { label: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setPending(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
    } catch {
      setError("Google sign-in isn't set up yet. Ask whoever's running the demo to add the Supabase keys.");
      setPending(false);
    }
  };

  return (
    <div>
      <button type="button" onClick={handleClick} disabled={pending} className="inline-flex min-h-11 w-full items-center justify-center gap-2.5 rounded-sm border border-border-strong bg-surface px-5 text-[15px] font-semibold text-ink transition-colors duration-100 hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50">
        <GoogleIcon />
        {pending ? "Redirecting to Google…" : label}
      </button>
      {error && <p className="mt-3 rounded-sm border border-accent/40 bg-accent-tint px-3.5 py-3 text-[14px] text-ink">{error}</p>}
    </div>
  );
}
