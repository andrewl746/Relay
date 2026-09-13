import Link from "next/link";
import { GoogleOAuthButton } from "@/components/auth/google-oauth-button";
import { SITE_NAME } from "@/lib/hub/site";

export const metadata = { title: "Create your account" };

export default function RegisterPage() {
  return (
    <div className="gh-card p-6 sm:p-8">
      <h1 className="text-center text-2xl font-normal text-gh-fg">Create your {SITE_NAME} account</h1>
      <p className="mt-2 text-center text-[13px] text-gh-fg-muted">
        We’ll ask you to verify a university email after you sign in with Google.
      </p>

      <div className="mt-6">
        <GoogleOAuthButton label="Sign up with Google" />
      </div>

      <p className="mt-6 text-center text-[13px] text-gh-fg-muted">
        Already have an account?{" "}
        <Link href="/login" className="gh-link">
          Sign in
        </Link>
      </p>
    </div>
  );
}
