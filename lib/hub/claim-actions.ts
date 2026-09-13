"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { mutate } from "@/lib/relay/runtime";
import { getListing } from "./data";
import { getCurrentUser, getTradeBlocker } from "./session";

/**
 * Records a claim, then sends the user to the confirmation.
 *
 * Previously the claim form only did router.push() to the confirmed page, so
 * nothing was ever written and /handoffs was permanently empty — the flow
 * looked complete and dead-ended.
 *
 * Server Functions take direct POSTs, so this validates that the listing and
 * the slot actually exist rather than trusting the form.
 */
export async function claimListing(formData: FormData) {
  const listingId = String(formData.get("listingId") ?? "");
  const slotId = String(formData.get("slotId") ?? "");
  if (!listingId || !slotId) throw new Error("Pick a pickup time first.");
  if (await getTradeBlocker()) throw new Error("Finish setting up your account before you claim.");

  const [user, listing] = await Promise.all([getCurrentUser(), getListing(listingId)]);
  if (!listing) throw new Error("That listing no longer exists.");
  if (!listing.slots.some((s) => s.id === slotId)) {
    throw new Error("That pickup time is no longer available.");
  }
  if (listing.sellerId === user.id) throw new Error("This is your own listing.");

  mutate((r) => {
    const already = r.claims.some(
      (c) => c.listingId === listingId && c.buyerId === user.id,
    );
    if (!already) {
      r.claims.push({
        id: `c-${Date.now().toString(36)}`,
        listingId,
        slotId,
        buyerId: user.id,
        createdAt: new Date().toISOString(),
      });
    }
  });

  revalidatePath("/", "layout");
  redirect(`/listings/${listingId}/claim/confirmed?slot=${encodeURIComponent(slotId)}`);
}
