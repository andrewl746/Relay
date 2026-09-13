"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Need" },
  { href: "/handoffs", label: "Handoffs" },
  { href: "/shelf", label: "Shelf" },
  { href: "/network", label: "Network" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLinks({ due }: { due: number }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="-mx-4 w-[calc(100%+2rem)] overflow-x-auto border-t border-rule px-4 [scrollbar-width:none] sm:-mx-6 sm:w-[calc(100%+3rem)] sm:px-6 lg:mx-0 lg:w-auto lg:border-0 lg:px-0"
    >
      <ul className="flex gap-6">
        {links.map((link) => {
          const active = isActive(pathname, link.href);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-1.5 border-b-2 py-3 text-[15px] font-semibold whitespace-nowrap lg:py-4 ${
                  active ? "border-ink text-ink" : "border-transparent text-ink-2 hover:text-ink"
                }`}
              >
                {link.label}
                {link.href === "/handoffs" && due > 0 && (
                  <span className="data bg-ink px-1 text-[11px] leading-4 text-paper">
                    {due}
                    <span className="sr-only"> due in the next two days</span>
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
