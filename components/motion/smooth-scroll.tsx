'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'

/**
 * Lenis smooth scroll.
 *
 * Mounted once at the root. Two things it must not break:
 *
 *   1. prefers-reduced-motion. Smoothed scrolling is exactly the kind of motion
 *      that triggers vestibular symptoms, so we simply never start Lenis for
 *      those users and leave native scrolling alone.
 *   2. In-page anchors and focus. Lenis hijacks the scroll position, so
 *      `scroll-behavior: smooth` in CSS would fight it — the stylesheet leaves
 *      that alone and lets Lenis own scrolling entirely.
 */
export function SmoothScroll() {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (reduce.matches) return

    const lenis = new Lenis({
      duration: 1.05,
      // Slightly weighted easing — this is a site about moving heavy objects.
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      // Never smooth touch: it makes phones feel broken and laggy.
      syncTouch: false,
    })

    let frame = 0
    const raf = (time: number) => {
      lenis.raf(time)
      frame = requestAnimationFrame(raf)
    }
    frame = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(frame)
      lenis.destroy()
    }
  }, [])

  return null
}
