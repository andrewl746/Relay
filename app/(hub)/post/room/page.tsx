import { RoomBundleForm } from "@/components/hub/room-bundle-form";
import { BackLink, PageShell, PageTitle } from "@/components/hub/ui";
import { SetupRequired } from "@/components/onboarding/setup-required";
import { getCurrentUser, getTradeBlocker } from "@/lib/hub/session";

export const metadata = { title: "Post your room" };

export default async function PostRoomPage() {
  const [user, blocker] = await Promise.all([getCurrentUser(), getTradeBlocker()]);
  if (blocker) return <SetupRequired step={blocker} action="post" title="Post your room" />;

  return (
    <PageShell>
      <BackLink href="/post">Post a single item instead</BackLink>
      <PageTitle
        title="Post your room"
        lede="List everything in your room as one bundle. An incoming student claims all of it in a single pickup, so you’re not arranging eight separate handoffs."
      />
      <RoomBundleForm defaultPlace={user.moveStatus === "leaving" ? user.home : ""} />
    </PageShell>
  );
}
