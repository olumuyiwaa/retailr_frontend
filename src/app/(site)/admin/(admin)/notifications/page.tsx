"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, EmptyState, PageHeader } from "@/components/saas/Card";
import { OutlineButton, PrimaryButton } from "@/components/saas/Form";
import { relativeTime } from "@/lib/format";
import { disablePush, enablePush, pushState, type PushState } from "@/lib/push";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
  type NotificationKind,
} from "@/services/notifications";

const KIND: Record<NotificationKind, { label: string; tone: string }> = {
  new_order: { label: "Order", tone: "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400" },
  low_stock: { label: "Stock", tone: "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400" },
  out_of_stock: { label: "Stock", tone: "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400" },
  new_booking: { label: "Booking", tone: "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400" },
  booking_cancelled: { label: "Booking", tone: "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400" },
  new_business: { label: "Sign-up", tone: "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500" },
};

type Filter = "all" | "unread";

export default function NotificationsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [push, setPush] = useState<PushState | null>(null);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const r = await listNotifications(100, filter === "unread");
      setItems(r.items);
      setUnread(r.unreadCount);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load notifications.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    void refresh();
  }, [refresh]);

  useEffect(() => {
    void pushState().then(setPush);
  }, []);

  const open = async (n: AppNotification) => {
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
    if (filter === "unread") void refresh();
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
    <div>
      <PageHeader
        title="Notifications"
        subtitle={unread ? `${unread} unread` : "You're up to date."}
        action={
          <div className="flex flex-wrap gap-2">
            {unread > 0 && (
              <OutlineButton type="button" onClick={() => void readAll()}>
                Mark all as read
              </OutlineButton>
            )}
            {push && push !== "unsupported" && (
              <PrimaryButton type="button" busy={pushBusy} onClick={() => void togglePush()}>
                {push === "on" ? "Disable browser push" : "Enable browser push"}
              </PrimaryButton>
            )}
          </div>
        }
      />

      {pushError && <p className="mb-4 text-sm text-error-500">{pushError}</p>}

      <div className="mb-4 flex gap-2">
        {(["all", "unread"] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
              filter === f
                ? "bg-brand-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
            }`}
          >
            {f === "all" ? "All" : "Unread"}
          </button>
        ))}
      </div>

      <Card>
        {loading ? (
          <p className="px-5 py-10 text-center text-sm text-gray-500">Loading…</p>
        ) : error ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-error-500">{error}</p>
            <OutlineButton type="button" className="mt-3" onClick={() => void refresh()}>
              Try again
            </OutlineButton>
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title={filter === "unread" ? "No unread notifications" : "No notifications yet"}
            body={filter === "unread" ? "You're all caught up." : "New orders, stock alerts and bookings will show up here."}
          />
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {items.map((n) => {
              const kind = KIND[n.type] ?? { label: "Update", tone: "bg-gray-100 text-gray-600" };
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => void open(n)}
                    className={`flex w-full items-start gap-3 px-5 py-4 text-left transition hover:bg-gray-50 dark:hover:bg-white/[0.03] sm:px-6 ${
                      n.read ? "opacity-80" : ""
                    }`}
                  >
                    {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand-500" aria-hidden />}
                    {n.read && <span className="mt-2 h-2 w-2 shrink-0" aria-hidden />}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${kind.tone}`}>{kind.label}</span>
                        <span className="text-xs text-gray-400">{relativeTime(n.createdAt)}</span>
                      </div>
                      <p className={`mt-1 text-sm ${n.read ? "text-gray-600 dark:text-gray-400" : "font-medium text-gray-800 dark:text-white/90"}`}>
                        {n.title}
                      </p>
                      {n.body && <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{n.body}</p>}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
