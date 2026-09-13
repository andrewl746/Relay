import Link from "next/link";
import { GoogleOAuthButton } from "@/components/auth/google-oauth-button";
import { SITE_NAME } from "@/lib/hub/site";

export const metadata = { title: "Sign in" };

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return <LoginCard searchParams={searchParams} />;
}

async function LoginCard({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : null;

  return (
    <div className="gh-card p-6 sm:p-8">
      <h1 className="text-center text-2xl font-normal text-gh-fg">Sign in to {SITE_NAME}</h1>

      {error && (
        <p className="gh-flash-error mt-5">
          That didn’t work. {error === "access_denied" ? "You cancelled the Google sign-in." : error}
        </p>
      )}

      <div className="mt-6">
        <GoogleOAuthButton label="Continue with Google" />
      </div>

      <p className="mt-6 text-center text-[13px] text-gh-fg-muted">
        First time here?{" "}
        <Link href="/register" className="gh-link">
          Create an account
        </Link>
      </p>

      <div className="mt-4 border-t border-gh-border-muted pt-4 text-center">
        <Link href="/login/demo" className="text-[13px] text-gh-fg-muted hover:text-gh-fg">
          Running the demo? Skip sign-in →
        </Link>
      </div>
    </div>
  );
}
