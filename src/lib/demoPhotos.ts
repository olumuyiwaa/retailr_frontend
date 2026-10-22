/**
 * Unsplash photos used by the API demo seed (Scentora perfume shop).
 * Same IDs as prisma/seed-demo.ts — free to hotlink under the Unsplash licence.
 * Used for marketing theme thumbnails and hero mocks so previews look real.
 */
const PHOTO = (id: string, w = 600) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export const DEMO_PHOTOS = [
  PHOTO("1594035910387-fea47794261f"), // black and gold bottle
  PHOTO("1458538977777-0549b2370168"), // clear bottle
  PHOTO("1590736704728-f4730bb30770"), // hand holding glass bottle
  PHOTO("1622618991746-fe6004db3a47"), // bottle and jars on yellow
  PHOTO("1615634260167-c8cdede054de"), // glass bottle, selective focus
  PHOTO("1543422655-ac1c6ca993ed"), // glass bottle
  PHOTO("1593487568720-92097fb460fb"), // bottle on wooden table
  PHOTO("1723391962154-8a2b6299bc09"), // bottle on a table
] as const;

/** Named products from the Scentora seed — labels for marketing previews. */
export const DEMO_PRODUCTS = [
  { name: "Lagos Nights", price: "₦28,500", photo: DEMO_PHOTOS[0], cat: "Women", badge: "Bestseller" as const },
  { name: "Harmattan Rose", price: "₦26,000", photo: DEMO_PHOTOS[1], cat: "Women", badge: null },
  { name: "Iron & Cedar", price: "₦30,000", photo: DEMO_PHOTOS[2], cat: "Men", badge: "New" as const },
  { name: "Sahel Oud", price: "₦45,000", photo: DEMO_PHOTOS[3], cat: "Oud & Attar", badge: null },
  { name: "Cotton Bloom", price: "₦9,500", photo: DEMO_PHOTOS[4], cat: "Body Mist", badge: "Sale" as const },
  { name: "Discovery Set", price: "₦22,000", photo: DEMO_PHOTOS[5], cat: "Gift Sets", badge: null },
  { name: "Amber Attar", price: "₦12,500", photo: DEMO_PHOTOS[6], cat: "Oud & Attar", badge: null },
  { name: "Vanilla Sugar", price: "₦9,500", photo: DEMO_PHOTOS[7], cat: "Body Mist", badge: "Sale" as const },
] as const;

export const DEMO_CATEGORIES = ["Women", "Men", "Unisex", "Oud & Attar", "Body Mist", "Gift Sets"] as const;

export type ThemeLayout = "classic" | "showcase" | "atelier" | "market";
