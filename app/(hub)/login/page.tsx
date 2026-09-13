import { DevLogin } from "@/components/hub/dev-login";
import { MagicLinkForm } from "@/components/hub/magic-link-form";
import { PageShell, PageTitle } from "@/components/hub/ui";
import { getUniversity, getUsers } from "@/lib/hub/data";
import { moveLine } from "@/lib/hub/format";
import { getCurrentUser } from "@/lib/hub/session";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : null;
  const dev = params.dev === "1";

  const [users, university, current] = await Promise.all([getUsers(), getUniversity(), getCurrentUser()]);

  if (dev) {
    return (
      <PageShell width="narrow">
        <PageTitle
          title="Choose a student"
          lede="Dev picker — this is a demo. Pick a student to see the app the way they would."
        />
        <DevLogin
          next={next}
          currentUserId={current.id}
          domain={university.emailDomain}
          users={users.map((u) => ({ id: u.id, name: u.name, email: u.email, detail: `${moveLine(u)} · ${u.note}` }))}
        />
      </PageShell>
    );
  }

  return (
    <PageShell width="narrow">
      <PageTitle
        title="Sign in"
        lede="No password. We'll email you a link — click it and you're in."
      />
      <MagicLinkForm domain={university.emailDomain} next={next} />
    </PageShell>
  );
}
