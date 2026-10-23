// Super admin (platform owner) services.
import type { Business, BusinessStatus, Invoice, Plan, PlanCoupon, PlatformOverview, Subscription, TeamMember } from "@/types/saas";
import { api, listAll } from "@/lib/api";

export const getPlatformOverview = () => api.get<PlatformOverview>("/platform/overview");

export interface BusinessRow extends Business {
  planName: string;
  mrr: number;
}
export const listBusinesses = () => listAll<BusinessRow>("/platform/businesses");

export interface BusinessDetail {
  business: Business;
  plan?: Plan;
  subscription?: Subscription;
  invoices: Invoice[];
  team: TeamMember[];
  orders30d: number;
  revenue30d: number;
}
export const getBusinessDetail = (id: string) => api.get<BusinessDetail>(`/platform/businesses/${id}`);
export const setBusinessStatus = (id: string, status: BusinessStatus) => api.patch<Business>(`/platform/businesses/${id}/status`, { status });

export interface SubscriptionRow extends Subscription {
  businessName: string;
  planName: string;
}
export const listSubscriptions = () => listAll<SubscriptionRow>("/platform/subscriptions");

export interface InvoiceRow extends Invoice {
  businessName: string;
}
export const listInvoices = () => listAll<InvoiceRow>("/platform/invoices");

export const listPlans = () => api.get<(Plan & { subscribers: number })[]>("/platform/plans");
export const savePlan = (plan: Plan) => api.put<Plan>(`/platform/plans/${encodeURIComponent(plan.id)}`, plan);

// ---------- payment providers ----------

export interface PaymentProviderRow {
  name: string;
  label: string;
  /** Its keys are set in the server's environment. */
  configured: boolean;
  /** Offered to businesses for new payments. */
  enabled: boolean;
  isDefault: boolean;
  requiredEnv: string[];
}
export interface PaymentProviders { paymentsEnabled: boolean; providers: PaymentProviderRow[] }
export const getPaymentProviders = () => api.get<PaymentProviders>("/platform/payment-providers");
export const savePaymentProviders = (enabled: string[], def: string) => api.put<PaymentProviders>("/platform/payment-providers", { enabled, default: def });

// ---------- subscription discounts ----------

export type PlanCouponRow = PlanCoupon & { businessName?: string; planNames: string[]; redeemed: number; discountPerMonth: number };
export type PlanCouponInput = Pick<PlanCoupon, "code" | "type" | "value" | "planIds" | "businessId" | "maxUses" | "expiresAt" | "note">;

const couponBody = (i: PlanCouponInput) => ({
  code: i.code.trim().toUpperCase(), type: i.type, value: i.value,
  planIds: i.planIds?.length ? i.planIds : [], businessId: i.businessId || null,
  maxUses: i.maxUses ?? null, expiresAt: i.expiresAt ?? null, note: i.note?.trim() || null,
});

export const listPlanCoupons = () => listAll<PlanCouponRow>("/platform/plan-coupons");
export const savePlanCoupon = (id: string | null, input: PlanCouponInput) =>
  id ? api.put<PlanCoupon>(`/platform/plan-coupons/${id}`, couponBody(input)) : api.post<PlanCoupon>("/platform/plan-coupons", couponBody(input));
export const setPlanCouponStatus = (id: string, status: PlanCoupon["status"]) => api.patch<void>(`/platform/plan-coupons/${id}/status`, { status });
export const deletePlanCoupon = (id: string) => api.del(`/platform/plan-coupons/${id}`);
