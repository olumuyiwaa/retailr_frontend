// Visitor tracking (sent to the API in small batches) and the analytics reports.
import type { BusinessAnalytics, DeviceKind, PlatformAnalytics, TrafficSource } from "@/types/saas";
import { API_URL, api } from "@/lib/api";

export type TrackEvent =
  | { type: "visit"; source: TrafficSource; device: DeviceKind; country: string; newVisitorToday: boolean }
  | { type: "page"; page: string }
  | { type: "product"; productId: string }
  | { type: "add_to_cart" }
  | { type: "checkout" };

type WireEvent = { type: "page" | "product" | "add_to_cart" | "checkout"; path?: string; productId?: string; source?: TrafficSource; device?: DeviceKind; country?: string };

const rid = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`).replace(/-/g, "");
const stored = (store: Storage, key: string) => {
  try {
    let v = store.getItem(key);
    if (!v) { v = rid(); store.setItem(key, v); }
    return v;
  } catch { return rid(); }
};

/** What we know about this visit, sent with each event (the API only uses the first one of a session). */
const context: Record<string, { source: TrafficSource; device: DeviceKind; country: string }> = {};
const queue: Record<string, WireEvent[]> = {};
let timer: ReturnType<typeof setTimeout> | null = null;
let hooked = false;

function flush(useKeepalive = false) {
  if (timer) { clearTimeout(timer); timer = null; }
  for (const scope of Object.keys(queue)) {
    const events = queue[scope].splice(0, 50);
    if (!events.length) continue;
    const body = JSON.stringify({ scope, visitorId: stored(window.localStorage, "retailr:vid"), sessionId: stored(window.sessionStorage, "retailr:sid"), events });
    // fire and forget: tracking must never get in the way of the page
    fetch(`${API_URL}/track`, { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: useKeepalive }).catch(() => undefined);
    if (queue[scope].length) timer = setTimeout(() => flush(), 500);
  }
}

/** Records one thing a visitor did. `scope` is a business id, or "platform" for the marketing site. */
export function track(scope: string, e: TrackEvent) {
  if (typeof window === "undefined") return;
  try {
    if (e.type === "visit") { context[scope] = { source: e.source, device: e.device, country: e.country }; return; }
    const ctx = context[scope];
    const wire: WireEvent = e.type === "page" ? { type: "page", path: e.page } : e.type === "product" ? { type: "product", path: "/product", productId: e.productId } : { type: e.type };
    (queue[scope] ??= []).push({ ...wire, ...(ctx ?? {}) });
    if (!hooked) {
      hooked = true;
      window.addEventListener("pagehide", () => flush(true));
      document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flush(true); });
    }
    if (!timer) timer = setTimeout(() => flush(), 2000);
  } catch { /* never throw from tracking */ }
}

export type AnalyticsDays = 7 | 30 | 90 | 365;

export const getBusinessAnalytics = (_businessId: string, days: AnalyticsDays) => api.get<BusinessAnalytics>("/business/analytics", { days });
export const getPlatformAnalytics = (days: AnalyticsDays) => api.get<PlatformAnalytics>("/platform/analytics", { days });
