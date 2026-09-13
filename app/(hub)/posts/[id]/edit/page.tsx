import { notFound } from "next/navigation";
import { EditListingForm } from "@/components/hub/edit-listing-form";
import { BackLink, PageShell, PageTitle } from "@/components/hub/ui";
import { getListing } from "@/lib/hub/data";
import { getCurrentUser } from "@/lib/hub/session";

export const metadata = { title: "Edit listing" };

export default async function EditListingPage({ params }: PageProps<"/posts/[id]/edit">) {
  const { id } = await params;
  const [listing, user] = await Promise.all([getListing(id), getCurrentUser()]);

  if (!listing || listing.sellerId !== user.id || listing.status !== "available") notFound();

  return (
    <PageShell width="narrow">
      <BackLink href="/posts">My posts</BackLink>
      <PageTitle title="Edit listing" lede="Make your changes, then confirm — or cancel to leave it as it was." />
      <EditListingForm listing={listing} />
    </PageShell>
  );
}
