import { RoomBundleForm } from "@/components/hub/room-bundle-form";
import { BackLink, PageShell, PageTitle } from "@/components/hub/ui";
import { getCurrentUser } from "@/lib/hub/session";

export const metadata = { title: "Post your room" };

export default async function PostRoomPage() {
  const user = await getCurrentUser();

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
