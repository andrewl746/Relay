import Link from "next/link";
import { PostItemForm } from "@/components/hub/post-item-form";
import { btnSecondary, PageShell, PageTitle } from "@/components/hub/ui";
import { SetupRequired } from "@/components/onboarding/setup-required";
import { getCurrentUser, getTradeBlocker } from "@/lib/hub/session";

export const metadata = { title: "Post an item" };

export default async function PostPage() {
  const [user, blocker] = await Promise.all([getCurrentUser(), getTradeBlocker()]);
  if (blocker) return <SetupRequired step={blocker} action="post" title="Post an item" />;

  return (
    <PageShell>
      <PageTitle title="Post an item" lede="List an item for sale or borrow across campus." />

      <div className="board mb-10 flex flex-wrap items-center justify-between gap-4 px-5 py-4">
        <div>
          <p className="font-semibold">Moving out with a whole room?</p>
          <p className="text-[13px] text-ink-2">List everything at once. One student picks it all up.</p>
        </div>
        <Link href="/post/room" className={btnSecondary}>
          Post my room instead
        </Link>
      </div>

      <PostItemForm defaultPlace={user.home} />
    </PageShell>
  );
}
