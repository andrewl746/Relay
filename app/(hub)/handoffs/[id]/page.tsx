import { notFound } from "next/navigation";
import { HandoffSummary } from "@/components/hub/handoff-summary";
import { BackLink, PageShell } from "@/components/hub/ui";
import { getHandoff } from "@/lib/hub/data";

export const metadata = { title: "Handoff" };

export default async function HandoffPage({ params }: PageProps<"/handoffs/[id]">) {
  const handoff = await getHandoff((await params).id);
  if (!handoff) notFound();

  return (
    <PageShell width="narrow">
      <BackLink href="/handoffs">All handoffs</BackLink>
      <HandoffSummary listing={handoff.listing} slot={handoff.slot} buyer={handoff.buyer} seller={handoff.seller} />
    </PageShell>
  );
}
