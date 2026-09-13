export type Category = "furniture" | "school" | "kitchen" | "electronics" | "hygiene" | "other";
export type OfferType = "sale" | "rent" | "free" | "lend";
export type Condition = "new" | "like-new" | "good" | "fair" | "bad";
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

export type Handoff = {
  id: string;
  listingId: string;
  slotId: string;
  buyerId: string;
  sellerId: string;
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
