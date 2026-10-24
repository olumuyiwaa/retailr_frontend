"use client";
import React from "react";
import Link from "next/link";
import { useStore } from "@/app/context/StoreContext";
import BazaarCard, { ProductPhoto, isNew } from "./Card";
import CategoryPicture from "@/components/Store/CategoryPicture";
import { payPhrase } from "@/lib/paymentCopy";

const Wrap = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`mx-auto w-full max-w-[1680px] px-5 sm:px-8 lg:px-12 2xl:px-20 ${className}`}>{children}</div>
);

export default function BazaarHome() {
  const ctx = useStore();
  if (!ctx?.store) return null;
  const { store, products, categories, href, fmt } = ctx;

  const list = products ?? [];
  const goods = list.filter((p) => (p.kind ?? "product") === "product");
  const services = list.filter((p) => p.kind === "service");
  const catalog = goods.length ? goods : list;
  const newest = [...catalog].filter(isNew).slice(0, 8);
  const featured = catalog.slice(0, 12);
  const deal = catalog.find((p) => p.price !== undefined && p.price > p.discountedPrice) ?? catalog[0];
  const sidePicks = catalog.filter((p) => p.id !== deal?.id).slice(0, 4);

  return (
    <div style={{ background: "var(--wash)" }}>
      {/* Hero strip */}
      <section className="border-b bg-white" style={{ borderColor: "var(--line)" }}>
        <Wrap className="grid gap-4 py-5 lg:grid-cols-[220px_1fr] lg:py-6">
          {/* Category sidebar — 1688 signature */}
          <aside className="hidden rounded border bg-white lg:block" style={{ borderColor: "var(--line)" }}>
            <p className="border-b px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-dark" style={{ borderColor: "var(--line)", background: "var(--tint)" }}>
              Categories
            </p>
            <ul className="max-h-[340px] overflow-y-auto py-1">
              <li>
                <Link href={href("/shop")} className="flex items-center justify-between px-3 py-2 text-sm text-dark hover:bg-[var(--tint)]">
                  All products
                  <span className="text-[11px]" style={{ color: "var(--muted)" }}>{goods.length || list.length}</span>
                </Link>
              </li>
              {categories.map((c) => {
                const n = catalog.filter((p) => p.category === c).length;
                return (
                  <li key={c}>
                    <Link
                      href={href(`/shop?category=${encodeURIComponent(c)}`)}
                      className="flex items-center justify-between px-3 py-2 text-sm text-dark hover:bg-[var(--tint)]"
                    >
                      <span className="truncate">{c}</span>
                      <span className="text-[11px]" style={{ color: "var(--muted)" }}>{n}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </aside>

          {/* Promo / deal mosaic */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {deal && (
              <Link
                href={href(`/product/${deal.id}`)}
                className="group relative col-span-1 overflow-hidden rounded border bg-white sm:col-span-2 lg:row-span-2"
                style={{ borderColor: "var(--line)", minHeight: 220 }}
              >
                <div className="absolute inset-0">
                  <ProductPhoto item={deal} alt="" className="h-full w-full" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-white">Featured deal</p>
                  <p className="mt-1 text-lg font-extrabold leading-snug sm:text-xl">{deal.title}</p>
                  <p className="mt-1 text-base font-bold" style={{ color: "var(--brand-fg)", opacity: 0.85 }}>
                    {fmt(deal.discountedPrice)}
                  </p>
                </div>
              </Link>
            )}
            {sidePicks.map((p) => (
              <Link
                key={p.id}
                href={href(`/product/${p.id}`)}
                className="group flex gap-3 overflow-hidden rounded border bg-white p-2 transition-shadow hover:shadow-md"
                style={{ borderColor: "var(--line)" }}
              >
                <ProductPhoto item={p} alt="" className="h-20 w-20 shrink-0 rounded" />
                <div className="min-w-0 flex-1 py-0.5">
                  <p className="line-clamp-2 text-sm font-medium text-dark group-hover:underline">{p.title}</p>
                  <p className="mt-1 text-sm font-extrabold" style={{ color: "var(--brand)" }}>
                    {fmt(p.discountedPrice)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </Wrap>
      </section>

      {/* Category chips (mobile + quick jump) */}
      {categories.length > 0 && (
        <section className="border-b bg-white lg:hidden" style={{ borderColor: "var(--line)" }}>
          <Wrap className="flex gap-2 overflow-x-auto py-3">
            {categories.map((c) => (
              <Link
                key={c}
                href={href(`/shop?category=${encodeURIComponent(c)}`)}
                className="flex min-h-11 shrink-0 items-center gap-2 rounded border bg-white px-3 py-1.5 text-xs font-medium"
                style={{ borderColor: "var(--line)" }}
              >
                <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded" aria-hidden>
                  <CategoryPicture name={c} />
                </span>
                {c}
              </Link>
            ))}
          </Wrap>
        </section>
      )}

      {/* Dense product grid */}
      <section className="py-6 sm:py-8">
        <Wrap>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-extrabold text-dark sm:text-xl">Sourcing picks</h2>
            <Link href={href("/shop")} className="text-sm font-semibold" style={{ color: "var(--brand)" }}>
              View all →
            </Link>
          </div>
          {featured.length === 0 ? (
            <p className="rounded border bg-white p-8 text-center text-sm" style={{ borderColor: "var(--line)", color: "var(--muted)" }}>
              Products are coming soon.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {featured.map((p) => (
                <BazaarCard key={p.id} item={p} />
              ))}
            </div>
          )}
        </Wrap>
      </section>

      {newest.length > 0 && (
        <section className="pb-8">
          <Wrap>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-extrabold text-dark sm:text-xl">New arrivals</h2>
              <Link href={href("/shop")} className="text-sm font-semibold" style={{ color: "var(--brand)" }}>
                See more →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {newest.map((p) => (
                <BazaarCard key={p.id} item={p} />
              ))}
            </div>
          </Wrap>
        </section>
      )}

      {services.length > 0 && (
        <section className="border-t bg-white py-8" style={{ borderColor: "var(--line)" }}>
          <Wrap>
            <h2 className="mb-4 text-lg font-extrabold text-dark sm:text-xl">Services</h2>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {services.slice(0, 10).map((p) => (
                <BazaarCard key={p.id} item={p} />
              ))}
            </div>
          </Wrap>
        </section>
      )}
    </div>
  );
}
