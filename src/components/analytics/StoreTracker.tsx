"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useStore } from "@/app/context/StoreContext";
import { useAppSelector } from "@/redux/store";
import { startSession } from "@/lib/tracking";
import { track } from "@/services/analytics";

/** Records visits, page views, product views, add-to-cart and checkout starts for a storefront. Renders nothing. */
export default function StoreTracker() {
  const ctx = useStore();
  const pathname = usePathname();
  const storeId = ctx?.store?.id;
  const lastPath = useRef<string | null>(null);
  const cartCount = useAppSelector((s) => s.cartReducer.items.reduce((n, i) => n + i.quantity, 0));
  const lastCart = useRef<number | null>(null);

  useEffect(() => {
    if (!storeId) return;
    startSession(storeId);
    const parts = pathname.split("/").filter(Boolean); // ["s", slug, page, id]
    const page = parts[2] ?? "";
    const key = `${storeId}:${pathname}`;
    if (lastPath.current === key) return;
    lastPath.current = key;
    if (page === "") track(storeId, { type: "page", page: "/" });
    else if (page === "shop") track(storeId, { type: "page", page: "/shop" });
    else if (page === "product") {
      track(storeId, { type: "page", page: "/product" });
      if (parts[3]) track(storeId, { type: "product", productId: decodeURIComponent(parts[3]) });
    } else if (page === "cart") track(storeId, { type: "page", page: "/cart" });
    else if (page === "checkout") {
      track(storeId, { type: "page", page: "/checkout" });
      track(storeId, { type: "checkout" });
    }
  }, [storeId, pathname]);

  useEffect(() => {
    if (!storeId) return;
    if (lastCart.current !== null && cartCount > lastCart.current) track(storeId, { type: "add_to_cart" });
    lastCart.current = cartCount;
  }, [storeId, cartCount]);

  return null;
}
