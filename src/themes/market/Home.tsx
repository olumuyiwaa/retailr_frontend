"use client";
import React from "react";
import Link from "next/link";
import { useStore } from "@/app/context/StoreContext";
import MarketCard, { ProductPhoto, isNew } from "./Card";
import CategoryPicture from "@/components/Store/CategoryPicture";
import type { Product } from "@/types/product";
import { payPhrase } from "@/lib/paymentCopy";

/* ─────────────────────────────── Layout helpers ─────────────────────── */

const Wrap = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`mx-auto w-full max-w-[1680px] px-5 sm:px-8 lg:px-12 2xl:px-20 ${className}`}>
    {children}
  </div>
);

function SectionHeading({
  title,
  linkHref,
  label = "See all",
}: {
  title: string;
  linkHref?: string;
  label?: string;
}) {
  return (
    <div className="mb-5 flex items-center justify-between gap-4">
      <h2
        className="text-xl font-extrabold text-dark sm:text-2xl"
        style={{ letterSpacing: "-0.02em" }}
      >
        {title}
      </h2>
      {linkHref && (
        <Link
          href={linkHref}
          className="flex shrink-0 items-center gap-1 text-custom-sm font-bold transition-opacity hover:opacity-80"
          style={{ color: "var(--brand)" }}
        >
          {label}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      )}
    </div>
  );
}

/* ─────────────────────────────── Trust icons ─────────────────────────── */

function IconShield() {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}
function IconTruck() {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
    </svg>
  );
}
function IconPhone() {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}
function IconReturn() {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 2 2 2-2 2 2 2-2 4 2z" />
    </svg>
  );
}

/* ─────────────────────────── Hero product showcase ──────────────────── */

function HeroShowcase({ items, href: hrefFn }: { items: Product[]; href: (p: string) => string }) {
  // Up to 4 products in a 2×2 grid, or a single portrait if only 1
  const picks = items.slice(0, 4);
  if (picks.length === 0) return null;

  if (picks.length === 1) {
    return (
      <Link href={hrefFn(`/product/${picks[0].id}`)} className="group block overflow-hidden rounded-xl">
        <ProductPhoto item={picks[0]} className="aspect-[4/3] w-full" />
      </Link>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3">
      {picks.map((p, i) => (
        <Link
          key={p.id}
          href={hrefFn(`/product/${p.id}`)}
          className="group relative block overflow-hidden rounded-lg"
        >
          <ProductPhoto item={p} className="aspect-square w-full" />
          {/* Product title chip */}
          <div className="absolute inset-x-0 bottom-0 translate-y-full bg-dark/80 px-2.5 py-2 text-2xs font-semibold text-white transition-transform duration-200 group-focus-visible:translate-y-0 group-hover:translate-y-0">
            {p.title}
          </div>
          {i === 0 && isNew(p) && (
            <span
              className="absolute left-2 top-2 rounded px-2 py-0.5 text-2xs font-bold text-white"
              style={{ background: "var(--brand)" }}
            >
              NEW
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}

/* ─────────────────────────── Deal spotlight ─────────────────────────── */

function DealSpotlight({ item, href: hrefFn, fmt }: { item: Product; href: (p: string) => string; fmt: (n: number) => string }) {
  const hasOriginal = item.price !== undefined && item.price > item.discountedPrice;
  const discount = hasOriginal
    ? Math.round(((item.price! - item.discountedPrice) / item.price!) * 100)
    : 0;
  const photos = item.imgs?.previews ?? [];

  return (
    <Link
      href={hrefFn(`/product/${item.id}`)}
      className="group flex overflow-hidden rounded-xl border bg-white transition-shadow hover:shadow-lg"
      style={{ borderColor: "var(--line)" }}
    >
      {/* Image */}
      <div className="relative w-40 shrink-0 overflow-hidden sm:w-56">
        <div className="absolute inset-0">
          <ProductPhoto item={item} alt="" className="h-full w-full" />
        </div>
        {hasOriginal && (
          <span
            className="absolute left-2 top-2 rounded px-2 py-0.5 text-custom-sm font-extrabold text-white"
            style={{ background: "var(--brand)" }}
          >
            -{discount}%
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col justify-center gap-2 p-5">
        {item.category && (
          <p
            className="text-2xs font-bold uppercase tracking-widest"
            style={{ color: "var(--brand)" }}
          >
            {item.category}
          </p>
        )}
        <h3 className="text-xl font-extrabold leading-snug text-dark group-hover:underline underline-offset-2 sm:text-2xl">
          {item.title}
        </h3>
        {item.description && (
          <p className="line-clamp-2 text-custom-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            {item.description}
          </p>
        )}
        <div className="mt-1 flex flex-wrap items-baseline gap-3">
          <span className="text-2xl font-extrabold text-dark">{fmt(item.discountedPrice)}</span>
          {hasOriginal && (
            <span className="text-base line-through" style={{ color: "var(--muted)" }}>
              {fmt(item.price!)}
            </span>
          )}
        </div>
        <span
          className="mt-1 inline-flex h-10 w-fit items-center rounded px-5 text-custom-sm font-bold text-white transition-opacity group-hover:opacity-90"
          style={{ background: "var(--brand)" }}
        >
          Shop Now
        </span>
      </div>
    </Link>
  );
}

/* ─────────────────────────── Category tile ──────────────────────────── */

function CategoryTile({ name, href: hrefFn }: { name: string; href: (p: string) => string }) {
  return (
    <Link
      href={hrefFn(`/shop?category=${encodeURIComponent(name)}`)}
      className="group relative block overflow-hidden rounded-xl bg-white"
      style={{ border: "1px solid var(--line)" }}
    >
      {/* Image — CategoryPicture needs relative overflow-hidden parent + aspect */}
      <div className="relative aspect-[4/3] overflow-hidden" style={{ background: "var(--tint)" }}>
        <CategoryPicture name={name} />
        {/* Overlay on hover */}
        <div
          className="absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          style={{ background: "color-mix(in srgb, var(--ink) 45%, transparent)" }}
          aria-hidden="true"
        />
      </div>
      {/* Label */}
      <div className="px-3 py-2.5">
        <span className="text-custom-sm font-bold text-dark group-hover:underline underline-offset-2 line-clamp-1">
          {name}
        </span>
      </div>
    </Link>
  );
}

/* ─────────────────────────── Horizontal scroll row ─────────────────── */

function ScrollRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-4 sm:-mx-6">
      <div className="flex gap-3 overflow-x-auto px-4 pb-2 sm:px-6 [&>*]:shrink-0 [&>*]:w-[calc(50%-6px)] sm:[&>*]:w-[calc(33.333%-8px)] lg:[&>*]:w-[calc(25%-9px)]">
        {children}
      </div>
    </div>
  );
}

/* ─────────────────────────── Main component ─────────────────────────── */

export default function MarketHome() {
  const ctx = useStore();
  if (!ctx?.store) return null;
  const { store, products, categories, href, fmt } = ctx;

  /* ── Data cuts ── */
  const goods = products.filter((p) => (p.kind ?? "product") === "product");
  const services = products.filter((p) => p.kind === "service");

  const withPhoto = [...(goods.length ? goods : products)].filter(
    (p) => p.imgs?.previews?.length
  );

  const newest = [...(goods.length ? goods : products)].sort(
    (a, b) => +new Date(b.createdAt ?? 0) - +new Date(a.createdAt ?? 0)
  );

  const best = goods
    .filter((p) => (p.sold ?? 0) > 0)
    .sort((a, b) => (b.sold ?? 0) - (a.sold ?? 0))
    .slice(0, 8);

  const onSale = goods
    .filter((p) => p.price !== undefined && p.price > p.discountedPrice)
    .sort(
      (a, b) =>
        (b.price! - b.discountedPrice) / b.price! -
        (a.price! - a.discountedPrice) / a.price!
    );

  const topServices = [...services]
    .sort(
      (a, b) =>
        (b.sold ?? 0) - (a.sold ?? 0) ||
        +new Date(b.createdAt ?? 0) - +new Date(a.createdAt ?? 0)
    )
    .slice(0, 4);

  // Hero showcase: prefer products with photos
  const heroShowcase = withPhoto.slice(0, 4).length >= 2
    ? withPhoto.slice(0, 4)
    : newest.slice(0, 4);

  // Deal spotlight: best discounted item with a photo and description
  const spotlight =
    onSale.find((p) => p.imgs?.previews?.length && p.description) ??
    onSale[0] ??
    (goods.length ? goods.find((p) => p.imgs?.previews?.length) ?? goods[0] : null);

  const newArrivals = newest.slice(0, 8);
  const featuredCats = categories.slice(0, 8);

  /* ── Trust bar items ── */
  const trustItems: [React.ReactNode, string, string][] = [
    [<IconShield key="s" />, "Secure Checkout", "Pay safely every time"],
    [<IconTruck key="t" />, store.city ? `Ships from ${store.city}` : "Delivery available", store.country || "Ask us for details"],
    [<IconPhone key="p" />, "We're here to help", store.phone || "Contact us anytime"],
    [<IconReturn key="r" />, "Flexible payment", payPhrase(store.paymentMethods, "cash")],
  ];

  return (
    <main style={{ background: "var(--wash)" }}>

      {/* ═══════════════════════════════ HERO ════════════════════════════ */}
      <section style={{ background: "var(--ink)" }} className="pb-10 pt-8 sm:pb-14 sm:pt-12">
        <Wrap className="grid items-center gap-8 lg:grid-cols-[1fr_520px] lg:gap-12">

          {/* Left: copy */}
          <div className="order-2 lg:order-1">
            {store.category && (
              <span
                className="mb-4 inline-block rounded px-3 py-1 text-2xs font-extrabold uppercase tracking-widest text-white"
                style={{ background: "var(--brand)" }}
              >
                {store.category}
              </span>
            )}
            <h1
              className="text-[clamp(2.25rem,5.5vw,4rem)] font-extrabold leading-[1.0] text-white"
              style={{ letterSpacing: "-0.03em" }}
            >
              {store.name}
            </h1>
            <p className="mt-5 max-w-[38rem] text-lg leading-relaxed text-white/70">
              {store.description ||
                `${[store.category, [store.city, store.country].filter(Boolean).join(", ")].filter(Boolean).join(" from ")}. Browse our full catalogue below.`}
            </p>

            {/* CTA row */}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={href("/shop")}
                className="inline-flex h-12 items-center rounded px-8 text-base font-extrabold text-white transition-opacity hover:opacity-90"
                style={{ background: "var(--brand)" }}
              >
                Shop Now
              </Link>
              {categories.length > 0 && (
                <Link
                  href={href(`/shop?category=${encodeURIComponent(categories[0])}`)}
                  className="inline-flex h-12 items-center rounded border px-6 text-base font-semibold text-white/90 transition-colors hover:bg-white/10"
                  style={{ borderColor: "rgba(255,255,255,.3)" }}
                >
                  {categories[0]}
                </Link>
              )}
            </div>

            {/* Mini stats row */}
            <div className="mt-10 flex flex-wrap gap-8 border-t pt-6" style={{ borderColor: "rgba(255,255,255,.12)" }}>
              {[
                [String(goods.length), "Products"],
                ...(services.length ? [[String(services.length), "Services"]] : []),
                [String(categories.length), "Categories"],
                ...(store.city ? [[store.city, store.country]] : []),
              ].map(([val, label]) => (
                <div key={label || val}>
                  <p className="text-2xl font-extrabold text-white">{val}</p>
                  <p className="text-custom-sm text-white/60">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: product showcase grid */}
          <div className="order-1 lg:order-2">
            <HeroShowcase items={heroShowcase} href={href} />
          </div>
        </Wrap>
      </section>

      {/* ═══════════════════════════ TRUST BAR ═══════════════════════════ */}
      <div className="bg-white shadow-sm">
        <Wrap>
          <ul className="grid grid-cols-2 divide-x divide-y divide-[color:var(--line)] lg:grid-cols-4 lg:divide-y-0">
            {trustItems.map(([icon, title, sub]) => (
              <li
                key={title}
                className="flex items-center gap-3 px-5 py-4"
              >
                <span style={{ color: "var(--brand)" }}>{icon}</span>
                <div>
                  <p className="text-custom-sm font-bold text-dark">{title}</p>
                  <p className="text-2xs" style={{ color: "var(--muted)" }}>{sub}</p>
                </div>
              </li>
            ))}
          </ul>
        </Wrap>
      </div>

      {products.length === 0 ? (
        /* ═══════════════════════ EMPTY STATE ══════════════════════════ */
        <Wrap className="py-28 text-center">
          <div
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full"
            style={{ background: "var(--tint)" }}
          >
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4} style={{ color: "var(--muted)" }} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h2 className="mb-2 text-3xl font-extrabold text-dark">Products coming soon</h2>
          <p className="mx-auto max-w-sm text-lg" style={{ color: "var(--muted)" }}>
            {store.name} is setting up shop. Check back shortly.
          </p>
        </Wrap>
      ) : (
        <>
          {/* ═══════════════════════ SHOP BY CATEGORY ════════════════════ */}
          {featuredCats.length > 0 && (
            <Wrap className="pb-4 pt-10">
              <SectionHeading title="Shop by Category" linkHref={href("/shop")} label="Browse all" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8">
                {featuredCats.map((c) => (
                  <CategoryTile key={c} name={c} href={href} />
                ))}
              </div>
            </Wrap>
          )}

          {/* ═══════════════════════ NEW ARRIVALS ════════════════════════ */}
          {newArrivals.length > 0 && (
            <Wrap className="pt-10">
              <SectionHeading title="New Arrivals" linkHref={href("/shop")} label="View all" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {newArrivals.slice(0, 4).map((p) => (
                  <MarketCard key={p.id} item={p} />
                ))}
              </div>
            </Wrap>
          )}

          {/* ═══════════════════════ PROMO BANNER ════════════════════════ */}
          <div className="mt-10" style={{ background: "var(--brand)" }}>
            <Wrap className="py-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xl font-extrabold text-white sm:text-2xl">
                    Explore the full catalogue
                  </p>
                  <p className="mt-1 text-white">
                    {products.length} item{products.length === 1 ? "" : "s"}{store.city ? ` from ${store.city}` : ""}
                  </p>
                </div>
                <Link
                  href={href("/shop")}
                  className="inline-flex h-11 shrink-0 items-center rounded border-2 border-white px-7 font-extrabold text-white transition-colors hover:bg-white hover:text-dark"
                >
                  Shop All
                </Link>
              </div>
            </Wrap>
          </div>

          {/* ═══════════════════════ BEST SELLERS ════════════════════════ */}
          {best.length > 0 && (
            <Wrap className="pt-10">
              <SectionHeading title="Best Sellers" linkHref={href("/shop")} label="Shop all" />
              {/* Scrollable on mobile, grid on desktop */}
              <div className="hidden grid-cols-4 gap-3 lg:grid">
                {best.slice(0, 8).map((p) => (
                  <MarketCard key={p.id} item={p} />
                ))}
              </div>
              <div className="lg:hidden">
                <ScrollRow>
                  {best.slice(0, 8).map((p) => (
                    <MarketCard key={p.id} item={p} />
                  ))}
                </ScrollRow>
              </div>
            </Wrap>
          )}

          {/* ═══════════════════════ DEAL SPOTLIGHT ═════════════════════ */}
          {spotlight && (
            <Wrap className="pt-10">
              <SectionHeading
                title={onSale.length > 0 ? "Deal of the Day" : "Featured Product"}
                linkHref={href(`/product/${spotlight.id}`)}
                label="View product"
              />
              <DealSpotlight item={spotlight} href={href} fmt={fmt} />
            </Wrap>
          )}

          {/* ═══════════════════════ MORE ARRIVALS (row 2) ═══════════════ */}
          {newArrivals.length > 4 && (
            <Wrap className="pt-10">
              <SectionHeading title="More to Explore" linkHref={href("/shop")} label="View all" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {newArrivals.slice(4, 8).map((p) => (
                  <MarketCard key={p.id} item={p} />
                ))}
              </div>
            </Wrap>
          )}

          {/* ═══════════════════════ SERVICES ════════════════════════════ */}
          {topServices.length > 0 && (
            <Wrap className="pt-10">
              <SectionHeading
                title="Our Services"
                linkHref={href("/shop?kind=service")}
                label="See all services"
              />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {topServices.map((p) => (
                  <MarketCard key={p.id} item={p} />
                ))}
              </div>
            </Wrap>
          )}

          {/* ═══════════════════════ BOTTOM CTA ══════════════════════════ */}
          <div className="mt-14 border-t" style={{ borderColor: "var(--line)", background: "var(--tint)" }}>
            <Wrap className="py-14 text-center">
              <h2 className="text-2xl font-extrabold text-dark sm:text-3xl">
                Everything {store.name} sells, in one place
              </h2>
              <p className="mx-auto mt-3 max-w-md text-lg" style={{ color: "var(--muted)" }}>
                {products.length} item{products.length === 1 ? "" : "s"} across {categories.length} categor{categories.length === 1 ? "y" : "ies"}.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Link
                  href={href("/shop")}
                  className="inline-flex h-12 items-center rounded px-10 font-extrabold text-white transition-opacity hover:opacity-90"
                  style={{ background: "var(--brand)" }}
                >
                  View Full Catalogue
                </Link>
                <Link
                  href={href("/cart")}
                  className="inline-flex h-12 items-center rounded border px-8 font-semibold text-dark transition-colors hover:bg-dark hover:text-white"
                  style={{ borderColor: "var(--line)" }}
                >
                  View Cart
                </Link>
              </div>
            </Wrap>
          </div>
        </>
      )}
    </main>
  );
}
