"use client";
import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/app/context/StoreContext";
import AtelierCard from "./Card";

type Sort = "featured" | "latest" | "price-asc" | "price-desc";
const field = "h-11 rounded-md border bg-white/60 px-3 text-custom-sm text-dark outline-none focus:bg-white";

export default function AtelierShop() {
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
  const tab = (on: boolean) =>
    `whitespace-nowrap border-b-2 py-4 text-custom-sm ease-out duration-200 hover:text-dark ${on ? "border-[color:var(--ink)] font-medium text-dark" : "border-transparent"}`;
  const line = { borderColor: "var(--line)" };
  const heading =
    category || (kind === "service" ? "Services" : goods.length && services.length ? "Products" : "Shop all");

  return (
    <section>
      <div className="mx-auto w-full max-w-[1680px] px-5 pb-8 pt-10 sm:px-8 lg:px-12 2xl:px-20">
        <nav aria-label="Breadcrumb" className="text-custom-sm">
          <Link href={href("/")} className="hover:text-dark">
            Home
          </Link>{" "}
          / <span className="text-dark">{heading}</span>
        </nav>
        <h1 className="mt-4 text-4xl font-bold text-dark sm:text-5xl">{heading}</h1>
        <p className="mt-3 max-w-[40rem] text-lg">
          {category ? `${store.name} · ${category}` : store.description || `Everything ${store.name} sells.`}
        </p>
      </div>

      <div className="border-y" style={line}>
        <div className="mx-auto flex w-full max-w-[1680px] flex-wrap items-center gap-x-8 gap-y-3 px-5 sm:px-8 lg:px-12 2xl:px-20">
          {goods.length > 0 && services.length > 0 && (
            <nav className="flex gap-6 overflow-x-auto" aria-label="Catalogue type">
              <Link href={href("/shop")} className={tab(kind === "product")} aria-current={kind === "product" ? "page" : undefined}>
                Products
              </Link>
              <Link
                href={href("/shop?kind=service")}
                className={tab(kind === "service")}
                aria-current={kind === "service" ? "page" : undefined}
              >
                Services
              </Link>
            </nav>
          )}
          <nav className="flex gap-6 overflow-x-auto" aria-label="Categories">
            <Link href={href(shopBase)} className={tab(!category)} aria-current={!category ? "page" : undefined}>
              All
            </Link>
            {categories.map((c) => (
              <Link
                key={c}
                href={href(`/shop?${kind === "service" ? "kind=service&" : ""}category=${encodeURIComponent(c)}`)}
                className={tab(category === c)}
                aria-current={category === c ? "page" : undefined}
              >
                {c}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex w-full gap-3 py-3 sm:w-auto">
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search"
              aria-label="Search"
              className={`${field} min-w-0 flex-1 sm:w-44`}
              style={line}
            />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              aria-label="Sort"
              className={field}
              style={line}
            >
              <option value="featured">Featured</option>
              <option value="latest">Newest</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1680px] px-5 pt-8 sm:px-8 lg:px-12 2xl:px-20">
        <p className="mb-6 text-custom-sm">
          {list.length}{" "}
          {kind === "service"
            ? list.length === 1
              ? "service"
              : "services"
            : list.length === 1
              ? "product"
              : "products"}
        </p>
        {list.length === 0 ? (
          <div className="py-20 text-center">
            {(kind === "service" ? services : goods).length === 0 ? (
              <p className="font-medium text-dark">{kind === "service" ? "No services listed yet." : "No products listed yet."}</p>
            ) : (
              <>
                <p className="font-medium text-dark">Nothing matches that.</p>
                <Link href={href(shopBase)} onClick={() => setTerm("")} className="mt-3 inline-block py-2 underline underline-offset-4">
                  Clear filters
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
            {list.map((p) => (
              <AtelierCard key={p.id} item={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
