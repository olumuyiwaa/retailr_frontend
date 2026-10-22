// Domain types for the Retailr SaaS marketplace.
// These mirror what the backend will eventually expose, so the mock services
// in src/services can be swapped for real API calls without touching the UI.

export type Role = "super_admin" | "business_admin";

export type BusinessStatus =
  | "active"
  | "trial"
  | "pending"
  | "suspended"
  | "cancelled";

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "cancelled";

export type BillingCycle = "monthly" | "yearly";

export type Currency = "NGN" | "GHS" | "KES" | "USD";

export interface PlanLimits {
  products: number; // -1 = unlimited
  staff: number;
  ordersPerMonth: number;
  storageGb: number;
  smsPerMonth: number;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  transactionFeePct: number;
  limits: PlanLimits;
  features: string[];
  /** Storefront theme ids this plan includes; "classic" is always included. */
  themes: string[];
  highlighted?: boolean;
  isActive: boolean;
  /** Hand-set local prices so each market sees a clean number (USD stays the accounting currency). */
  localPrices?: Partial<Record<Currency, { monthly: number; yearly: number }>>;
}

export interface BusinessStats {
  products: number;
  orders: number;
  customers: number;
  revenue: number; // lifetime gross merchandise value
}

export interface Business {
  id: string;
  name: string;
  slug: string;
  category: string;
  ownerName: string;
  ownerEmail: string;
  phone: string;
  country: string;
  city: string;
  brandColor: string;
  /** Storefront theme id (see src/themes). Missing means the default theme. */
  theme?: string;
  /** Business logo as a (resized) data URL; shoppers see it in the storefront header and on invoices. */
  logo?: string;
  /** Currency the store sells in; product prices are entered in it. */
  currency: Currency;
  paymentMethods?: StorePaymentMethod[];
  /** Shown to shoppers who choose bank transfer. */
  bankDetails?: string;
  description: string;
  status: BusinessStatus;
  planId: string;
  joinedAt: string; // ISO
  stats: BusinessStats;
}

/** A product category the business manages itself; products point at it by name. */
export interface ProductSpec {
  label: string;
  value: string;
}

export interface Category {
  id: string;
  businessId: string;
  name: string;
  /** Cover picture shown on the storefront (data URL or path). */
  image?: string;
  createdAt: string;
}

export interface Subscription {
  id: string;
  businessId: string;
  planId: string;
  status: SubscriptionStatus;
  cycle: BillingCycle;
  amount: number;
  startedAt: string;
  currentPeriodEnd: string;
  trialEndsAt?: string;
  cancelledAt?: string;
  /** Platform discount code applied to this subscription; `amount` is already net of it. */
  couponCode?: string;
  /** What the code takes off each billing period, in USD. */
  discount?: number;
}

/** A discount the platform gives businesses on their Retailr subscription. Amounts are in USD. */
export interface PlanCoupon {
  id: string;
  code: string;
  type: CouponType;
  /** percent: 1-100, fixed: USD off each billing period */
  value: number;
  /** Limit to these plans; empty or missing means every paid plan. */
  planIds?: string[];
  /** Limit to one business; missing means anyone can use it. */
  businessId?: string;
  maxUses?: number;
  usedCount: number;
  expiresAt?: string;
  status: CouponStatus;
  note?: string;
  createdAt: string;
}

export type InvoiceStatus = "paid" | "pending" | "failed" | "refunded";

export interface Invoice {
  id: string;
  businessId: string;
  planId: string;
  description: string;
  amount: number;
  status: InvoiceStatus;
  issuedAt: string;
  paidAt?: string;
}

export type ProductStatus = "active" | "draft" | "out_of_stock";

export interface ProductVariant {
  id: string;
  /** What the shopper picks, e.g. "Large / Red". */
  name: string;
  /** Overrides the product price when set. */
  price?: number;
  stock: number;
}

export interface Product {
  id: string;
  businessId: string;
  name: string;
  sku: string;
  category: string;
  description: string;
  price: number;
  stock: number;
  status: ProductStatus;
  sold: number;
  imageColor: string;
  /** Cover photo (always images[0] when there are photos), kept for screens that show one picture. */
  image?: string;
  /** All photos as (resized) data URLs, cover first. */
  images?: string[];
  /** When present, product.stock is the sum of the variants' stock. */
  variants?: ProductVariant[];
  /** Extra details the business wants shown on the product page (e.g. Material: Cotton). */
  specs?: ProductSpec[];
  createdAt: string;
}

export type ServiceStatus = "active" | "draft";

/** A priced choice such as "Short hair". Overrides the service price when set. */
export interface ServiceOption {
  id: string;
  name: string;
  price?: number;
}

/** A haircut, repair, class… Kept apart from products: no stock, never sold out, optionally bookable for a time slot. */
export interface Service {
  id: string;
  businessId: string;
  name: string;
  category: string;
  description: string;
  price: number;
  /** Minutes the service takes. */
  durationMins?: number;
  /** Customers pick a time slot instead of adding it to a cart. */
  bookable?: boolean;
  /** How many bookings can overlap. */
  maxConcurrent?: number;
  status: ServiceStatus;
  sold: number;
  imageColor: string;
  image?: string;
  images?: string[];
  options?: ServiceOption[];
  specs?: ProductSpec[];
  createdAt: string;
}

export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type PaymentStatus = "paid" | "unpaid" | "refunded";

export type PaymentMethod = "cod" | "bank" | "card" | "cash" | "pos";
/** The ways a shopper can pay at a storefront checkout; the store owner chooses which are offered. */
export type StorePaymentMethod = "cod" | "bank" | "card";

/** Where a sale came from. Online = the storefront; the rest are recorded by the merchant. */
export type SalesChannel = "online" | "in_store" | "whatsapp" | "instagram" | "phone" | "other";

export interface OrderItem {
  /** A line is a product (productId, variantId) or a service (serviceId, optionId). */
  productId: string;
  serviceId?: string;
  variantId?: string;
  optionId?: string;
  name: string;
  qty: number;
  price: number;
}

export interface Order {
  id: string;
  businessId: string;
  number: string;
  customerId: string;
  customerName: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  placedAt: string;
  // Captured at storefront checkout (absent on older seeded orders)
  customerEmail?: string;
  customerPhone?: string;
  shippingAddress?: string;
  notes?: string;
  paymentMethod?: PaymentMethod;
  /** Absent on older orders, which are treated as online. */
  channel?: SalesChannel;
  /** Shopper discount applied at checkout; `total` is already net of it. */
  couponCode?: string;
  discount?: number;
  receiptSentAt?: string;
}

export type CouponType = "percent" | "fixed";
export type CouponStatus = "active" | "disabled";

export interface Coupon {
  id: string;
  businessId: string;
  code: string;
  type: CouponType;
  /** percent: 1-100, fixed: amount off */
  value: number;
  minOrder?: number;
  maxUses?: number;
  usedCount: number;
  expiresAt?: string;
  status: CouponStatus;
  createdAt: string;
}

/** What a shopper is allowed to see about a business. */
export interface PublicStore {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  phone: string;
  city: string;
  country: string;
  brandColor: string;
  theme?: string;
  logo?: string;
  currency: Currency;
  paymentMethods?: StorePaymentMethod[];
  bankDetails?: string;
}

export interface Customer {
  id: string;
  businessId: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  orders: number;
  totalSpent: number;
  joinedAt: string;
}

export type GroupRuleType = "spent_over" | "orders_at_least" | "joined_within_days" | "no_order_within_days";

export interface CustomerGroup {
  id: string;
  businessId: string;
  name: string;
  description?: string;
  /** manual: you pick the members. auto: members are worked out from a rule. */
  kind: "manual" | "auto";
  memberIds: string[]; // manual groups
  rule?: { type: GroupRuleType; value: number }; // auto groups
  createdAt: string;
}

export type MessageChannel = "email" | "sms";

export interface Audience {
  type: "all" | "group";
  groupId?: string;
}

export interface Message {
  id: string;
  businessId: string;
  channel: MessageChannel;
  subject?: string;
  /** Template; {{first_name}} and {{store}} are filled in per customer. */
  body: string;
  audienceLabel: string;
  recipientCount: number;
  /** How many were handed to the mail or SMS provider, and how many could not be sent. Filled in a few seconds after sending. */
  delivered: number;
  failed: number;
  sentAt: string;
}

export interface TeamMember {
  id: string;
  businessId: string;
  name: string;
  email: string;
  role: "owner" | "manager" | "staff";
  status: "active" | "invited";
  joinedAt: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  /** False until the person opens the link in the confirmation email. */
  emailVerified?: boolean;
  businessId?: string; // set for business_admin
  /** A business admin's role on the team; decides which screens they see. */
  teamRole?: "owner" | "manager" | "staff";
}

export interface TimeSeriesPoint {
  label: string;
  value: number;
}

export interface PlatformOverview {
  mrr: number;
  mrrChangePct: number;
  activeBusinesses: number;
  trialBusinesses: number;
  suspendedBusinesses: number;
  newSignups30d: number;
  churnRatePct: number;
  gmv: number;
  mrrSeries: TimeSeriesPoint[];
  signupSeries: TimeSeriesPoint[];
  planDistribution: { planId: string; name: string; count: number }[];
  recentSignups: Business[];
  recentInvoices: Invoice[];
}

export interface BusinessOverview {
  revenue30d: number;
  revenueChangePct: number;
  orders30d: number;
  ordersChangePct: number;
  customers: number;
  newCustomers30d: number;
  avgOrderValue: number;
  revenueSeries: TimeSeriesPoint[];
  ordersByStatus: { status: OrderStatus; count: number }[];
  topProducts: Product[];
  lowStock: Product[];
  recentOrders: Order[];
  // Operational signals for the "needs attention" panel and the setup checklist
  pendingOrders: number;
  unpaidOrders: number;
  unpaidAmount: number;
  fulfilmentRatePct: number;
  cancelRatePct: number;
  outOfStock: number;
  lowStockCount: number;
  totalOrders: number;
  productsTotal: number;
  activeProducts: number;
  teamSize: number;
}

export interface BusinessUsage {
  products: { used: number; limit: number };
  staff: { used: number; limit: number };
  ordersThisMonth: { used: number; limit: number };
  storageGb: { used: number; limit: number };
}

// ---------- site analytics ----------

export type TrafficSource = "direct" | "whatsapp" | "instagram" | "facebook" | "search" | "other";
export type DeviceKind = "mobile" | "desktop" | "tablet";

export interface AnalyticsRange {
  days: number;
}

export interface AnalyticsKpi {
  value: number;
  /** % change against the previous period of the same length. */
  changePct: number;
}

export interface FunnelStep {
  label: string;
  count: number;
}

export interface SiteAnalytics {
  days: number;
  visitors: AnalyticsKpi;
  sessions: AnalyticsKpi;
  pageViews: AnalyticsKpi;
  /** Orders (or sign-ups) per 100 sessions. */
  conversionRate: AnalyticsKpi;
  series: { label: string; visitors: number; pageViews: number }[];
  funnel: FunnelStep[];
  pages: { label: string; views: number }[];
  sources: { source: TrafficSource; sessions: number }[];
  devices: { device: DeviceKind; sessions: number }[];
  countries: { country: string; sessions: number }[];
}

export interface BusinessAnalytics extends SiteAnalytics {
  topProducts: { id: string; name: string; views: number; orders: number }[];
}

export interface PlatformAnalytics extends SiteAnalytics {
  /** Traffic across every storefront on the platform. */
  stores: { visitors: number; sessions: number; orders: number; conversionRate: number };
  topStores: { id: string; name: string; slug: string; visitors: number; sessions: number; orders: number; conversionRate: number }[];
}

export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled" | "no_show";

export interface Booking {
  id: string;
  serviceId: string;
  serviceName: string;
  variantName?: string;
  price: number;
  /** ISO instants; show them in `timezone`. */
  startsAt: string;
  endsAt: string;
  durationMins: number;
  status: BookingStatus;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: string;
  source: "store" | "admin";
  timezone?: string;
  /** Only on what the customer gets back, for their own link. */
  publicToken?: string;
  createdAt: string;
}

export type WeekDay = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
export interface OpeningPeriod { start: string; end: string }
export interface BookingSettings {
  timezone: string;
  hours: Partial<Record<WeekDay, OpeningPeriod[]>>;
  /** false until the owner saves hours once (Monday to Friday 09:00-17:00 applies meanwhile). */
  configured: boolean;
  noticeHours: number;
  autoConfirm: boolean;
}

export interface BookingSlots {
  date: string;
  timezone: string;
  durationMins: number;
  slots: { startsAt: string; label: string }[];
}


export type ExpenseCategory = "rent" | "utilities" | "supplies" | "marketing" | "salaries" | "transport" | "other";

export interface Expense {
  id: string;
  businessId: string;
  amount: number;
  category: ExpenseCategory;
  note: string;
  spentAt: string;
  createdAt: string;
}

export interface SmsCredits {
  used: number;
  limit: number;
  remaining: number;
}
