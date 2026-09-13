"use server"

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { USER_COOKIE } from "./dev-login";
import { getCurrentUser } from "./session";
import { resetPlanCache } from "./matching";
import { listings, users } from "./mock-data";
import type { Category, Condition, Listing, OfferType } from "./types";

export async function loginAction(userId: string, email: string) {
  // No university email restriction — any email works.
  // University is selected during onboarding.
  if (!email || !email.includes("@")) {
    throw new Error("Please enter a valid email address.");
  }

  (await cookies()).set(USER_COOKIE, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax"
  });
}

type ParsedListingFields = {
  title: string;
  description: string;
  category: Category;
  offerType: OfferType;
  condition: Condition;
  priceCents: number | null;
  expiresAt: string | null;
};

// Shared by createListing and updateListing so the two forms can't drift
// out of sync on validation.
function parseListingFields(formData: FormData): ParsedListingFields | { error: string } {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Give it a title." };

  const category = String(formData.get("category")) as Category;
  const offerType = String(formData.get("offerType")) as OfferType;
  const condition = String(formData.get("condition")) as Condition;
  const description = String(formData.get("description") ?? "").trim();

  const needsPrice = offerType === "sale" || offerType === "rent";
  const priceRaw = formData.get("price");
  const priceCents = needsPrice && priceRaw ? Math.round(Number(priceRaw) * 100) : null;
  if (needsPrice && (priceCents === null || Number.isNaN(priceCents))) {
    return { error: "Enter a price." };
  }

  const expiresAtLocal = formData.get("expiresAt");
  const expiresAt = typeof expiresAtLocal === "string" && expiresAtLocal ? `${expiresAtLocal}:00-04:00` : null;

  return { title, description, category, offerType, condition, priceCents, expiresAt };
}

export type CreateListingResult =
  | { status: "error"; message: string }
  | { status: "ok"; id: string; title: string; expiresAt: string | null };

export async function createListing(_prev: CreateListingResult, formData: FormData): Promise<CreateListingResult> {
  const fields = parseListingFields(formData);
  if ("error" in fields) return { status: "error", message: fields.error };
  const { title, description, category, offerType, condition, priceCents, expiresAt } = fields;

  const user = await getCurrentUser();

  // Real (Supabase) sellers won't already be in the seeded users list that
  // listing detail / claim pages look sellers up in — add them so those
  // pages can find them, the same way every seeded demo user already can.
  if (!users.some((u) => u.id === user.id)) users.push(user);

  const newListing: Listing = {
    id: `l-${Date.now().toString(36)}`,
    universityId: user.universityId,
    sellerId: user.id,
    title,
    description,
    kind: title.split(" ")[0] || "Item",
    category,
    offerType,
    priceCents,
    condition,
    pickupArea: user.home,
    expiresAt,
    isBundle: false,
    parentId: null,
    status: "available",
    createdAt: new Date().toISOString(),
  };

  listings.unshift(newListing);
  revalidatePath("/");
  revalidatePath("/wants");

  return { status: "ok", id: newListing.id, title: newListing.title, expiresAt: newListing.expiresAt };
}

// Soft delete: mark it removed rather than splicing it out of the array.
// Keeps it out of the board and search (both only ever show "available"
// listings) without breaking anything that still points at its id — pickup
// slots, matches, an in-flight claim link someone already opened — and
// leaves a record on "My posts" instead of silently vanishing.
export async function removeListing(listingId: string, _formData: FormData) {
  const user = await getCurrentUser();
  const listing = listings.find((l) => l.id === listingId);
  if (!listing || listing.sellerId !== user.id || listing.status !== "available") return;

  listing.status = "removed";
  resetPlanCache();
  revalidatePath("/");
  revalidatePath("/posts");
  revalidatePath(`/listings/${listingId}`);
}

export type UpdateListingResult = { status: "error"; message: string } | { status: "idle" };

export async function updateListing(
  listingId: string,
  _prev: UpdateListingResult,
  formData: FormData,
): Promise<UpdateListingResult> {
  const user = await getCurrentUser();
  const listing = listings.find((l) => l.id === listingId);
  if (!listing || listing.sellerId !== user.id) {
    return { status: "error", message: "You can't edit this listing." };
  }
  if (listing.status !== "available") {
    return { status: "error", message: "This listing can no longer be edited." };
  }

  const fields = parseListingFields(formData);
  if ("error" in fields) return { status: "error", message: fields.error };

  listing.title = fields.title;
  listing.description = fields.description;
  listing.kind = fields.title.split(" ")[0] || listing.kind;
  listing.category = fields.category;
  listing.offerType = fields.offerType;
  listing.priceCents = fields.priceCents;
  listing.condition = fields.condition;
  listing.expiresAt = fields.expiresAt;

  resetPlanCache();
  revalidatePath("/");
  revalidatePath("/posts");
  revalidatePath(`/listings/${listingId}`);

  redirect("/posts");
}
