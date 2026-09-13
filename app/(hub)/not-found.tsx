import Link from "next/link";
import { btnSecondary, PageShell, PageTitle } from "@/components/hub/ui";

export default function NotFound() {
  return (
    <PageShell width="narrow">
      <PageTitle
        title="That isn’t here"
        lede="It may be a receipt for someone else’s booking, or a link to a screen Relay doesn’t have any more."
      />
      <Link href="/" className={btnSecondary}>
        What do you need?
      </Link>
    </PageShell>
  );
}
