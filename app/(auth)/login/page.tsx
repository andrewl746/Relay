import Link from "next/link";
import { GoogleOAuthButton } from "@/components/auth/google-oauth-button";
import { SITE_NAME } from "@/lib/hub/site";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : null;

  return (
    <div className="rounded-md border border-border bg-surface p-6 shadow-[var(--lift)] sm:p-8">
      <h1 className="text-[26px] leading-tight font-semibold tracking-[-0.02em]">
        Sign in to {SITE_NAME}
      </h1>
      <p className="mt-2 text-[15px] text-ink-2">
        Use your university Google account. That&rsquo;s the whole check — it&rsquo;s how everyone here
        knows you actually go to their school.
      </p>

      {error && (
        <p className="mt-5 rounded-sm border border-accent/40 bg-accent-tint px-3.5 py-3 text-[14px] text-ink">
          That didn&rsquo;t work.{" "}
          {error === "access_denied" ? "You cancelled the Google sign-in." : error}
        </p>
      )}

      <div className="mt-6">
        <GoogleOAuthButton label={`Continue with Google`} />
      </div>

      <p className="mt-5 text-[14px] text-ink-2">
        New here?{" "}
        <Link href="/register" className="font-semibold text-accent transition-colors duration-100 hover:text-ink">
          Create an account
        </Link>
        . We&rsquo;ll ask which school you&rsquo;re at next.
      </p>

      <div className="mt-6 border-t border-border pt-5">
        <p className="text-[14px] text-ink-2">
          Just looking?{" "}
          <Link href="/login/demo" className="font-semibold text-accent transition-colors duration-100 hover:text-ink">
            Open the demo
          </Link>{" "}
          and browse as a seeded student. Nothing you do there is real.
        </p>
      </div>
    </div>
  );
}
