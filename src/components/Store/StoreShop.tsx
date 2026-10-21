"use client";
import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import StoreCrumbs from "./StoreCrumbs";
import StoreProductCard from "./StoreProductCard";
import { useStore } from "@/app/context/StoreContext";

const PAGE_SIZE = 12;

type Sort = "latest" | "best" | "price-asc" | "price-desc";

export default function StoreShop() {
  const ctx = useStore();
  const router = useRouter();
  const params = useSearchParams();
  const [sort, setSort] = useState<Sort>("latest");
  const [page, setPage] = useState(1);
  const [inStockOnly, setInStockOnly] = useState(false);

  const q = (params.get("q") ?? "").trim();
  const category = params.get("category") ?? "";
  /** product (default) | service — UI separation on the same catalogue */
  const kind = params.get("kind") === "service" ? "service" : "product";

  const filtered = useMemo(() => {
    let list = ctx?.products ?? [];
    list = list.filter((p) => (p.kind ?? "product") === kind);
    if (category) list = list.filter((p) => p.category === category);
    if (inStockOnly && kind === "product") list = list.filter((p) => p.stock === undefined || p.stock > 0);
    if (q) {
      const needle = q.toLowerCase();
      list = list.filter((p) => `${p.title} ${p.category ?? ""} ${p.description ?? ""}`.toLowerCase().includes(needle));
    }
    const by = [...list];
    if (sort === "latest") by.sort((a, b) => +new Date(b.createdAt ?? 0) - +new Date(a.createdAt ?? 0));
    if (sort === "best") by.sort((a, b) => (b.sold ?? 0) - (a.sold ?? 0));
    if (sort === "price-asc") by.sort((a, b) => a.discountedPrice - b.discountedPrice);
    if (sort === "price-desc") by.sort((a, b) => b.discountedPrice - a.discountedPrice);
    return by;
  }, [ctx?.products, category, q, sort, inStockOnly, kind]);

  if (!ctx?.store) return null;
  const { href, categories, products } = ctx;

  const goods = products.filter((p) => (p.kind ?? "product") === "product");
  const services = products.filter((p) => p.kind === "service");
  const pool = kind === "service" ? services : goods;
  const shopBase = kind === "service" ? "/shop?kind=service" : "/shop";

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const countIn = (c: string) => pool.filter((p) => p.category === c).length;

  const setKind = (k: "product" | "service") => {
    setPage(1);
    const sp = new URLSearchParams();
    if (k === "service") sp.set("kind", "service");
    if (q) sp.set("q", q);
    const qs = sp.toString();
    router.push(href(`/shop${qs ? `?${qs}` : ""}`));
  };

  const setCategory = (c: string) => {
    setPage(1);
    const sp = new URLSearchParams();
    if (kind === "service") sp.set("kind", "service");
    if (c) sp.set("category", c);
    if (q) sp.set("q", q);
    const qs = sp.toString();
    router.push(href(`/shop${qs ? `?${qs}` : ""}`));
  };

  const title =
    category ||
    (q
      ? `Results for “${q}”`
      : kind === "service"
        ? "Services"
        : services.length
          ? "Products"
          : "All products");

  const chip = (active: boolean) =>
    `inline-flex h-10 shrink-0 items-center rounded-full px-5 text-custom-sm font-medium ease-out duration-200 ${
      active ? "" : "bg-white text-dark ring-1 ring-inset hover:ring-2"
    }`;
  const chipStyle = (active: boolean): React.CSSProperties =>
    active
      ? { background: "var(--brand)", color: "var(--brand-fg)" }
      : ({ ["--tw-ring-color" as string]: "var(--line)" } as React.CSSProperties);

  return (
    <section>
      <div className="store-container mx-auto px-4 pb-4 pt-8 sm:px-8 sm:pt-10">
        <StoreCrumbs
          trail={[
            {
              label: kind === "service" ? "Services" : "Shop",
              to: category || q ? href(shopBase) : undefined,
            },
            ...(category || q ? [{ label: category || `“${q}”` }] : []),
          ]}
        />
        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-4xl font-bold text-dark sm:text-5xl">{title}</h1>
          <label className="flex items-center gap-2.5">
            <span className="text-custom-sm">Sort by</span>
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value as Sort);
                setPage(1);
              }}
              className="h-10 rounded-full bg-white py-0 pl-4 pr-9 text-custom-sm font-medium text-dark outline-none ring-1 ring-inset focus-visible:ring-2"
              style={{ ["--tw-ring-color" as string]: "var(--line)" } as React.CSSProperties}
            >
              <option value="latest">Latest</option>
              <option value="best">Best selling</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
            </select>
          </label>
        </div>

        {goods.length > 0 && services.length > 0 && (
          <div
            className="-mx-4 mt-6 flex gap-2.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
            role="tablist"
            aria-label="Catalogue type"
          >
            <button
              type="button"
              role="tab"
              aria-selected={kind === "product"}
              className={chip(kind === "product")}
              style={chipStyle(kind === "product")}
              onClick={() => setKind("product")}
            >
              Products <span className="ml-1.5 opacity-60">{goods.length}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={kind === "service"}
              className={chip(kind === "service")}
              style={chipStyle(kind === "service")}
              onClick={() => setKind("service")}
            >
              Services <span className="ml-1.5 opacity-60">{services.length}</span>
            </button>
          </div>
        )}

        {categories.length > 1 && (
          <div
            className="-mx-4 mt-6 flex gap-2.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
            role="group"
            aria-label="Categories"
          >
            <button className={chip(!category)} style={chipStyle(!category)} onClick={() => setCategory("")}>
              All <span className="ml-1.5 opacity-60">{pool.length}</span>
            </button>
            {categories.map((c) => (
              <button key={c} className={chip(category === c)} style={chipStyle(category === c)} onClick={() => setCategory(c)}>
                {c} <span className="ml-1.5 opacity-60">{countIn(c)}</span>
              </button>
            ))}
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-custom-sm">
          <p>
            {filtered.length} {kind === "service" ? (filtered.length === 1 ? "service" : "services") : filtered.length === 1 ? "product" : "products"}
          </p>
          {kind === "product" && (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => {
                  setInStockOnly(e.target.checked);
                  setPage(1);
                }}
                className="h-4 w-4 accent-[var(--brand)]"
              />
              In stock only
            </label>
          )}
        </div>

        {visible.length === 0 ? (
          <div className="mt-10 rounded-3xl px-6 py-16 text-center" style={{ background: "var(--tint)" }}>
            <p className="mb-1 font-display text-2xl font-bold text-dark">
              {pool.length === 0
                ? kind === "service"
                  ? "No services yet"
                  : "No products yet"
                : kind === "service"
                  ? "No services match your search"
                  : "No products match your search"}
            </p>
            <p className="mb-6">
              {pool.length === 0
                ? kind === "service"
                  ? "This shop has not listed services yet."
                  : "This shop is still being set up."
                : "Try a different word, or clear the filters."}
            </p>
            {pool.length > 0 && (
              <Link
                href={href(shopBase)}
                className="inline-flex h-11 items-center rounded-full px-7 font-medium"
                style={{ background: "var(--brand)", color: "var(--brand-fg)" }}
              >
                {kind === "service" ? "See all services" : "See all products"}
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
            {visible.map((item) => (
              <StoreProductCard item={item} key={item.id} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <nav className="mt-14 flex items-center justify-center gap-2" aria-label="Pagination">
            <button
              disabled={current === 1}
              onClick={() => setPage(current - 1)}
              className="h-10 rounded-full bg-white px-5 text-custom-sm font-medium text-dark ring-1 ring-inset disabled:opacity-40"
              style={{ ["--tw-ring-color" as string]: "var(--line)" } as React.CSSProperties}
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                aria-current={n === current ? "page" : undefined}
                className={`h-10 w-10 rounded-full text-custom-sm font-medium ${n === current ? "" : "text-dark hover:bg-white"}`}
                style={n === current ? { background: "var(--brand)", color: "var(--brand-fg)" } : undefined}
              >
                {n}
              </button>
            ))}
            <button
              disabled={current === totalPages}
              onClick={() => setPage(current + 1)}
              className="h-10 rounded-full bg-white px-5 text-custom-sm font-medium text-dark ring-1 ring-inset disabled:opacity-40"
              style={{ ["--tw-ring-color" as string]: "var(--line)" } as React.CSSProperties}
            >
              Next
            </button>
          </nav>
        )}
      </div>
    </section>
  );
}
