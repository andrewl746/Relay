import { cache } from "react";
import { createClient } from "../supabase/server";
import type { HubClaim } from "@/lib/relay/runtime";

/** A claim plus the buyer's name as it was at claim time. See 0008_names.sql. */
export type NamedClaim = HubClaim & { buyerName: string | null };

/**
 * Hub claims, in Supabase.
 *
 * These were in data/runtime.json, written with writeFileSync — which throws
 * EROFS on a serverless host and, even where it works, is per-instance. A claim
 * has to outlive the request that made it and be visible to the seller on a
 * different device, so it belongs in the database.
 *
 * See lib/hub/listing-store.ts for the same treatment of listings, and
 * supabase/migrations/0007_claims.sql for why only the hub's claims moved.
 */

type Row = {
  id: string;
  listing_id: string;
  slot_id: string;
  buyer_id: string;
  created_at: string;
  buyer_name: string | null;
};

const toClaim = (r: Row): NamedClaim => ({
  id: r.id,
  listingId: r.listing_id,
  slotId: r.slot_id,
  buyerId: r.buyer_id,
  createdAt: r.created_at,
  buyerName: r.buyer_name,
});

/** Every claim. Never throws: an unreachable database must not empty the board. */
export const allClaims = cache(async (): Promise<NamedClaim[]> => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("claims").select("*");
    if (error) throw error;
    return ((data ?? []) as Row[]).map(toClaim);
  } catch (err) {
    console.error("[claims] load failed:", err);
    return [];
  }
});

/**
 * Record a claim. Idempotent: the unique index on (listing_id, buyer_id) means
 * a double submit is a no-op rather than a second handoff, which is what the
 * old `already` check was reaching for before it raced.
 */
export async function saveClaim(claim: NamedClaim): Promise<void> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("claims").upsert(
      {
        id: claim.id,
        listing_id: claim.listingId,
        slot_id: claim.slotId,
        buyer_id: claim.buyerId,
        created_at: claim.createdAt,
        buyer_name: claim.buyerName,
      },
      { onConflict: "listing_id,buyer_id", ignoreDuplicates: true },
    );
    if (error) throw error;
  } catch (err) {
    console.error("[claims] save failed:", err);
    throw new Error("Couldn't record that claim. Try again.");
  }
}
