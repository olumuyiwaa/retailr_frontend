"use client";
import React from "react";
import Link from "next/link";
import StoreProductCard from "./StoreProductCard";
import ProductArt from "./ProductArt";
import CategoryPicture from "./CategoryPicture";
import ProductThumb from "@/components/Common/ProductThumb";
import { useStore } from "@/app/context/StoreContext";
import type { Product } from "@/types/product";

const Container = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`store-container mx-auto w-full px-4 sm:px-8 ${className}`}>{children}</div>
);

const SectionHead = ({ title, href, cta = "View all" }: { title: string; href: string; cta?: string }) => (
  <div className="mb-8 flex items-end justify-between gap-4">
    <h2 className="text-3xl font-bold text-dark sm:text-4xl">{title}</h2>
    <Link href={href} className="shrink-0 pb-1 font-medium text-dark underline decoration-1 underline-offset-[6px] ease-out duration-200 hover:opacity-70">
      {cta}
    </Link>
  </div>
);

function HeroTile({
  item,
  fmt,
  to,
  className,
  fallbackSeed,
  fallbackColor,
}: {
  item?: Product;
  fmt: (n: number) => string;
  to: string;
  className: string;
  fallbackSeed: string;
  fallbackColor: string;
}) {
  const body = (
    <>
      <div className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-[1.04]">
        {item ? <ProductThumb item={item} size={400} /> : <ProductArt seed={fallbackSeed} color={fallbackColor} showInitial={false} />}
      </div>
      {item && (
        <span className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-3 rounded-full bg-white px-4 py-2 text-custom-sm shadow-md">
          <span className="truncate font-medium text-dark">{item.title}</span>
          <span className="font-semibold text-dark">{fmt(item.discountedPrice)}</span>
        </span>
      )}
    </>
  );
  const cls = `group relative block overflow-hidden ${className}`;
  return item ? (
    <Link href={to} className={cls} aria-label={item.title}>
      {body}
    </Link>
  ) : (
    <div className={cls} aria-hidden>
      {body}
    </div>
  );
}

export default function StoreHome() {
  const ctx = useStore();
  if (!ctx?.store) return null;
  const { store, products, categories, href, fmt } = ctx;

  const goods = products.filter((p) => (p.kind ?? "product") === "product");
  const services = products.filter((p) => p.kind === "service");
  const live = goods.filter((p) => p.stock === undefined || p.stock > 0);
  const newest = [...goods].sort((a, b) => +new Date(b.createdAt ?? 0) - +new Date(a.createdAt ?? 0)).slice(0, 8);
  const bestSellers = [...live].filter((p) => (p.sold ?? 0) > 0).sort((a, b) => (b.sold ?? 0) - (a.sold ?? 0)).slice(0, 4);
  const featured = [...bestSellers, ...newest.filter((p) => !bestSellers.includes(p) && (p.stock ?? 1) > 0)].slice(0, 3);
  const topServices = [...services].sort((a, b) => (b.sold ?? 0) - (a.sold ?? 0) || +new Date(b.createdAt ?? 0) - +new Date(a.createdAt ?? 0)).slice(0, 4);

  const catTiles = categories.map((c) => {
    const inCat = products.filter((p) => p.category === c);
    return { name: c, count: inCat.length, color: inCat[0]?.color ?? "#E5E7EB" };
  });

  return (
    <main>
      {/* hero */}
      <section style={{ background: "var(--tint)" }}>
        <Container className="grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:py-20">
          <div>
            <h1 className="text-[clamp(2.6rem,7vw,5.25rem)] font-extrabold leading-[0.95] text-dark">{store.name}</h1>
            <p className="mt-6 max-w-[34rem] text-lg leading-relaxed">
              {store.description || `${store.category} from ${store.city}, ${store.country}.`}
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href={href("/shop")}
                className="inline-flex h-12 items-center rounded-full px-8 font-medium ease-out duration-200 hover:brightness-90"
                style={{ background: "var(--brand)", color: "var(--brand-fg)" }}
              >
                Shop the collection
              </Link>
              {store.phone && (
                <a
                  href={`tel:${store.phone.replace(/\s/g, "")}`}
                  className="inline-flex h-12 items-center rounded-full px-7 font-medium text-dark ring-1 ring-inset ease-out duration-200 hover:bg-white"
                  style={{ ["--tw-ring-color" as string]: "color-mix(in srgb, var(--ink) 30%, transparent)" }}
                >
                  Call {store.phone}
                </a>
              )}
            </div>
          </div>

          <div className="grid h-[400px] grid-cols-[1.1fr_1fr] grid-rows-2 gap-3 sm:h-[500px]" aria-label="Featured products">
            <HeroTile
              fmt={fmt}
              item={featured[0]}
              to={featured[0] ? href(`/product/${featured[0].id}`) : href("/shop")}
              className="row-span-2 rounded-3xl"
              fallbackSeed={`${store.name}-a`}
              fallbackColor={featured[0]?.color ?? "#F4C9A8"}
            />
            <HeroTile
              fmt={fmt}
              item={featured[1]}
              to={featured[1] ? href(`/product/${featured[1].id}`) : href("/shop")}
              className="rounded-3xl"
              fallbackSeed={`${store.name}-b`}
              fallbackColor={featured[1]?.color ?? "#BFD8C8"}
            />
            <HeroTile
              fmt={fmt}
              item={featured[2]}
              to={featured[2] ? href(`/product/${featured[2].id}`) : href("/shop")}
              className="rounded-3xl"
              fallbackSeed={`${store.name}-c`}
              fallbackColor={featured[2]?.color ?? "#C9C6E8"}
            />
          </div>
        </Container>
      </section>

      {/* facts */}
      <Container>
        <dl className="grid gap-y-5 border-b py-8 sm:grid-cols-3" style={{ borderColor: "var(--line)" }}>
          {[
            ["Pay your way", "Cash on delivery or bank transfer"],
            [`Based in ${store.city}`, `Orders ship from ${store.city}, ${store.country}`],
            ["Need help ordering?", store.phone ? `Call or message ${store.phone}` : `Ask ${store.name} directly`],
          ].map(([t, d], i) => (
            <div key={t} className={`sm:px-6 ${i === 0 ? "sm:pl-0" : "sm:border-l"}`} style={{ borderColor: "var(--line)" }}>
              <dt className="font-display font-semibold text-dark">{t}</dt>
              <dd className="mt-0.5 text-custom-sm">{d}</dd>
            </div>
          ))}
        </dl>
      </Container>

      {products.length === 0 ? (
        <section className="py-24 text-center">
          <Container>
            <h2 className="mb-2 text-3xl font-bold text-dark">Products are coming soon</h2>
            <p>{store.name} is still setting up its shop. Check back shortly.</p>
          </Container>
        </section>
      ) : (
        <>
          {catTiles.length > 1 && (
            <section className="pt-16">
              <Container>
                <h2 className="mb-8 text-3xl font-bold text-dark sm:text-4xl">Shop by category</h2>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
                  {catTiles.map((c) => (
                    <Link
                      key={c.name}
                      href={href(`/shop?category=${encodeURIComponent(c.name)}`)}
                      className="group relative block aspect-[5/4] overflow-hidden rounded-2xl"
                    >
                      <div className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-[1.05]">
                        <CategoryPicture name={c.name} />
                      </div>
                      <span className="absolute bottom-3 left-3 rounded-full bg-white px-4 py-1.5 text-custom-sm font-medium text-dark shadow-md">
                        {c.name} <span className="opacity-60">{c.count}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              </Container>
            </section>
          )}

          <section className="pt-16">
            <Container>
              <SectionHead title="New arrivals" href={href("/shop")} />
              <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
                {newest.map((item) => (
                  <StoreProductCard item={item} key={item.id} />
                ))}
              </div>
            </Container>
          </section>

          {topServices.length > 0 && (
            <section className="mt-16">
              <div className="mb-8 flex items-end justify-between gap-4">
                <h2 className="text-3xl font-bold text-dark sm:text-4xl">Services</h2>
                <Link href={href("/shop?kind=service")} className="text-custom-sm font-medium underline-offset-4 hover:underline">
                  View all
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
                {topServices.map((item) => (
                  <StoreProductCard item={item} key={item.id} />
                ))}
              </div>
            </section>
          )}

          {bestSellers.length > 0 && (
            <section className="mt-20 py-16" style={{ background: "var(--tint)" }}>
              <Container>
                <SectionHead title="Customer favourites" href={href("/shop")} />
                <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
                  {bestSellers.map((item) => (
                    <StoreProductCard item={item} key={item.id} />
                  ))}
                </div>
              </Container>
            </section>
          )}
        </>
      )}
    </main>
  );
}
