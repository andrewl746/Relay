import Link from "next/link";
import { getUnreadCount, getUniversity } from "@/lib/hub/data";
import { getCurrentUser } from "@/lib/hub/session";
import { SITE_NAME } from "@/lib/hub/site";
import { signOut } from "@/lib/supabase/actions";
import { getSupabaseUser } from "@/lib/supabase/session";
import { BellIcon } from "./icons";
import { Logo } from "./logo";
import { NavLinks } from "./nav-links";
import { UserMenu } from "./user-menu";

export async function SiteHeader() {
  const [user, supabaseUser, university] = await Promise.all([
    getCurrentUser(),
    getSupabaseUser(),
    getUniversity(),
  ]);
  const unread = await getUnreadCount(user.id);

  return (
    /* Sticky, with its own ground. The wrapper stopped painting a background
       so the kraft grain could show through the page, which left the header
       transparent and the board scrolling under bare text. */
    <header className="sticky top-0 z-40 border-b border-border bg-bg/60 backdrop-blur-[14px] backdrop-saturate-150">
      <div className="mx-auto flex max-w-[1120px] flex-wrap items-center gap-x-3 px-4 sm:gap-x-6 sm:px-6 lg:flex-nowrap">
        {/* The whole lockup is the home link — the campus name reads as part of
            the mark, so it should behave like it. The mark is a mask, so the
            whole thing takes the accent on hover in one colour change. */}
        <Link
          href="/"
          aria-label={`${SITE_NAME} home`}
          className="group flex min-h-14 shrink-0 items-center gap-2.5 pr-2 sm:pr-6"
        >
          <Logo className="h-8 bg-ink transition-colors duration-200 ease-out group-hover:bg-accent" />
          <span aria-hidden className="hidden h-7 w-px shrink-0 bg-border-strong sm:block" />
          {/* leading-none: the default line box hangs descender space under the
              word, which parked it visibly below the mark's optical centre. */}
          <span className="hidden text-[19px] leading-none font-semibold tracking-[-0.01em] text-ink-3 transition-colors duration-200 ease-out group-hover:text-accent sm:inline">
            {university.shortName}
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-1 lg:order-last">
          <Link
            href="/notifications"
            className="relative grid size-11 place-items-center rounded-1 text-ink-2 transition-colors duration-100 hover:bg-paper-raised hover:text-ink"
            aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
          >
            <BellIcon className="size-5" />
            {unread > 0 && (
              <span className="data absolute top-1.5 right-1 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[11px] font-semibold text-on-accent">
                {unread}
              </span>
            )}
          </Link>

          {/* One menu in both modes. The demo used to hang a <select> of fake
              students off the header, which is developer furniture on the
              first screen a judge sees; switching demo students now lives in
              Settings, where every other account control already is. */}
          <div className="flex items-center pl-2">
            <UserMenu
              name={user.name}
              email={user.email}
              signedIn={Boolean(supabaseUser)}
              avatarUrl={
                (supabaseUser?.user_metadata?.avatar_url as string | undefined) ??
                (supabaseUser?.user_metadata?.picture as string | undefined) ??
                null
              }
              signOutAction={signOut}
            />
          </div>
        </div>

        <NavLinks />
      </div>
    </header>
  );
}
