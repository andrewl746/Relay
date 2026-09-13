import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/hub/site-header";
import { requireMe } from "@/lib/relay/me";
import { slipsFor } from "@/lib/relay/views";

export default async function HubLayout({ children }: { children: ReactNode }) {
  // Everything inside this group is for someone who has told Relay where and
  // when they can meet. Anyone else is sent to /hello or /start first.
  const me = await requireMe();
  const { due } = slipsFor(me);
  const soon = due.filter((s) => s.inDays <= 2).length;

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <SiteHeader name={me.profile.name} due={soon} />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-rule">
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-6 text-[13px] text-ink-2 sm:px-6">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {/* Plain wordmark: the footer rule is already the frame (docs/BRAND.md). */}
            <Image src="/brand/relay-wordmark-plain.png" alt="" width={952} height={160} unoptimized className="h-3.5 w-auto" />
            <p>Relay never handles money. You pay the owner directly, when you collect.</p>
          </div>
          <Link href="/network" className="underline underline-offset-[3px] hover:text-ink">
            How the route is worked out
          </Link>
        </div>
      </footer>
    </div>
  );
}
