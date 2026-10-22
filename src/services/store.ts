// Public storefront services: what a shopper at /s/[slug] can do. All of them are open to anyone, so they send no session.
import type { Booking, BookingSlots, Order, OrderItem, PaymentMethod, Product, PublicStore, Service } from "@/types/saas";
import { ApiError, api } from "@/lib/api";

export const STORE_UNAVAILABLE = "STORE_UNAVAILABLE";

/** Only businesses that are live (active or on trial) have a public store. */
export async function getStoreBySlug(slug: string): Promise<PublicStore> {
  try {
    return await api.get<PublicStore>(`/store/${encodeURIComponent(slug)}`, undefined, { auth: false });
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) throw new Error(STORE_UNAVAILABLE);
    throw e;
  }
}

/** Draft products are hidden; sold-out products stay visible but can't be bought. */
export const listStoreProducts = (slug: string) => api.get<Product[]>(`/store/${encodeURIComponent(slug)}/products`, undefined, { auth: false });

/** Draft services are hidden. */
export const listStoreServices = (slug: string) => api.get<Service[]>(`/store/${encodeURIComponent(slug)}/services`, undefined, { auth: false });

/** The business's own categories that currently have something on sale, alphabetically, with their pictures. */
export const listStoreCategories = (slug: string) => api.get<{ name: string; image?: string }[]>(`/store/${encodeURIComponent(slug)}/categories`, undefined, { auth: false });

/** Checks a code against the cart subtotal without using it up. */
export const validateCoupon = (slug: string, code: string, subtotal: number) =>
  api.post<{ code: string; discount: number }>(`/store/${encodeURIComponent(slug)}/coupons/validate`, { code: code.trim(), subtotal }, { auth: false });

export interface PlaceOrderInput {
  slug: string;
  customer: { name: string; email: string; phone: string };
  shippingAddress: string;
  notes?: string;
  paymentMethod: PaymentMethod;
  couponCode?: string;
  /** Each line is a product (productId, variantId) or a service (serviceId, optionId). */
  items: { productId?: string | number; variantId?: string; serviceId?: string; optionId?: string; qty: number }[];
}

/** Places the order. `publicToken` is what the confirmation page uses to find it again. */
export async function placeOrder({ slug, ...body }: PlaceOrderInput): Promise<Order & { publicToken: string }> {
  const items = body.items.map((i) => ({ ...i, ...(i.productId !== undefined ? { productId: String(i.productId) } : {}) }));
  return api.post(`/store/${encodeURIComponent(slug)}/orders`, { ...body, notes: body.notes?.trim() || undefined, couponCode: body.couponCode || undefined, items }, { auth: false });
}

/** The order for the confirmation and invoice pages, found by its unguessable token. */
export async function getOrderForConfirmation(token: string): Promise<Order & { items: OrderItem[] }> {
  const r = await api.get<{ order: Order & { items: OrderItem[] } }>(`/store/orders/${encodeURIComponent(token)}`, undefined, { auth: false });
  return r.order;
}

// ---------- bookings ----------

/** Free start times for a bookable service on one day (YYYY-MM-DD), already in the business's time zone. */
export const getSlots = (slug: string, serviceId: string, date: string) =>
  api.get<BookingSlots>(`/store/${encodeURIComponent(slug)}/services/${encodeURIComponent(serviceId)}/slots`, { date }, { auth: false });

export interface BookInput {
  slug: string;
  serviceId: string;
  optionId?: string;
  startsAt: string;
  customer: { name: string; email: string; phone: string };
  notes?: string;
}
export const bookService = ({ slug, ...body }: BookInput) =>
  api.post<Booking & { publicToken: string }>(`/store/${encodeURIComponent(slug)}/bookings`, { ...body, notes: body.notes?.trim() || undefined }, { auth: false });

export const getBookingByToken = (token: string) => api.get<{ booking: Booking }>(`/store/bookings/${encodeURIComponent(token)}`, undefined, { auth: false }).then((r) => r.booking);
export const cancelBookingByToken = (token: string) => api.post<Booking>(`/store/bookings/${encodeURIComponent(token)}/cancel`, {}, { auth: false });
