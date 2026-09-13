import Link from "next/link";
import { GoogleOAuthButton } from "@/components/auth/google-oauth-button";
import { SITE_NAME } from "@/lib/hub/site";

export const metadata = { title: "Create your account" };

export default function RegisterPage() {
  return (
    <div className="rounded-md border border-border bg-surface p-6 shadow-[var(--lift)] sm:p-8">
      <h1 className="text-[34px] leading-tight font-semibold tracking-[-0.02em]">
        Create your {SITE_NAME} account
      </h1>
      <p className="mt-2 text-[15px] text-ink-2">
        Sign in with Google, then verify a university email. Takes about a minute and you only do it
        once.
      </p>

      <div className="mt-6">
        <GoogleOAuthButton label="Sign up with Google" />
      </div>

      <p className="mt-5 text-[14px] text-ink-2">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-accent transition-colors duration-100 hover:text-ink">
          Sign in
        </Link>
      </p>
    </div>
  );
}
