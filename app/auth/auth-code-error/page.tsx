import Link from "next/link";
import { PageShell, PageTitle, btnPrimary } from "@/components/hub/ui";

export const metadata = { title: "Sign-in link expired" };

export default async function AuthCodeErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;

  const message =
    reason === "unknown-student"
      ? "That email is verified, but it isn't one of the students in this demo's roster."
      : "That link has expired or was already used. Links only work once.";

  return (
    <PageShell width="narrow">
      <PageTitle title="Couldn't sign you in" lede={message} />
      <Link href="/login" className={btnPrimary}>
        Try again
      </Link>
    </PageShell>
  );
}
