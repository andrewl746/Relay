import Link from "next/link";
import { GoogleOAuthButton } from "@/components/auth/google-oauth-button";
import { SITE_NAME } from "@/lib/hub/site";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : null;

  return (
    <div className="rounded-md border border-border bg-surface p-6 shadow-[var(--lift)] sm:p-8">
      <h1 className="text-[34px] leading-tight font-semibold tracking-[-0.02em]">
        Sign in to {SITE_NAME}
      </h1>
      <p className="mt-2 text-[15px] text-ink-2">
        Don&rsquo;t worry about using your university sign-in. That&rsquo;ll come later in the process.
      </p>

      {error && (
        <p className="mt-5 rounded-sm border border-accent/40 bg-accent-tint px-3.5 py-3 text-[14px] text-ink">
          That didn&rsquo;t work.{" "}
          {error === "access_denied"
            ? "You cancelled the Google sign-in."
            : error}
        </p>
      )}

      <div className="mt-6">
        <GoogleOAuthButton label={`Continue with Google`} />
      </div>

      <p className="mt-5 text-[14px] text-ink-2">
        New here?{" "}
        <Link
          href="/register"
          className="font-semibold text-accent transition-colors duration-100 hover:text-ink"
        >
          Create an account
        </Link>.
      </p>

      <div className="mt-6 border-t border-border pt-5">
        <p className="text-[14px] text-ink-2">
          {" "}
          <Link
            href="/login/demo"
            className="font-semibold underline transition-colors duration-100 hover:text-ink"
          >
            open demo
          </Link>{" "}
          
        </p>
      </div>
    </div>
  );
}
