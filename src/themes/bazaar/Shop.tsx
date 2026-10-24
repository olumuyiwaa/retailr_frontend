"use client";
import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/app/context/StoreContext";
import BazaarCard from "./Card";

type Sort = "featured" | "latest" | "price-asc" | "price-desc";

const inputCls =
  "h-11 rounded border bg-white px-3 text-custom-sm text-dark outline-none focus:ring-2 focus:ring-offset-1";

export default function BazaarShop() {
  const ctx = useStore();
  const params = useSearchParams();
  const [sort, setSort] = useState<Sort>("featured");
  const [term, setTerm] = useState(params.get("q") ?? "");
  const category = params.get("category") ?? "";
  const onlyServices =
    !!ctx?.products.length && !ctx.products.some((p) => (p.kind ?? "product") === "product");
  const kind = params.get("kind") === "service" || onlyServices ? "service" : "product";
  const urlQ = params.get("q") ?? "";
  // keep the box in step with the URL (e.g. a search submitted from the header)
  const [prevQ, setPrevQ] = useState(urlQ);
  if (prevQ !== urlQ) {
    setPrevQ(urlQ);
    setTerm(urlQ);
  }
  const q = term.trim().toLowerCase();

  const list = useMemo(() => {
    let l = ctx?.products ?? [];
    l = l.filter((p) => (p.kind ?? "product") === kind);
    if (category) l = l.filter((p) => p.category === category);
    if (q)
      l = l.filter((p) =>
        `${p.title} ${p.category ?? ""} ${p.description ?? ""}`.toLowerCase().includes(q)
      );
    const by = [...l];
    if (sort === "featured")
      by.sort(
        (a, b) =>
          (b.sold ?? 0) - (a.sold ?? 0) ||
          +new Date(b.createdAt ?? 0) - +new Date(a.createdAt ?? 0)
      );
    if (sort === "latest")
      by.sort(
        (a, b) => +new Date(b.createdAt ?? 0) - +new Date(a.createdAt ?? 0)
      );
    if (sort === "price-asc") by.sort((a, b) => a.discountedPrice - b.discountedPrice);
    if (sort === "price-desc") by.sort((a, b) => b.discountedPrice - a.discountedPrice);
    return by;
  }, [ctx?.products, category, q, sort, kind]);

  if (!ctx?.store) return null;
  const { store, categories, href, products } = ctx;

  const goods = products.filter((p) => (p.kind ?? "product") === "product");
  const services = products.filter((p) => p.kind === "service");
  const shopBase = kind === "service" ? "/shop?kind=service" : "/shop";

  const heading =
    category ||
    (kind === "service"
      ? "Services"
      : goods.length && services.length
        ? "Products"
        : "All Products");

  const divider = { borderColor: "var(--line)" };
  // only offer categories that have something of the kind being browsed
  const cats = categories.filter((c) =>
    products.some((p) => (p.kind ?? "product") === kind && p.category === c)
  );

  /* Active category pill */
  const catPill = (on: boolean) =>
    `whitespace-nowrap rounded border px-3.5 py-2.5 text-custom-sm font-medium transition-colors duration-150 ${
      on
        ? "text-white border-transparent"
        : "bg-white text-dark hover:bg-[color:var(--tint)]"
    }`;

  return (
    <section style={{ background: "var(--wash)" }}>
      {/* Breadcrumb + heading */}
      <div className="bg-white border-b" style={divider}>
        <div className="mx-auto w-full max-w-[1680px] px-5 sm:px-8 lg:px-12 2xl:px-20 py-5">
          <nav aria-label="Breadcrumb" className="text-custom-sm mb-2" style={{ color: "var(--muted)" }}>
            <Link href={href("/")} className="hover:underline hover:text-dark">
              Home
            </Link>{" "}
            /{" "}
            {category ? (
              <>
                <Link href={href("/shop")} className="hover:underline hover:text-dark">
                  Shop
                </Link>{" "}
                / <span className="text-dark font-medium">{category}</span>
              </>
            ) : (
              <span className="text-dark font-medium">Shop</span>
            )}
          </nav>
          <h1 className="text-3xl font-extrabold text-dark sm:text-4xl">{heading}</h1>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1680px] px-5 sm:px-8 lg:px-12 2xl:px-20 py-6">
        {/* Filters toolbar */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          {/* Category + kind pills */}
          <div className="flex flex-1 flex-wrap gap-2">
            {goods.length > 0 && services.length > 0 && (
              <>
                <Link
                  href={href("/shop")}
                  className={catPill(kind === "product")}
                  style={kind === "product" ? { background: "var(--ink)" } : { borderColor: "var(--line)" }}
                >
                  Products
                </Link>
                <Link
                  href={href("/shop?kind=service")}
                  className={catPill(kind === "service")}
                  style={kind === "service" ? { background: "var(--ink)" } : { borderColor: "var(--line)" }}
                >
                  Services
                </Link>
              </>
            )}
            <Link
              href={href(shopBase)}
              className={catPill(!category)}
              style={!category ? { background: "var(--brand)" } : { borderColor: "var(--line)" }}
            >
              All
            </Link>
            {cats.map((c) => (
              <Link
                key={c}
                href={href(
                  `/shop?${kind === "service" ? "kind=service&" : ""}category=${encodeURIComponent(c)}`
                )}
                className={catPill(category === c)}
                style={
                  category === c
                    ? { background: "var(--brand)" }
                    : { borderColor: "var(--line)" }
                }
              >
                {c}
              </Link>
            ))}
          </div>

          {/* Search + sort */}
          <div className="flex w-full gap-2 sm:w-auto">
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search…"
              aria-label="Search products"
              className={`${inputCls} flex-1 sm:w-44`}
              style={{ borderColor: "var(--line)" }}
            />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              aria-label="Sort products"
              className={inputCls}
              style={{ borderColor: "var(--line)" }}
            >
              <option value="featured">Featured</option>
              <option value="latest">Newest</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
            </select>
          </div>
        </div>

        {/* Result count */}
        <p className="mb-4 text-custom-sm" style={{ color: "var(--muted)" }}>
          {list.length}{" "}
          {kind === "service"
            ? list.length === 1
              ? "service"
              : "services"
            : list.length === 1
              ? "product"
              : "products"}
          {category && ` in "${category}"`}
        </p>

        {/* Grid */}
        {list.length === 0 ? (
          <div className="rounded-lg border bg-white py-20 text-center" style={divider}>
            <p className="mb-3 font-semibold text-dark">Nothing matches that search.</p>
            <Link
              href={href(shopBase)}
              className="inline-flex h-11 items-center rounded px-6 font-semibold text-white"
              style={{ background: "var(--brand)" }}
            >
              Clear filters
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {list.map((p) => (
              <BazaarCard key={p.id} item={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
