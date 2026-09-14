import Link from 'next/link'
import { PlainHeader } from '@/components/hub/plain-header'
import { btnPrimary, btnSecondary } from '@/components/hub/ui'
import { Belt } from '@/components/motion/belt'
import { Conveyor, Crate, Stamp } from '@/components/motion/box'

export const metadata = {
  title: 'Relay — borrow it from someone down the hall',
  description:
    'The stuff you need once and can’t justify buying. Borrow it from a student in your building for a few dollars a day, or sell what you’re not taking with you.',
}

const STEPS = [
  {
    n: '01',
    title: 'Say what you need',
    body: 'Type it how you’d say it out loud — "need a drill saturday, putting up shelves". No categories, no filters.',
    // Three blues by hue, not lightness, so --on-accent keeps its contrast:
    // white 5.8–6.4:1 in light, black 7.4–7.8:1 in dark.
    color: 'oklch(from var(--accent) l c calc(h - 20))',
  },
  {
    n: '02',
    title: 'See who has one free',
    body: 'Someone in your building or the next street over. You get their name, the area, which days it’s free, and what it costs.',
    color: 'var(--accent)',
  },
  {
    n: '03',
    title: 'Pick it up, bring it back',
    body: 'Agree a time, collect it, return it on the date you both agreed. Buying something outright works the same way, minus the return.',
    color: 'oklch(from var(--accent) l c calc(h + 15))',
  },
]

const BELT_A: { name: string; price: string; unit?: string }[] = [
  { name: 'Power drill', price: '$4', unit: '/day' },
  { name: 'Carpet cleaner', price: '$12', unit: '/day' },
  { name: 'Step ladder', price: '$5', unit: '/day' },
  { name: 'Projector', price: '$8', unit: '/day' },
  { name: 'Hand truck', price: '$8', unit: '/day' },
  { name: 'Sewing machine', price: '$5', unit: '/day' },
  { name: 'Air mattress', price: '$5', unit: '/day' },
]

const BELT_B: { name: string; price: string; unit?: string }[] = [
  { name: 'Mini fridge', price: '$45' },
  { name: 'Big suitcase', price: '$3', unit: '/day' },
  { name: 'Brita filter', price: '$12' },
  { name: 'Stand mixer', price: '$6', unit: '/day' },
  { name: 'Desk lamp', price: '$8' },
  { name: 'Camping stove', price: '$6', unit: '/day' },
  { name: 'Kettle + toaster', price: '$20' },
]

const BORROW = [
  { item: 'Power drill', price: '$4', unit: '/day', note: 'for the one afternoon of shelves' },
  { item: 'Carpet cleaner', price: '$12', unit: '/day', note: 'before the end-of-lease inspection' },
  { item: 'Step ladder', price: '$5', unit: '/day', note: 'lightbulbs, curtains, smoke alarm' },
  { item: 'Hand truck', price: '$8', unit: '/day', note: 'move-in day, once' },
  { item: 'Projector', price: '$8', unit: '/day', note: 'for one movie night' },
  { item: 'Big suitcase', price: '$3', unit: '/day', note: 'twice a year, going home' },
]

const BUY = [
  { item: 'Mini fridge', price: '$45' },
  { item: 'Kettle + toaster', price: '$20' },
  { item: 'Brita filter', price: '$12' },
  { item: 'Desk lamp', price: '$8' },
]

const REASSURANCE = [
  {
    title: 'Students only',
    body: 'You sign up with your university email, so everyone here is someone you could run into on campus.',
  },
  {
    title: 'You keep the money',
    body: 'Relay shows the price and the dates. You and the other person settle it however you like — we never touch your payments.',
  },
  {
    title: 'It comes back',
    body: 'Every loan has a return date agreed up front, and you always know who it goes to next.',
  },
]

/**
 * The hero's motion: a parcel working its way down a route, pausing at each
 * door it's handed to. SVG + SMIL rather than JS, because the hero must never
 * depend on hydration. The three curves are mirror images of one another, so
 * the stops sit at exactly a third of the path each and keyPoints can pause
 * on them. Reduced motion keeps the route and drops the parcel.
 */
const ROUTE = 'M30 20 C30 85 130 85 130 150 S30 215 30 280 S130 345 130 410'
const STOPS = [[30, 20], [130, 150], [30, 280], [130, 410]]

function RelayRoute({ className, begin }: { className: string; begin: string }) {
  const timing = { dur: '9s', begin, repeatCount: 'indefinite' }
  return (
    <svg aria-hidden viewBox="0 0 160 430" className={`pointer-events-none absolute hidden h-[430px] w-[160px] lg:block ${className}`}>
      <path d={ROUTE} fill="none" stroke="var(--border-strong)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="0 9" />
      {STOPS.map(([x, y]) => (
        <circle key={y} cx={x} cy={y} r="6" fill="var(--bg)" stroke="var(--ink-3)" strokeWidth="2" />
      ))}
      <g className="motion-reduce:hidden" opacity="0">
        <rect x="-9" y="-9" width="18" height="18" rx="3" fill="var(--accent)" />
        <path d="M-9 -3h18M0 -9v6" stroke="var(--bg)" strokeWidth="1.5" opacity="0.6" />
        <animateMotion {...timing} path={ROUTE} calcMode="linear" keyPoints="0;0;0.3333;0.3333;0.6667;0.6667;1;1" keyTimes="0;0.1;0.3;0.4;0.6;0.7;0.9;1" />
        <animate {...timing} attributeName="opacity" values="0;1;1;0" keyTimes="0;0.08;0.92;1" />
      </g>
    </svg>
  )
}

export default function LandingPage() {
  return (
    // clip, not hidden: overflow-hidden makes a scroll container, which would
    // stop the sticky header sticking. No background — the kraft grain behind
    // the page is the ground, same as every signed-in screen.
    <div className="overflow-x-clip text-ink">
      {/* Sign in and Get started are the same Google flow; they land on /login
          and /register so the copy matches what the person clicked. */}
      <PlainHeader>
        <Link
          href="/login"
          className="px-2 py-3 text-[17px] font-semibold text-ink-2 transition-colors duration-100 hover:text-ink"
        >
          Sign in
        </Link>
        <Link href="/register" className={btnPrimary}>
          Get started
        </Link>
      </PlainHeader>

      {/* Hero */}
      <section className="relative mx-auto flex max-w-[1120px] flex-col items-center px-5 pt-20 pb-16 text-center sm:px-6 sm:pt-24">
        <RelayRoute className="top-12 left-[2%]" begin="0s" />
        <RelayRoute className="top-24 right-[2%] -scale-x-100" begin="-4.5s" />

        {/* CSS-driven, not motion: the hero must never depend on hydration.
            A JS entry animation starts at opacity 0, so any hiccup leaves the
            headline blank — which happened repeatedly while building this.
            These keyframes run without JS and always end visible. */}
        <div className="anim-slide">
          <h1 className="stencil max-w-[13ch] text-[clamp(44px,8.5vw,84px)] leading-[1.3]">
            Why buy, when you can borrow?
          </h1>
        </div>

        <div className="anim-slide" style={{ animationDelay: "90ms" }}>
          <p className="mx-auto mt-7 max-w-[520px] text-[18px] leading-relaxed text-ink-2">
            You need a wrench for one Saturday afternoon. Buying one costs $25
            and then it lives in your closet forever. Someone on campus has one - and they can borrow it to you for {" "}
            <strong className="mark font-semibold">$2 a day</strong>.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/register" className={btnPrimary}>
              Find what you need
            </Link>
            <Link href="/post" className={btnSecondary}>
              Lend out your stuff
            </Link>
          </div>

          <p className="mt-4 text-[13px] text-ink-2">
            Free to join for university students.
          </p>
        </div>
      </section>

      {/* The belt: what is actually moving around a building right now. Two
          rows running opposite ways, full-bleed on purpose. */}
      <section
        aria-label="Things students are lending right now"
        className="space-y-3 pb-16"
      >
        <Belt items={BELT_A} direction="left" seconds={42} />
        <Belt items={BELT_B} direction="right" seconds={50} />
      </section>

      <div className="mx-auto max-w-[var(--page-max)] space-y-16 px-5 pb-20 sm:px-6">
        {/* How it works */}
        <section className="board px-6 py-14 sm:px-10">
          <h2 className="stencil mb-12 text-center text-[clamp(26px,4vw,40px)]">
            How it works
          </h2>
          <Conveyor className="grid gap-8 sm:grid-cols-3">
            {STEPS.map((s) => (
              <Crate key={s.n}>
                <div
                  className="data mb-4 inline-flex size-9 items-center justify-center rounded-sm text-[13px] font-bold text-on-accent"
                  style={{ background: s.color }}
                >
                  {s.n}
                </div>
                <h3 className="mb-3 text-[19px] font-semibold">{s.title}</h3>
                <p className="text-[15px] leading-relaxed text-ink-2">
                  {s.body}
                </p>
              </Crate>
            ))}
          </Conveyor>
        </section>

        {/* What you can borrow */}
        <section>
          <h2 className="stencil mb-3 text-[clamp(26px,4vw,40px)]">
            Stuff you need once
          </h2>
          <p className="mb-10 max-w-[560px] text-[16px] text-ink-2">
            Nobody needs four of these per building. Borrow one for a day or
            two, then it goes back and someone else gets a turn.
          </p>

          <Conveyor className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BORROW.map((b) => (
              <Crate
                key={b.item}
                className="board flex items-start justify-between gap-4 p-5"
              >
                <div>
                  <div className="text-[17px] font-semibold">{b.item}</div>
                  <div className="mt-1 text-[14px] text-ink-2">{b.note}</div>
                </div>
                <div className="shrink-0 text-right">
                  <span className="data text-[22px] font-semibold">
                    {b.price}
                  </span>
                  <span className="data text-[13px] text-ink-2">{b.unit}</span>
                </div>
              </Crate>
            ))}
          </Conveyor>
        </section>

        {/* Moving out */}
        <section className="board grid items-center gap-10 px-6 py-12 sm:px-10 lg:grid-cols-2">
          <div>
            <h2 className="stencil mb-4 text-[clamp(26px,4vw,40px)]">
              Moving out? Don&rsquo;t bin it.
            </h2>
            <p className="mb-6 text-[16px] leading-relaxed text-ink-2">
              The water filter, the kettle, the mini fridge — you&rsquo;re not
              taking them home and someone moving in this week would rather pay
              you than pay full price. List it in about a minute.
            </p>
            <Link
              href="/post"
              className="text-[15px] font-semibold text-accent transition-colors duration-100 hover:text-ink"
            >
              List something you&rsquo;re leaving behind →
            </Link>
          </div>

          {/* Inset wells, not cards on a card. */}
          <Conveyor className="grid gap-2">
            {BUY.map((b) => (
              <Crate
                key={b.item}
                className="flex items-center justify-between rounded-md bg-surface-2 px-5 py-4"
              >
                <span className="text-[16px] font-medium">{b.item}</span>
                <span className="data text-[18px] font-semibold">
                  {b.price}
                </span>
              </Crate>
            ))}
          </Conveyor>
        </section>

        {/* Reassurance */}
        <section className="board px-6 py-10 sm:px-10">
          <Conveyor className="grid gap-8 sm:grid-cols-3">
            {REASSURANCE.map((r) => (
              <Crate key={r.title} className="border-t-2 border-accent pt-5">
                <h3 className="mb-2 text-[17px] font-semibold">{r.title}</h3>
                <p className="text-[15px] leading-relaxed text-ink-2">
                  {r.body}
                </p>
              </Crate>
            ))}
          </Conveyor>
        </section>

        {/* Final CTA */}
        <section className="board px-6 py-16 text-center">
          <Stamp className="mb-6">
            <span className="border border-border-strong bg-surface-2 px-3 py-1.5 text-[13px] font-semibold tracking-[0.02em] text-ink-2">
              Free to join
            </span>
          </Stamp>
          <h2 className="stencil mx-auto mb-4 max-w-[720px] text-[clamp(28px,4.5vw,44px)] leading-[1.1]">
            Don&rsquo;t waste your money.
          </h2>
          <p className="mx-auto mb-9 max-w-[460px] text-[16px] text-ink-2">
            Let&rsquo;s try and spend a litte less cash, alright?
          </p>
          <Link href="/register" className={btnPrimary}>
            Get started
          </Link>
        </section>
      </div>
    </div>
  );
}
