/**
 * Stencil art for the interest picker.
 *
 * Inline SVG rather than image files on purpose: no network request, nothing to
 * 404 on venue wifi, and it inherits currentColor so it recolours with the
 * theme. Drawn as flat shapes with a heavy stroke, like something sprayed
 * through a stencil onto a box.
 */

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 96 96" aria-hidden className="size-full">
      {children}
    </svg>
  )
}

const ART: Record<string, React.ReactNode> = {
  'school-supplies': (
    <Frame>
      <g {...stroke}>
        <path d="M25 22h40a6 6 0 0 1 6 6v48H31a6 6 0 0 1-6-6V22Z" />
        <path d="M71 28h10v48H71" />
        <path d="M37 38h22M37 50h22" />
      </g>
    </Frame>
  ),
  'kitchen-supplies': (
    <Frame>
      <g {...stroke}>
        <path d="M26 40h44v30a6 6 0 0 1-6 6H32a6 6 0 0 1-6-6V40Z" />
        <path d="M26 40h44" />
        <path d="M38 40V24M58 40V24" />
        <path d="M70 48h8a6 6 0 0 1 0 12h-8" />
      </g>
    </Frame>
  ),
  hygiene: (
    <Frame>
      <g {...stroke}>
        <path d="M38 34h20v40a4 4 0 0 1-4 4H42a4 4 0 0 1-4-4V34Z" />
        <path d="M42 34V22h12v12" />
        <path d="M38 50h20" />
      </g>
    </Frame>
  ),
  furniture: (
    <Frame>
      <g {...stroke}>
        <path d="M20 46h56" />
        <path d="M20 46V34a4 4 0 0 1 4-4h48a4 4 0 0 1 4 4v12" />
        <path d="M26 46v26M70 46v26" />
        <path d="M30 58h36" />
      </g>
    </Frame>
  ),
  electronics: (
    <Frame>
      <g {...stroke}>
        <rect x="18" y="24" width="60" height="40" rx="4" />
        <path d="M40 76h16M48 64v12" />
        <path d="M30 36h20" />
      </g>
    </Frame>
  ),
  other: (
    <Frame>
      <g {...stroke}>
        <path d="M18 38 48 24l30 14-30 14-30-14Z" />
        <path d="M18 38v24l30 14 30-14V38" />
        <path d="M48 52v24" />
      </g>
    </Frame>
  ),
}

export function InterestArt({ id }: { id: string }) {
  return <>{ART[id] ?? ART.other}</>
}
