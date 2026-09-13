/** Union of both sides: "tools" carries the borrow story, "hygiene"/"other" are his. */
export type Category = "furniture" | "school" | "tools" | "kitchen" | "electronics" | "hygiene" | "other";

/**
 * The four ways an object can move between two people. The axis that matters
 * is whether it comes back: "free" and "sale" transfer ownership, "lend" and
 * "rent" do not. That return leg is the thing a general marketplace cannot do,
 * so it is modelled here rather than written into a description field.
 */
export type OfferType = "sale" | "rent" | "free" | "lend";

/** Does the owner get it back? */
export const RETURNS: Record<OfferType, boolean> = {
  free: false,
  sale: false,
  lend: true,
  rent: true,
};

export type Condition = "new" | "like-new" | "good" | "fair" | "bad";

/**
 * How badly someone wants this resolved. Chosen by a person, not derived.
 *
 * On a listing it shortens the item's life: an urgent seller is saying "this
 * leaves with me on Sunday", and the matcher treats the shorter window as a
 * real constraint rather than a badge. On a want it tightens the buyer's
 * deadline, which is what decides a contested object.
 */
export type Urgency = "low" | "medium" | "high";
export type MoveStatus = "leaving" | "arriving" | "staying";
export type PlaceKind = "seller" | "campus";
export type ListingStatus = "available" | "claimed" | "removed";
export type UrgencyTier = "not-urgent" | "urgent" | "very-urgent";

export type University = {
  id: string;
  name: string;
  shortName: string;
  emailDomain: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  universityId: string;
  home: string;
  /** Where an arriving student is moving to. Null once they are already here. */
  destination: string | null;
  moveStatus: MoveStatus;
  moveDate: string | null;
  note: string;
};

export type Listing = {
  id: string;
  universityId: string;
  sellerId: string;
  title: string;
  description: string;
  kind: string;
  category: Category;
  offerType: OfferType;
  priceCents: number | null;
  condition: Condition;
  pickupArea: string;
  /** How the seller wants to be reached once someone claims it. */
  /** How the seller wants to be reached once someone claims it. */
  contact?: string;
  /** How long the borrower keeps it, for the two modes that come back. */
  returnDays?: number | null;
  expiresAt: string | null;
  isBundle: boolean;
  parentId: string | null;
  status: ListingStatus;
  createdAt: string;
  /** Seller-uploaded photo (a resized JPEG data URL). Absent means show the placeholder. */
  photoUrl?: string | null;
  /** From the SCREAM! meter on the post form. Only set when the deadline is within a week. */
  urgency?: UrgencyTier | null;
};

export type TimeSlot = {
  id: string;
  listingId: string;
  startsAt: string;
  endsAt: string;
  place: string;
  placeKind: PlaceKind;
};

export type Want = {
  id: string;
  userId: string;
  text: string;
  maxPriceCents: number | null;
  neededBy: string;
  urgency?: Urgency;
  fulfilled: boolean;
};

export type Match = {
  id: string;
  userId: string;
  listingId: string;
  wantIds: string[];
  score: number;
  reason: string;
};

/** Mock only. No real card data is ever collected or stored. */
export type PaymentMethod = { brand: string; last4: string } | null;

export type Handoff = {
  id: string;
  listingId: string;
  slotId: string;
  buyerId: string;
  sellerId: string;
  /** What the buyer entered at checkout, so the seller knows who to expect. */
  buyerName?: string;
  buyerContact?: string;
  payment?: PaymentMethod;
  urgency?: Urgency;
  /** Set for lend and rent: when the owner gets it back. */
  dueBack?: string | null;
  createdAt: string;
};

export type NotificationKind = "match" | "claim" | "handoff" | "reminder";

export type UserNotification = {
  id: string;
  userId: string;
  kind: NotificationKind;
  text: string;
  href: string;
  createdAt: string;
  read: boolean;
};
