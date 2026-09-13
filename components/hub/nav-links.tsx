"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/browse", label: "Browse" },
  { href: "/wants", label: "My list" },
  { href: "/post", label: "Post" },
  { href: "/handoffs", label: "Handoffs" },
];

function isActive(pathname: string, href: string) {
  if (href === "/browse") return pathname === "/browse" || pathname.startsWith("/listings");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className="-mx-4 w-[calc(100%+2rem)] overflow-x-auto [scrollbar-width:none] border-t border-rule px-4 sm:-mx-6 sm:w-[calc(100%+3rem)] sm:px-6 lg:mx-0 lg:w-auto lg:border-0 lg:px-0">
      <ul className="flex gap-5">
        {links.map((link) => {
          const active = isActive(pathname, link.href);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`block border-b-2 py-3 text-[15px] font-semibold whitespace-nowrap lg:py-4 ${
                  active ? "border-ink text-ink" : "border-transparent text-ink-2 hover:text-ink"
                }`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
