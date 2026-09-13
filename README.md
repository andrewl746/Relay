# Campus Hub

*(working title, rename as you like)*

A centralized hub where university students can sell, rent out, or give away furniture and school materials they do not need, especially when leaving for a co-op term.

## Problem

Hackathon topic: Problem 8, Resource Sharing. Useful items sit unused while someone nearby needs the same thing.

On a university campus this happens on a predictable schedule. Every co-op rotation and term boundary, thousands of students leave at the same time and thousands more arrive. Desks, monitors, mini fridges, lab kits, and textbooks get thrown out because coordinating a handoff is harder than throwing the item away. The buyer and the seller are often in the same building and never find each other.

General marketplaces do not solve this. They are built for browsing on a random Tuesday, not for a ten day window where everything has to move before a flight leaves.

## What we are building

A campus scoped marketplace built around move out timing.

Two modes on the same data:

- **Marketplace mode.** Normal listings for furniture and school materials, available year round.
- **Clearing mode.** During move out windows, listings carry a deadline and the app sorts by urgency instead of recency. Incoming students get matches pushed to them instead of searching an empty app.

Scope for now is furniture and school materials, because those are the items that are the biggest hassle to move and the most likely to be thrown out.

## Core features

### 1. Marketplace

Listings for furniture and school materials, for sale or for rent. Browse, filter, claim.

Students join their own university hub, so listings are local by default and pickup is realistic.

### 2. Student email verification

Sign up requires a valid university email. This keeps the hub local, cuts down on scams, and separates us from open marketplaces.

We are deliberately cautious about automatic scam and lowball filtering. A very cheap listing is usually a student who needs the item gone by Friday, not a scam. Any filtering should flag for review rather than delete.

### 3. Deadlines and urgency sorting

A listing can carry an expiry, for example "gone by Sat 12pm". The feed sorts by how close an item is to its deadline.

Price can decay toward free as the deadline approaches. The seller's real alternative is the dumpster, so this matches what the item is actually worth to them, and it gives buyers a reason to check back.

### 4. Wants list matching

Incoming students post what they need before they arrive, with a budget and a move in date. Leavers post what they are getting rid of. The system pairs them and notifies both sides.

This is the feature that makes the app more than a search box. A new user in July sees a queue of upcoming matches instead of an empty feed.

### 5. Room bundles

A leaver can post an entire room as one bundle. An arriver claims the whole thing in one action.

One leaver usually has eight items and one arriver usually needs eight items. Existing marketplaces force eight separate transactions. This is one trip and one handoff.

### 6. Exchange options

When a buyer claims an item, they pick from options the seller already set instead of opening a blank chat. Both sides get a confirmation with a time and a place.

- **Pickup at the seller's location.** Buyer picks a slot from the seller's stated windows.
- **Public campus meeting spot.** Seller offers the spot, buyer picks the time.
- **Delivery.** Only if the seller offers it.

Freeform negotiation is where marketplaces break down, with repeated "is this still available" messages and no shows. Structured slots produce a commitment with a time attached.

Handoffs default to public campus locations rather than private residences.

## Secondary features

### Camera scanning

Point a phone at a room. A vision model identifies objects and drafts listings the user approves with a swipe.

The reason people do not list things is that filling out a form costs more effort than the item is worth. Removing that friction is the point. Stretch goal, behind a feature flag, with normal photo upload as the fallback.

### Item history

Shows how many times an item has been passed between students. Adds trust to a listing and makes the reuse visible.

### Condition photos at handoff

Photos taken at handoff and at return, for rentals only, so damage disputes have evidence. Not needed for permanent sales.

### Chat

Low priority. Every marketplace has it and it is expensive to build well. The exchange options above cover most of what students actually need to coordinate. If we add it, it stays attached to a claimed item rather than working as open messaging between strangers.

## Impact

Every listing that gets claimed is one less item in a dumpster and one less thing an incoming student has to buy new. A per campus dashboard can track items diverted and money saved, which is also the number a residence life or sustainability office would care about.

## Build priority

1. Marketplace, listings, university hubs, student email verification
2. Deadlines and urgency sorting
3. Wants list matching
4. Room bundles
5. Exchange options and scheduling
6. Price decay
7. Item history
8. Camera scanning (stretch)
9. Condition photos (stretch)
10. Chat (only if time remains)

## Demo plan

The whole flow can be shown by our own team, with no outside users required.

1. Seed the hub with realistic listings from one campus.
2. A student leaving for co-op lists their room as a bundle in under a minute.
3. An incoming student's wants list matches the bundle and they get a notification.
4. They claim it and pick a pickup slot. Both sides see the confirmation.
5. Show the urgency feed and price decay on an item close to its deadline.

## Team

*(add names and roles)*

## Stack

*(add once decided)*

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
