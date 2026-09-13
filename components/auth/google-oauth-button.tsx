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
      <button type="button" onClick={handleClick} disabled={pending} className="gh-btn">
        <GoogleIcon />
        {pending ? "Redirecting to Google…" : label}
      </button>
      {error && <p className="gh-flash-error mt-3">{error}</p>}
    </div>
  );
}
