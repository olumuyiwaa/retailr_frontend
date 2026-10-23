import type { StoreTheme } from "../types";

/**
 * Bazaar: wholesale-marketplace look inspired by 1688 —
 * orange search & CTAs, dense product grids, category sidebar,
 * price-forward cards. Best for high-SKU catalogues and bulk-style selling.
 */
const bazaar: StoreTheme = {
  id: "bazaar",
  name: "Bazaar",
  description:
    "Wholesale marketplace style: orange search bar, dense product grids, category sidebar and price-first cards — inspired by 1688.",
  swatches: ["#FFF7F0", "#FFFFFF", "#FF6A00"],
  palette: {
    brand: "#FF6A00",
    brandFg: "#FFFFFF",
    ink: "#222222",
    tint: "#FFF1E6",
    wash: "#F7F8FA",
    line: "#E8E8E8",
    muted: "#8C8C8C",
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
export default bazaar;
