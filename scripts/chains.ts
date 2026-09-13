/**
 * Print computed chains to the terminal. Run: npm run chains [-- --remove p12]
 *
 * This is the algorithm's ground truth. The UI renders exactly what this prints.
 */
import { dataset, matches } from '../lib/data.ts'
import { assignAll } from '../lib/assign.ts'
import { config } from '../lib/config.ts'

const args = process.argv.slice(2)
const removeIdx = args.indexOf('--remove')
const excludePersonIds =
  removeIdx === -1 ? [] : args.slice(removeIdx + 1).filter((a) => !a.startsWith('--'))

const data = dataset()
const table = matches()

const t0 = Date.now()
const chains = assignAll(data, table, { excludePersonIds })
const ms = Date.now() - t0

const peopleById = new Map(data.people.map((p) => [p.id, p]))
const itemsById = new Map(data.items.map((i) => [i.id, i]))

const placed = chains.filter((c) => c.hops.length > 0)
const totalHops = placed.reduce((s, c) => s + c.hops.length, 0)
const totalGap = placed.reduce((s, c) => s + c.totalGapDays, 0)

if (excludePersonIds.length) {
  console.log(
    `excluded: ${excludePersonIds
      .map((id) => `${peopleById.get(id)?.label ?? id} (${id})`)
      .join(', ')}\n`,
  )
}

console.log(
  `assigned in ${ms}ms — ${placed.length}/${chains.length} ${config.ui.itemNounPlural} placed, ` +
    `${totalHops} ${config.ui.handoffNoun}s, ${totalGap} ${config.ui.gapLabel} total\n`,
)

// Longest chains first: those are the ones worth looking at.
placed.sort((a, b) => b.hops.length - a.hops.length || b.value - a.value)

for (const chain of placed.slice(0, 8)) {
  const item = itemsById.get(chain.itemId)!
  const holder = peopleById.get(item.holderId)
  console.log(`${chain.itemId}  ${item.rawText.slice(0, 72)}`)
  console.log(
    `      held by ${holder?.label} (${holder?.location}), free ${item.freeFrom} -> ${item.freeUntil}`,
  )
  for (const hop of chain.hops) {
    const person = peopleById.get(hop.personId)
    const gap =
      hop.gapDays > 0 ? `  [${hop.gapDays} ${config.ui.gapLabel}]` : '  [no gap]'
    console.log(
      `      ${hop.from} -> ${hop.to}  ${(person?.label ?? hop.personId).padEnd(12)} ` +
        `${(person?.location ?? '').padEnd(11)} score ${hop.matchScore.toFixed(3)}${gap}`,
    )
    console.log(`        ^ ${hop.reason}`)
  }
  console.log(
    `      value ${chain.value.toFixed(3)}  |  ${chain.totalGapDays} ${config.ui.gapLabel}, ` +
      `${chain.totalDistance} cross-area moves, match sum ${chain.totalMatchScore.toFixed(2)}\n`,
  )
}
