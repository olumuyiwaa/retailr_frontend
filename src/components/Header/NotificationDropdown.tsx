"use client";
import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { relativeTime } from "@/lib/format";
import { disablePush, enablePush, pushState, type PushState } from "@/lib/push";
import { listNotifications, markAllNotificationsRead, markNotificationRead, type AppNotification, type NotificationKind } from "@/services/notifications";

const POLL_MS = 30_000;

const KIND: Record<NotificationKind, { label: string; tone: string }> = {
  new_order: { label: "Order", tone: "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400" },
  low_stock: { label: "Stock", tone: "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400" },
  out_of_stock: { label: "Stock", tone: "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400" },
  new_booking: { label: "Booking", tone: "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400" },
  booking_cancelled: { label: "Booking", tone: "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400" },
  new_business: { label: "Sign-up", tone: "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500" },
};

/** The bell in the admin header: recent notifications, unread count and the switch for browser push. */
export default function NotificationDropdown() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [push, setPush] = useState<PushState | null>(null);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const r = await listNotifications(20);
      setItems(r.items);
      setUnread(r.unreadCount);
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoaded(true);
    }
  }, []);

  // load now, then keep checking while the tab is in view
  useEffect(() => {
    void refresh();
    const timer = setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, POLL_MS);
    const onVisible = () => { if (document.visibilityState === "visible") void refresh(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", onVisible); };
  }, [refresh]);

  useEffect(() => {
    if (isOpen) {
      void refresh();
      void pushState().then(setPush);
    }
  }, [isOpen, refresh]);

  const open = async (n: AppNotification) => {
    setIsOpen(false);
    if (!n.read) {
      setItems((list) => list.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      setUnread((c) => Math.max(0, c - 1));
      void markNotificationRead(n.id).catch(() => undefined);
    }
    if (n.link) router.push(n.link);
  };

  const readAll = async () => {
    setItems((list) => list.map((x) => ({ ...x, read: true })));
    setUnread(0);
    await markAllNotificationsRead().catch(() => undefined);
  };

  const togglePush = async () => {
    setPushError(null);
    setPushBusy(true);
    try {
      if (push === "on") await disablePush();
      else await enablePush();
    } catch (e) {
      setPushError(e instanceof Error ? e.message : "Couldn't change push notifications.");
    } finally {
      setPush(await pushState());
      setPushBusy(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={isOpen}
        className="relative dropdown-toggle flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={() => setIsOpen((o) => !o)}
      >
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 z-10 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[11px] font-semibold leading-none text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
        <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
          />
        </svg>
      </button>
      <Dropdown
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        className="absolute -right-[240px] mt-[17px] flex h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0"
      >
        <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
          <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Notifications</h5>
          {unread > 0 && (
            <button type="button" onClick={readAll} className="text-theme-sm font-medium text-brand-500 hover:text-brand-600">
              Mark all as read
            </button>
          )}
        </div>

        <ul className="custom-scrollbar flex h-auto flex-1 flex-col overflow-y-auto">
          {!loaded ? (
            <li className="px-4 py-8 text-center text-theme-sm text-gray-500">Loading…</li>
          ) : failed && items.length === 0 ? (
            <li className="px-4 py-8 text-center text-theme-sm text-gray-500">Couldn&apos;t load notifications. We&apos;ll try again shortly.</li>
          ) : items.length === 0 ? (
            <li className="px-4 py-8 text-center text-theme-sm text-gray-500">You&apos;re all caught up. New orders and stock alerts will appear here.</li>
          ) : (
            items.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => open(n)}
                  className={`flex w-full gap-3 rounded-lg border-b border-gray-100 px-3 py-3 text-left hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5 ${n.read ? "" : "bg-brand-50/40 dark:bg-white/[0.03]"}`}
                >
                  <span className={`mt-0.5 h-fit shrink-0 rounded-md px-2 py-0.5 text-theme-xs font-medium ${KIND[n.type]?.tone ?? ""}`}>{KIND[n.type]?.label ?? "Update"}</span>
                  <span className="block min-w-0 flex-1">
                    <span className={`block text-theme-sm text-gray-800 dark:text-white/90 ${n.read ? "" : "font-semibold"}`}>{n.title}</span>
                    {n.body && <span className="block truncate text-theme-sm text-gray-500 dark:text-gray-400">{n.body}</span>}
                    <span className="mt-1 block text-theme-xs text-gray-400">{relativeTime(n.createdAt)}</span>
                  </span>
                  {!n.read && <span aria-label="Unread" className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
                </button>
              </li>
            ))
          )}
        </ul>

        {push && push !== "unsupported" && push !== "off-on-server" && (
          <div className="mt-3 border-t border-gray-100 pt-3 dark:border-gray-800">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90">Push notifications</p>
                <p className="text-theme-xs text-gray-500">
                  {push === "on" ? "On for this browser, even when Retailr is closed." : push === "blocked" ? "Blocked in your browser's site settings." : "Get alerts on this device when Retailr is closed."}
                </p>
              </div>
              {push !== "blocked" && (
                <button
                  type="button"
                  role="switch"
                  aria-checked={push === "on"}
                  aria-label="Push notifications"
                  disabled={pushBusy}
                  onClick={togglePush}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60 ${push === "on" ? "bg-brand-500" : "bg-gray-200 dark:bg-white/10"}`}
                >
                  <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${push === "on" ? "translate-x-5" : ""}`} />
                </button>
              )}
            </div>
            {pushError && <p role="alert" className="mt-2 text-theme-xs text-error-600">{pushError}</p>}
          </div>
        )}
      </Dropdown>
    </div>
  );
}
