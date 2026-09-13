import Link from "next/link";
import { btnSecondary, PageShell, PageTitle } from "@/components/hub/ui";

export default function NotFound() {
  return (
    <PageShell>
      <PageTitle
        title="That’s not on the board"
        lede="It may have been claimed, or its deadline passed. Most things get posted in the last two weeks of term."
      />
      <Link href="/" className={btnSecondary}>
        Back to all listings
      </Link>
    </PageShell>
  );
}
