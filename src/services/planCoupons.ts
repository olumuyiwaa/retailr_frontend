// Platform discounts businesses can use when they subscribe or change plan. Pricing and redemption are done by the API.
import type { PlanCoupon } from "@/types/saas";
import { api } from "@/lib/api";

/** Checks a code for a plan without using it up. Sends the session (when there is one) so codes meant for one business validate for it. */
export const validatePlanCoupon = (code: string, planId: string) =>
  api.post<PlanCoupon>("/plan-coupons/validate", { code: code.trim(), planId });
