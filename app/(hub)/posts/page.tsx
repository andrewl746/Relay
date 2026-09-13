import Link from "next/link";
import { MyListingRow } from "@/components/hub/my-listing-row";
import { btnSecondary, EmptyState, PageShell, PageTitle } from "@/components/hub/ui";
import { getMyListings } from "@/lib/hub/data";
import { getCurrentUser } from "@/lib/hub/session";

export const metadata = { title: "My posts" };

export default async function MyPostsPage() {
  const user = await getCurrentUser();
  const myListings = await getMyListings(user.id);
  const live = myListings.filter((l) => l.status === "available");
  const claimed = myListings.filter((l) => l.status === "claimed");
  const removed = myListings.filter((l) => l.status === "removed");

  return (
    <PageShell width="narrow">
      <PageTitle
        title="My posts"
        lede="Everything you've put up for offer. Once a claim is confirmed on both sides, it comes off this list on its own."
      />

      {myListings.length === 0 ? (
        <EmptyState title="You haven't posted anything yet.">
          <p>List your first item and it'll show up here.</p>
          <Link href="/post" className={`${btnSecondary} mt-4`}>
            Post an item
          </Link>
        </EmptyState>
      ) : (
        <>
          {live.length > 0 && (
            <section className="board mb-6 overflow-hidden">
              <h2 className="border-b border-border px-5 py-3.5 text-[19px] font-semibold tracking-[-0.01em] text-ink">
                Live · {live.length} {live.length === 1 ? "post" : "posts"}
              </h2>
              <ul className="divide-y divide-border">
                {live.map((l) => (
                  <MyListingRow key={l.id} listing={l} />
                ))}
              </ul>
            </section>
          )}

          {claimed.length > 0 && (
            <section className="board mb-6 overflow-hidden">
              <h2 className="border-b border-border px-5 py-3.5 text-[19px] font-semibold tracking-[-0.01em] text-ink">
                Claimed, pickup pending · {claimed.length}
              </h2>
              <ul className="divide-y divide-border">
                {claimed.map((l) => (
                  <MyListingRow key={l.id} listing={l} />
                ))}
              </ul>
            </section>
          )}

          {removed.length > 0 && (
            <section className="board overflow-hidden">
              <h2 className="border-b border-border px-5 py-3.5 text-[19px] font-semibold tracking-[-0.01em] text-ink">Removed · {removed.length}</h2>
              <ul className="divide-y divide-border">
                {removed.map((l) => (
                  <MyListingRow key={l.id} listing={l} />
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </PageShell>
  );
}
