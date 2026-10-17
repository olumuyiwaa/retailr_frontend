// In-memory "database" shared by the mock services, mirrored to localStorage so
// changes (a new sign-up, a suspended business, an edited product, ...) survive
// page reloads like a real backend would. "Reset demo data" clears it.
// When the real backend exists, delete this file and point the services at it.

import * as seed from "@/mock/seed";
import type { AuthUser, Category } from "@/types/saas";

/** Visits recorded live while the demo runs, added on top of the generated history. Keyed by business id or "platform", then by YYYY-MM-DD. */
export type LiveDay = {
  visitors: number;
  sessions: number;
  pageViews: number;
  productViews: number;
  addToCart: number;
  checkouts: number;
  sources: Record<string, number>;
  devices: Record<string, number>;
  countries: Record<string, number>;
  pages: Record<string, number>;
  products: Record<string, number>;
};

const STORAGE_KEY = "retailr:db:v2";
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

/** One category per distinct product category a business already uses (seed data and older saved data predate managed categories). */
function deriveCategories(products: { businessId: string; category: string; image?: string }[]): Category[] {
  const seen = new Set<string>();
  const out: Category[] = [];
  for (const p of products) {
    const name = (p.category ?? "").trim();
    const key = `${p.businessId}|${name.toLowerCase()}`;
    if (!name || seen.has(key)) continue;
    seen.add(key);
    out.push({ id: `cat_${out.length + 1}_${Math.random().toString(36).slice(2, 7)}`, businessId: p.businessId, name, ...(p.image ? { image: p.image } : {}), createdAt: new Date(0).toISOString() });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

const fresh = () => ({
  plans: clone(seed.plans),
  businesses: clone(seed.businesses),
  subscriptions: clone(seed.subscriptions),
  invoices: clone(seed.invoices),
  products: clone(seed.products),
  categories: deriveCategories(seed.products),
  analyticsLive: {} as Record<string, Record<string, LiveDay>>,
  orders: clone(seed.orders),
  customers: clone(seed.customers),
  coupons: clone(seed.coupons),
  customerGroups: clone(seed.customerGroups),
  messages: clone(seed.messages),
  team: clone(seed.team),
  users: clone(seed.demoAccounts) as AuthUser[],
});

type DB = ReturnType<typeof fresh>;

function load(): DB {
  if (typeof window === "undefined") return fresh();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // basic shape check so a corrupted/old blob falls back to seed data
      if (parsed && Array.isArray(parsed.businesses) && Array.isArray(parsed.plans) && Array.isArray(parsed.users) && Array.isArray(parsed.coupons) && Array.isArray(parsed.customerGroups) && Array.isArray(parsed.messages)) {
        if (!parsed.analyticsLive || typeof parsed.analyticsLive !== "object") parsed.analyticsLive = {};
        if (!Array.isArray(parsed.categories)) parsed.categories = deriveCategories(parsed.products ?? []);
        return parsed as DB;
      }
    }
  } catch {
    /* storage blocked or corrupt — use seed data */
  }
  return fresh();
}

let saveQueued = false;
function scheduleSave() {
  if (typeof window === "undefined" || saveQueued) return;
  saveQueued = true;
  queueMicrotask(() => {
    saveQueued = false;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(raw));
    } catch {
      /* quota exceeded or blocked — keep working in memory */
    }
  });
}

// Deep proxy: any write anywhere in the tree (push, splice, assignment, ...)
// schedules a single save, so service code stays plain mutation.
const proxies = new WeakMap<object, object>();
function observe<T extends object>(target: T): T {
  const cached = proxies.get(target);
  if (cached) return cached as T;
  const proxy = new Proxy(target, {
    get(t, key, receiver) {
      const v = Reflect.get(t, key, receiver);
      return v && typeof v === "object" ? observe(v as object) : v;
    },
    set(t, key, value, receiver) {
      const ok = Reflect.set(t, key, value, receiver);
      scheduleSave();
      return ok;
    },
    deleteProperty(t, key) {
      const ok = Reflect.deleteProperty(t, key);
      scheduleSave();
      return ok;
    },
  });
  proxies.set(target, proxy);
  return proxy;
}

const raw: DB = load();
export const db: DB = observe(raw);

/** Wipe all changes and go back to the seeded demo data. */
export function resetDemoData() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem("retailr:user");
  } catch {
    /* ignore */
  }
}

export const delay = (ms = 350) => new Promise<void>((r) => setTimeout(r, ms));

let counter = 1000;
export const uid = (prefix: string) => `${prefix}_${Date.now().toString(36)}${(counter++).toString(36)}`;

export class ServiceError extends Error {}
