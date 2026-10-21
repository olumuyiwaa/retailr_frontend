import type { StoreTheme } from "../types";

/**
 * Market: bold marketplace aesthetic inspired by SHOP.COM —
 * deep navy header, red action colours, crisp white product grid.
 * Structured two-row header with category bar, grid-heavy home page,
 * and high-contrast CTAs. Great for stores with large catalogues.
 */
const market: StoreTheme = {
  id: "market",
  name: "Market",
  description: "Bold marketplace: navy header, red accents and a structured product grid for stores with big catalogues.",
  swatches: ["#1A2238", "#FFFFFF", "#D72638"],
  palette: {
    brand: "#D72638",
    brandFg: "#FFFFFF",
    ink: "#1A2238",
    tint: "#EEF1F8",
    wash: "#F5F6FA",
    line: "#E2E6EF",
    muted: "#6B7A99",
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
export default market;
