"use client";
import React from "react";
import Link from "next/link";
import { useStore } from "@/app/context/StoreContext";
import ShopCard, { ShopPhoto } from "./Card";
import CategoryPicture from "@/components/Store/CategoryPicture";

const Wrap = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`mx-auto w-full max-w-[1680px] px-5 sm:px-8 lg:px-12 2xl:px-20 ${className}`}>{children}</div>
);

const SectionHeader = ({ title, href, linkLabel = "See all" }: { title: string; href: string; linkLabel?: string }) => (
  <div className="mb-5 flex items-center justify-between gap-4">
    <h2 className="text-xl font-bold text-dark sm:text-2xl">{title}</h2>
    <Link
      href={href}
      className="flex items-center gap-1 text-custom-sm font-medium text-dark transition-opacity hover:opacity-70"
    >
      {linkLabel}
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="m9 18 6-6-6-6" />
      </svg>
    </Link>
  </div>
);

export default function ShopHome() {
  const ctx = useStore();
  if (!ctx?.store) return null;
  const { store, products, categories, href } = ctx;

  const goods = products.filter((p) => (p.kind ?? "product") === "product");
  const services = products.filter((p) => p.kind === "service");
  const newest = [...goods].sort((a, b) => +new Date(b.createdAt ?? 0) - +new Date(a.createdAt ?? 0));
  const topRated = goods.filter((p) => (p.sold ?? 0) > 0).sort((a, b) => (b.sold ?? 0) - (a.sold ?? 0)).slice(0, 8);
  const topServices = [...services].sort((a, b) => (b.sold ?? 0) - (a.sold ?? 0)).slice(0, 4);
  const featured = newest[0];

  const catTiles = categories.slice(0, 6).map((c) => ({
    name: c,
    item: products.find((p) => p.category === c && p.imgs?.previews?.length) ?? products.find((p) => p.category === c),
  }));

  return (
    <main>
      {/* Hero — bold magazine-style */}
      {featured ? (
        <Wrap className="py-6 sm:py-8">
          <Link
            href={href(`/product/${featured.id}`)}
            className="group relative block overflow-hidden rounded-2xl bg-[color:var(--tint)]"
          >
            {featured.imgs?.previews?.[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={featured.imgs.previews[0]}
                alt={featured.title}
                className="h-[300px] w-full object-cover sm:h-[420px] lg:h-[500px]"
              />
            ) : (
              <div className="h-[300px] sm:h-[420px] lg:h-[500px] flex items-center justify-center">
                <p className="text-4xl font-extrabold text-dark sm:text-6xl lg:text-8xl">{store.name}</p>
              </div>
            )}
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 p-6 sm:p-8">
              <p className="text-custom-sm font-medium text-white/80">{store.category}</p>
              <h1 className="mt-1 text-2xl font-extrabold text-white sm:text-4xl">{store.name}</h1>
              <p className="mt-1 max-w-md text-sm text-white/80 line-clamp-2">
                {store.description || `Shop ${store.category} from ${store.city}`}
              </p>
              <span className="mt-4 inline-flex h-10 items-center rounded-full bg-white px-5 text-custom-sm font-semibold text-dark transition-opacity group-hover:opacity-90">
                Shop now
              </span>
            </div>
          </Link>
        </Wrap>
      ) : (
        <Wrap className="py-12 text-center">
          <h1 className="mb-2 text-4xl font-extrabold text-dark">{store.name}</h1>
          <p className="mb-5 text-lg">{store.description || `${store.category} · ${store.city}`}</p>
          <Link
            href={href("/shop")}
            className="inline-flex h-11 items-center rounded-full bg-dark px-7 font-semibold text-white"
          >
            Browse the store
          </Link>
        </Wrap>
      )}

      {products.length === 0 && (
        <Wrap className="py-16 text-center">
          <h2 className="mb-2 text-3xl font-bold text-dark">Coming soon</h2>
          <p>{store.name} is setting up. Check back shortly.</p>
        </Wrap>
      )}

      {/* Category tiles */}
      {catTiles.length > 0 && (
        <Wrap className="py-8">
          <SectionHeader title="Shop by category" href={href("/shop")} />
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {catTiles.map((t) => (
              <Link
                key={t.name}
                href={href(`/shop?category=${encodeURIComponent(t.name)}`)}
                className="group flex flex-col items-center gap-2"
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-[color:var(--tint)] transition-transform duration-300 group-hover:scale-[1.03]">
                  <CategoryPicture name={t.name} />
                </div>
                <span className="text-center text-custom-sm font-medium text-dark leading-tight">{t.name}</span>
              </Link>
            ))}
          </div>
        </Wrap>
      )}

      {/* Top rated */}
      {topRated.length > 0 && (
        <Wrap className="py-8">
          <SectionHeader title="Top rated" href={href("/shop")} />
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-4 lg:grid-cols-5">
            {topRated.map((p) => (
              <ShopCard key={p.id} item={p} />
            ))}
          </div>
        </Wrap>
      )}

      {/* What's new */}
      {newest.length > 0 && (
        <Wrap className="py-8">
          <SectionHeader title="What's new" href={href("/shop")} />
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-4 lg:grid-cols-5">
            {newest.slice(0, 10).map((p) => (
              <ShopCard key={p.id} item={p} />
            ))}
          </div>
        </Wrap>
      )}

      {/* Services */}
      {topServices.length > 0 && (
        <Wrap className="py-8">
          <SectionHeader title="Services" href={href("/shop?kind=service")} />
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-4">
            {topServices.map((p) => (
              <ShopCard key={p.id} item={p} />
            ))}
          </div>
        </Wrap>
      )}

      {/* Spacer for mobile bottom nav */}
      <div className="h-20 sm:h-8" />
    </main>
  );
}
