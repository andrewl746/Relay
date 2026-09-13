import { SettingsForm, type SettingsDefaults } from "@/components/hub/settings-form";
import { PageShell, PageTitle } from "@/components/hub/ui";
import { getUsers } from "@/lib/hub/data";
import { getCurrentUser } from "@/lib/hub/session";
import { deleteAccount, signOut } from "@/lib/supabase/actions";
import { getMyProfile, getSupabaseUser } from "@/lib/supabase/session";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const [user, authUser, demoUsers] = await Promise.all([
    getCurrentUser(),
    getSupabaseUser(),
    getUsers(),
  ]);

  // Signed in with Supabase: read the real profile. Demo mode: show what the
  // demo user has, so the page is still explorable without auth configured.
  const profile = authUser ? await getMyProfile() : null;

  const googlePhoto =
    (authUser?.user_metadata?.avatar_url as string | undefined) ??
    (authUser?.user_metadata?.picture as string | undefined) ??
    null;

  const defaults: SettingsDefaults = {
    fullName: profile?.full_name ?? user.name,
    email: profile?.university_email ?? authUser?.email ?? user.email,
    universityId: profile?.university_id ?? user.universityId ?? null,
    livingSituation: profile?.living_situation ?? null,
    street: profile?.street ?? null,
    city: profile?.city ?? null,
    province: profile?.province ?? null,
    country: profile?.country ?? null,
    postalCode: profile?.postal_code ?? null,
    avatarUrl: (profile as { avatar_url?: string | null } | null)?.avatar_url ?? googlePhoto,
  };

  return (
    <PageShell>
      <PageTitle title="Settings" lede="Your profile, where you are, and how Relay looks." />
      <div className="max-w-[720px]">
        <SettingsForm
          defaults={defaults}
          deleteAction={deleteAccount}
          signOutAction={signOut}
          signedIn={Boolean(authUser)}
          currentUserId={user.id}
          demoUsers={demoUsers.map((u) => ({ id: u.id, label: `${u.name} · ${u.moveStatus}` }))}
        />
      </div>
    </PageShell>
  );
}
