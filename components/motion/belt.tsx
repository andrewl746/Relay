'use client'

import { motion, useReducedMotion } from 'motion/react'

export type BeltItem = { name: string; price: string; unit?: string }

/**
 * A conveyor belt of boxes crossing the hero.
 *
 * The list is rendered twice back to back and the track is translated by
 * exactly -50%, so the second copy lands where the first started and the loop
 * is seamless — no snap, no gap, and no need to measure anything at runtime.
 *
 * Reduced motion gets a static, wrapped row instead of a frozen belt: a
 * stopped conveyor reads as broken, whereas a plain row reads as a list.
 */
export function Belt({
  items,
  direction = 'left',
  seconds = 38,
}: {
  items: BeltItem[]
  direction?: 'left' | 'right'
  seconds?: number
}) {
  const still = useReducedMotion()

  if (still) {
    return (
      <div className="flex flex-wrap justify-center gap-3 px-4">
        {items.map((it) => (
          <Box key={it.name} {...it} />
        ))}
      </div>
    )
  }

  const doubled = [...items, ...items]
  const from = direction === 'left' ? '0%' : '-50%'
  const to = direction === 'left' ? '-50%' : '0%'

  return (
    <div
      className="group relative overflow-hidden py-1"
      style={{
        maskImage:
          'linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)',
        WebkitMaskImage:
          'linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)',
      }}
    >
      <motion.div
        className="flex w-max gap-3"
        initial={{ x: from }}
        animate={{ x: to }}
        transition={{ duration: seconds, ease: 'linear', repeat: Infinity }}
      >
        {doubled.map((it, i) => (
          <Box key={`${it.name}-${i}`} {...it} aria-hidden={i >= items.length} />
        ))}
      </motion.div>
    </div>
  )
}

function Box({
  name,
  price,
  unit,
  ...rest
}: BeltItem & { 'aria-hidden'?: boolean }) {
  return (
    <div
      {...rest}
      className="flex shrink-0 items-center gap-3 rounded-[4px] border border-[var(--kraft-300)] bg-[var(--kraft-100)] px-4 py-3"
      style={{ boxShadow: '0 2px 0 var(--kraft-300)' }}
    >
      {/* box-flap glyph: the lid seam of a carton, seen head on */}
      <span aria-hidden className="text-[var(--kraft-400)]">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 8h18v12H3zM3 8l3-4h12l3 4M12 4v16" />
        </svg>
      </span>
      <span className="text-[15px] font-semibold whitespace-nowrap text-[var(--ink)]">
        {name}
      </span>
      <span className="data whitespace-nowrap text-[14px] font-semibold text-[var(--amber)]">
        {price}
        {unit ? <span className="text-[var(--ink-2)]">{unit}</span> : null}
      </span>
    </div>
  )
}
