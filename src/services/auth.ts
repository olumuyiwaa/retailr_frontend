import type { AuthUser, Business, Subscription } from "@/types/saas";
import { DEMO_PASSWORD } from "@/mock/seed";
import { currencyForCountry } from "@/lib/money";
import { priceWithCoupon } from "./planCoupons";
import { db, delay, ServiceError, uid } from "./db";

export async function login(email: string, password: string): Promise<AuthUser> {
  await delay(500);
  const user = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user || password !== DEMO_PASSWORD) {
    throw new ServiceError("Invalid email or password.");
  }
  if (user.businessId) {
    const biz = db.businesses.find((b) => b.id === user.businessId);
    if (biz?.status === "suspended") {
      throw new ServiceError("This business account is suspended. Contact Retailr support.");
    }
    if (biz?.status === "cancelled") {
      throw new ServiceError("This business account has been cancelled.");
    }
  }
  return user;
}

export interface RegisterPayload {
  ownerName: string;
  email: string;
  password: string;
  businessName: string;
  category: string;
  country: string;
  city: string;
  phone: string;
  planId: string;
  cycle: "monthly" | "yearly";
  /** Optional platform discount code. */
  couponCode?: string;
}

export async function registerBusiness(p: RegisterPayload): Promise<AuthUser> {
  await delay(900);
  if (db.users.some((u) => u.email.toLowerCase() === p.email.trim().toLowerCase())) {
    throw new ServiceError("An account with this email already exists.");
  }
  const plan = db.plans.find((x) => x.id === p.planId);
  if (!plan) throw new ServiceError("Please choose a plan.");

  const baseSlug = p.businessName.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  let slug = baseSlug || "store";
  let n = 2;
  while (db.businesses.some((b) => b.slug === slug)) slug = `${baseSlug}-${n++}`;

  const free = plan.priceMonthly === 0;
  // check the code before anything is created, so a bad code doesn't leave a half-made account
  const priced = priceWithCoupon(free ? undefined : p.couponCode, plan, p.cycle);
  const now = new Date();
  const biz: Business = {
    id: uid("biz"),
    name: p.businessName,
    slug,
    category: p.category,
    ownerName: p.ownerName,
    ownerEmail: p.email,
    phone: p.phone,
    country: p.country,
    city: p.city,
    brandColor: "#465fff",
    currency: currencyForCountry(p.country),
    description: "",
    status: free ? "active" : "trial",
    planId: plan.id,
    joinedAt: now.toISOString(),
    stats: { products: 0, orders: 0, customers: 0, revenue: 0 },
  };
  db.businesses.unshift(biz);

  const trialEnds = new Date(now.getTime() + 14 * 86400000).toISOString();
  const sub: Subscription = {
    id: uid("sub"),
    businessId: biz.id,
    planId: plan.id,
    status: free ? "active" : "trialing",
    cycle: p.cycle,
    amount: priced.amount,
    ...(priced.couponCode ? { couponCode: priced.couponCode, discount: priced.discount } : {}),
    startedAt: now.toISOString(),
    currentPeriodEnd: trialEnds,
    trialEndsAt: free ? undefined : trialEnds,
  };
  db.subscriptions.unshift(sub);

  db.team.push({
    id: uid("tm"),
    businessId: biz.id,
    name: p.ownerName,
    email: p.email,
    role: "owner",
    status: "active",
    joinedAt: now.toISOString(),
  });

  const user: AuthUser = {
    id: uid("usr"),
    name: p.ownerName,
    email: p.email,
    role: "business_admin",
    businessId: biz.id,
  };
  db.users.push(user);
  return user;
}
