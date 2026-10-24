"use client";
import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/app/context/StoreContext";
import ShopCard from "./Card";

type Sort = "featured" | "latest" | "price-asc" | "price-desc";

const inputBase =
  "h-10 rounded-full border bg-[color:var(--tint)] px-4 text-custom-sm text-dark outline-none transition-colors focus:bg-white focus:border-dark";

export default function ShopShop() {
  const ctx = useStore();
  const params = useSearchParams();
  const [sort, setSort] = useState<Sort>("featured");
  const urlQ = params.get("q") ?? "";
  const [term, setTerm] = useState(urlQ);
  const [seenQ, setSeenQ] = useState(urlQ);
  // follow ?q= when it changes (e.g. a search from the header)
  if (seenQ !== urlQ) {
    setSeenQ(urlQ);
    setTerm(urlQ);
  }
  const category = params.get("category") ?? "";
  const kind = params.get("kind") === "service" ? "service" : "product";
  const q = term.trim().toLowerCase();

  const list = useMemo(() => {
    let l = ctx?.products ?? [];
    l = l.filter((p) => (p.kind ?? "product") === kind);
    if (category) l = l.filter((p) => p.category === category);
    if (q) l = l.filter((p) => `${p.title} ${p.category ?? ""} ${p.description ?? ""}`.toLowerCase().includes(q));
    const by = [...l];
    if (sort === "featured") by.sort((a, b) => (b.sold ?? 0) - (a.sold ?? 0) || +new Date(b.createdAt ?? 0) - +new Date(a.createdAt ?? 0));
    if (sort === "latest") by.sort((a, b) => +new Date(b.createdAt ?? 0) - +new Date(a.createdAt ?? 0));
    if (sort === "price-asc") by.sort((a, b) => a.discountedPrice - b.discountedPrice);
    if (sort === "price-desc") by.sort((a, b) => b.discountedPrice - a.discountedPrice);
    return by;
  }, [ctx?.products, category, q, sort, kind]);

  if (!ctx?.store) return null;
  const { store, categories, href, products } = ctx;
  const goods = products.filter((p) => (p.kind ?? "product") === "product");
  const services = products.filter((p) => p.kind === "service");
  const shopBase = kind === "service" ? "/shop?kind=service" : "/shop";

  const heading = category || (kind === "service" ? "Services" : goods.length && services.length ? "Products" : "Shop all");

  const pill = (active: boolean) =>
    `shrink-0 rounded-full px-4 py-2 text-custom-sm font-medium transition-colors ${
      active ? "bg-dark text-white" : "bg-[color:var(--tint)] text-dark hover:bg-[color:var(--line)]"
    }`;

  return (
    <section>
      {/* Page header */}
      <div className="mx-auto w-full max-w-[1680px] px-5 pb-5 pt-7 sm:px-8 lg:px-12 2xl:px-20">
        <nav aria-label="Breadcrumb" className="mb-2 text-custom-sm" style={{ color: "var(--muted)" }}>
          <Link href={href("/")} className="hover:text-dark transition-colors">Home</Link>
          <span className="mx-1.5" aria-hidden>/</span>
          <span className="text-dark">{heading}</span>
        </nav>
        <h1 className="text-3xl font-extrabold text-dark sm:text-4xl">{heading}</h1>
        {(category || kind === "service") && (
          <p className="mt-1.5 text-base" style={{ color: "var(--muted)" }}>
            {category ? `${store.name} · ${category}` : `Everything ${store.name} offers as a service.`}
          </p>
        )}
      </div>

      {/* Filters row */}
      <div className="border-y bg-white relative" style={{ borderColor: "var(--line)" }}>
        <div className="mx-auto flex w-full max-w-[1680px] items-center gap-3 overflow-x-auto px-5 py-3 sm:px-8 lg:px-12 2xl:px-20 no-scrollbar">
          {/* Kind tabs */}
          {goods.length > 0 && services.length > 0 && (
            <>
              <Link href={href("/shop")} className={pill(kind === "product")} aria-current={kind === "product" ? "page" : undefined}>Products</Link>
              <Link href={href("/shop?kind=service")} className={pill(kind === "service")} aria-current={kind === "service" ? "page" : undefined}>Services</Link>
              <span className="mx-1 h-5 w-px shrink-0 bg-[color:var(--line)]" aria-hidden />
            </>
          )}
          {/* Category pills */}
          <Link href={href(shopBase)} className={pill(!category)} aria-current={!category ? "page" : undefined}>All</Link>
          {categories.map((c) => (
            <Link
              key={c}
              href={href(`/shop?${kind === "service" ? "kind=service&" : ""}category=${encodeURIComponent(c)}`)}
              className={pill(category === c)}
              aria-current={category === c ? "page" : undefined}
            >
              {c}
            </Link>
          ))}

        </div>
        <div className="mx-auto flex w-full max-w-[1680px] items-center gap-2 px-5 pb-3 sm:px-8 lg:px-12 2xl:px-20">
          <div className="ml-auto flex w-full items-center gap-2 sm:w-auto">
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search…"
              aria-label="Search products"
              className={`${inputBase} min-w-0 flex-1 sm:w-48 sm:flex-none`}
              style={{ borderColor: "var(--line)" }}
            />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              aria-label="Sort products"
              className={`${inputBase} cursor-pointer pr-2`}
              style={{ borderColor: "var(--line)" }}
            >
              <option value="featured">Featured</option>
              <option value="latest">Newest</option>
              <option value="price-asc">Price ↑</option>
              <option value="price-desc">Price ↓</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="mx-auto w-full max-w-[1680px] px-5 pb-8 pt-6 sm:px-8 lg:px-12 2xl:px-20">
        <p className="mb-5 text-custom-sm" style={{ color: "var(--muted)" }}>
          {list.length} {kind === "service" ? (list.length === 1 ? "service" : "services") : list.length === 1 ? "product" : "products"}
        </p>
        {list.length === 0 ? (
          (kind === "service" ? services : goods).length === 0 ? (
            <div className="py-24 text-center">
              <p className="text-lg font-semibold text-dark">{kind === "service" ? "No services listed yet." : "No products listed yet."}</p>
              <p className="mt-1 text-custom-sm" style={{ color: "var(--muted)" }}>Check back soon.</p>
            </div>
          ) : (
            <div className="py-24 text-center">
              <p className="text-lg font-semibold text-dark">Nothing matches that search.</p>
              <p className="mt-1 text-custom-sm" style={{ color: "var(--muted)" }}>Try different keywords or clear the filters.</p>
              <Link href={href(shopBase)} onClick={() => setTerm("")} className="mt-5 inline-flex h-11 items-center rounded-full bg-dark px-6 text-custom-sm font-medium text-white">
                Clear filters
              </Link>
            </div>
          )
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 lg:grid-cols-5">
            {list.map((p) => (
              <ShopCard key={p.id} item={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
