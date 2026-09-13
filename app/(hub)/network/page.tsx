import { PageShell, PageTitle } from "@/components/hub/ui";
import Board from "@/components/network/board";
import { snapshot } from "@/lib/relay/store";

export const metadata = { title: "Network" };

export default function NetworkPage() {
  const snap = snapshot();

  // Embeddings stay on the server. Retrieval and rerank are already baked into
  // the match table, so the browser needs only the table and the entities; the
  // DP then runs client-side, which is what makes "remove this person" instant.
  const lean = {
    people: snap.data.people,
    items: snap.data.items.map((item) => ({ ...item, embedding: [] as number[] })),
    needs: snap.data.needs.map((need) => ({ ...need, embedding: [] as number[] })),
  };

  return (
    <PageShell>
      <PageTitle
        title="The network"
        lede="Every object on the network and where the route sends it this term. Remove a person to watch the schedule re-plan around them."
      />
      <Board data={lean} table={snap.table} />
    </PageShell>
  );
}
