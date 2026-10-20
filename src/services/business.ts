// Business admin services. The API works out which business you are from your sign-in, so the businessId arguments are kept only so
// the screens read the same as before: they are not sent.
import type {
  Audience, Business, BusinessOverview, BusinessUsage, Category, Coupon, Customer, CustomerGroup, GroupRuleType, Invoice, Message,
  MessageChannel, Order, OrderStatus, PaymentMethod, Plan, Product, SalesChannel, Subscription, TeamMember, TimeSeriesPoint,
} from "@/types/saas";
import { api, listAll } from "@/lib/api";
import { uploadImage, uploadImages } from "@/lib/upload";

/* eslint-disable @typescript-eslint/no-unused-vars */

export const getBusinessOverview = (_b: string) => api.get<BusinessOverview>("/business/overview");

// ---------- products & categories ----------

export const listProducts = (_b: string) => listAll<Product>("/business/products");

export type CategoryWithCount = Category & { productCount: number };
export const listCategories = (_b: string) => api.get<CategoryWithCount[]>("/business/categories");
export async function createCategory(_b: string, rawName: string, image?: string): Promise<Category> {
  return api.post<Category>("/business/categories", { name: rawName.trim(), ...(image ? { image: await uploadImage(image, "category") } : {}) });
}
export async function updateCategory(_b: string, id: string, patch: { name?: string; image?: string | null }): Promise<Category> {
  const { image, ...rest } = patch;
  return api.patch<Category>(`/business/categories/${id}`, { ...rest, ...(image === undefined ? {} : { image: image ? await uploadImage(image, "category") : null }) });
}
export const deleteCategory = (_b: string, id: string) => api.del<{ uncategorised: number }>(`/business/categories/${id}`);

export const MAX_PRODUCT_IMAGES = 6;
export const MAX_PRODUCT_SPECS = 10;

export type ProductInput = Pick<Product, "name" | "sku" | "category" | "description" | "price" | "stock" | "status"> & {
  /** Photos (picked files as data URLs, or already-uploaded URLs), cover first. Omit to leave unchanged; [] removes all. */
  images?: string[];
  variants?: Product["variants"];
  /** Product details shown on the storefront. Omit to leave unchanged; [] removes all. */
  specs?: Product["specs"];
};

export async function saveProduct(_b: string, input: ProductInput, id?: string): Promise<Product> {
  const { images, ...rest } = input;
  const body = { ...rest, ...(images ? { images: await uploadImages(images, "product") } : {}) };
  return id ? api.put<Product>(`/business/products/${id}`, body) : api.post<Product>("/business/products", body);
}
export const deleteProduct = (_b: string, id: string) => api.del(`/business/products/${id}`);

// ---------- orders & customers ----------

export const listOrders = (_b: string) => listAll<Order>("/business/orders");
export const updateOrderStatus = (_b: string, id: string, status: OrderStatus) => api.patch<Order>(`/business/orders/${id}/status`, { status });

export interface RecordSaleInput {
  /** Existing customer id, or omit for a walk-in / new customer. */
  customerId?: string;
  newCustomer?: { name: string; phone?: string; email?: string };
  items: { productId: string; variantId?: string; qty: number; price?: number }[];
  channel: SalesChannel;
  paymentMethod: PaymentMethod;
  /** false = the customer still owes the money */
  paid: boolean;
  /** true = goods already handed over (delivered); false = still to deliver */
  handedOver: boolean;
  /** Flat amount taken off the subtotal */
  discount?: number;
  notes?: string;
}
/** Record a sale made outside the storefront (in person, WhatsApp, Instagram, ...). */
export const recordSale = (_b: string, input: RecordSaleInput) => api.post<Order>("/business/sales", input);

export type ReportDays = 7 | 30 | 90 | 365;
export interface SalesReport {
  days: ReportDays;
  revenue: number;
  revenueChangePct: number;
  orders: number;
  ordersChangePct: number;
  avgOrderValue: number;
  /** Money still owed by customers on live orders in this period */
  outstanding: number;
  itemsSold: number;
  newCustomers: number;
  series: TimeSeriesPoint[];
  byChannel: { channel: SalesChannel; orders: number; revenue: number }[];
  byPayment: { method: PaymentMethod | "unknown"; orders: number; revenue: number }[];
  topProducts: { name: string; qty: number; revenue: number }[];
  topCustomers: { id: string; name: string; orders: number; revenue: number }[];
}

export const getSalesReport = (_b: string, days: ReportDays) => api.get<SalesReport>("/business/reports/sales", { days });

export const listCustomers = (_b: string) => listAll<Customer>("/business/customers");

export interface CustomerDetail {
  customer: Customer;
  orders: Order[];
  groups: string[];
  avgOrder: number;
  lastOrderAt?: string;
  address?: string;
}
export const getCustomerDetail = (_b: string, customerId: string) => api.get<CustomerDetail>(`/business/customers/${customerId}`);

// ---------- team ----------

export const listTeam = (_b: string) => api.get<TeamMember[]>("/business/team");
/** Sends the invite email; the person sets their own password from the link. */
export const inviteTeamMember = (_b: string, input: { name: string; email: string; role: "manager" | "staff" }) => api.post<TeamMember>("/business/team", input);
export const removeTeamMember = (_b: string, id: string) => api.del(`/business/team/${id}`);
export const resendInvite = (id: string) => api.post<TeamMember>(`/business/team/${id}/resend`);

// ---------- billing ----------

export interface BillingInfo {
  plan: Plan;
  subscription?: Subscription;
  usage: BusinessUsage;
  invoices: Invoice[];
  plans: Plan[];
  /** Whether plans are paid for online, and whether a card is saved for renewals. */
  payments?: { enabled: boolean; provider: string | null; cardOnFile: boolean };
}
export const getBilling = (_b: string) => api.get<BillingInfo>("/business/billing");

export interface CheckoutResult {
  reference: string;
  checkoutUrl?: string;
  applied: boolean;
  charge: { amount: number; currency: string };
}

/** Starts paying for a plan. When online payments are on this returns where to send the customer; a fully discounted plan applies at once. */
export const startCheckout = (planId: string, cycle: "monthly" | "yearly", couponCode?: string) =>
  api.post<CheckoutResult>("/business/billing/checkout", { planId, cycle, couponCode: couponCode || undefined });

/** Asks the API how a payment ended (after the customer returns from the payment page). */
export const verifyPayment = (reference: string) => api.get<{ status: "paid" | "failed" | "pending"; applied: boolean }>(`/business/billing/verify/${encodeURIComponent(reference)}`);

/**
 * Switches plan. Returns `{ redirected: true }` when the plan has to be paid for first: the browser is then on its way to the payment page.
 */
export async function changePlan(_b: string, planId: string, cycle: "monthly" | "yearly", couponCode?: string): Promise<{ redirected: boolean }> {
  try {
    await api.post("/business/billing/change-plan", { planId, cycle, couponCode: couponCode || undefined });
    return { redirected: false };
  } catch (e) {
    if ((e as { code?: string }).code !== "PAYMENT_REQUIRED") throw e;
  }
  const c = await startCheckout(planId, cycle, couponCode);
  if (c.applied || !c.checkoutUrl) return { redirected: false };
  window.location.href = c.checkoutUrl;
  return { redirected: true };
}

// ---------- store profile ----------

export const getBusinessProfile = (_b: string) => api.get<Business>("/business/profile");
export async function updateBusinessProfile(
  _b: string,
  patch: Partial<Pick<Business, "name" | "description" | "phone" | "country" | "city" | "brandColor" | "category" | "currency" | "theme" | "paymentMethods" | "bankDetails">> & {
    /** picked file as a data URL to set, null to remove, undefined to leave unchanged */
    logo?: string | null;
  }
): Promise<Business> {
  const { logo, ...rest } = patch;
  return api.patch<Business>("/business/profile", { ...rest, ...(logo === undefined ? {} : { logo: logo ? await uploadImage(logo, "logo") : null }) });
}

// ---------- discounts & coupons ----------

export type CouponInput = Pick<Coupon, "code" | "type" | "value" | "minOrder" | "maxUses" | "expiresAt">;
const couponBody = (i: CouponInput) => ({ code: i.code.trim().toUpperCase(), type: i.type, value: i.value, minOrder: i.minOrder ?? null, maxUses: i.maxUses ?? null, expiresAt: i.expiresAt ?? null });

export const listCoupons = (_b: string) => api.get<Coupon[]>("/business/coupons");
export const saveCoupon = (_b: string, id: string | null, input: CouponInput) =>
  id ? api.put<Coupon>(`/business/coupons/${id}`, couponBody(input)) : api.post<Coupon>("/business/coupons", couponBody(input));
export const setCouponStatus = (_b: string, id: string, status: Coupon["status"]) => api.patch<void>(`/business/coupons/${id}/status`, { status });
export const deleteCoupon = (_b: string, id: string) => api.del(`/business/coupons/${id}`);

// ---------- receipts ----------

/** Emails the receipt to the customer, then returns the order with its sent time. */
export const markReceiptSent = (_b: string, orderId: string) => api.post<Order>(`/business/orders/${orderId}/receipt`);

// ---------- customer groups ----------

export type GroupInput = Pick<CustomerGroup, "name" | "description" | "kind" | "rule" | "memberIds">;
export type GroupWithCount = CustomerGroup & { memberCount: number };

export const RULE_LABELS: Record<GroupRuleType, string> = {
  spent_over: "Has spent more than",
  orders_at_least: "Has placed at least (orders)",
  joined_within_days: "Joined in the last (days)",
  no_order_within_days: "No order in the last (days)",
};

export const listGroups = (_b: string) => api.get<GroupWithCount[]>("/business/groups");
export const getGroupMembers = (_b: string, groupId: string) => api.get<Customer[]>(`/business/groups/${groupId}/members`);
export const saveGroup = (_b: string, id: string | null, input: GroupInput) =>
  id ? api.put<CustomerGroup>(`/business/groups/${id}`, input) : api.post<CustomerGroup>("/business/groups", input);
export const deleteGroup = (_b: string, id: string) => api.del(`/business/groups/${id}`);

// ---------- messages ----------

/** How many customers a message would reach (customers without an email / phone are skipped). */
export const countRecipients = (_b: string, audience: Audience, channel: MessageChannel) =>
  api.get<{ count: number; skipped: number; label: string; sampleName?: string }>("/business/messages/audience", { type: audience.type, groupId: audience.type === "group" ? audience.groupId : undefined, channel });

export const listMessages = (_b: string) => api.get<Message[]>("/business/messages");

export interface MessageInput {
  channel: MessageChannel;
  subject?: string;
  body: string;
  audience: Audience;
}
export const sendMessage = (_b: string, input: MessageInput) => api.post<Message>("/business/messages", input);
