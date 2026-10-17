// Site analytics for the demo.
//
// History is generated on the fly from the seed data (deterministic, so charts look
// the same on every visit and online orders always match the orders table). Visits
// you make while using the demo are recorded as small daily counters and added on top.
// With a real backend, replace this file with calls to an analytics API (or events
// from your tracking provider); the pages only use getBusinessAnalytics / getPlatformAnalytics.
import type { Business, BusinessAnalytics, DeviceKind, FunnelStep, PlatformAnalytics, SiteAnalytics, TrafficSource } from "@/types/saas";
import { db, delay, type LiveDay } from "./db";

const DAY = 86400000;
const HISTORY_DAYS = 365;
const SOURCES: TrafficSource[] = ["direct", "whatsapp", "instagram", "facebook", "search", "other"];
const SOURCE_WEIGHTS = [0.27, 0.24, 0.2, 0.1, 0.13, 0.06];
const DEVICES: DeviceKind[] = ["mobile", "desktop", "tablet"];
const DEVICE_WEIGHTS = [0.68, 0.27, 0.05];

type Day = {
  visitors: number;
  sessions: number;
  pageViews: number;
  productViews: number;
  addToCart: number;
  checkouts: number;
  orders: number;
  sources: Record<string, number>;
  devices: Record<string, number>;
  countries: Record<string, number>;
  pages: Record<string, number>;
  products: Record<string, number>;
};

const emptyDay = (): Day => ({ visitors: 0, sessions: 0, pageViews: 0, productViews: 0, addToCart: 0, checkouts: 0, orders: 0, sources: {}, devices: {}, countries: {}, pages: {}, products: {} });

const dateKey = (d: Date) => d.toISOString().slice(0, 10);
const daysAgoKey = (n: number) => dateKey(new Date(Date.now() - n * DAY));

// ---------- deterministic generator ----------

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function rng(seed: string) {
  let a = hash(seed);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Splits `total` across keys by weight with a little noise; always sums to `total`. */
function spread<K extends string>(total: number, keys: readonly K[], weights: readonly number[], r: () => number): Record<string, number> {
  const w = weights.map((x) => x * (0.75 + r() * 0.5));
  const sum = w.reduce((a, b) => a + b, 0);
  const out: Record<string, number> = {};
  let left = total;
  keys.forEach((k, i) => {
    const n = i === keys.length - 1 ? left : Math.min(left, Math.round((w[i] / sum) * total));
    out[k] = n;
    left -= n;
  });
  return out;
}

const OTHER_COUNTRIES = ["United Kingdom", "United States", "Ghana", "Kenya", "South Africa", "Canada"];

function countriesFor(home: string, sessions: number, r: () => number) {
  const second = OTHER_COUNTRIES.filter((c) => c !== home)[Math.floor(r() * 5)];
  return spread(sessions, [home, second, "Other"], [0.72, 0.16, 0.12], r);
}

function productWeights(ids: string[]) {
  // a few products get most of the attention
  return ids.map((id, i) => (1 / (1 + ((hash(id) % 7) + i) * 0.55)) );
}

function storeDays(biz: Business): Map<string, Day> {
  const out = new Map<string, Day>();
  if (biz.status === "pending") return out;
  const online = db.orders.filter((o) => o.businessId === biz.id && (o.channel ?? "online") === "online");
  const byDay = new Map<string, number>();
  for (const o of online) byDay.set(o.placedAt.slice(0, 10), (byDay.get(o.placedAt.slice(0, 10)) ?? 0) + 1);
  const joinedAgo = Math.max(1, Math.floor((Date.now() - new Date(biz.joinedAt).getTime()) / DAY));
  const span = Math.min(HISTORY_DAYS, joinedAgo);
  const base = Math.max(6, online.length / Math.min(span, 180) / 0.025);
  const products = db.products.filter((p) => p.businessId === biz.id && p.status !== "draft").map((p) => p.id);
  const pw = productWeights(products);
  const pwSum = pw.reduce((a, b) => a + b, 0) || 1;

  for (let n = span; n >= 0; n--) {
    const key = daysAgoKey(n);
    const r = rng(`${biz.id}|${key}`);
    const dow = new Date(Date.now() - n * DAY).getDay();
    const season = dow === 0 || dow === 6 ? 1.25 : dow === 5 ? 1.1 : 0.9;
    const trend = 0.65 + 0.5 * (1 - n / Math.max(span, 1));
    const sessions = Math.max(0, Math.round(base * season * trend * (0.6 + r() * 0.8)));
    const orders = byDay.get(key) ?? 0;
    const sess = Math.max(sessions, orders * 12);
    const productViews = Math.round(sess * (0.5 + r() * 0.2));
    const addToCart = Math.max(orders, Math.round(productViews * (0.1 + r() * 0.08)));
    const checkouts = Math.max(orders, Math.round(addToCart * (0.5 + r() * 0.15)));
    const viewsByProduct: Record<string, number> = {};
    products.forEach((id, i) => {
      const v = Math.round((productViews * pw[i]) / pwSum);
      if (v > 0) viewsByProduct[id] = v;
    });
    const pageViews = sess + productViews + Math.round(sess * 0.35) + addToCart + checkouts;
    out.set(key, {
      visitors: Math.round(sess * (0.78 + r() * 0.08)),
      sessions: sess,
      pageViews,
      productViews,
      addToCart,
      checkouts,
      orders,
      sources: spread(sess, SOURCES, SOURCE_WEIGHTS, r),
      devices: spread(sess, DEVICES, DEVICE_WEIGHTS, r),
      countries: countriesFor(biz.country, sess, r),
      pages: { "/": sess, "/shop": Math.round(sess * 0.35), "/product": productViews, "/cart": addToCart, "/checkout": checkouts },
      products: viewsByProduct,
    });
  }
  return out;
}

/** Marketing site: landing visits, sign-up page views and real sign-ups (from the businesses table). */
function marketingDays(): Map<string, Day> {
  const out = new Map<string, Day>();
  const signups = new Map<string, number>();
  for (const b of db.businesses) signups.set(b.joinedAt.slice(0, 10), (signups.get(b.joinedAt.slice(0, 10)) ?? 0) + 1);
  const first = db.businesses.reduce((m, b) => Math.min(m, +new Date(b.joinedAt)), Date.now());
  const span = Math.min(HISTORY_DAYS, Math.max(30, Math.floor((Date.now() - first) / DAY)));
  const base = Math.max(40, (db.businesses.length / Math.max(span, 30)) / 0.02);
  for (let n = span; n >= 0; n--) {
    const key = daysAgoKey(n);
    const r = rng(`platform|${key}`);
    const dow = new Date(Date.now() - n * DAY).getDay();
    const season = dow === 0 || dow === 6 ? 0.8 : 1.1;
    const trend = 0.55 + 0.6 * (1 - n / span);
    const sessions = Math.round(base * season * trend * (0.6 + r() * 0.8));
    const orders = signups.get(key) ?? 0; // "orders" = sign-ups for the marketing site
    const sess = Math.max(sessions, orders * 20);
    const started = Math.max(orders, Math.round(sess * (0.12 + r() * 0.06)));
    out.set(key, {
      visitors: Math.round(sess * (0.8 + r() * 0.06)),
      sessions: sess,
      pageViews: Math.round(sess * (1.8 + r() * 0.8)) + started,
      productViews: Math.round(sess * (0.45 + r() * 0.15)), // visits that reached pricing/features
      addToCart: started,
      checkouts: Math.max(orders, Math.round(started * 0.5)),
      orders,
      sources: spread(sess, SOURCES, [0.22, 0.12, 0.2, 0.12, 0.3, 0.04], r),
      devices: spread(sess, DEVICES, [0.6, 0.35, 0.05], r),
      countries: spread(sess, ["Nigeria", "Ghana", "Kenya", "South Africa", "Other"], [0.46, 0.14, 0.12, 0.08, 0.2], r),
      pages: { "/": sess, "/get-started": started },
      products: {},
    });
  }
  return out;
}

// ---------- live tracking ----------

const addTo = (rec: Record<string, number>, key: string, n = 1) => {
  rec[key] = (rec[key] ?? 0) + n;
};

const liveDay = (scope: string, key: string): LiveDay => {
  const bucket = (db.analyticsLive[scope] ??= {});
  return (bucket[key] ??= { visitors: 0, sessions: 0, pageViews: 0, productViews: 0, addToCart: 0, checkouts: 0, sources: {}, devices: {}, countries: {}, pages: {}, products: {} });
};

export type TrackEvent =
  | { type: "visit"; source: TrafficSource; device: DeviceKind; country: string; newVisitorToday: boolean }
  | { type: "page"; page: string }
  | { type: "product"; productId: string }
  | { type: "add_to_cart" }
  | { type: "checkout" };

/** Records one thing a visitor did. `scope` is a business id, or "platform" for the marketing site. */
export function track(scope: string, e: TrackEvent) {
  const d = liveDay(scope, dateKey(new Date()));
  if (e.type === "visit") {
    d.sessions += 1;
    if (e.newVisitorToday) d.visitors += 1;
    addTo(d.sources, e.source);
    addTo(d.devices, e.device);
    addTo(d.countries, e.country);
  } else if (e.type === "page") {
    d.pageViews += 1;
    addTo(d.pages, e.page);
  } else if (e.type === "product") {
    d.productViews += 1;
    addTo(d.products, e.productId);
  } else if (e.type === "add_to_cart") d.addToCart += 1;
  else d.checkouts += 1;
}

// ---------- reporting ----------

function merged(scope: string, base: Map<string, Day>): (key: string) => Day {
  return (key) => {
    const b = base.get(key) ?? emptyDay();
    const l = db.analyticsLive[scope]?.[key];
    if (!l) return b;
    const sum = (a: Record<string, number>, c: Record<string, number>) => {
      const o = { ...a };
      for (const [k, v] of Object.entries(c)) o[k] = (o[k] ?? 0) + v;
      return o;
    };
    return {
      visitors: b.visitors + l.visitors,
      sessions: b.sessions + l.sessions,
      pageViews: b.pageViews + l.pageViews,
      productViews: b.productViews + l.productViews,
      addToCart: b.addToCart + l.addToCart,
      checkouts: b.checkouts + l.checkouts,
      orders: b.orders,
      sources: sum(b.sources, l.sources),
      devices: sum(b.devices, l.devices),
      countries: sum(b.countries, l.countries),
      pages: sum(b.pages, l.pages),
      products: sum(b.products, l.products),
    };
  };
}

const change = (a: number, b: number) => (b === 0 ? (a > 0 ? 100 : 0) : ((a - b) / b) * 100);

function windowOf(get: (k: string) => Day, from: number, to: number) {
  const t = emptyDay();
  for (let n = from; n > to; n--) {
    const d = get(daysAgoKey(n - 1));
    t.visitors += d.visitors; t.sessions += d.sessions; t.pageViews += d.pageViews; t.productViews += d.productViews;
    t.addToCart += d.addToCart; t.checkouts += d.checkouts; t.orders += d.orders;
    for (const k of Object.keys(d.sources)) addTo(t.sources, k, d.sources[k]);
    for (const k of Object.keys(d.devices)) addTo(t.devices, k, d.devices[k]);
    for (const k of Object.keys(d.countries)) addTo(t.countries, k, d.countries[k]);
    for (const k of Object.keys(d.pages)) addTo(t.pages, k, d.pages[k]);
    for (const k of Object.keys(d.products)) addTo(t.products, k, d.products[k]);
  }
  return t;
}

const PAGE_LABELS: Record<string, string> = { "/": "Home", "/shop": "Shop", "/product": "Product pages", "/cart": "Cart", "/checkout": "Checkout", "/get-started": "Get started (sign-up)" };

function report(get: (k: string) => Day, days: number, funnelLabels: [string, string, string, string, string]): SiteAnalytics {
  const cur = windowOf(get, days, 0);
  const prev = windowOf(get, days * 2, days);
  const conv = (t: Day) => (t.sessions ? (t.orders / t.sessions) * 100 : 0);

  const size = days <= 30 ? 1 : days <= 90 ? 7 : 30;
  const series: SiteAnalytics["series"] = [];
  for (let b = Math.ceil(days / size) - 1; b >= 0; b--) {
    const t = windowOf(get, Math.min(days, (b + 1) * size), b * size);
    series.push({
      label: new Date(Date.now() - b * size * DAY).toLocaleDateString("en-US", size >= 30 ? { month: "short" } : { month: "short", day: "numeric" }),
      visitors: t.visitors,
      pageViews: t.pageViews,
    });
  }
  const sorted = <T extends string>(rec: Record<string, number>, name: (k: string) => T) =>
    Object.entries(rec).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ key: name(k), v }));

  return {
    days,
    visitors: { value: cur.visitors, changePct: change(cur.visitors, prev.visitors) },
    sessions: { value: cur.sessions, changePct: change(cur.sessions, prev.sessions) },
    pageViews: { value: cur.pageViews, changePct: change(cur.pageViews, prev.pageViews) },
    conversionRate: { value: conv(cur), changePct: change(conv(cur), conv(prev)) },
    series,
    funnel: ([
      [funnelLabels[0], cur.sessions],
      [funnelLabels[1], cur.productViews],
      [funnelLabels[2], cur.addToCart],
      [funnelLabels[3], cur.checkouts],
      [funnelLabels[4], cur.orders],
    ] as [string, number][]).map(([label, count]): FunnelStep => ({ label, count })),
    pages: Object.entries(cur.pages).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ label: PAGE_LABELS[k] ?? k, views: v })),
    sources: sorted(cur.sources, (k) => k as TrafficSource).map((x) => ({ source: x.key, sessions: x.v })),
    devices: sorted(cur.devices, (k) => k as DeviceKind).map((x) => ({ device: x.key, sessions: x.v })),
    countries: sorted(cur.countries, (k) => k).slice(0, 6).map((x) => ({ country: x.key, sessions: x.v })),
  };
}

export type AnalyticsDays = 7 | 30 | 90 | 365;

export async function getBusinessAnalytics(businessId: string, days: AnalyticsDays): Promise<BusinessAnalytics> {
  await delay();
  const biz = db.businesses.find((b) => b.id === businessId);
  const get = merged(businessId, biz ? storeDays(biz) : new Map());
  const r = report(get, days, ["Visits", "Viewed a product", "Added to cart", "Started checkout", "Placed an order"]);
  const cur = windowOf(get, days, 0);
  const sold = new Map<string, number>();
  const since = Date.now() - days * DAY;
  for (const o of db.orders) {
    if (o.businessId !== businessId || (o.channel ?? "online") !== "online" || +new Date(o.placedAt) < since) continue;
    for (const it of o.items) sold.set(it.productId, (sold.get(it.productId) ?? 0) + it.qty);
  }
  const topProducts = Object.entries(cur.products)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([id, views]) => ({ id, name: db.products.find((p) => p.id === id)?.name ?? "Removed product", views, orders: sold.get(id) ?? 0 }));
  return { ...r, topProducts };
}

export async function getPlatformAnalytics(days: AnalyticsDays): Promise<PlatformAnalytics> {
  await delay();
  const r = report(merged("platform", marketingDays()), days, ["Site visits", "Looked at features or pricing", "Opened sign-up", "Started registration", "Signed up"]);
  const rows = db.businesses
    .filter((b) => b.status !== "pending")
    .map((b) => {
      const t = windowOf(merged(b.id, storeDays(b)), days, 0);
      return { id: b.id, name: b.name, slug: b.slug, visitors: t.visitors, sessions: t.sessions, orders: t.orders, conversionRate: t.sessions ? (t.orders / t.sessions) * 100 : 0 };
    });
  const tot = rows.reduce((a, x) => ({ visitors: a.visitors + x.visitors, sessions: a.sessions + x.sessions, orders: a.orders + x.orders }), { visitors: 0, sessions: 0, orders: 0 });
  return {
    ...r,
    stores: { ...tot, conversionRate: tot.sessions ? (tot.orders / tot.sessions) * 100 : 0 },
    topStores: rows.sort((a, b) => b.visitors - a.visitors).slice(0, 8),
  };
}
