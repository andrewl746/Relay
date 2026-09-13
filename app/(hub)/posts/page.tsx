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
            <section className="mb-8">
              <h2 className="t-eyebrow border-b border-rule-strong pb-2 text-ink-2">
                Live · {live.length} {live.length === 1 ? "post" : "posts"}
              </h2>
              <ul className="-mx-4 sm:mx-0">
                {live.map((l) => (
                  <MyListingRow key={l.id} listing={l} />
                ))}
              </ul>
            </section>
          )}

          {claimed.length > 0 && (
            <section className="mb-8">
              <h2 className="t-eyebrow border-b border-rule-strong pb-2 text-ink-2">
                Claimed, pickup pending · {claimed.length}
              </h2>
              <ul className="-mx-4 sm:mx-0">
                {claimed.map((l) => (
                  <MyListingRow key={l.id} listing={l} />
                ))}
              </ul>
            </section>
          )}

          {removed.length > 0 && (
            <section>
              <h2 className="t-eyebrow border-b border-rule-strong pb-2 text-ink-2">Removed · {removed.length}</h2>
              <ul className="-mx-4 sm:mx-0">
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
