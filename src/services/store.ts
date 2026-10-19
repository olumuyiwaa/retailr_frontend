// Public storefront services: what a shopper at /s/[slug] can do. All of them are open to anyone, so they send no session.
import type { Order, OrderItem, PaymentMethod, Product, PublicStore } from "@/types/saas";
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
  items: { productId: string | number; variantId?: string; qty: number }[];
}

/** Places the order. `publicToken` is what the confirmation page uses to find it again. */
export async function placeOrder({ slug, ...body }: PlaceOrderInput): Promise<Order & { publicToken: string }> {
  const items = body.items.map((i) => ({ ...i, productId: String(i.productId) }));
  return api.post(`/store/${encodeURIComponent(slug)}/orders`, { ...body, notes: body.notes?.trim() || undefined, couponCode: body.couponCode || undefined, items }, { auth: false });
}

/** The order for the confirmation and invoice pages, found by its unguessable token. */
export async function getOrderForConfirmation(token: string): Promise<Order & { items: OrderItem[] }> {
  const r = await api.get<{ order: Order & { items: OrderItem[] } }>(`/store/orders/${encodeURIComponent(token)}`, undefined, { auth: false });
  return r.order;
}
