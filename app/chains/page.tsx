import { dataset, matches } from '@/lib/data'
import { config } from '@/lib/config'
import Board from './board'

export default function Page() {
  const data = dataset()
  const table = matches()

  // Embeddings stay on the server — retrieval and rerank are already baked into
  // the match table, so the browser only needs the table and the entities. The
  // DP then runs client-side, which is what makes "remove this person" instant.
  const lean = {
    people: data.people,
    items: data.items.map(({ embedding, ...rest }) => ({
      ...rest,
      embedding: [] as number[],
    })),
    needs: data.needs.map(({ embedding, ...rest }) => ({
      ...rest,
      embedding: [] as number[],
    })),
  }

  return (
    <main className="flex-1 px-6 py-5 md:px-10">
      <header className="mb-5">
        <h1 className="text-4xl font-semibold tracking-tight">
          {config.ui.productName}
        </h1>
        <p className="text-sm text-neutral-500">{config.ui.tagline}</p>
      </header>
      <Board data={lean} table={table} />
    </main>
  )
}
