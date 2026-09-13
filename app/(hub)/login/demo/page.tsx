import { DevLogin } from "@/components/hub/dev-login";
import { PageShell, PageTitle } from "@/components/hub/ui";
import { getUniversity, getUsers } from "@/lib/hub/data";
import { moveLine } from "@/lib/hub/format";
import { getCurrentUser } from "@/lib/hub/session";

export const metadata = { title: "Choose a student" };

export default async function LoginPage({ searchParams }: PageProps<"/login/demo">) {
  const next = (await searchParams).next;
  const [users, university, current] = await Promise.all([getUsers(), getUniversity(), getCurrentUser()]);

  return (
    <PageShell width="narrow">
      <PageTitle
        title="Choose a student"
        lede="This is a demo, so there’s no password. Pick a student to see the app the way they would."
      />
      <DevLogin
        next={typeof next === "string" ? next : null}
        currentUserId={current.id}
        domain={university.emailDomain}
        users={users.map((u) => ({ id: u.id, name: u.name, email: u.email, detail: `${moveLine(u)} · ${u.note}` }))}
      />
    </PageShell>
  );
}
