import type { StorePaymentMethod } from "@/types/saas";

/**
 * "Pay on delivery or by bank transfer": the checkout options a store really offers, for headers, footers and product pages.
 * "pay" reads as a sentence ("Pay on delivery or by bank transfer"); "cash" as a list item ("Cash on delivery or bank transfer").
 */
export function payPhrase(methods: StorePaymentMethod[] | undefined, style: "pay" | "cash" = "pay"): string {
  const m = methods?.length ? methods : (["cod"] as StorePaymentMethod[]);
  const parts = m.map((x) => {
    if (x === "cod") return style === "pay" ? "on delivery" : "cash on delivery";
    if (x === "bank") return style === "pay" ? "by bank transfer" : "bank transfer";
    return style === "pay" ? "by card" : "card";
  });
  const joined = parts.length > 1 ? `${parts.slice(0, -1).join(", ")} or ${parts[parts.length - 1]}` : parts[0];
  const s = style === "pay" ? `Pay ${joined}` : joined;
  return s.charAt(0).toUpperCase() + s.slice(1);
}
