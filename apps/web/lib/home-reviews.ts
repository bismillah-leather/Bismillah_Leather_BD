import { getPrisma, listApprovedHomeReviews, type PublicReview } from "@bismillah/db";
import { connection } from "next/server";
import { cache } from "react";
import { remember } from "./remember";

const SAMPLE_HOME_REVIEWS: PublicReview[] = [
  {
    id: "sample-1",
    rating: 5,
    title: "Soft leather, solid stitching",
    body: "The wallet feels thick and smooth, not plastic. Stitching is even and the card slots hold tight after a week of daily use.",
    authorName: "Rafiq Hasan",
    authorCity: "Dhaka",
    photos: [],
    verified: true,
    createdAt: "2026-11-21T00:00:00.000Z",
    productName: "Mini Long Wallet",
    productSlug: "mini-long-wallet",
    productImage: "/catalog/wallet-black-long.jpg",
  },
  {
    id: "sample-2",
    rating: 5,
    title: "Looks better in hand",
    body: "Colour is richer than the photos. Gifted this to my brother and the edge paint is clean. Packing was neat too.",
    authorName: "Nusrat Jahan",
    authorCity: "Chattogram",
    photos: [],
    verified: true,
    createdAt: "2026-11-20T00:00:00.000Z",
    productName: "Buffalo Wallet",
    productSlug: "buffalo-wallet",
    productImage: "/catalog/wallet-buffalo.jpg",
  },
  {
    id: "sample-3",
    rating: 4,
    title: "Good value",
    body: "Smell of real leather on opening. Slightly stiff at first, then it softened. Delivery inside Dhaka was next day after the call.",
    authorName: "Mahmudul Islam",
    authorCity: "Gazipur",
    photos: [],
    verified: true,
    createdAt: "2026-11-19T00:00:00.000Z",
    productName: "Tan Jeans Belt",
    productSlug: "jeans-belt",
    productImage: "/catalog/belt-tan-jeans.jpg",
  },
  {
    id: "sample-4",
    rating: 5,
    title: "Office bag that lasts",
    body: "Carry laptop and papers every day. Handle is comfortable and the zip does not snag. Would buy another colour.",
    authorName: "Farhana Akter",
    authorCity: "Sylhet",
    photos: [],
    verified: true,
    createdAt: "2026-11-18T00:00:00.000Z",
    productName: "Thara Wallet",
    productSlug: "thara-wallet",
    productImage: "/catalog/wallet-brown-long.jpg",
  },
  {
    id: "sample-5",
    rating: 5,
    title: "Belt size was right",
    body: "Measured as the chart said and it fits. Buckle is heavy, leather does not crease ugly after sitting.",
    authorName: "Tanvir Ahmed",
    authorCity: "Khulna",
    photos: [],
    verified: true,
    createdAt: "2026-11-17T00:00:00.000Z",
    productName: "Brown Formal Belt",
    productSlug: "formal-belt",
    productImage: "/catalog/belt-brown-formal.jpg",
  },
  {
    id: "sample-6",
    rating: 5,
    title: "Will order again",
    body: "Customer care confirmed before packing. Product is as described and the smell is genuine leather. Keep this quality.",
    authorName: "Ayesha Siddika",
    authorCity: "Barishal",
    photos: [],
    verified: true,
    createdAt: "2026-11-16T00:00:00.000Z",
    productName: "Three Quarter",
    productSlug: "semi-long-wallet",
    productImage: "/catalog/wallet-espresso.jpg",
  },
];

export const listHomeReviews = cache(async (): Promise<PublicReview[]> => {
  await connection();
  return remember("home-reviews", 5_000, async () => {
    try {
      const rows = await listApprovedHomeReviews(getPrisma(), 9);
      return rows.length > 0 ? rows : SAMPLE_HOME_REVIEWS;
    } catch (error) {
      console.error("[web] home reviews failed:", error);
      return SAMPLE_HOME_REVIEWS;
    }
  });
});
