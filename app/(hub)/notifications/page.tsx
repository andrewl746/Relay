import Link from "next/link";
import { EmptyState, PageShell, PageTitle } from "@/components/hub/ui";
import { getNotifications } from "@/lib/hub/data";
import { formatWhen } from "@/lib/hub/format";
import { getCurrentUser } from "@/lib/hub/session";
import type { NotificationKind } from "@/lib/hub/types";

export const metadata = { title: "Notifications" };

const kindLabel: Record<NotificationKind, string> = {
  match: "New match",
  claim: "Claimed",
  handoff: "Handoff set",
  reminder: "Reminder",
};

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  const notifications = await getNotifications(user.id);

  return (
    <PageShell>
      <PageTitle title="Notifications" lede="Matches for your list, claims on your things, and pickups coming up." />

      {notifications.length === 0 ? (
        <EmptyState title="Nothing new.">
          Add things to <Link href="/wants" className="font-semibold text-ink underline underline-offset-[3px]">your list</Link>{" "}
          and we’ll tell you when someone posts a match.
        </EmptyState>
      ) : (
        <ul className="border-t border-rule-strong">
          {notifications.map((n) => (
            <li key={n.id} className="relative border-b border-rule">
              {!n.read && <span aria-hidden="true" className="absolute inset-y-0 left-0 w-0.5 bg-ink" />}
              <Link href={n.href} className="group block py-3 pr-1 pl-4 transition-colors duration-[90ms] hover:bg-paper-raised">
                <span className="flex items-baseline justify-between gap-4">
                  <span className={`t-eyebrow ${n.read ? "text-ink-2" : "text-ink"}`}>
                    {kindLabel[n.kind]}
                    {!n.read && <span className="sr-only">, unread</span>}
                  </span>
                  <span className="data shrink-0 text-[13px] text-ink-2">{formatWhen(n.createdAt)}</span>
                </span>
                <span className={`mt-1 block group-hover:underline group-hover:underline-offset-[3px] ${n.read ? "text-ink-2" : "font-semibold"}`}>
                  {n.text}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
