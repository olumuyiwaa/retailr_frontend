"use client";
import React from "react";
import Link from "next/link";
import ProductItem from "@/components/Common/ProductItem";
import ProductThumb from "@/components/Common/ProductThumb";
import CategoryPicture from "@/components/Store/CategoryPicture";
import { useStore } from "@/app/context/StoreContext";

const Wrap = ({ children }: { children: React.ReactNode }) => <div className="store-container mx-auto w-full px-4 sm:px-8">{children}</div>;

export default function ShowcaseHome() {
  const ctx = useStore();
  if (!ctx?.store) return null;
  const { store, products, categories, href, fmt } = ctx;

  const goods = products.filter((p) => (p.kind ?? "product") === "product");
  const services = products.filter((p) => p.kind === "service");
  const live = goods.filter((p) => p.stock === undefined || p.stock > 0);
  const newest = [...goods].sort((a, b) => +new Date(b.createdAt ?? 0) - +new Date(a.createdAt ?? 0));
  const best = [...live].filter((p) => (p.sold ?? 0) > 0).sort((a, b) => (b.sold ?? 0) - (a.sold ?? 0)).slice(0, 6);
  const topServices = [...services].sort((a, b) => (b.sold ?? 0) - (a.sold ?? 0) || +new Date(b.createdAt ?? 0) - +new Date(a.createdAt ?? 0)).slice(0, 4);
  // spotlight tiles: best sellers first, then in-stock newest, then services; never the same item twice
  const spot = [...best, ...newest.filter((p) => (p.stock ?? 1) > 0), ...topServices]
    .filter((p, i, a) => a.findIndex((x) => x.id === p.id) === i)
    .slice(0, 2);

  return (
    <main>
      <section className="bg-[color:var(--tint)] py-8 sm:py-10">
        <Wrap>
          <div className="flex flex-wrap gap-5">
            <div className="relative w-full overflow-hidden rounded-[10px] bg-white xl:max-w-[800px] xl:flex-1">
              <div className="flex flex-col justify-center px-6 py-12 sm:px-12 sm:py-16">
                {store.category && <span className="mb-3 text-custom-sm font-medium text-blue">{store.category}</span>}
                <h1 className="max-w-[520px] text-heading-3 font-bold text-dark sm:text-heading-2">{store.name}</h1>
                <p className="mt-4 max-w-[460px] text-dark-3">{store.description || `Shop ${(store.category || "everything").toLowerCase()} from ${store.city}, ${store.country}.`}</p>
                <Link href={href("/shop")} className="mt-8 inline-flex w-fit rounded-md bg-dark px-9 py-3 font-medium text-white ease-out duration-200 hover:bg-blue">
                  Shop now
                </Link>
              </div>
            </div>
            <div className="flex w-full flex-col gap-5 sm:flex-row xl:w-[400px] xl:flex-col">
              {spot.map((p) => (
                <Link key={p.id} href={href(`/product/${p.id}`)} className="flex flex-1 items-center justify-between gap-4 rounded-[10px] bg-white p-5">
                  <span>
                    <span className="block max-w-[150px] text-lg font-semibold text-dark">{p.title}</span>
                    <span className="mt-3 block text-heading-6 font-medium text-red">{fmt(p.discountedPrice)}</span>
                  </span>
                  <span className="block h-[110px] w-[110px] shrink-0 overflow-hidden rounded-md">
                    <ProductThumb item={p} size={200} />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </Wrap>
      </section>

      {products.length === 0 ? (
        <section className="py-24 text-center">
          <Wrap>
            <h2 className="mb-2 text-heading-5 font-bold text-dark">Products are coming soon</h2>
            <p>{store.name} is still setting up its shop. Check back shortly.</p>
          </Wrap>
        </section>
      ) : (
        <>
          {categories.length > 0 && (
            <section className="pt-14">
              <Wrap>
                <h2 className="mb-7 text-xl font-semibold text-dark xl:text-heading-5">Browse by category</h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                  {categories.map((c) => (
                    <Link key={c} href={href(`/shop?category=${encodeURIComponent(c)}`)} className="group flex flex-col items-center text-center">
                      <span className="relative mb-3 block h-28 w-28 overflow-hidden rounded-full bg-[color:var(--wash)]">
                        <CategoryPicture name={c} />
                      </span>
                      <span className="font-medium text-dark ease-out duration-200 group-hover:text-blue">{c}</span>
                    </Link>
                  ))}
                </div>
              </Wrap>
            </section>
          )}

          {newest.length > 0 && (
          <section className="py-14">
            <Wrap>
              <div className="mb-7 flex items-end justify-between">
                <h2 className="text-xl font-semibold text-dark xl:text-heading-5">New arrivals</h2>
                <Link href={href("/shop")} className="rounded-lg border border-gray-3 bg-gray-1 px-6 py-2 text-custom-sm font-medium text-dark ease-out duration-200 hover:bg-dark hover:text-white">
                  View all
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-x-7.5 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
                {newest.slice(0, 8).map((p) => <ProductItem item={p} key={p.id} />)}
              </div>
            </Wrap>
          </section>
          )}

          {topServices.length > 0 && (
            <section className={newest.length > 0 ? "mt-12" : "pt-14"}>
              <Wrap>
                <div className="mb-6 flex items-end justify-between gap-4">
                  <h2 className="text-xl font-semibold text-dark xl:text-heading-5">Services</h2>
                  <Link href={href("/shop?kind=service")} className="text-custom-sm text-blue">
                    View all
                  </Link>
                </div>
                <div className="grid grid-cols-1 gap-x-7.5 gap-y-9 sm:grid-cols-2 xl:grid-cols-4">
                  {topServices.map((p) => (
                    <ProductItem item={p} key={p.id} />
                  ))}
                </div>
              </Wrap>
            </section>
          )}

          {best.length > 0 && (
            <section className="pb-16 pt-2">
              <Wrap>
                <h2 className="mb-7 text-xl font-semibold text-dark xl:text-heading-5">Best sellers</h2>
                <div className="grid grid-cols-1 gap-x-7.5 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
                  {best.map((p) => <ProductItem item={p} key={p.id} />)}
                </div>
              </Wrap>
            </section>
          )}
        </>
      )}
    </main>
  );
}
