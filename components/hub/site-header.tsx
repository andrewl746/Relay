import Image from "next/image";
import Link from "next/link";
import { getUnreadCount, getUniversity, getUsers } from "@/lib/hub/data";
import { getCurrentUser } from "@/lib/hub/session";
import { SITE_NAME } from "@/lib/hub/site";
import { signOut } from "@/lib/supabase/actions";
import { getSupabaseUser } from "@/lib/supabase/session";
import { BellIcon } from "./icons";
import { NavLinks } from "./nav-links";
import { UserMenu } from "./user-menu";
import { UserSwitcher } from "./user-switcher";

export async function SiteHeader() {
  const [user, supabaseUser, users, university] = await Promise.all([
    getCurrentUser(),
    getSupabaseUser(),
    getUsers(),
    getUniversity(),
  ]);
  const unread = await getUnreadCount(user.id);

  return (
    <header className="border-b border-rule-strong">
      <div className="mx-auto flex max-w-[1120px] flex-wrap items-center gap-x-3 px-4 sm:gap-x-6 sm:px-6 lg:flex-nowrap">
        {/* The campus name sat inline at nav size and read as another tab.
            It is context, not a destination: larger, tracked, ink-3, and
            separated by a rule with real space on both sides. */}
        {/* The whole lockup is the home link — the campus name reads as part of
            the mark, so it should behave like it. */}
        <Link
          href="/"
          aria-label={`${SITE_NAME} home`}
          className="flex min-h-14 shrink-0 items-center gap-2.5 pr-2 sm:pr-6"
        >
          <Image src="/relay-black.png" alt={SITE_NAME} width={160} height={58} priority className="h-8 w-auto" />
          <span aria-hidden className="hidden h-7 w-px bg-border-strong sm:block" />
          <span className="hidden text-[19px] font-semibold tracking-[-0.01em] text-ink-3 sm:inline">
            {university.shortName}
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-1 lg:order-last">
          <Link
            href="/notifications"
            className="relative grid size-11 place-items-center rounded-1 hover:bg-paper-raised"
            aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
          >
            <BellIcon className="size-5" />
            {unread > 0 && (
              <span className="data absolute top-1.5 right-1 grid h-4 min-w-4 place-items-center bg-ink px-1 text-[11px] font-semibold text-paper">
                {unread}
              </span>
            )}
          </Link>

          {supabaseUser ? (
            <div className="flex items-center pl-2">
              <UserMenu
                name={user.name}
                email={user.email}
                avatarUrl={(supabaseUser.user_metadata?.avatar_url as string | undefined) ?? (supabaseUser.user_metadata?.picture as string | undefined) ?? null}
                signOutAction={signOut}
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-2">
              <span className="t-eyebrow hidden text-ink-3 sm:inline">Demo</span>
              <UserSwitcher users={users.map((u) => ({ id: u.id, label: `${u.name}, ${u.moveStatus}` }))} currentUserId={user.id} />
            </div>
          )}
        </div>

        <NavLinks />
      </div>
    </header>
  );
}
