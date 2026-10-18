// Platform discounts businesses can use when they subscribe or change plan.
import type { Plan, PlanCoupon } from "@/types/saas";
import { planDiscountUsd } from "@/lib/planCoupon";
import { db, delay, ServiceError } from "./db";

const find = (code: string) => db.planCoupons.find((c) => c.code === code.trim().toUpperCase());

/** Why this code can't be used, or the coupon itself. `businessId` is absent while signing up. */
export function checkPlanCoupon(code: string, plan: Plan, businessId?: string): PlanCoupon {
  const c = find(code);
  if (!c || c.status !== "active") throw new ServiceError("That discount code isn't valid.");
  if (c.expiresAt && new Date(c.expiresAt).getTime() < Date.now()) throw new ServiceError("That discount code has expired.");
  if (c.maxUses != null && c.usedCount >= c.maxUses) throw new ServiceError("That discount code has been fully used.");
  if (c.businessId && c.businessId !== businessId) throw new ServiceError("That discount code isn't valid for this business.");
  if (c.planIds?.length && !c.planIds.includes(plan.id)) {
    const names = c.planIds.map((id) => db.plans.find((p) => p.id === id)?.name ?? id).join(", ");
    throw new ServiceError(`That code only works on the ${names} plan.`);
  }
  if (plan.priceMonthly === 0) throw new ServiceError("Discount codes only apply to paid plans.");
  return { ...c };
}

/** Checks a code for a plan without using it up. */
export async function validatePlanCoupon(code: string, planId: string, businessId?: string): Promise<PlanCoupon> {
  await delay(300);
  const plan = db.plans.find((p) => p.id === planId);
  if (!plan) throw new ServiceError("Please choose a plan.");
  return checkPlanCoupon(code, plan, businessId);
}

/** Price, discount (USD) and the code to store for a subscription; counts the use. */
export function priceWithCoupon(code: string | undefined, plan: Plan, cycle: "monthly" | "yearly", businessId?: string, current?: string) {
  const list = cycle === "yearly" ? plan.priceYearly : plan.priceMonthly;
  if (!code?.trim()) return { amount: list, discount: 0, couponCode: undefined as string | undefined };
  const c = checkPlanCoupon(code, plan, businessId);
  const discount = planDiscountUsd(c, list);
  if (c.code !== current) {
    const stored = db.planCoupons.find((x) => x.id === c.id)!;
    stored.usedCount += 1;
  }
  return { amount: Math.round((list - discount) * 100) / 100, discount, couponCode: c.code };
}
