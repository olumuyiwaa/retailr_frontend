"use client";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import type { Product as StoreProductRow, PublicStore } from "@/types/saas";
import type { Product } from "@/types/product";
import { getStoreBySlug, listStoreCategories, listStoreProducts, STORE_UNAVAILABLE } from "@/services/store";
import { syncCartToStore } from "@/redux/features/cart-slice";
import type { AppDispatch } from "@/redux/store";
import { storePalette } from "@/lib/storeTheme";
import { getTheme } from "@/themes/registry";
import { formatCurrency } from "@/lib/money";

interface StoreContextValue {
  store: PublicStore | null;
  products: Product[];
  categories: string[];
  /** Cover picture per category name (only for categories that have one). */
  categoryImages: Record<string, string>;
  status: "loading" | "ready" | "unavailable" | "error";
  /** Prefix a storefront path with this store's base URL, e.g. "/shop" -> "/s/<slug>/shop". */
  href: (path: string) => string;
  /** Formats an amount in this store's currency. */
  fmt: (n: number) => string;
  reload: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

/** null when rendered outside a business storefront (e.g. the /storefront template preview). */
export const useStore = () => useContext(StoreContext);

/** Slug-aware link builder; identity function outside a storefront. */
/** Amount formatter for the current store's currency (USD outside a storefront). */
export const useStoreMoney = () => useContext(StoreContext)?.fmt ?? ((n: number) => formatCurrency(n, "USD"));

export const useStoreHref = () => useContext(StoreContext)?.href ?? ((p: string) => p);

export const storeBase = (slug: string) => `/s/${slug}`;

/** Services have no stock; their options get a ceiling so quantity pickers stay finite. */
const SERVICE_OPTION_STOCK = 99;

// Convert an admin product row into the shape the template's product components use.
export const toTemplateProduct = (p: StoreProductRow): Product => ({
  id: p.id,
  title: p.name,
  reviews: 0,
  price: p.price,
  discountedPrice: p.price,
  storeId: p.businessId,
  category: p.category,
  description: p.description,
  // a service has no stock: leaving it undefined means "always available" everywhere the storefront checks
  stock: p.kind === "service" ? undefined : p.status === "out_of_stock" ? 0 : p.stock,
  kind: p.kind,
  durationMins: p.durationMins,
  color: p.imageColor,
  imgs: (() => {
    const all = p.images?.length ? p.images : p.image ? [p.image] : [];
    return all.length ? { thumbnails: all, previews: all } : undefined;
  })(),
  // a service's options never run out
  variants: p.variants?.length ? p.variants.map((v) => ({ ...v, stock: p.kind === "service" ? SERVICE_OPTION_STOCK : v.stock })) : undefined,
  sku: p.sku,
  specs: p.specs?.length ? p.specs.map((s) => ({ ...s })) : undefined,
  createdAt: p.createdAt,
  sold: p.sold,
});

export function StoreProvider({ slug, children }: { slug?: string; children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();
  const [store, setStore] = useState<PublicStore | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryList, setCategoryList] = useState<{ name: string; image?: string }[]>([]);
  const [status, setStatus] = useState<StoreContextValue["status"]>("loading");
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setStatus((s) => (s === "ready" ? s : "loading"));
    (async () => {
      try {
        const s = await getStoreBySlug(slug);
        const [rows, cats] = await Promise.all([listStoreProducts(slug), listStoreCategories(slug)]);
        if (cancelled) return;
        setStore(s);
        setProducts(rows.map(toTemplateProduct));
        setCategoryList(cats);
        setStatus("ready");
        dispatch(syncCartToStore(s.id));
      } catch (e) {
        if (cancelled) return;
        setStore(null);
        setStatus(e instanceof Error && e.message === STORE_UNAVAILABLE ? "unavailable" : "error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, nonce, dispatch]);

  const value = useMemo<StoreContextValue | null>(() => {
    if (!slug) return null;
    return {
      store,
      products,
      categories: categoryList.map((c) => c.name),
      categoryImages: Object.fromEntries(categoryList.filter((c) => c.image).map((c) => [c.name, c.image as string])),
      status,
      href: (path: string) => `${storeBase(slug)}${path === "/" ? "" : path}`,
      fmt: (n: number) => formatCurrency(n, store?.currency ?? "USD"),
      reload: () => setNonce((n) => n + 1),
    };
  }, [slug, store, products, categoryList, status]);

  if (!slug) return <>{children}</>;

  const pal = { ...storePalette(store?.brandColor ?? "#3C50E0"), ...getTheme(store?.theme).palette };
  return (
    <StoreContext.Provider value={value}>
      <div
        className="store-themed min-h-screen"
        style={{
          ["--brand" as string]: pal.brand,
          ["--brand-fg" as string]: pal.brandFg,
          ["--ink" as string]: pal.ink,
          ["--tint" as string]: pal.tint,
          ["--wash" as string]: pal.wash,
          ["--line" as string]: pal.line,
          ["--muted" as string]: pal.muted,
        }}
      >
        {/* Re-skin the template's blue/navy with the business's own palette */}
        <style>{`
          .store-themed{background:var(--wash);color:var(--muted)}
          .store-themed .font-display,.store-themed h1,.store-themed h2{font-family:var(--font-display),system-ui,sans-serif;letter-spacing:-0.02em}
          .store-themed .text-dark{color:var(--ink)!important}
          .store-themed .bg-dark{background-color:var(--ink)!important}
          .store-themed .bg-blue{background-color:var(--brand)!important;color:var(--brand-fg)!important}
          .store-themed .hover\\:bg-blue-dark:hover{background-color:var(--brand)!important;filter:brightness(.9)}
          .store-themed .text-blue,.store-themed .hover\\:text-blue:hover,.store-themed .last\\:text-blue:last-child{color:var(--brand)!important}
          .store-themed .border-blue{border-color:var(--brand)!important}
          .store-themed .before\\:bg-blue::before{background-color:var(--brand)!important}
          .store-themed .focus\\:ring-blue\\/20:focus{--tw-ring-color:color-mix(in srgb,var(--brand) 20%,transparent)!important}
          .store-themed :focus-visible{outline:2px solid var(--brand);outline-offset:2px}
        `}</style>
        {children}
      </div>
    </StoreContext.Provider>
  );
}
