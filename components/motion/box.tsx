'use client'

import { motion, useReducedMotion, type HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'

/**
 * Cardboard motion.
 *
 * The rule: everything moves like board, not like software. Flaps hinge, boxes
 * land with weight, stamps press. Nothing cross-fades, nothing floats, nothing
 * eases languidly — a box either is somewhere or it isn't.
 *
 * Every primitive here honours prefers-reduced-motion by collapsing to an
 * instant state change rather than a slower version of the same thing. A
 * vestibular-sensitive user does not want a gentler rotateX.
 */

const EASE_BOX = [0.34, 1.28, 0.64, 1] as const // slight overshoot = weight

/** A panel hinging open like the flap of a box. Use for cards and answers. */
export function FlapIn({
  children,
  delay = 0,
  className,
  ...rest
}: { children: ReactNode; delay?: number } & HTMLMotionProps<'div'>) {
  const still = useReducedMotion()
  return (
    <motion.div
      className={className}
      style={{ transformOrigin: 'top center', transformPerspective: 700 }}
      initial={still ? { opacity: 0 } : { opacity: 0, rotateX: -72 }}
      animate={still ? { opacity: 1 } : { opacity: 1, rotateX: 0 }}
      transition={still ? { duration: 0 } : { duration: 0.26, delay, ease: EASE_BOX }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

/**
 * A lighter entry: lifts into place without hinging.
 *
 * Use this for text. A flap is a *panel* gesture — hinging a whole headline
 * through 72 degrees reads as broken rather than physical, and the skew makes
 * large type unreadable for the whole transition. Reserve FlapIn for things
 * that are actually shaped like a flap.
 */
export function SlideUp({
  children,
  delay = 0,
  className,
  ...rest
}: { children: ReactNode; delay?: number } & HTMLMotionProps<'div'>) {
  const still = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={still ? { opacity: 0 } : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={still ? { duration: 0 } : { duration: 0.3, delay, ease: EASE_BOX }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

/**
 * A list arriving on a conveyor: each row slides in behind the one before it.
 * Stagger is capped so a long feed doesn't take a second and a half to appear.
 */
export function Conveyor({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const still = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial="off"
      animate="on"
      variants={{
        on: { transition: { staggerChildren: still ? 0 : 0.035 } },
      }}
    >
      {children}
    </motion.div>
  )
}

/** One row on the conveyor. Must be inside <Conveyor>. */
export function Crate({
  children,
  className,
  ...rest
}: { children: ReactNode } & HTMLMotionProps<'div'>) {
  const still = useReducedMotion()
  return (
    <motion.div
      className={className}
      variants={{
        off: still ? { opacity: 0 } : { opacity: 0, y: 12 },
        on: { opacity: 1, y: 0 },
      }}
      transition={still ? { duration: 0 } : { duration: 0.24, ease: EASE_BOX }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

/**
 * A rubber stamp hitting the box: overshoots, settles, and stays a couple of
 * degrees off-square. The one piece of delight, reserved for confirmations.
 */
export function Stamp({
  children,
  className,
  angle = -1.5,
}: {
  children: ReactNode
  className?: string
  angle?: number
}) {
  const still = useReducedMotion()
  return (
    <motion.span
      className={className}
      style={{ display: 'inline-block' }}
      initial={still ? { opacity: 0 } : { opacity: 0, scale: 1.18, rotate: angle - 1.5 }}
      animate={{ opacity: 1, scale: 1, rotate: angle }}
      transition={still ? { duration: 0 } : { duration: 0.3, ease: EASE_BOX }}
    >
      {children}
    </motion.span>
  )
}

/**
 * Pressable board. On press it sinks into its own edge shadow, the way pushing
 * a corrugated panel actually feels, instead of scaling like a bubble.
 */
export function PressBox({
  children,
  className,
  ...rest
}: { children: ReactNode } & HTMLMotionProps<'button'>) {
  const still = useReducedMotion()
  return (
    <motion.button
      className={className}
      whileHover={still ? undefined : { y: -1 }}
      whileTap={still ? undefined : { y: 2, boxShadow: '0 0 0 var(--kraft-300)' }}
      transition={{ duration: 0.09, ease: 'easeOut' }}
      {...rest}
    >
      {children}
    </motion.button>
  )
}
