import { DevLogin } from "@/components/hub/dev-login";
import { PageShell, PageTitle } from "@/components/hub/ui";
import { getUsers } from "@/lib/hub/data";
import { getCurrentUser } from "@/lib/hub/session";

export const metadata = { title: "Authorization — Relay" };

export default async function LoginPage({ searchParams }: PageProps<"/login/demo">) {
  const next = (await searchParams).next;
  const [users, current] = await Promise.all([getUsers(), getCurrentUser()]);

  return (
    <PageShell width="narrow">
      <div className="mb-8">
        <h1 className="font-[family-name:var(--font-display)] text-[32px] font-bold tracking-[-0.03em] text-[var(--text-primary)]">
          AUTHORIZE
        </h1>
        <p className="mt-2 text-[var(--text-muted)] max-w-[52ch]">
          Select a user profile to access the routing system. You&apos;ll configure your university and location next.
        </p>
      </div>
      <DevLogin
        next={typeof next === "string" ? next : null}
        currentUserId={current.id}
        users={users.map((u) => ({ id: u.id, name: u.name, email: u.email, detail: `${u.home} · ${u.note}` }))}
      />
    </PageShell>
  );
}
