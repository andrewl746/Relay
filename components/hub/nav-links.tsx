"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/*
 * No "Home" item on purpose. With a horizontal top nav the logo is the home
 * affordance, so a Home tab is a second control for the same destination —
 * GitHub, Notion, Figma and Linear all drop it. An explicit Home belongs in a
 * sidebar nav, where the logo is usually a workspace switcher instead.
 */
const links = [
  { href: "/browse", label: "Browse" },
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
      <ul className="flex gap-6 sm:gap-7">
        {links.map((link) => {
          const active = isActive(pathname, link.href);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`group relative block py-3 text-[17px] font-semibold whitespace-nowrap lg:py-4 ${
                  active ? "text-ink" : "text-ink-2 hover:text-ink"
                }`}
              >
                {link.label}
                {/* Underline wipes in from the left. scaleX on a full-width
                    rule, so it animates on the compositor instead of
                    animating width and forcing layout every frame. */}
                <span
                  aria-hidden
                  className={`absolute inset-x-0 bottom-0 h-[2px] origin-left bg-accent transition-transform duration-200 ease-out ${
                    active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                  }`}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
