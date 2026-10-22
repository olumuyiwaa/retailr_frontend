// The signed-in person's notifications and their browser push subscription.
import { api } from "@/lib/api";

export type NotificationKind = "new_order" | "low_stock" | "out_of_stock" | "new_business" | "new_booking" | "booking_cancelled";

export interface AppNotification {
  id: string;
  type: NotificationKind;
  title: string;
  body: string;
  /** An app path to open, e.g. /admin/business/orders */
  link?: string;
  read: boolean;
  createdAt: string; // ISO
}

export interface NotificationList { unreadCount: number; items: AppNotification[] }

export const listNotifications = (limit = 20, unreadOnly = false) =>
  api.get<NotificationList>("/notifications", { limit, ...(unreadOnly ? { unread: "true" } : {}) });
export const markNotificationRead = (id: string) => api.post<void>(`/notifications/${id}/read`);
export const markAllNotificationsRead = () => api.post<void>("/notifications/read-all");

export const getPushKey = () => api.get<{ enabled: boolean; publicKey: string | null }>("/notifications/push/key");
export const savePushSubscription = (sub: PushSubscriptionJSON) => api.post<void>("/notifications/push/subscribe", { endpoint: sub.endpoint, keys: sub.keys });
export const removePushSubscription = (endpoint: string) => api.post<void>("/notifications/push/unsubscribe", { endpoint });
