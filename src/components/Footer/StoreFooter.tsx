"use client";
import React from "react";
import Link from "next/link";
import { useStore } from "@/app/context/StoreContext";

// Footer for a business storefront: a deep brand-ink block with the shop's name
// set large, and only real details (address, phone, categories).
const StoreFooter = () => {
  const ctx = useStore();
  const store = ctx?.store;
  const href = ctx?.href ?? ((p: string) => p);
  const year = new Date().getFullYear();
  if (!store) return null;

  const linkCls = "ease-out duration-200 hover:text-white";

  return (
    <footer className="mt-24 overflow-hidden" style={{ background: "var(--ink)", color: "rgba(255,255,255,.72)" }}>
      <div className="store-container mx-auto px-4 sm:px-8">
        <div className="grid gap-12 pb-12 pt-16 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <p className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">{store.name}</p>
            <p className="mt-4 max-w-[360px]">{store.description || `${store.category} from ${store.city}.`}</p>
          </div>

          <div>
            <h2 className="mb-4 font-display text-base font-semibold text-white">Shop</h2>
            <ul className="flex flex-col gap-2.5">
              <li><Link className={linkCls} href={href("/shop")}>All products</Link></li>
              <li><Link className={linkCls} href={href("/cart")}>Cart</Link></li>
              <li><Link className={linkCls} href={href("/checkout")}>Checkout</Link></li>
            </ul>
          </div>

          <div>
            <h2 className="mb-4 font-display text-base font-semibold text-white">Categories</h2>
            <ul className="flex flex-col gap-2.5">
              {(ctx?.categories ?? []).slice(0, 6).map((c) => (
                <li key={c}>
                  <Link className={linkCls} href={href(`/shop?category=${encodeURIComponent(c)}`)}>{c}</Link>
                </li>
              ))}
              {(ctx?.categories ?? []).length === 0 && <li>{store.category}</li>}
            </ul>
          </div>

          <div>
            <h2 className="mb-4 font-display text-base font-semibold text-white">Find us</h2>
            <ul className="flex flex-col gap-2.5">
              <li>{store.city}, {store.country}</li>
              {store.phone && (
                <li>
                  <a className={linkCls} href={`tel:${store.phone.replace(/\s/g, "")}`}>{store.phone}</a>
                </li>
              )}
              <li>Pay on delivery or by bank transfer</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t py-6 text-custom-sm" style={{ borderColor: "rgba(255,255,255,.14)" }}>
          <p>&copy; {year} {store.name}</p>
          <p>
            Store powered by{" "}
            <Link href="/" className="font-medium text-white hover:underline">Retailr</Link>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default StoreFooter;
