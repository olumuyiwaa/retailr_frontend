import type { DeviceKind, TrafficSource } from "@/types/saas";
import { track } from "@/services/analytics";

const safe = <T,>(fn: () => T, fallback: T): T => {
  try {
    return fn();
  } catch {
    return fallback;
  }
};

export function sourceFromReferrer(referrer: string, search: string): TrafficSource {
  const utm = new URLSearchParams(search).get("utm_source")?.toLowerCase() ?? "";
  const host = safe(() => (referrer ? new URL(referrer).hostname.toLowerCase() : ""), "");
  const hay = `${utm} ${host}`;
  if (/whatsapp|wa\.me/.test(hay)) return "whatsapp";
  if (/instagram|ig\./.test(hay)) return "instagram";
  if (/facebook|fb\.|fbclid/.test(hay)) return "facebook";
  if (/google|bing|duckduckgo|yahoo|search/.test(hay)) return "search";
  if (!host && !utm) return "direct";
  if (host === window.location.hostname) return "direct";
  return "other";
}

export function deviceKind(): DeviceKind {
  const w = window.innerWidth;
  return w < 640 ? "mobile" : w < 1024 ? "tablet" : "desktop";
}

export function visitorCountry(): string {
  return safe(() => {
    const region = (navigator.language || "").split("-")[1];
    return region ? new Intl.DisplayNames(["en"], { type: "region" }).of(region.toUpperCase()) ?? "Other" : "Other";
  }, "Other");
}

/** Starts a session for `scope` once per browser tab, counting a visitor once per day. Returns true if a new session began. */
export function startSession(scope: string): boolean {
  return safe(() => {
    const sKey = `retailr:session:${scope}`;
    if (window.sessionStorage.getItem(sKey)) return false;
    window.sessionStorage.setItem(sKey, "1");
    const today = new Date().toISOString().slice(0, 10);
    const vKey = `retailr:visitor:${scope}`;
    const newToday = window.localStorage.getItem(vKey) !== today;
    if (newToday) window.localStorage.setItem(vKey, today);
    track(scope, { type: "visit", source: sourceFromReferrer(document.referrer, window.location.search), device: deviceKind(), country: visitorCountry(), newVisitorToday: newToday });
    return true;
  }, false);
}
