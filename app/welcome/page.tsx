import Image from 'next/image'
import Link from 'next/link'
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
    color: 'var(--kand-blue)',
  },
  {
    n: '02',
    title: 'We find who has one',
    body: 'Someone in your building or the next street over. You get a name, an address, the days it’s free, and what it costs.',
    color: 'var(--kand-yellow)',
  },
  {
    n: '03',
    title: 'Pick it up, pass it on',
    body: 'We already know who needs it after you, so the next handoff is arranged before you even have it.',
    color: 'var(--kand-red)',
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

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-[var(--kraft-50)] text-[var(--ink)]">
      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between border-b border-[var(--kraft-300)] px-6 py-5">
        <Image
          src="/relay-black.png"
          alt="Relay"
          width={200}
          height={72}
          priority
          className="h-9 w-auto"
        />
        <Link
          href="/login"
          className="text-[14px] font-semibold underline decoration-[var(--kraft-400)] underline-offset-4 transition-colors hover:text-[var(--signal)]"
        >
          Sign in
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center overflow-hidden px-6 pt-20 pb-20 text-center sm:pt-28">
        {/* Bauhaus shapes — flat spot colours, purely decorative */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <span className="shape-circle absolute left-[6%] top-[14%] size-28 bg-[var(--kand-blue)] opacity-[0.24] sm:size-40" />
          <span className="shape-tri absolute right-[9%] top-[22%] text-[var(--kand-red)] opacity-[0.26] [--tri:34px] sm:[--tri:52px]" />
          <span className="shape-circle absolute bottom-[8%] right-[18%] size-16 bg-[var(--kand-yellow)] opacity-[0.5] sm:size-24" />
          <span className="absolute bottom-[22%] left-[14%] h-[3px] w-24 bg-[var(--kand-red)] opacity-[0.45] sm:w-36" />
        </div>
        {/* CSS-driven, not motion: the hero must never depend on hydration.
            A JS entry animation starts at opacity 0, so any hiccup leaves the
            headline blank — which happened repeatedly while building this.
            These keyframes run without JS and always end visible. */}
        <div className="anim-slide">
          <h1 className="stencil max-w-[13ch] text-[clamp(38px,7.5vw,72px)] leading-[0.95]">
            Borrow it from someone down the hall
          </h1>
        </div>

        <div className="anim-slide" style={{ animationDelay: '90ms' }}>
          <p className="mx-auto mt-7 max-w-[520px] text-[18px] leading-relaxed text-[var(--ink-2)]">
            You need a drill for one Saturday afternoon. Buying one costs $60 and
            then it lives in your closet forever. Someone four doors down already
            has one — rent it for <strong className="mark font-semibold">$4 a day</strong>.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex min-h-12 items-center justify-center rounded-[4px] bg-[var(--signal)] px-8 text-[15px] font-bold tracking-wide text-[var(--kraft-50)] transition-transform duration-75 hover:-translate-y-[1px] active:translate-y-[2px]"
              style={{ boxShadow: '0 3px 0 #7C2814' }}
            >
              Find what you need
            </Link>
            <Link
              href="/post"
              className="board inline-flex min-h-12 items-center justify-center px-8 text-[15px] font-semibold"
            >
              Lend out your stuff
            </Link>
          </div>

          <p className="mt-4 text-[13px] text-[var(--ink-2)]">
            Free to join with your university email.
          </p>
        </div>
      </section>

      {/* The belt: what is actually moving around a building right now. Two
          rows running opposite ways so the hero has motion without anything
          blinking or sliding in on scroll. */}
      <section aria-label="Things students are lending right now" className="relative z-10 space-y-3 pb-16">
        <Belt items={BELT_A} direction="left" seconds={42} />
        <Belt items={BELT_B} direction="right" seconds={50} />
      </section>

      {/* How it works */}
      <section className="relative z-10 border-y border-[var(--kraft-300)] bg-[var(--kraft-100)]">
        <div className="mx-auto max-w-[1000px] px-6 py-20">
          <h2 className="stencil mb-12 text-center text-[clamp(26px,4vw,40px)]">
            How it works
          </h2>
          <Conveyor className="grid gap-6 sm:grid-cols-3">
            {STEPS.map((s) => (
              <Crate key={s.n}>
                <div
                  className={`data mb-4 inline-flex size-9 items-center justify-center text-[13px] font-bold ${
                    s.n === '02' ? 'text-[var(--ink)]' : 'text-[var(--kraft-50)]'
                  }`}
                  style={{ background: s.color }}
                >
                  {s.n}
                </div>
                <h3 className="mb-3 text-[19px] font-semibold">{s.title}</h3>
                <p className="text-[15px] leading-relaxed text-[var(--ink-2)]">
                  {s.body}
                </p>
              </Crate>
            ))}
          </Conveyor>
        </div>
      </section>

      {/* What you can borrow */}
      <section className="relative z-10 mx-auto max-w-[1000px] px-6 py-20">
        <h2 className="stencil mb-3 text-[clamp(26px,4vw,40px)]">
          Stuff you need once
        </h2>
        <p className="mb-10 max-w-[560px] text-[16px] text-[var(--ink-2)]">
          Nobody should own four of these per building. Borrow for a day or two,
          hand it to whoever needs it next.
        </p>

        <Conveyor className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BORROW.map((b) => (
            <Crate
              key={b.item}
              className="board flex items-start justify-between gap-4 p-5"
            >
              <div>
                <div className="text-[17px] font-semibold">{b.item}</div>
                <div className="mt-1 text-[14px] text-[var(--ink-2)]">{b.note}</div>
              </div>
              <div className="shrink-0 text-right">
                <span className="data text-[22px] font-semibold text-[var(--amber)]">
                  {b.price}
                </span>
                <span className="data text-[13px] text-[var(--ink-2)]">{b.unit}</span>
              </div>
            </Crate>
          ))}
        </Conveyor>
      </section>

      {/* Moving out */}
      <section className="relative z-10 border-y border-[var(--kraft-300)] bg-[var(--kraft-100)]">
        <div className="mx-auto grid max-w-[1000px] items-center gap-12 px-6 py-20 lg:grid-cols-2">
          <div>
            <h2 className="stencil mb-4 text-[clamp(26px,4vw,40px)]">
              Moving out? Don&rsquo;t bin it.
            </h2>
            <p className="mb-6 text-[16px] leading-relaxed text-[var(--ink-2)]">
              The water filter, the kettle, the mini fridge — you&rsquo;re not
              taking them home and someone moving in this week would rather pay
              you than pay full price. List it in about a minute.
            </p>
            <Link
              href="/post"
              className="text-[15px] font-semibold underline decoration-[var(--kraft-400)] underline-offset-4 hover:text-[var(--signal)]"
            >
              List something you&rsquo;re leaving behind →
            </Link>
          </div>

          <Conveyor className="grid gap-3">
            {BUY.map((b) => (
              <Crate
                key={b.item}
                className="board flex items-center justify-between px-5 py-4"
              >
                <span className="text-[16px] font-medium">{b.item}</span>
                <span className="data text-[18px] font-semibold text-[var(--amber)]">
                  {b.price}
                </span>
              </Crate>
            ))}
          </Conveyor>
        </div>
      </section>

      {/* Reassurance */}
      <section className="relative z-10 mx-auto max-w-[1000px] px-6 py-20">
        <Conveyor className="grid gap-6 sm:grid-cols-3">
          <Crate className="border-t-4 pt-5" style={{ borderColor: 'var(--kand-blue)' }}>
            <h3 className="mb-2 text-[17px] font-semibold">Students only</h3>
            <p className="text-[15px] leading-relaxed text-[var(--ink-2)]">
              You sign up with your university email, so everyone here is someone
              you could run into on campus.
            </p>
          </Crate>
          <Crate className="border-t-4 pt-5" style={{ borderColor: 'var(--kand-yellow)' }}>
            <h3 className="mb-2 text-[17px] font-semibold">You keep the money</h3>
            <p className="text-[15px] leading-relaxed text-[var(--ink-2)]">
              Relay shows the price and the dates. You and the other person settle
              it however you like — we never touch your payments.
            </p>
          </Crate>
          <Crate className="border-t-4 pt-5" style={{ borderColor: 'var(--kand-red)' }}>
            <h3 className="mb-2 text-[17px] font-semibold">It comes back</h3>
            <p className="text-[15px] leading-relaxed text-[var(--ink-2)]">
              Every loan has a return date agreed up front, and you always know
              who it goes to next.
            </p>
          </Crate>
        </Conveyor>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 border-t border-[var(--kraft-300)] bg-[var(--kraft-100)]">
        <div className="mx-auto max-w-[720px] px-6 py-20 text-center">
          <Stamp className="mb-6">
            <span className="stencil-label border border-[var(--rule-strong)] bg-[var(--kraft-50)] px-3 py-1.5">
              Free to join
            </span>
          </Stamp>
          <h2 className="stencil mb-4 text-[clamp(28px,4.5vw,44px)] leading-[1.02]">
            Your building already owns everything in it
          </h2>
          <p className="mx-auto mb-9 max-w-[460px] text-[16px] text-[var(--ink-2)]">
            Start with one thing you need this week.
          </p>
          <Link
            href="/login"
            className="inline-flex min-h-12 items-center justify-center rounded-[4px] bg-[var(--signal)] px-8 text-[15px] font-bold tracking-wide text-[var(--kraft-50)] transition-transform duration-75 hover:-translate-y-[1px] active:translate-y-[2px]"
            style={{ boxShadow: '0 3px 0 #7C2814' }}
          >
            Get started
          </Link>
        </div>
      </section>

      <footer className="relative z-10 px-6 py-8 text-center">
        <p className="text-[13px] text-[var(--ink-2)]">
          Relay · Built at PivotHacks 2026
        </p>
      </footer>
    </div>
  )
}
