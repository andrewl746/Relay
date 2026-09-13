import { cache } from "react";
import { createClient } from "../supabase/server";
import { listings as seed } from "./mock-data";
import type { Listing } from "./types";

/**
 * Where listings actually live.
 *
 * The seeded board in mock-data.ts is code — it ships with the app and is the
 * same on every instance. Anything a person posts, edits, claims or removes is a
 * row in Supabase. A row OVERRIDES a seed listing with the same id, so a claim
 * against a demo item survives a restart without the seed having to be loaded
 * into the database first.
 *
 * This replaces `listings.unshift(...)` into a module-level array. That array
 * was per-process: two devices talking to one dev server shared it, but on any
 * serverless host each instance gets its own copy and is recycled without
 * warning, so a post would be invisible to the next request and then vanish.
 *
 * Reads are wrapped in React cache(), so a render that asks four times — the
 * board, the match panel, the search pass, the detail page — pays for one query.
 */

type Row = {
  id: string;
  university_id: string;
  seller_id: string;
  title: string;
  description: string;
  kind: string;
  category: string;
  offer_type: string;
  price_cents: number | null;
  condition: string;
  pickup_area: string;
  expires_at: string | null;
  is_bundle: boolean;
  parent_id: string | null;
  status: string;
  created_at: string;
  photo_url: string | null;
  urgency: string | null;
};

function toListing(r: Row): Listing {
  return {
    id: r.id,
    universityId: r.university_id,
    sellerId: r.seller_id,
    title: r.title,
    description: r.description,
    kind: r.kind,
    category: r.category as Listing["category"],
    offerType: r.offer_type as Listing["offerType"],
    priceCents: r.price_cents,
    condition: r.condition as Listing["condition"],
    pickupArea: r.pickup_area,
    expiresAt: r.expires_at,
    isBundle: r.is_bundle,
    parentId: r.parent_id,
    status: r.status as Listing["status"],
    createdAt: r.created_at,
    photoUrl: r.photo_url,
    urgency: (r.urgency as Listing["urgency"]) ?? null,
  };
}

function toRow(l: Listing): Row {
  return {
    id: l.id,
    university_id: l.universityId,
    seller_id: l.sellerId,
    title: l.title,
    description: l.description,
    kind: l.kind,
    category: l.category,
    offer_type: l.offerType,
    price_cents: l.priceCents,
    condition: l.condition,
    pickup_area: l.pickupArea,
    expires_at: l.expiresAt,
    is_bundle: l.isBundle,
    parent_id: l.parentId,
    status: l.status,
    created_at: l.createdAt,
    photo_url: l.photoUrl ?? null,
    urgency: l.urgency ?? null,
  };
}

/**
 * Every listing: the seed board, with any persisted row of the same id taking
 * its place, plus everything posted since — newest first.
 *
 * Never throws. If Supabase is unreachable the seeded board still renders, which
 * is the difference between a degraded demo and a white screen.
 */
export const allListings = cache(async (): Promise<Listing[]> => {
  let rows: Row[] = [];
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    rows = (data ?? []) as Row[];
  } catch (err) {
    console.error("[listings] load failed, seed board only:", err);
    return seed;
  }

  const persisted = rows.map(toListing);
  const byId = new Map(persisted.map((l) => [l.id, l]));
  const seedIds = new Set(seed.map((s) => s.id));
  return [
    ...persisted.filter((l) => !seedIds.has(l.id)), // posted since, newest first
    ...seed.map((s) => byId.get(s.id) ?? s), // the demo board, overrides applied
  ];
});

/**
 * Write a listing through, whether it is new or a seed item being changed.
 *
 * Upsert rather than insert-or-update on purpose: editing or claiming a SEEDED
 * listing has no row to update yet, and this is the one call that handles both
 * without the caller having to know which kind it is holding.
 */
export async function saveListing(listing: Listing): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("listings").upsert(toRow(listing));
    if (error) throw error;
    return { ok: true };
  } catch (err) {
    console.error("[listings] save failed:", err);
    return { ok: false, message: "Couldn't save that. Try again." };
  }
}
