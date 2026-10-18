import type { PlanCoupon } from "@/types/saas";

/** What a platform discount takes off a USD price (never more than the price). */
export function planDiscountUsd(coupon: Pick<PlanCoupon, "type" | "value">, listUsd: number): number {
  const raw = coupon.type === "percent" ? (listUsd * coupon.value) / 100 : coupon.value;
  return Math.round(Math.min(raw, listUsd) * 100) / 100;
}

export const planCouponLabel = (c: Pick<PlanCoupon, "type" | "value">) =>
  c.type === "percent" ? `${c.value}% off` : `$${c.value} off`;
