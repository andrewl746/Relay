import Link from "next/link";
import { getUnreadCount, getUniversity, getUsers } from "@/lib/hub/data";
import { getCurrentUser } from "@/lib/hub/session";
import { SITE_NAME } from "@/lib/hub/site";
import { signOut } from "@/lib/supabase/actions";
import { getSupabaseUser } from "@/lib/supabase/session";
import { BellIcon } from "./icons";
import { NavLinks } from "./nav-links";
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
        <Link href="/browse" className="flex min-h-14 items-baseline gap-2">
          <span className="t-display text-[20px] whitespace-nowrap">{SITE_NAME}</span>
          <span className="hidden text-[13px] font-medium text-ink-2 sm:inline">{university.shortName}</span>
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
            <div className="flex items-center gap-3 pl-2">
              <span className="hidden max-w-[9rem] truncate text-[13px] font-semibold sm:inline">{user.name}</span>
              <form action={signOut}>
                <button type="submit" className="min-h-11 rounded-1 px-3 text-[13px] font-semibold text-ink-2 hover:bg-paper-raised hover:text-ink">
                  Sign out
                </button>
              </form>
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
