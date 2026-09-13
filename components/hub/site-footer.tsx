import Image from "next/image";
import Link from "next/link";
import { SITE_NAME } from "@/lib/hub/site";

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Relay",
    links: [
      { href: "/browse", label: "Browse" },
      { href: "/post", label: "Lend or sell" },
      { href: "/wants", label: "Your list" },
      { href: "/handoffs", label: "Handoffs" },
    ],
  },
  {
    title: "About",
    links: [
      { href: "/welcome", label: "How it works" },
      { href: "/chains", label: "The routing engine" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/terms", label: "Terms of service" },
      { href: "/privacy", label: "Privacy policy" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="mx-auto w-full max-w-[var(--page-max)] px-5 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Image
              src="/relay-black.png"
              alt={SITE_NAME}
              width={160}
              height={58}
              className="h-8 w-auto"
            />
            <p className="mt-3 max-w-[30ch] text-[14px] leading-relaxed text-ink-2">
              Borrow what you need for a few days from someone in your building,
              and pass it on when you&rsquo;re done.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h2 className="mb-3 text-[13px] font-semibold text-ink">{col.title}</h2>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-[14px] text-ink-2 hover:text-ink hover:underline underline-offset-4"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-border pt-6 text-[13px] text-ink-2 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Relay. Built at PivotHacks.</p>
          <p>Relay never handles your payments — you settle up directly.</p>
        </div>
      </div>
    </footer>
  );
}
