// Business admin (tenant) services. Every call is scoped by businessId, which
// is exactly how the real API will authorise requests.
import type { Category,
  Audience,
  Business,
  CustomerGroup,
  GroupRuleType,
  Message,
  MessageChannel,
  Coupon,
  BusinessOverview,
  BusinessUsage,
  Customer,
  Invoice,
  Order,
  OrderItem,
  OrderStatus,
  Plan,
  PaymentMethod,
  Product,
  SalesChannel,
  Subscription,
  TeamMember,
  TimeSeriesPoint,
} from "@/types/saas";
import { priceWithCoupon } from "./planCoupons";
import { db, delay, ServiceError, uid } from "./db";

const DAY = 86400000;
const inRange = (iso: string, fromDaysAgo: number, toDaysAgo: number) => {
  const t = Date.now() - new Date(iso).getTime();
  return t >= toDaysAgo * DAY && t < fromDaysAgo * DAY;
};

export async function getBusinessOverview(businessId: string): Promise<BusinessOverview> {
  await delay();
  const orders = db.orders.filter((o) => o.businessId === businessId);
  const paid = orders.filter((o) => o.paymentStatus === "paid");

  const cur = paid.filter((o) => inRange(o.placedAt, 30, 0));
  const prev = paid.filter((o) => inRange(o.placedAt, 60, 30));
  const sum = (xs: Order[]) => xs.reduce((s, o) => s + o.total, 0);
  const change = (a: number, b: number) => (b === 0 ? (a > 0 ? 100 : 0) : ((a - b) / b) * 100);

  const series: TimeSeriesPoint[] = [];
  for (let d = 29; d >= 0; d--) {
    const day = new Date(Date.now() - d * DAY);
    series.push({
      label: day.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: paid
        .filter((o) => inRange(o.placedAt, d + 1, d))
        .reduce((s, o) => s + o.total, 0),
    });
  }

  const statuses: OrderStatus[] = ["pending", "processing", "shipped", "delivered", "cancelled", "refunded"];
  const customers = db.customers.filter((c) => c.businessId === businessId);
  const products = db.products.filter((p) => p.businessId === businessId);

  return {
    revenue30d: sum(cur),
    revenueChangePct: change(sum(cur), sum(prev)),
    orders30d: cur.length,
    ordersChangePct: change(cur.length, prev.length),
    customers: customers.length,
    newCustomers30d: customers.filter((c) => inRange(c.joinedAt, 30, 0)).length,
    avgOrderValue: cur.length ? sum(cur) / cur.length : 0,
    revenueSeries: series,
    ordersByStatus: statuses.map((status) => ({
      status,
      count: orders.filter((o) => o.status === status).length,
    })),
    topProducts: [...products].sort((a, b) => b.sold - a.sold).slice(0, 5),
    lowStock: products.filter((p) => p.status !== "draft" && p.stock <= 6).slice(0, 5),
    recentOrders: orders.slice(0, 6),
    ...operational(orders, products, db.team.filter((t) => t.businessId === businessId).length),
  };
}

function operational(orders: Order[], products: Product[], teamSize: number) {
  const live = orders.filter((o) => o.status !== "cancelled" && o.status !== "refunded");
  const unpaid = live.filter((o) => o.paymentStatus === "unpaid");
  const sellable = products.filter((p) => p.status !== "draft");
  return {
    pendingOrders: orders.filter((o) => o.status === "pending").length,
    unpaidOrders: unpaid.length,
    unpaidAmount: unpaid.reduce((s, o) => s + o.total, 0),
    fulfilmentRatePct: live.length ? (live.filter((o) => o.status === "delivered").length / live.length) * 100 : 0,
    cancelRatePct: orders.length ? (orders.filter((o) => o.status === "cancelled").length / orders.length) * 100 : 0,
    outOfStock: sellable.filter((p) => p.stock <= 0).length,
    lowStockCount: sellable.filter((p) => p.stock > 0 && p.stock <= 6).length,
    totalOrders: orders.length,
    productsTotal: products.length,
    activeProducts: products.filter((p) => p.status === "active").length,
    teamSize,
  };
}

// ---------- products ----------

export async function listProducts(businessId: string): Promise<Product[]> {
  await delay();
  return db.products.filter((p) => p.businessId === businessId);
}

// ---------- categories ----------

export type CategoryWithCount = Category & { productCount: number };

const cleanCategoryName = (raw: string): string => {
  const name = raw.replace(/\s+/g, " ").trim();
  if (!name) throw new ServiceError("Enter a category name.");
  if (name.length > 40) throw new ServiceError("Keep category names under 40 characters.");
  return name;
};

export async function listCategories(businessId: string): Promise<CategoryWithCount[]> {
  await delay(200);
  return db.categories
    .filter((c) => c.businessId === businessId)
    .map((c) => ({ ...c, productCount: db.products.filter((p) => p.businessId === businessId && p.category === c.name).length }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function createCategory(businessId: string, rawName: string, image?: string): Promise<Category> {
  await delay(250);
  const name = cleanCategoryName(rawName);
  if (db.categories.some((c) => c.businessId === businessId && c.name.toLowerCase() === name.toLowerCase())) {
    throw new ServiceError(`You already have a category called "${name}".`);
  }
  const cat: Category = { id: uid("cat"), businessId, name, ...(image ? { image } : {}), createdAt: new Date().toISOString() };
  db.categories.push(cat);
  return { ...cat };
}

/** Renaming also moves the category's products to the new name. `image`: data URL to set, null to remove, undefined to keep. */
export async function updateCategory(businessId: string, id: string, patch: { name?: string; image?: string | null }): Promise<Category> {
  await delay(300);
  const cat = db.categories.find((c) => c.id === id && c.businessId === businessId);
  if (!cat) throw new ServiceError("Category not found.");
  if (patch.name !== undefined) {
    const name = cleanCategoryName(patch.name);
    if (db.categories.some((c) => c.id !== id && c.businessId === businessId && c.name.toLowerCase() === name.toLowerCase())) {
      throw new ServiceError(`You already have a category called "${name}".`);
    }
    for (const p of db.products) if (p.businessId === businessId && p.category === cat.name) p.category = name;
    cat.name = name;
  }
  if (patch.image === null) cat.image = undefined;
  else if (patch.image) cat.image = patch.image;
  return { ...cat };
}

/** Products in a deleted category stay on sale, just uncategorised. */
export async function deleteCategory(businessId: string, id: string): Promise<{ uncategorised: number }> {
  await delay(300);
  const i = db.categories.findIndex((c) => c.id === id && c.businessId === businessId);
  if (i === -1) throw new ServiceError("Category not found.");
  const name = db.categories[i].name;
  let n = 0;
  for (const p of db.products) if (p.businessId === businessId && p.category === name) { p.category = ""; n++; }
  db.categories.splice(i, 1);
  return { uncategorised: n };
}

export const MAX_PRODUCT_IMAGES = 6;
export const MAX_PRODUCT_SPECS = 10;

function cleanSpecs(input?: Product["specs"]): Product["specs"] {
  if (!input) return undefined;
  const rows = input.map((s) => ({ label: s.label.trim(), value: s.value.trim() })).filter((s) => s.label || s.value);
  if (rows.length > MAX_PRODUCT_SPECS) throw new ServiceError(`A product can have up to ${MAX_PRODUCT_SPECS} details.`);
  for (const r of rows) {
    if (!r.label || !r.value) throw new ServiceError("Each product detail needs both a name and a value.");
    if (r.label.length > 30) throw new ServiceError("Keep detail names under 30 characters.");
    if (r.value.length > 120) throw new ServiceError("Keep detail values under 120 characters.");
  }
  return rows;
}

export type ProductInput = Pick<Product, "name" | "sku" | "category" | "description" | "price" | "stock" | "status"> & {
  /** Photos as data URLs, cover first. Omit to leave unchanged; [] removes all. */
  images?: string[];
  variants?: Product["variants"];
  /** Product details shown on the storefront. Omit to leave unchanged; [] removes all. */
  specs?: Product["specs"];
};

function cleanVariants(input?: Product["variants"]): Product["variants"] {
  if (!input || input.length === 0) return undefined;
  const seen = new Set<string>();
  return input.map((v) => {
    const name = v.name.trim();
    if (!name) throw new ServiceError("Every variant needs a name.");
    if (seen.has(name.toLowerCase())) throw new ServiceError(`Two variants are both called "${name}".`);
    seen.add(name.toLowerCase());
    if (!Number.isInteger(v.stock) || v.stock < 0) throw new ServiceError(`Stock for "${name}" must be a whole number, 0 or more.`);
    if (v.price !== undefined && !(v.price >= 0)) throw new ServiceError(`Enter a valid price for "${name}".`);
    return { id: v.id || uid("var"), name, stock: v.stock, ...(v.price !== undefined ? { price: v.price } : {}) };
  });
}

export async function saveProduct(
  businessId: string,
  input: ProductInput,
  id?: string
): Promise<Product> {
  await delay(400);
  const { images: rawImages, variants: rawVariants, specs: rawSpecs, ...fields } = input;
  const specs = cleanSpecs(rawSpecs);
  const variants = cleanVariants(rawVariants);
  if (rawImages && rawImages.length > MAX_PRODUCT_IMAGES) throw new ServiceError(`A product can have up to ${MAX_PRODUCT_IMAGES} photos.`);
  const images = rawImages?.filter(Boolean);
  if (variants) fields.stock = variants.reduce((s, v) => s + v.stock, 0);
  input = fields as ProductInput;
  if (input.category?.trim()) {
    const cat = db.categories.find((c) => c.businessId === businessId && c.name.toLowerCase() === input.category.trim().toLowerCase());
    if (!cat) throw new ServiceError(`"${input.category.trim()}" isn't one of your categories. Add it under Categories first.`);
    input.category = cat.name;
  } else {
    input.category = "";
  }
  if (id) {
    const p = db.products.find((x) => x.id === id && x.businessId === businessId);
    if (!p) throw new ServiceError("Product not found.");
    Object.assign(p, input, {
      status: input.stock === 0 && input.status === "active" ? "out_of_stock" : input.status,
    });
    p.variants = variants;
    if (specs) p.specs = specs.length ? specs : undefined;
    if (images) {
      p.images = images.length ? images : undefined;
      p.image = images[0];
    }
    return { ...p };
  }
  const biz = db.businesses.find((b) => b.id === businessId);
  const plan = db.plans.find((p) => p.id === biz?.planId);
  const count = db.products.filter((p) => p.businessId === businessId).length;
  if (plan && plan.limits.products !== -1 && count >= plan.limits.products) {
    throw new ServiceError(`Your ${plan.name} plan is limited to ${plan.limits.products} products. Upgrade to add more.`);
  }
  const colors = ["#c3ceff", "#ffd9a8", "#b7ebd0", "#fecdca", "#d9d6fe", "#b2e9f5"];
  const product: Product = {
    ...input,
    id: uid("prd"),
    businessId,
    sold: 0,
    imageColor: colors[count % colors.length],
    createdAt: new Date().toISOString(),
    ...(images?.length ? { images, image: images[0] } : {}),
    ...(variants ? { variants } : {}),
    ...(specs?.length ? { specs } : {}),
    status: input.stock === 0 && input.status === "active" ? "out_of_stock" : input.status,
  };
  db.products.unshift(product);
  if (biz) biz.stats.products += 1;
  return product;
}

export async function deleteProduct(businessId: string, id: string): Promise<void> {
  await delay(300);
  const i = db.products.findIndex((p) => p.id === id && p.businessId === businessId);
  if (i === -1) throw new ServiceError("Product not found.");
  db.products.splice(i, 1);
  const biz = db.businesses.find((b) => b.id === businessId);
  if (biz) biz.stats.products = Math.max(0, biz.stats.products - 1);
}

// ---------- orders & customers ----------

export async function listOrders(businessId: string): Promise<Order[]> {
  await delay();
  return db.orders.filter((o) => o.businessId === businessId);
}

export async function updateOrderStatus(
  businessId: string,
  id: string,
  status: OrderStatus
): Promise<Order> {
  await delay(300);
  const o = db.orders.find((x) => x.id === id && x.businessId === businessId);
  if (!o) throw new ServiceError("Order not found.");
  o.status = status;
  if (status === "refunded") o.paymentStatus = "refunded";
  else if (status === "cancelled") o.paymentStatus = "unpaid";
  else if (o.paymentStatus === "unpaid" && status !== "pending") o.paymentStatus = "paid";
  return { ...o };
}

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
export async function recordSale(businessId: string, input: RecordSaleInput): Promise<Order> {
  await delay(500);
  const biz = db.businesses.find((b) => b.id === businessId);
  if (!biz) throw new ServiceError("Business not found.");
  if (biz.status !== "active" && biz.status !== "trial") {
    throw new ServiceError("Your store isn't active, so new sales can't be recorded.");
  }
  if (input.items.length === 0) throw new ServiceError("Add at least one product to the sale.");

  const plan = db.plans.find((p) => p.id === biz.planId);
  if (plan && plan.limits.ordersPerMonth !== -1) {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const thisMonth = db.orders.filter((o) => o.businessId === biz.id && new Date(o.placedAt) >= monthStart).length;
    if (thisMonth >= plan.limits.ordersPerMonth) {
      throw new ServiceError("You've reached this month's order limit on your plan. Upgrade to record more sales.");
    }
  }

  // validate every line against current stock BEFORE changing anything
  const lines: { product: Product; variant?: NonNullable<Product["variants"]>[number]; qty: number; price: number }[] = [];
  for (const it of input.items) {
    const product = db.products.find((p) => p.id === it.productId && p.businessId === biz.id);
    if (!product) throw new ServiceError("One of the products no longer exists.");
    if (!Number.isInteger(it.qty) || it.qty < 1) throw new ServiceError(`Enter a whole quantity for ${product.name}.`);
    if (it.price !== undefined && !(it.price >= 0)) throw new ServiceError(`Enter a valid price for ${product.name}.`);
    if (product.variants?.length) {
      const variant = product.variants.find((v) => v.id === it.variantId);
      if (!variant) throw new ServiceError(`Choose an option for ${product.name}.`);
      const label = `${product.name} (${variant.name})`;
      if (it.qty > variant.stock) throw new ServiceError(variant.stock <= 0 ? `${label} is sold out.` : `Only ${variant.stock} of ${label} left in stock.`);
      lines.push({ product, variant, qty: it.qty, price: it.price ?? variant.price ?? product.price });
      continue;
    }
    if (it.qty > product.stock) throw new ServiceError(product.stock <= 0 ? `${product.name} is sold out.` : `Only ${product.stock} of ${product.name} left in stock.`);
    lines.push({ product, qty: it.qty, price: it.price ?? product.price });
  }

  const items: OrderItem[] = lines.map(({ product, variant, qty, price }) => ({
    productId: product.id,
    ...(variant ? { variantId: variant.id } : {}),
    name: variant ? `${product.name} (${variant.name})` : product.name,
    qty,
    price,
  }));
  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
  const discount = input.discount && input.discount > 0 ? input.discount : 0;
  if (discount > subtotal) throw new ServiceError("The discount can't be more than the sale total.");
  const total = Math.round((subtotal - discount) * 100) / 100;

  // customer: existing, new (reuse by email/phone), or walk-in
  let customer = input.customerId ? db.customers.find((c) => c.id === input.customerId && c.businessId === biz.id) : undefined;
  if (input.customerId && !customer) throw new ServiceError("That customer no longer exists.");
  const nc = input.newCustomer;
  if (!customer && nc && nc.name.trim()) {
    const email = nc.email?.trim().toLowerCase() ?? "";
    const phone = nc.phone?.trim() ?? "";
    if (email && !/^\S+@\S+\.\S+$/.test(email)) throw new ServiceError("Enter a valid customer email, or leave it blank.");
    customer = db.customers.find((c) => c.businessId === biz.id && ((email && c.email.toLowerCase() === email) || (phone && c.phone === phone)));
    if (!customer) {
      db.customers.unshift({
        id: uid("cus"),
        businessId: biz.id,
        name: nc.name.trim(),
        email,
        phone,
        city: "",
        orders: 0,
        totalSpent: 0,
        joinedAt: new Date().toISOString(),
      });
      biz.stats.customers += 1;
      customer = db.customers[0];
    }
  }
  // the proxy returns stable objects, so re-read to mutate the stored record
  const stored = customer ? db.customers.find((c) => c.id === customer!.id)! : undefined;

  const prefix = biz.slug.slice(0, 2).toUpperCase();
  const last = db.orders
    .filter((o) => o.businessId === biz.id)
    .reduce((max, o) => Math.max(max, parseInt(o.number.replace(/\D/g, ""), 10) || 0), 999);

  const order: Order = {
    id: uid("ord"),
    businessId: biz.id,
    number: `#${prefix}${last + 1}`,
    customerId: stored?.id ?? "walk_in",
    customerName: stored?.name ?? "Walk-in customer",
    items,
    total,
    status: input.handedOver ? "delivered" : "processing",
    paymentStatus: input.paid ? "paid" : "unpaid",
    placedAt: new Date().toISOString(),
    channel: input.channel,
    paymentMethod: input.paymentMethod,
    ...(stored?.email ? { customerEmail: stored.email } : {}),
    ...(stored?.phone ? { customerPhone: stored.phone } : {}),
    ...(input.notes?.trim() ? { notes: input.notes.trim() } : {}),
    ...(discount ? { discount } : {}),
  };
  db.orders.unshift(order);

  for (const { product, variant, qty } of lines) {
    if (variant) variant.stock -= qty;
    product.stock -= qty;
    product.sold += qty;
    if (product.stock <= 0) product.status = "out_of_stock";
  }
  biz.stats.orders += 1;
  if (input.paid) {
    biz.stats.revenue += total;
    if (stored) {
      stored.orders += 1;
      stored.totalSpent += total;
    }
  }
  return { ...order };
}

// ---------- reports ----------

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

export async function getSalesReport(businessId: string, days: ReportDays): Promise<SalesReport> {
  await delay();
  const all = db.orders.filter((o) => o.businessId === businessId);
  const paid = all.filter((o) => o.paymentStatus === "paid");
  const cur = paid.filter((o) => inRange(o.placedAt, days, 0));
  const prev = paid.filter((o) => inRange(o.placedAt, days * 2, days));
  const sum = (xs: Order[]) => xs.reduce((s, o) => s + o.total, 0);
  const change = (a: number, b: number) => (b === 0 ? (a > 0 ? 100 : 0) : ((a - b) / b) * 100);

  // chart buckets: daily up to 30 days, weekly for 90, monthly-ish for a year
  const size = days <= 30 ? 1 : days <= 90 ? 7 : 30;
  const buckets = Math.ceil(days / size);
  const series: TimeSeriesPoint[] = [];
  for (let b = buckets - 1; b >= 0; b--) {
    const start = Math.min(days, (b + 1) * size);
    const end = b * size;
    const day = new Date(Date.now() - end * DAY);
    series.push({
      label: day.toLocaleDateString("en-US", size >= 30 ? { month: "short" } : { month: "short", day: "numeric" }),
      value: cur.filter((o) => inRange(o.placedAt, start, end)).reduce((s, o) => s + o.total, 0),
    });
  }

  const group = <K extends string>(keyOf: (o: Order) => K) => {
    const map = new Map<K, { orders: number; revenue: number }>();
    for (const o of cur) {
      const k = keyOf(o);
      const g = map.get(k) ?? { orders: 0, revenue: 0 };
      g.orders += 1;
      g.revenue += o.total;
      map.set(k, g);
    }
    return Array.from(map.entries()).map(([key, v]) => ({ key, ...v })).sort((a, b) => b.revenue - a.revenue);
  };

  const prodMap = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const o of cur) {
    for (const it of o.items) {
      const p = db.products.find((x) => x.id === it.productId);
      const key = it.productId;
      const g = prodMap.get(key) ?? { name: p?.name ?? it.name, qty: 0, revenue: 0 };
      g.qty += it.qty;
      g.revenue += it.qty * it.price;
      prodMap.set(key, g);
    }
  }

  const custMap = new Map<string, { id: string; name: string; orders: number; revenue: number }>();
  for (const o of cur) {
    if (o.customerId === "walk_in") continue;
    const g = custMap.get(o.customerId) ?? { id: o.customerId, name: o.customerName, orders: 0, revenue: 0 };
    g.orders += 1;
    g.revenue += o.total;
    custMap.set(o.customerId, g);
  }

  const live = all.filter((o) => o.status !== "cancelled" && o.status !== "refunded" && o.paymentStatus === "unpaid" && inRange(o.placedAt, days, 0));

  return {
    days,
    revenue: sum(cur),
    revenueChangePct: change(sum(cur), sum(prev)),
    orders: cur.length,
    ordersChangePct: change(cur.length, prev.length),
    avgOrderValue: cur.length ? sum(cur) / cur.length : 0,
    outstanding: live.reduce((s, o) => s + o.total, 0),
    itemsSold: cur.reduce((s, o) => s + o.items.reduce((n, i) => n + i.qty, 0), 0),
    newCustomers: db.customers.filter((c) => c.businessId === businessId && inRange(c.joinedAt, days, 0)).length,
    series,
    byChannel: group((o) => o.channel ?? "online").map((g) => ({ channel: g.key, orders: g.orders, revenue: g.revenue })),
    byPayment: group((o) => (o.paymentMethod ?? "unknown") as PaymentMethod | "unknown").map((g) => ({ method: g.key, orders: g.orders, revenue: g.revenue })),
    topProducts: Array.from(prodMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 8),
    topCustomers: Array.from(custMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5),
  };
}

export async function listCustomers(businessId: string): Promise<Customer[]> {
  await delay();
  return db.customers.filter((c) => c.businessId === businessId);
}

export interface CustomerDetail {
  customer: Customer;
  orders: Order[];
  groups: string[];
  avgOrder: number;
  lastOrderAt?: string;
  address?: string;
}

export async function getCustomerDetail(businessId: string, customerId: string): Promise<CustomerDetail> {
  await delay(200);
  const customer = db.customers.find((c) => c.id === customerId && c.businessId === businessId);
  if (!customer) throw new ServiceError("Customer not found.");
  const orders = db.orders
    .filter((o) => o.businessId === businessId && o.customerId === customer.id)
    .map((o) => ({ ...o }))
    .sort((a, b) => b.placedAt.localeCompare(a.placedAt));
  const paid = orders.filter((o) => o.paymentStatus === "paid");
  const groups = db.customerGroups
    .filter((g) => g.businessId === businessId && membersOf(businessId, g).some((m) => m.id === customer.id))
    .map((g) => g.name);
  return {
    customer: { ...customer },
    orders,
    groups,
    avgOrder: paid.length ? paid.reduce((n, o) => n + o.total, 0) / paid.length : 0,
    lastOrderAt: orders[0]?.placedAt,
    address: orders.find((o) => o.shippingAddress)?.shippingAddress,
  };
}

// ---------- team ----------

export async function listTeam(businessId: string): Promise<TeamMember[]> {
  await delay(250);
  return db.team.filter((t) => t.businessId === businessId);
}

export async function inviteTeamMember(
  businessId: string,
  input: { name: string; email: string; role: "manager" | "staff" }
): Promise<TeamMember> {
  await delay(400);
  const biz = db.businesses.find((b) => b.id === businessId);
  const plan = db.plans.find((p) => p.id === biz?.planId);
  const count = db.team.filter((t) => t.businessId === businessId).length;
  if (plan && count >= plan.limits.staff) {
    throw new ServiceError(`Your ${plan.name} plan allows ${plan.limits.staff} team members. Upgrade to invite more.`);
  }
  if (db.team.some((t) => t.businessId === businessId && t.email.toLowerCase() === input.email.toLowerCase())) {
    throw new ServiceError("That person is already on your team.");
  }
  const m: TeamMember = {
    id: uid("tm"),
    businessId,
    ...input,
    status: "invited",
    joinedAt: new Date().toISOString(),
  };
  db.team.push(m);
  return m;
}

export async function removeTeamMember(businessId: string, id: string): Promise<void> {
  await delay(300);
  const m = db.team.find((t) => t.id === id && t.businessId === businessId);
  if (!m) throw new ServiceError("Team member not found.");
  if (m.role === "owner") throw new ServiceError("The owner cannot be removed.");
  db.team.splice(db.team.indexOf(m), 1);
}

// ---------- billing ----------

export interface BillingInfo {
  plan: Plan;
  subscription?: Subscription;
  usage: BusinessUsage;
  invoices: Invoice[];
  plans: Plan[];
}

export async function getBilling(businessId: string): Promise<BillingInfo> {
  await delay();
  const biz = db.businesses.find((b) => b.id === businessId);
  if (!biz) throw new ServiceError("Business not found.");
  const plan = db.plans.find((p) => p.id === biz.planId)!;
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const ordersThisMonth = db.orders.filter(
    (o) => o.businessId === businessId && new Date(o.placedAt) >= monthStart
  ).length;
  const productCount = db.products.filter((p) => p.businessId === businessId).length;
  return {
    plan,
    subscription: db.subscriptions.find((s) => s.businessId === businessId),
    usage: {
      products: { used: productCount, limit: plan.limits.products },
      staff: { used: db.team.filter((t) => t.businessId === businessId).length, limit: plan.limits.staff },
      ordersThisMonth: { used: ordersThisMonth, limit: plan.limits.ordersPerMonth },
      storageGb: { used: Math.round((0.3 + productCount * 0.08) * 10) / 10, limit: plan.limits.storageGb },
    },
    invoices: db.invoices.filter((i) => i.businessId === businessId),
    plans: db.plans.filter((p) => p.isActive),
  };
}

export async function changePlan(
  businessId: string,
  planId: string,
  cycle: "monthly" | "yearly",
  couponCode?: string
): Promise<void> {
  await delay(700);
  const biz = db.businesses.find((b) => b.id === businessId);
  const plan = db.plans.find((p) => p.id === planId);
  const sub = db.subscriptions.find((s) => s.businessId === businessId);
  if (!biz || !plan || !sub) throw new ServiceError("Could not change plan.");
  // validate the code first so a bad one changes nothing; a code from an earlier plan doesn't carry over unless re-entered
  let priced = { amount: 0, discount: 0, couponCode: undefined as string | undefined };
  const carry = !couponCode && sub.planId === plan.id ? sub.couponCode : undefined; // same plan, new cycle: keep the discount if it still works
  try {
    priced = priceWithCoupon(couponCode ?? carry, plan, cycle, businessId, sub.couponCode);
  } catch (e) {
    if (couponCode) throw e;
    priced = priceWithCoupon(undefined, plan, cycle);
  }
  biz.planId = plan.id;
  sub.planId = plan.id;
  sub.cycle = cycle;
  sub.amount = priced.amount;
  sub.couponCode = priced.couponCode;
  sub.discount = priced.couponCode ? priced.discount : undefined;
  if (sub.amount === 0) {
    sub.status = "active";
    sub.trialEndsAt = undefined;
  }
}

// ---------- store profile ----------

export async function getBusinessProfile(businessId: string): Promise<Business> {
  await delay(250);
  const biz = db.businesses.find((b) => b.id === businessId);
  if (!biz) throw new ServiceError("Business not found.");
  return { ...biz };
}

export async function updateBusinessProfile(
  businessId: string,
  patch: Partial<Pick<Business, "name" | "description" | "phone" | "country" | "city" | "brandColor" | "category" | "currency" | "theme">> & {
    /** data URL to set, null to remove, undefined to leave unchanged */
    logo?: string | null;
  }
): Promise<Business> {
  await delay(450);
  const biz = db.businesses.find((b) => b.id === businessId);
  if (!biz) throw new ServiceError("Business not found.");
  const { logo, ...rest } = patch;
  Object.assign(biz, rest);
  if (logo === null) biz.logo = undefined;
  else if (logo) biz.logo = logo;
  return { ...biz };
}

// ---------- discounts & coupons ----------

export type CouponInput = Pick<Coupon, "code" | "type" | "value" | "minOrder" | "maxUses" | "expiresAt">;

export async function listCoupons(businessId: string): Promise<Coupon[]> {
  await delay(250);
  return db.coupons.filter((c) => c.businessId === businessId).map((c) => ({ ...c }));
}

export async function saveCoupon(businessId: string, id: string | null, input: CouponInput): Promise<Coupon> {
  await delay(400);
  const code = input.code.trim().toUpperCase();
  if (!/^[A-Z0-9-]{3,20}$/.test(code)) throw new ServiceError("Use 3–20 letters, numbers or dashes for the code.");
  if (!(input.value > 0)) throw new ServiceError("Enter a discount greater than zero.");
  if (input.type === "percent" && input.value > 100) throw new ServiceError("A percentage can't be more than 100.");
  if (db.coupons.some((c) => c.businessId === businessId && c.code === code && c.id !== id)) {
    throw new ServiceError("You already have a code with that name.");
  }
  if (id) {
    const c = db.coupons.find((x) => x.id === id && x.businessId === businessId);
    if (!c) throw new ServiceError("Coupon not found.");
    Object.assign(c, input, { code });
    return { ...c };
  }
  const c: Coupon = { id: uid("cpn"), businessId, ...input, code, usedCount: 0, status: "active", createdAt: new Date().toISOString() };
  db.coupons.unshift(c);
  return { ...c };
}

export async function setCouponStatus(businessId: string, id: string, status: Coupon["status"]): Promise<void> {
  await delay(250);
  const c = db.coupons.find((x) => x.id === id && x.businessId === businessId);
  if (!c) throw new ServiceError("Coupon not found.");
  c.status = status;
}

export async function deleteCoupon(businessId: string, id: string): Promise<void> {
  await delay(250);
  const i = db.coupons.findIndex((x) => x.id === id && x.businessId === businessId);
  if (i >= 0) db.coupons.splice(i, 1);
}

// ---------- receipts ----------

export async function markReceiptSent(businessId: string, orderId: string): Promise<Order> {
  await delay(500);
  const o = db.orders.find((x) => x.id === orderId && x.businessId === businessId);
  if (!o) throw new ServiceError("Order not found.");
  o.receiptSentAt = new Date().toISOString();
  return { ...o };
}

// ---------- customer groups ----------

export type GroupInput = Pick<CustomerGroup, "name" | "description" | "kind" | "rule" | "memberIds">;
export type GroupWithCount = CustomerGroup & { memberCount: number };

export const RULE_LABELS: Record<GroupRuleType, string> = {
  spent_over: "Has spent more than",
  orders_at_least: "Has placed at least (orders)",
  joined_within_days: "Joined in the last (days)",
  no_order_within_days: "No order in the last (days)",
};

function membersOf(businessId: string, g: CustomerGroup): Customer[] {
  const mine = db.customers.filter((c) => c.businessId === businessId);
  if (g.kind === "manual") {
    const ids = new Set(g.memberIds);
    return mine.filter((c) => ids.has(c.id));
  }
  const rule = g.rule;
  if (!rule) return [];
  const now = Date.now();
  const lastOrder = (c: Customer) =>
    db.orders
      .filter((o) => o.businessId === businessId && o.customerId === c.id)
      .reduce((max, o) => Math.max(max, new Date(o.placedAt).getTime()), 0);
  return mine.filter((c) => {
    switch (rule.type) {
      case "spent_over": return c.totalSpent > rule.value;
      case "orders_at_least": return c.orders >= rule.value;
      case "joined_within_days": return now - new Date(c.joinedAt).getTime() <= rule.value * DAY;
      case "no_order_within_days": {
        const last = lastOrder(c);
        return last === 0 ? now - new Date(c.joinedAt).getTime() > rule.value * DAY : now - last > rule.value * DAY;
      }
    }
  });
}

export async function listGroups(businessId: string): Promise<GroupWithCount[]> {
  await delay(250);
  return db.customerGroups
    .filter((g) => g.businessId === businessId)
    .map((g) => ({ ...g, memberCount: membersOf(businessId, g).length }));
}

export async function getGroupMembers(businessId: string, groupId: string): Promise<Customer[]> {
  await delay(200);
  const g = db.customerGroups.find((x) => x.id === groupId && x.businessId === businessId);
  if (!g) throw new ServiceError("Group not found.");
  return membersOf(businessId, g).map((c) => ({ ...c }));
}

export async function saveGroup(businessId: string, id: string | null, input: GroupInput): Promise<CustomerGroup> {
  await delay(400);
  const name = input.name.trim();
  if (!name) throw new ServiceError("Give the group a name.");
  if (db.customerGroups.some((g) => g.businessId === businessId && g.id !== id && g.name.toLowerCase() === name.toLowerCase())) {
    throw new ServiceError("You already have a group with that name.");
  }
  if (input.kind === "auto" && !(input.rule && input.rule.value >= 0 && Number.isFinite(input.rule.value))) {
    throw new ServiceError("Enter a valid number for the rule.");
  }
  const valid = new Set(db.customers.filter((c) => c.businessId === businessId).map((c) => c.id));
  const patch = {
    name,
    description: input.description?.trim() || undefined,
    kind: input.kind,
    rule: input.kind === "auto" ? input.rule : undefined,
    memberIds: input.kind === "manual" ? input.memberIds.filter((m) => valid.has(m)) : [],
  };
  if (id) {
    const g = db.customerGroups.find((x) => x.id === id && x.businessId === businessId);
    if (!g) throw new ServiceError("Group not found.");
    Object.assign(g, patch);
    return { ...g };
  }
  const g: CustomerGroup = { id: uid("grp"), businessId, ...patch, createdAt: new Date().toISOString() };
  db.customerGroups.push(g);
  return { ...g };
}

export async function deleteGroup(businessId: string, id: string): Promise<void> {
  await delay(250);
  const i = db.customerGroups.findIndex((g) => g.id === id && g.businessId === businessId);
  if (i >= 0) db.customerGroups.splice(i, 1);
}

// ---------- messages ----------

const reachable = (c: Customer, channel: MessageChannel) =>
  channel === "email" ? /^\S+@\S+\.\S+$/.test(c.email ?? "") : (c.phone ?? "").replace(/\D/g, "").length >= 7;

function audienceMembers(businessId: string, audience: Audience, channel: MessageChannel) {
  let pool: Customer[];
  let label = "All customers";
  if (audience.type === "group") {
    const g = db.customerGroups.find((x) => x.id === audience.groupId && x.businessId === businessId);
    if (!g) throw new ServiceError("That group no longer exists.");
    pool = membersOf(businessId, g);
    label = g.name;
  } else {
    pool = db.customers.filter((c) => c.businessId === businessId);
  }
  return { label, total: pool.length, recipients: pool.filter((c) => reachable(c, channel)) };
}

/** How many customers a message would reach (customers without an email / phone are skipped). */
export async function countRecipients(businessId: string, audience: Audience, channel: MessageChannel) {
  await delay(150);
  const a = audienceMembers(businessId, audience, channel);
  return { count: a.recipients.length, skipped: a.total - a.recipients.length, label: a.label, sampleName: a.recipients[0]?.name.split(" ")[0] };
}

export async function listMessages(businessId: string): Promise<Message[]> {
  await delay(250);
  return db.messages
    .filter((m) => m.businessId === businessId)
    .sort((a, b) => +new Date(b.sentAt) - +new Date(a.sentAt))
    .map((m) => ({ ...m }));
}

export interface MessageInput {
  channel: MessageChannel;
  subject?: string;
  body: string;
  audience: Audience;
}

export async function sendMessage(businessId: string, input: MessageInput): Promise<Message> {
  await delay(900);
  const body = input.body.trim();
  if (!body) throw new ServiceError("Write a message first.");
  if (input.channel === "email" && !input.subject?.trim()) throw new ServiceError("Add a subject for the email.");
  if (input.channel === "sms" && body.length > 480) throw new ServiceError("SMS messages are limited to 480 characters.");
  const a = audienceMembers(businessId, input.audience, input.channel);
  if (a.recipients.length === 0) throw new ServiceError("No customers in this audience can be reached on that channel.");
  const m: Message = {
    id: uid("msg"),
    businessId,
    channel: input.channel,
    ...(input.channel === "email" ? { subject: input.subject!.trim() } : {}),
    body,
    audienceLabel: a.label,
    recipientCount: a.recipients.length,
    sentAt: new Date().toISOString(),
  };
  db.messages.unshift(m);
  return { ...m };
}
