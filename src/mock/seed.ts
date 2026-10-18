// Deterministic mock data for the Retailr SaaS marketplace.
// Everything is generated from a fixed seed so screens look the same every
// run. Dates are relative to "now" so charts always show recent activity.

import type {
  PlanCoupon,
  Business,
  Coupon,
  CustomerGroup,
  Message,
  Currency,
  BusinessStatus,
  Customer,
  Invoice,
  Order,
  OrderItem,
  OrderStatus,
  Plan,
  Product,
  Subscription,
  TeamMember,
} from "@/types/saas";
import { currencyForCountry } from "@/lib/money";

// ---------- helpers ----------

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20261014);
const int = (min: number, max: number) =>
  Math.floor(rand() * (max - min + 1)) + min;
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
const chance = (p: number) => rand() < p;

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.now();
const daysAgo = (d: number) => new Date(NOW - d * DAY).toISOString();
const daysAhead = (d: number) => new Date(NOW + d * DAY).toISOString();
const pad = (n: number, len = 3) => String(n).padStart(len, "0");

// ---------- plans ----------

export const plans: Plan[] = [
  {
    id: "plan_basic",
    name: "Basic",
    description: "Free forever. Open a store and make your first sales.",
    priceMonthly: 0,
    priceYearly: 0,
    transactionFeePct: 4,
    limits: { products: 25, staff: 1, ordersPerMonth: 30, storageGb: 1 },
    features: [
      "Branded online storefront",
      "Up to 25 products",
      "30 orders / month",
      "Discount codes",
      "Order invoices & receipts",
      "Community support",
    ],
    localPrices: {
      NGN: { monthly: 0, yearly: 0 },
      GHS: { monthly: 0, yearly: 0 },
      KES: { monthly: 0, yearly: 0 },
    },
    isActive: true,
  },
  {
    id: "plan_starter",
    name: "Starter",
    description: "Everything a new business needs to start selling online.",
    priceMonthly: 3,
    priceYearly: 30,
    transactionFeePct: 3,
    limits: { products: 300, staff: 2, ordersPerMonth: 300, storageGb: 3 },
    features: [
      "Everything in Basic",
      "Up to 300 products",
      "2 team members",
      "300 orders / month",
      "Basic sales reports",
      "Email support",
    ],
    localPrices: {
      NGN: { monthly: 4500, yearly: 45000 },
      GHS: { monthly: 45, yearly: 450 },
      KES: { monthly: 450, yearly: 4500 },
    },
    isActive: true,
  },
  {
    id: "plan_growth",
    name: "Growth",
    description: "For growing shops that need more room and better insight.",
    priceMonthly: 6,
    priceYearly: 60,
    transactionFeePct: 2,
    limits: { products: 1500, staff: 5, ordersPerMonth: 2000, storageGb: 10 },
    features: [
      "Everything in Starter",
      "Up to 1,500 products",
      "5 team members",
      "2,000 orders / month",
      "Advanced analytics",
      "Priority support",
    ],
    localPrices: {
      NGN: { monthly: 9500, yearly: 95000 },
      GHS: { monthly: 95, yearly: 950 },
      KES: { monthly: 950, yearly: 9500 },
    },
    highlighted: true,
    isActive: true,
  },
  {
    id: "plan_scale",
    name: "Scale",
    description: "High-volume sellers with teams and custom needs.",
    priceMonthly: 15,
    priceYearly: 150,
    transactionFeePct: 1,
    limits: { products: -1, staff: 15, ordersPerMonth: -1, storageGb: 50 },
    features: [
      "Everything in Growth",
      "Unlimited products & orders",
      "15 team members",
      "Custom domain",
      "API access",
      "Dedicated account manager",
    ],
    localPrices: {
      NGN: { monthly: 22000, yearly: 220000 },
      GHS: { monthly: 220, yearly: 2200 },
      KES: { monthly: 2200, yearly: 22000 },
    },
    isActive: true,
  },
];

const planPrice = (id: string) => plans.find((p) => p.id === id)!;

// ---------- businesses ----------

interface BizSeed {
  name: string;
  category: string;
  owner: string;
  country: string;
  city: string;
  color: string;
  plan: string;
  status: BusinessStatus;
}

const bizSeeds: BizSeed[] = [
  { name: "Adire Hub", category: "Fashion & Textiles", owner: "Amara Okafor", country: "Nigeria", city: "Lagos", color: "#465fff", plan: "plan_growth", status: "active" },
  { name: "Kente & Co", category: "Fashion & Textiles", owner: "Kwame Mensah", country: "Ghana", city: "Accra", color: "#f79009", plan: "plan_scale", status: "active" },
  { name: "Shea Glow", category: "Beauty & Wellness", owner: "Zainab Bello", country: "Nigeria", city: "Abuja", color: "#12b76a", plan: "plan_growth", status: "active" },
  { name: "Savannah Spice", category: "Food & Groceries", owner: "Fatou Diallo", country: "Senegal", city: "Dakar", color: "#f04438", plan: "plan_starter", status: "active" },
  { name: "Kilimanjaro Coffee", category: "Coffee & Tea", owner: "Neema Mushi", country: "Tanzania", city: "Arusha", color: "#7a5af8", plan: "plan_growth", status: "active" },
  { name: "Baobab Crafts", category: "Crafts & Decor", owner: "Tendai Moyo", country: "Zimbabwe", city: "Harare", color: "#0ba5ec", plan: "plan_basic", status: "active" },
  { name: "Ankara Avenue", category: "Fashion & Textiles", owner: "Chidinma Eze", country: "Nigeria", city: "Port Harcourt", color: "#ee46bc", plan: "plan_scale", status: "active" },
  { name: "Zuri Beauty", category: "Beauty & Wellness", owner: "Zuri Kamau", country: "Kenya", city: "Nairobi", color: "#fb6514", plan: "plan_growth", status: "active" },
  { name: "Jollof Junction", category: "Food & Groceries", owner: "Tunde Bakare", country: "Nigeria", city: "Ibadan", color: "#d92d20", plan: "plan_basic", status: "active" },
  { name: "Accra Beads", category: "Jewellery", owner: "Efua Asante", country: "Ghana", city: "Kumasi", color: "#dd2590", plan: "plan_basic", status: "active" },
  { name: "Nile Textiles", category: "Fashion & Textiles", owner: "Omar Hassan", country: "Egypt", city: "Cairo", color: "#3641f5", plan: "plan_growth", status: "active" },
  { name: "Ubuntu Wellness", category: "Beauty & Wellness", owner: "Thabo Nkosi", country: "South Africa", city: "Johannesburg", color: "#039855", plan: "plan_growth", status: "active" },
  { name: "Lagos Leather Works", category: "Fashion & Textiles", owner: "Segun Adeyemi", country: "Nigeria", city: "Lagos", color: "#b54708", plan: "plan_scale", status: "active" },
  { name: "Cape Rooibos", category: "Coffee & Tea", owner: "Annelie van Wyk", country: "South Africa", city: "Cape Town", color: "#c4320a", plan: "plan_starter", status: "active" },
  { name: "Maasai Markets", category: "Crafts & Decor", owner: "Joseph Lenku", country: "Kenya", city: "Nairobi", color: "#6938ef", plan: "plan_growth", status: "active" },
  { name: "Teranga Eats", category: "Food & Groceries", owner: "Aminata Sow", country: "Senegal", city: "Thiès", color: "#079455", plan: "plan_starter", status: "trial" },
  { name: "Ife Jewels", category: "Jewellery", owner: "Folake Adebayo", country: "Nigeria", city: "Ile-Ife", color: "#9e77ed", plan: "plan_growth", status: "trial" },
  { name: "Abyssinia Brew", category: "Coffee & Tea", owner: "Selam Tadesse", country: "Ethiopia", city: "Addis Ababa", color: "#7f56d9", plan: "plan_starter", status: "trial" },
  { name: "Sahel Soaps", category: "Beauty & Wellness", owner: "Ibrahim Traoré", country: "Mali", city: "Bamako", color: "#15b79e", plan: "plan_starter", status: "trial" },
  { name: "Kigali Weaves", category: "Crafts & Decor", owner: "Grace Uwase", country: "Rwanda", city: "Kigali", color: "#e31b54", plan: "plan_growth", status: "suspended" },
  { name: "Mombasa Spices", category: "Food & Groceries", owner: "Hamisi Juma", country: "Kenya", city: "Mombasa", color: "#f63d68", plan: "plan_starter", status: "suspended" },
  { name: "Dakar Denim", category: "Fashion & Textiles", owner: "Cheikh Ndiaye", country: "Senegal", city: "Dakar", color: "#2e90fa", plan: "plan_starter", status: "pending" },
  { name: "Volta Pottery", category: "Crafts & Decor", owner: "Kofi Agyeman", country: "Ghana", city: "Ho", color: "#eaaa08", plan: "plan_starter", status: "pending" },
  { name: "Harare Honey", category: "Food & Groceries", owner: "Rudo Chikwanha", country: "Zimbabwe", city: "Harare", color: "#ca8504", plan: "plan_starter", status: "cancelled" },
];

const slugify = (s: string) =>
  s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const emailDomain = (name: string) =>
  name.toLowerCase().replace(/&/g, "").replace(/[^a-z0-9]+/g, "") + ".com";

const firstName = (full: string) => full.split(" ")[0].toLowerCase();

export const businesses: Business[] = bizSeeds.map((b, i) => {
  const isDemo = i === 0;
  const joinedDaysAgo =
    b.status === "pending" ? int(0, 3)
    : b.status === "trial" ? int(2, 12)
    : isDemo ? 420
    : int(40, 540);
  return {
    id: `biz_${pad(i + 1, 2)}`,
    name: b.name,
    slug: slugify(b.name),
    logo: `/demo/logos/${slugify(b.name)}.svg`,
    category: b.category,
    ownerName: b.owner,
    ownerEmail: `${firstName(b.owner)}@${emailDomain(b.name)}`,
    phone: `+${pick(["234", "233", "254", "27", "221"])} ${int(700, 999)} ${int(100, 999)} ${int(1000, 9999)}`,
    country: b.country,
    city: b.city,
    brandColor: b.color,
    currency: currencyForCountry(b.country),
    description: `${b.name} is a ${b.category.toLowerCase()} business based in ${b.city}, ${b.country}.`,
    status: b.status,
    planId: b.plan,
    joinedAt: daysAgo(joinedDaysAgo),
    stats: { products: 0, orders: 0, customers: 0, revenue: 0 },
  };
});

// Catalogue prices are written in USD-ish numbers; scale them to look right in each store currency.
const PRICE_SCALE: Record<Currency, number> = { USD: 1, NGN: 1000, GHS: 10, KES: 100 };

// ---------- product catalogue ----------

const catalogue: Record<string, { names: string[]; price: [number, number] }> = {
  "Fashion & Textiles": {
    names: ["Adire Wrap Dress", "Ankara Print Shirt", "Kente Stole", "Dashiki Top", "Aso-Oke Cap", "Batik Scarf", "Linen Agbada", "Mudcloth Jacket", "Wax Print Skirt", "Handwoven Tote"],
    price: [18, 140],
  },
  "Food & Groceries": {
    names: ["Suya Spice Blend", "Palm Oil (1L)", "Dried Hibiscus", "Moringa Powder", "Jollof Seasoning", "Peri-Peri Sauce", "Plantain Chips", "Baobab Fruit Powder", "Groundnut Paste", "Dried Crayfish"],
    price: [3, 28],
  },
  "Beauty & Wellness": {
    names: ["Raw Shea Butter", "Black Soap Bar", "Baobab Face Oil", "Hibiscus Body Scrub", "Marula Hair Oil", "Moringa Lotion", "Argan Night Cream", "Red Clay Mask", "Lip Balm Set", "Beard Oil"],
    price: [6, 48],
  },
  "Crafts & Decor": {
    names: ["Woven Raffia Basket", "Carved Stool", "Beaded Wall Hanging", "Clay Planter", "Sisal Floor Mat", "Brass Candle Holder", "Bolga Market Basket", "Soapstone Bowl", "Mud Cloth Cushion", "Wooden Mask"],
    price: [12, 120],
  },
  "Coffee & Tea": {
    names: ["Single-Origin Beans (250g)", "Rooibos Tea Tin", "Hibiscus Tea Bags", "Cold Brew Pack", "Espresso Roast (1kg)", "Honeybush Blend", "Ginger Chai Mix", "Moka Pot", "Ceramic Mug Set", "Green Tea Leaves"],
    price: [7, 45],
  },
  Jewellery: {
    names: ["Waist Beads", "Cowrie Necklace", "Brass Cuff", "Beaded Earrings", "Maasai Collar", "Gold-Plated Anklet", "Bronze Ring", "Amber Bracelet", "Trade Bead Strand", "Ear Cuffs"],
    price: [8, 95],
  },
};

/** Demo pictures live in public/demo (made by scripts/generate-demo-images.py). */
const pictureSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const productPictures = (name: string) => [1, 2].map((n) => `/demo/products/${pictureSlug(name)}-${n}.svg`);

const IMAGE_COLORS = ["#c3ceff", "#ffd9a8", "#b7ebd0", "#fecdca", "#d9d6fe", "#b2e9f5", "#fcc9e6", "#fedf89"];

export const products: Product[] = [];
export const customers: Customer[] = [];
export const orders: Order[] = [];
export const subscriptions: Subscription[] = [];
export const invoices: Invoice[] = [];
export const team: TeamMember[] = [];

const FIRST = ["Ada", "Kofi", "Amina", "Tariq", "Nia", "Seun", "Lerato", "Baraka", "Yaa", "Musa", "Imani", "Chike", "Sade", "Wanjiru", "Kagiso", "Ife", "Dayo", "Naledi", "Femi", "Zola", "Abena", "Obi", "Halima", "Tau"];
const LAST = ["Okonkwo", "Mensah", "Diop", "Kamau", "Nkosi", "Adeyemi", "Bello", "Mwangi", "Osei", "Traoré", "Banda", "Abara", "Sithole", "Ndlovu", "Eze", "Addo", "Juma", "Kone"];

businesses.forEach((biz, idx) => {
  const isDemo = idx === 0;
  const plan = planPrice(biz.planId);
  const hasActivity = biz.status !== "pending";
  const joinedDays = Math.max(
    1,
    Math.floor((NOW - new Date(biz.joinedAt).getTime()) / DAY)
  );

  // --- products ---
  const cat = catalogue[biz.category];
  const productCount = !hasActivity ? 0 : isDemo ? 10 : int(5, 10);
  const bizProducts: Product[] = [];
  for (let p = 0; p < productCount; p++) {
    const name = cat.names[p % cat.names.length];
    const price = int(cat.price[0], cat.price[1]) * PRICE_SCALE[biz.currency];
    const stock = chance(0.12) ? 0 : chance(0.2) ? int(1, 6) : int(8, 140);
    const status: Product["status"] =
      stock === 0 ? "out_of_stock" : chance(0.1) ? "draft" : "active";
    bizProducts.push({
      id: `prd_${biz.id.slice(4)}_${pad(p + 1, 2)}`,
      businessId: biz.id,
      name,
      sku: `${biz.slug.slice(0, 3).toUpperCase()}-${pad(p + 1)}`,
      category: biz.category,
      description: `${name} from ${biz.name}. Made with care in ${biz.country}.`,
      price,
      stock,
      status,
      sold: 0,
      imageColor: IMAGE_COLORS[(p + idx) % IMAGE_COLORS.length],
      images: productPictures(name),
      image: productPictures(name)[0],
      createdAt: daysAgo(int(1, joinedDays)),
    });
  }

  // --- customers ---
  const customerCount = !hasActivity ? 0 : isDemo ? 38 : int(8, 26);
  const bizCustomers: Customer[] = [];
  for (let c = 0; c < customerCount; c++) {
    const fn = pick(FIRST);
    const ln = pick(LAST);
    bizCustomers.push({
      id: `cus_${biz.id.slice(4)}_${pad(c + 1)}`,
      businessId: biz.id,
      name: `${fn} ${ln}`,
      email: `${fn}.${ln}${int(1, 99)}@example.com`.toLowerCase(),
      phone: `+${pick(["234", "233", "254", "27"])} ${int(700, 999)} ${int(100, 999)} ${int(1000, 9999)}`,
      city: pick(["Lagos", "Accra", "Nairobi", "Abuja", "Kumasi", "Cape Town", "Dakar", "London", "Toronto"]),
      orders: 0,
      totalSpent: 0,
      joinedAt: daysAgo(int(1, joinedDays)),
    });
  }

  // --- orders (spread over the last 180 days, weighted to recent) ---
  const targetOrders =
    !hasActivity || biz.status === "cancelled" ? (biz.status === "cancelled" ? int(10, 30) : 0)
    : isDemo ? 168
    : biz.status === "trial" ? int(3, 12)
    : plan.id === "plan_scale" ? int(90, 160)
    : plan.id === "plan_growth" ? int(50, 110)
    : int(20, 50);
  const spanDays = Math.min(180, joinedDays);
  let orderNo = 1000;
  for (let o = 0; o < targetOrders && bizProducts.length && bizCustomers.length; o++) {
    // recent bias: square the random so more orders fall near today
    const age = Math.floor(Math.pow(rand(), 1.5) * spanDays);
    const customer = pick(bizCustomers);
    const itemCount = int(1, 3);
    const items: OrderItem[] = [];
    for (let k = 0; k < itemCount; k++) {
      const prod = pick(bizProducts);
      if (items.some((it) => it.productId === prod.id)) continue;
      items.push({
        productId: prod.id,
        name: prod.name,
        qty: int(1, 3),
        price: prod.price,
      });
    }
    const total = items.reduce((s, it) => s + it.qty * it.price, 0);
    let status: OrderStatus;
    if (age > 12) {
      status = chance(0.9) ? "delivered" : pick(["cancelled", "refunded"] as OrderStatus[]);
    } else if (age > 4) {
      status = pick(["delivered", "shipped", "shipped", "processing"] as OrderStatus[]);
    } else {
      status = pick(["pending", "processing", "processing", "shipped"] as OrderStatus[]);
    }
    const paymentStatus: Order["paymentStatus"] =
      status === "refunded" ? "refunded" : status === "cancelled" || status === "pending" ? "unpaid" : "paid";
    orders.push({
      id: `ord_${biz.id.slice(4)}_${pad(o + 1)}`,
      businessId: biz.id,
      number: `#${biz.slug.slice(0, 2).toUpperCase()}${orderNo++}`,
      customerId: customer.id,
      customerName: customer.name,
      items,
      total,
      status,
      paymentStatus,
      placedAt: new Date(NOW - age * DAY - int(0, 20) * 3600 * 1000).toISOString(),
      // Deterministic (no RNG) so the rest of the seed stays exactly as it was.
      channel: o % 7 === 0 ? "whatsapp" : o % 5 === 0 ? "instagram" : o % 11 === 0 ? "in_store" : "online",
      paymentMethod: (["card", "bank", "cod", "card"] as const)[o % 4],
    });
    if (paymentStatus === "paid") {
      customer.orders += 1;
      customer.totalSpent += total;
      items.forEach((it) => {
        const prod = bizProducts.find((x) => x.id === it.productId);
        if (prod) prod.sold += it.qty;
      });
    }
  }

  // Clothing gets size variants (no RNG, so the rest of the seed is unchanged).
  if (biz.category === "Fashion & Textiles") {
    bizProducts
      .filter((x) => x.stock >= 4)
      .slice(0, 3)
      .forEach((x, n) => {
        const sizes = ["S", "M", "L", "XL"];
        const base = Math.floor(x.stock / 4);
        const extra = x.stock - base * 4;
        x.variants = sizes.map((size, i) => ({
          id: `${x.id}_${size.toLowerCase()}`,
          name: size,
          stock: base + (i < extra ? 1 : 0),
          ...(n === 0 && size === "XL" ? { price: x.price + 5 * PRICE_SCALE[biz.currency] } : {}),
        }));
      });
  }
  products.push(...bizProducts);
  customers.push(...bizCustomers);

  // --- team ---
  const members: TeamMember[] = [
    {
      id: `tm_${biz.id.slice(4)}_1`,
      businessId: biz.id,
      name: biz.ownerName,
      email: biz.ownerEmail,
      role: "owner",
      status: "active",
      joinedAt: biz.joinedAt,
    },
  ];
  const extra = plan.limits.staff > 2 ? int(0, 2) : int(0, 1);
  for (let m = 0; m < extra; m++) {
    const fn = pick(FIRST);
    members.push({
      id: `tm_${biz.id.slice(4)}_${m + 2}`,
      businessId: biz.id,
      name: `${fn} ${pick(LAST)}`,
      email: `${fn.toLowerCase()}@${emailDomain(biz.name)}`,
      role: m === 0 ? "manager" : "staff",
      status: chance(0.8) ? "active" : "invited",
      joinedAt: daysAgo(int(1, joinedDays)),
    });
  }
  team.push(...members);

  // --- stats ---
  const paid = orders.filter((o) => o.businessId === biz.id && o.paymentStatus === "paid");
  biz.stats = {
    products: bizProducts.length,
    orders: orders.filter((o) => o.businessId === biz.id).length,
    customers: bizCustomers.length,
    revenue: paid.reduce((s, o) => s + o.total, 0),
  };

  // --- subscription & invoices ---
  if (biz.status !== "pending") {
    const cycle: Subscription["cycle"] = chance(0.25) && biz.status === "active" ? "yearly" : "monthly";
    const amount = cycle === "yearly" ? plan.priceYearly : plan.priceMonthly;
    const status: Subscription["status"] =
      biz.status === "trial" ? "trialing"
      : biz.status === "suspended" ? "past_due"
      : biz.status === "cancelled" ? "cancelled"
      : "active";
    const startedDays = joinedDays;
    const periodLen = cycle === "yearly" ? 365 : 30;
    const intoPeriod = startedDays % periodLen;
    subscriptions.push({
      id: `sub_${biz.id.slice(4)}`,
      businessId: biz.id,
      planId: plan.id,
      status,
      cycle,
      amount,
      startedAt: biz.joinedAt,
      currentPeriodEnd: daysAhead(periodLen - intoPeriod),
      trialEndsAt: status === "trialing" ? daysAhead(14 - Math.min(13, startedDays)) : undefined,
      cancelledAt: status === "cancelled" ? daysAgo(int(5, 30)) : undefined,
    });

    if (status !== "trialing" && amount > 0) {
      const periods = Math.min(12, Math.max(1, Math.floor(startedDays / periodLen) + 1));
      for (let k = 0; k < periods; k++) {
        const issued = intoPeriod + k * periodLen;
        const isLast = k === 0;
        const st: Invoice["status"] =
          isLast && status === "past_due" ? "failed" : "paid";
        invoices.push({
          id: `inv_${biz.id.slice(4)}_${pad(periods - k, 2)}`,
          businessId: biz.id,
          planId: plan.id,
          description: `${plan.name} plan — ${cycle === "yearly" ? "annual" : "monthly"} subscription`,
          amount,
          status: st,
          issuedAt: daysAgo(issued),
          paidAt: st === "paid" ? daysAgo(issued) : undefined,
        });
      }
    }
  }
});

// newest first
orders.sort((a, b) => +new Date(b.placedAt) - +new Date(a.placedAt));
invoices.sort((a, b) => +new Date(b.issuedAt) - +new Date(a.issuedAt));

// ---------- demo accounts ----------

export const DEMO_PASSWORD = "demo1234";

// ---------- coupons ----------

export const coupons: Coupon[] = [];
businesses.forEach((biz, idx) => {
  if (biz.status === "pending" || biz.planId === "plan_basic" && idx !== 0) return;
  const mk = (code: string, type: Coupon["type"], value: number, extra: Partial<Coupon> = {}) =>
    coupons.push({
      id: `cpn_${biz.id.slice(4)}_${code.toLowerCase()}`,
      businessId: biz.id,
      code,
      type,
      value,
      usedCount: 0,
      status: "active",
      createdAt: daysAgo(int(10, 120)),
      ...extra,
    });
  const scale = PRICE_SCALE[biz.currency];
  if (idx === 0) {
    mk("WELCOME10", "percent", 10, { usedCount: 14 });
    mk("SAVE5", "fixed", 5 * scale, { minOrder: 50 * scale, usedCount: 6 });
    mk("EID25", "percent", 25, { maxUses: 50, usedCount: 50, expiresAt: daysAgo(20) });
    mk("LOYAL15", "percent", 15, { status: "disabled", usedCount: 3 });
  } else if (biz.status === "active" && chance(0.6)) {
    mk("WELCOME10", "percent", 10, { usedCount: int(0, 12) });
  }
});

// ---------- customer groups & messages ----------

export const customerGroups: CustomerGroup[] = [];
export const messages: Message[] = [];
businesses.forEach((biz, idx) => {
  if (biz.status === "pending" || (biz.planId === "plan_basic" && idx !== 0)) return;
  const mine = customers.filter((c) => c.businessId === biz.id);
  if (mine.length < 4) return;
  const scale = PRICE_SCALE[biz.currency];
  const g = (name: string, extra: Partial<CustomerGroup>) =>
    customerGroups.push({
      id: `grp_${biz.id.slice(4)}_${customerGroups.length + 1}`,
      businessId: biz.id,
      name,
      kind: "auto",
      memberIds: [],
      createdAt: daysAgo(40),
      ...extra,
    });
  g("VIP customers", { description: "Spent a lot with us", rule: { type: "spent_over", value: 150 * scale } });
  g("Repeat buyers", { description: "Ordered three times or more", rule: { type: "orders_at_least", value: 3 } });
  g("New this month", { description: "Joined in the last 30 days", rule: { type: "joined_within_days", value: 30 } });
  if (idx === 0) {
    g("Wholesale buyers", { description: "Shops that buy in bulk", kind: "manual", rule: undefined, memberIds: mine.slice(0, 5).map((c) => c.id) });
    g("Lapsed customers", { description: "No order in 60 days", rule: { type: "no_order_within_days", value: 60 } });
    messages.push(
      { id: `msg_${biz.id.slice(4)}_1`, businessId: biz.id, channel: "email", subject: "Eid collection is here", body: "Hi {{first_name}}, our Eid collection just landed at {{store}}. Use code EID25 this week.", audienceLabel: "All customers", recipientCount: mine.length, sentAt: daysAgo(21) },
      { id: `msg_${biz.id.slice(4)}_2`, businessId: biz.id, channel: "whatsapp", body: "Hi {{first_name}}, thank you for shopping with {{store}}. Your next order ships free.", audienceLabel: "Repeat buyers", recipientCount: 9, sentAt: daysAgo(8) },
    );
  }
});

export const demoAccounts = [
  {
    id: "usr_super",
    name: "Platform Admin",
    email: "admin@retailr.com",
    role: "super_admin" as const,
  },
  {
    id: "usr_biz_01",
    name: businesses[0].ownerName,
    email: businesses[0].ownerEmail,
    role: "business_admin" as const,
    businessId: businesses[0].id,
  },
  {
    id: "usr_biz_02",
    name: businesses[1].ownerName,
    email: businesses[1].ownerEmail,
    role: "business_admin" as const,
    businessId: businesses[1].id,
  },
];

/** Discounts the platform offers businesses on their subscription. */
export const planCoupons: PlanCoupon[] = [
  { id: "pcp_launch20", code: "LAUNCH20", type: "percent", value: 20, usedCount: 3, maxUses: 100, expiresAt: daysAhead(60), status: "active", note: "Launch offer for new sign-ups", createdAt: daysAgo(30) },
  { id: "pcp_growth15", code: "GROWTH15", type: "percent", value: 15, planIds: ["plan_growth"], usedCount: 1, status: "active", note: "Growth plan promo", createdAt: daysAgo(20) },
  { id: "pcp_save10", code: "SAVE10", type: "fixed", value: 10, usedCount: 0, maxUses: 25, expiresAt: daysAhead(30), status: "active", createdAt: daysAgo(5) },
  { id: "pcp_early", code: "EARLYBIRD", type: "percent", value: 30, usedCount: 12, maxUses: 12, status: "active", note: "Founding customers", createdAt: daysAgo(90) },
];
