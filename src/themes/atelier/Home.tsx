"use client";
import React from "react";
import Link from "next/link";
import { useStore } from "@/app/context/StoreContext";
import AtelierCard, { Photo } from "./Card";
import CategoryPicture from "@/components/Store/CategoryPicture";
import { whatsappLink } from "./whatsapp";

const Wrap = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`mx-auto w-full max-w-[1260px] px-4 sm:px-8 ${className}`}>{children}</div>
);

export default function AtelierHome() {
  const ctx = useStore();
  if (!ctx?.store) return null;
  const { store, products, categories, href } = ctx;

  const goods = products.filter((p) => (p.kind ?? "product") === "product");
  const services = products.filter((p) => p.kind === "service");
  const newest = [...(goods.length ? goods : products)].sort((a, b) => +new Date(b.createdAt ?? 0) - +new Date(a.createdAt ?? 0));
  const best = goods.filter((p) => (p.sold ?? 0) > 0).sort((a, b) => (b.sold ?? 0) - (a.sold ?? 0)).slice(0, 4);
  const topServices = [...services].sort((a, b) => (b.sold ?? 0) - (a.sold ?? 0) || +new Date(b.createdAt ?? 0) - +new Date(a.createdAt ?? 0)).slice(0, 4);
  const withPhoto = newest.filter((p) => p.imgs?.previews?.length);
  const main = withPhoto[0] ?? newest[0];
  const second = withPhoto[1] ?? newest[1];
  const wa = whatsappLink(store.phone, `Hi ${store.name}, I have a question.`);

  const tiles = categories.slice(0, 3).map((c) => ({ name: c, item: products.find((p) => p.category === c && p.imgs?.previews?.length) ?? products.find((p) => p.category === c) }));

  const btn = "inline-flex h-[52px] items-center rounded-md px-6 font-medium ease-out duration-200";
  const facts = [
    ["Pay your way", "Cash on delivery or bank transfer"],
    [`Ships from ${store.city}`, store.country],
    ["Questions?", store.phone ? `Call ${store.phone}` : `Ask ${store.name}`],
  ];

  return (
    <main>
      <Wrap className="grid items-center gap-12 py-12 sm:py-16 lg:grid-cols-[1fr_1.05fr] lg:gap-16 lg:py-20">
        <div>
          <p className="mb-5 text-custom-sm font-medium" style={{ color: "#9A4A36" }}>{store.category} · {store.city}</p>
          <h1 className="text-[clamp(2.5rem,6vw,4.25rem)] font-bold leading-[1.02] text-dark">{store.name}</h1>
          <p className="mt-6 max-w-[34rem] text-lg leading-relaxed">{store.description || `${store.category} from ${store.city}, ${store.country}.`}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={href("/shop")} className={`${btn} text-white hover:opacity-90`} style={{ background: "var(--ink)" }}>Shop now</Link>
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className={`${btn} border text-dark hover:bg-white`} style={{ borderColor: "var(--line)" }}>
                Ask us on WhatsApp
              </a>
            )}
          </div>
          <dl className="mt-10 grid gap-5 border-t pt-6 sm:grid-cols-3" style={{ borderColor: "var(--line)" }}>
            {facts.map(([t, d]) => (
              <div key={t}>
                <dt className="font-medium text-dark">{t}</dt>
                <dd className="text-custom-sm">{d}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative mx-auto w-full max-w-[560px] pb-10 pl-0 sm:pl-10 lg:max-w-none">
          <Photo item={main} className="aspect-[4/5] w-full rounded-md" />
          {second && (
            <div className="absolute bottom-0 left-0 hidden w-[38%] rounded-md bg-white p-1.5 shadow-lg sm:block">
              <Photo item={second} className="aspect-[4/5] w-full rounded" />
            </div>
          )}
        </div>
      </Wrap>

      {products.length === 0 ? (
        <Wrap className="py-20 text-center">
          <h2 className="mb-2 text-3xl font-bold text-dark">Products are coming soon</h2>
          <p>{store.name} is still setting up its shop. Check back shortly.</p>
        </Wrap>
      ) : (
        <>
          {tiles.length > 0 && (
            <Wrap className="py-12">
              <div className="mb-8 flex items-end justify-between gap-4">
                <h2 className="text-3xl font-bold text-dark">Shop by style</h2>
                <Link href={href("/shop")} className="pb-1 font-medium text-dark underline underline-offset-4">View everything</Link>
              </div>
              <div className="grid gap-5 sm:grid-cols-3">
                {tiles.map((t) => (
                  <Link key={t.name} href={href(`/shop?category=${encodeURIComponent(t.name)}`)} className="group relative block overflow-hidden rounded-md">
                    <div className="relative aspect-[4/5] w-full overflow-hidden bg-[color:var(--tint)] transition-transform duration-500 group-hover:scale-[1.03]"><CategoryPicture name={t.name} /></div>
                    <span className="absolute bottom-3 left-3 rounded bg-white px-3 py-1.5 text-custom-sm font-medium text-dark">{t.name}</span>
                  </Link>
                ))}
              </div>
            </Wrap>
          )}

          <Wrap className="py-12">
            <h2 className="mb-8 text-3xl font-bold text-dark">New in</h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
              {newest.slice(0, 8).map((p) => <AtelierCard key={p.id} item={p} />)}
            </div>
          </Wrap>

          {topServices.length > 0 && (
            <Wrap className="py-12">
              <div className="mb-8 flex items-end justify-between gap-4">
                <h2 className="text-3xl font-bold text-dark">Services</h2>
                <Link href={href("/shop?kind=service")} className="text-custom-sm underline-offset-4 hover:underline">
                  View all
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
                {topServices.map((p) => (
                  <AtelierCard key={p.id} item={p} />
                ))}
              </div>
            </Wrap>
          )}

          {best.length > 0 && (
            <Wrap className="py-12">
              <h2 className="mb-8 text-3xl font-bold text-dark">Most loved</h2>
              <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
                {best.map((p) => <AtelierCard key={p.id} item={p} />)}
              </div>
            </Wrap>
          )}
        </>
      )}
    </main>
  );
}
