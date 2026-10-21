// Browser push: registering the service worker and (un)subscribing this browser.
import { getPushKey, removePushSubscription, savePushSubscription } from "@/services/notifications";

export type PushState = "unsupported" | "off-on-server" | "blocked" | "off" | "on";

export const pushSupported = () =>
  typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

const keyBytes = (b64: string) => {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

async function registration() {
  return (await navigator.serviceWorker.getRegistration("/sw.js")) ?? (await navigator.serviceWorker.register("/sw.js"));
}

/** Whether this browser is receiving pushes for the signed-in person. */
export async function pushState(): Promise<PushState> {
  if (!pushSupported()) return "unsupported";
  try {
    if (!(await getPushKey()).enabled) return "off-on-server";
  } catch {
    return "unsupported";
  }
  if (Notification.permission === "denied") return "blocked";
  const reg = await navigator.serviceWorker.getRegistration("/sw.js");
  const sub = await reg?.pushManager.getSubscription();
  return sub && Notification.permission === "granted" ? "on" : "off";
}

/** Asks permission, subscribes this browser and tells the API. Throws a readable message on failure. */
export async function enablePush(): Promise<void> {
  const { enabled, publicKey } = await getPushKey();
  if (!enabled || !publicKey) throw new Error("Push notifications aren't switched on for this server.");
  if ((await Notification.requestPermission()) !== "granted") throw new Error("Notifications are blocked for this site. Allow them in your browser's site settings, then try again.");
  const reg = await registration();
  await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) }));
  await savePushSubscription(sub.toJSON());
}

export async function disablePush(): Promise<void> {
  const reg = await navigator.serviceWorker.getRegistration("/sw.js");
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return;
  await removePushSubscription(sub.endpoint).catch(() => undefined);
  await sub.unsubscribe();
}
