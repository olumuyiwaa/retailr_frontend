"use client";
import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ProductItem from "@/components/Common/ProductItem";
import { useStore } from "@/app/context/StoreContext";
import Pager from "@/components/Store/Pager";
import { usePagination } from "@/lib/usePagination";

const PAGE_SIZE = 12;

type Sort = "latest" | "best" | "price-asc" | "price-desc";

export default function ShowcaseShop() {
  const ctx = useStore();
  const params = useSearchParams();
  const [sort, setSort] = useState<Sort>("latest");
  const [inStock, setInStock] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false); // phones only: the sidebar folds away so results come first
  const q = (params.get("q") ?? "").trim();
  const category = params.get("category") ?? "";
  const kind = params.get("kind") === "service" ? "service" : "product";

  const top = useMemo(
    () => Math.ceil(Math.max(0, ...(ctx?.products ?? []).filter((p) => (p.kind ?? "product") === "product").map((p) => p.discountedPrice))),
    [ctx?.products],
  );

  const list = useMemo(() => {
    let l = ctx?.products ?? [];
    l = l.filter((p) => (p.kind ?? "product") === kind);
    if (category) l = l.filter((p) => p.category === category);
    if (inStock && kind === "product") l = l.filter((p) => p.stock === undefined || p.stock > 0);
    if (maxPrice !== null && kind === "product") l = l.filter((p) => p.discountedPrice <= maxPrice);
    if (q) l = l.filter((p) => `${p.title} ${p.category ?? ""} ${p.description ?? ""}`.toLowerCase().includes(q.toLowerCase()));
    const by = [...l];
    if (sort === "latest") by.sort((a, b) => +new Date(b.createdAt ?? 0) - +new Date(a.createdAt ?? 0));
    if (sort === "best") by.sort((a, b) => (b.sold ?? 0) - (a.sold ?? 0));
    if (sort === "price-asc") by.sort((a, b) => a.discountedPrice - b.discountedPrice);
    if (sort === "price-desc") by.sort((a, b) => b.discountedPrice - a.discountedPrice);
    return by;
  }, [ctx?.products, category, q, sort, kind, inStock, maxPrice]);

  const paged = usePagination(list, `${kind}|${category}|${q}|${sort}|${inStock}|${maxPrice}`, PAGE_SIZE);

  if (!ctx?.store) return null;
  const { categories, href, fmt, products } = ctx;
  const goods = products.filter((p) => (p.kind ?? "product") === "product");
  const services = products.filter((p) => p.kind === "service");
  const pool = kind === "service" ? services : goods;
  const qs = (o: Record<string, string>) => {
    const sp = new URLSearchParams();
    if (o.kind) sp.set("kind", o.kind);
    if (o.category) sp.set("category", o.category);
    if (q) sp.set("q", q);
    const s = sp.toString();
    return `/shop${s ? `?${s}` : ""}`;
  };
  const kindOpt = kind === "service" ? "service" : "";
  const shopBase = qs({ kind: kindOpt });
  const cap = maxPrice ?? top;
  const catCls = (on: boolean) =>
    `flex w-full justify-between rounded-md px-3 py-2 text-custom-sm ease-out duration-200 hover:bg-gray-1 hover:text-blue ${on ? "bg-gray-1 font-medium text-blue" : "text-dark"}`;
  const title =
    category || (q ? `Results for “${q}”` : kind === "service" ? "Services" : services.length ? "Products" : "All products");

  return (
    <section className="pb-16 pt-8" style={{ background: "var(--wash)" }}>
      <div className="store-container mx-auto px-4 sm:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-lg bg-white px-5 py-4 shadow-1">
          <h1 className="text-xl font-semibold text-dark">{title}</h1>
          <label className="flex items-center gap-2 text-custom-sm text-dark">
            Sort
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="rounded-md border border-gray-3 bg-gray-1 px-3 py-2 text-dark outline-none"
            >
              <option value="latest">Latest</option>
              <option value="best">Best selling</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
            </select>
          </label>
        </div>

        <button
          type="button"
          onClick={() => setFiltersOpen((o) => !o)}
          aria-expanded={filtersOpen}
          aria-controls="shop-filters"
          className="mb-4 flex h-11 w-full items-center justify-between rounded-lg bg-white px-5 text-custom-sm font-medium text-dark shadow-1 lg:hidden"
        >
          <span>Filters{category || inStock || maxPrice !== null ? " (active)" : ""}</span>
          <span aria-hidden>{filtersOpen ? "−" : "+"}</span>
        </button>

        <div className="flex flex-col gap-7 lg:flex-row">
          <aside id="shop-filters" className={`${filtersOpen ? "block" : "hidden"} w-full shrink-0 space-y-5 lg:block lg:w-[270px]`}>
            {goods.length > 0 && services.length > 0 && (
              <div className="rounded-lg bg-white p-5 shadow-1">
                <h2 className="mb-3 font-medium text-dark">Type</h2>
                <Link href={href(qs({}))} className={catCls(kind === "product")} aria-current={kind === "product" ? "page" : undefined}>
                  <span>Products</span>
                  <span>{goods.length}</span>
                </Link>
                <Link href={href(qs({ kind: "service" }))} className={catCls(kind === "service")} aria-current={kind === "service" ? "page" : undefined}>
                  <span>Services</span>
                  <span>{services.length}</span>
                </Link>
              </div>
            )}
            <div className="rounded-lg bg-white p-5 shadow-1">
              <h2 className="mb-3 font-medium text-dark">Categories</h2>
              <Link href={href(shopBase)} className={catCls(!category)} aria-current={!category ? "page" : undefined}>
                <span>All</span>
                <span>{pool.length}</span>
              </Link>
              {categories.map((c) => (
                <Link
                  key={c}
                  href={href(qs({ kind: kindOpt, category: c }))}
                  className={catCls(category === c)}
                  aria-current={category === c ? "page" : undefined}
                >
                  <span>{c}</span>
                  <span>{pool.filter((p) => p.category === c).length}</span>
                </Link>
              ))}
            </div>
            {kind === "product" && top > 0 && (
              <div className="rounded-lg bg-white p-5 shadow-1">
                <h2 className="mb-3 font-medium text-dark">Max price</h2>
                <input
                  type="range"
                  min={0}
                  max={top}
                  value={cap}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  aria-label="Maximum price"
                  className="w-full accent-blue"
                />
                <p className="mt-1 text-custom-sm">Up to {fmt(cap)}</p>
              </div>
            )}
            {kind === "product" && (
              <label className="flex items-center gap-3 rounded-lg bg-white p-5 text-custom-sm text-dark shadow-1">
                <input
                  type="checkbox"
                  checked={inStock}
                  onChange={(e) => setInStock(e.target.checked)}
                  className="h-4 w-4 accent-blue"
                />
                In stock only
              </label>
            )}
          </aside>

          <div className="flex-1">
            {list.length === 0 ? (
              <div className="rounded-lg bg-white py-20 text-center shadow-1">
                <p className="font-medium text-dark">
                  {pool.length === 0
                    ? kind === "service"
                      ? "No services yet."
                      : "No products yet."
                    : "No matches. Try a different word or clear the filters."}
                </p>
                <Link href={href(kind === "service" ? "/shop?kind=service" : "/shop")} className="mt-3 inline-block text-blue">
                  Clear filters
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-x-7.5 gap-y-9 sm:grid-cols-2 xl:grid-cols-3">
                {paged.visible.map((p) => (
                  <ProductItem item={p} key={p.id} />
                ))}
              </div>
            )}
            <Pager current={paged.current} total={paged.totalPages} onChange={paged.setPage} rounded="rounded-md" />
          </div>
        </div>
      </div>
    </section>
  );
}
