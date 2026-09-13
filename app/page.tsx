import Link from 'next/link'

export const metadata = {
  title: 'Relay — Physical routing for university campuses',
  description: 'A logistics engine that matches people who have things with people who need them, and builds the optimal handoff schedule.',
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--chassis)] text-[var(--text-primary)] overflow-hidden">
      {/* Dot grid overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, #E4E7EB 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 border-b border-[var(--bezel)]">
        <span className="font-[family-name:var(--font-display)] text-[18px] font-bold tracking-[-0.03em]">
          RELAY
        </span>
        <Link
          href="/login"
          className="text-[13px] font-semibold text-[var(--text-muted)] hover:text-[var(--active-route)] transition-colors duration-75"
        >
          AUTHORIZE →
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center justify-center px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-[2px] border border-[var(--bezel)] bg-[var(--panel)] px-3 py-1.5 mb-8">
          <span className="size-2 rounded-full bg-[var(--secured)] animate-pulse" />
          <span className="text-[11px] font-bold tracking-[0.14em] uppercase text-[var(--text-muted)] font-[family-name:var(--font-data)]">
            System Active
          </span>
        </div>

        <h1 className="font-[family-name:var(--font-display)] text-[clamp(48px,10vw,96px)] font-bold tracking-[-0.04em] leading-[0.9]">
          REL
          <span className="text-[var(--active-route)]">A</span>
          Y
        </h1>

        <p className="mt-6 max-w-[480px] text-[17px] leading-relaxed text-[var(--text-muted)]">
          Physical routing for university campuses. Match what you have with who needs it. Build the optimal handoff schedule.
        </p>

        <Link
          href="/login"
          className="mt-10 inline-flex min-h-12 items-center justify-center rounded-[2px] bg-[var(--active-route)] px-8 text-[15px] font-bold text-[#0D0E12] tracking-wide transition-all duration-75 hover:brightness-110 hover:scale-[1.02] active:scale-[0.98]"
        >
          ENTER THE SYSTEM
        </Link>

        <p className="mt-4 text-[13px] text-[var(--text-muted)]">
          Works at any university. No credit card.
        </p>
      </section>

      {/* Stats bar */}
      <section className="relative z-10 border-y border-[var(--bezel)] bg-[var(--panel)]">
        <div className="max-w-[960px] mx-auto grid grid-cols-3 divide-x divide-[var(--bezel)]">
          {[
            { value: '12,847', label: 'Items Routed' },
            { value: '34', label: 'Universities' },
            { value: '2,091', label: 'Active Chains' },
          ].map((stat) => (
            <div key={stat.label} className="px-6 py-8 text-center">
              <div className="font-[family-name:var(--font-data)] text-[28px] font-semibold text-[var(--secured)] tracking-tight">
                {stat.value}
              </div>
              <div className="mt-1 text-[11px] font-bold tracking-[0.14em] uppercase text-[var(--text-muted)]">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-[960px] mx-auto px-6 py-20">
        <h2 className="font-[family-name:var(--font-display)] text-[11px] font-bold tracking-[0.14em] uppercase text-[var(--text-muted)] mb-8">
          Core Systems
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              title: 'SEMANTIC MATCHING',
              desc: 'Natural language in, vector similarity out. Say "I need a drill Saturday morning" and the engine understands tools, time, and urgency.',
              accent: 'var(--secured)',
            },
            {
              title: 'OPTIMAL SCHEDULING',
              desc: 'Weighted Interval Scheduling DP builds the handoff chain that maximizes item utilization and minimizes idle days across the entire network.',
              accent: 'var(--active-route)',
            },
            {
              title: 'REAL DISTANCE',
              desc: 'Haversine-calculated proximity between campus neighbourhoods. The engine penalizes long trips and rewards walkable handoffs.',
              accent: 'var(--alert)',
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-[4px] border border-[var(--bezel)] bg-[var(--panel)] p-6 transition-all duration-75 hover:border-[color:var(--text-muted)]"
            >
              <div
                className="w-8 h-[3px] mb-4 rounded-full"
                style={{ background: f.accent }}
              />
              <h3 className="font-[family-name:var(--font-data)] text-[13px] font-semibold tracking-wide text-[var(--text-primary)] mb-3">
                {f.title}
              </h3>
              <p className="text-[14px] leading-relaxed text-[var(--text-muted)]">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[var(--bezel)] px-6 py-6 text-center">
        <p className="text-[12px] text-[var(--text-muted)] font-[family-name:var(--font-data)]">
          RELAY v0.1 · Built for PivotHacks 2026
        </p>
      </footer>
    </div>
  )
}
