import type { StoreTheme } from "../types";

/**
 * Shop: clean, white, marketplace-style theme. Inspired by modern commerce
 * platforms — stark white background, pill category navigation, rounded image
 * cards and bold section titles.
 * Great for beauty, fashion, sporting goods, and general merchandise.
 */
const shop: StoreTheme = {
  id: "shop",
  name: "Shop",
  description: "Clean white marketplace: pill categories, rounded cards, and a bold modern layout.",
  swatches: ["#FFFFFF", "#F5F5F5", "#1A1A1A"],
  palette: {
    brand: "#1A1A1A",
    brandFg: "#FFFFFF",
    ink: "#1A1A1A",
    tint: "#F5F5F5",
    wash: "#FFFFFF",
    line: "#E8E8E8",
    muted: "#666666",
  },
  header: () => import("./Header"),
  footer: () => import("./Footer"),
  pages: {
    home: () => import("./Home"),
    shop: () => import("./Shop"),
    product: () => import("./Product"),
    cart: () => import("./Cart"),
  },
};
export default shop;
