"use server"

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { USER_COOKIE } from "./dev-login";
import { getCurrentUser } from "./session";
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

export type CreateListingResult =
  | { status: "error"; message: string }
  | { status: "ok"; id: string; title: string; expiresAt: string | null };

export async function createListing(_prev: CreateListingResult, formData: FormData): Promise<CreateListingResult> {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { status: "error", message: "Give it a title." };

  const category = String(formData.get("category")) as Category;
  const offerType = String(formData.get("offerType")) as OfferType;
  const condition = String(formData.get("condition")) as Condition;
  const description = String(formData.get("description") ?? "").trim();

  const needsPrice = offerType === "sale" || offerType === "rent";
  const priceRaw = formData.get("price");
  const priceCents = needsPrice && priceRaw ? Math.round(Number(priceRaw) * 100) : null;
  if (needsPrice && (priceCents === null || Number.isNaN(priceCents))) {
    return { status: "error", message: "Enter a price." };
  }

  const expiresAtLocal = formData.get("expiresAt");
  const expiresAt = typeof expiresAtLocal === "string" && expiresAtLocal ? `${expiresAtLocal}:00-04:00` : null;

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
