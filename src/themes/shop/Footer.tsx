"use client";
import React from "react";
import Link from "next/link";
import { useStore } from "@/app/context/StoreContext";

export default function ShopFooter() {
  const ctx = useStore();
  if (!ctx?.store) return null;
  const { store, categories, href } = ctx;

  const col = "ease-out duration-200 hover:text-dark transition-colors";

  return (
    <footer className="border-t mt-16" style={{ borderColor: "var(--line)", background: "var(--tint)" }}>
      <div className="mx-auto w-full max-w-[1680px] px-5 sm:px-8 lg:px-12 2xl:px-20">
        <div className="grid gap-10 pb-12 pt-12 md:grid-cols-[1.5fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <p className="text-xl font-bold text-dark">{store.name}</p>
            <p className="mt-3 max-w-[360px] text-custom-sm leading-relaxed" style={{ color: "var(--muted)" }}>
              {store.description || `${store.category} from ${store.city}, ${store.country}.`}
            </p>
            {store.phone && (
              <a href={`tel:${store.phone.replace(/\s/g, "")}`} className="mt-4 inline-block text-custom-sm font-medium text-dark hover:underline underline-offset-4">
                {store.phone}
              </a>
            )}
          </div>

          {/* Shop links */}
          <div>
            <h2 className="mb-4 text-custom-sm font-bold uppercase tracking-wider text-dark">Shop</h2>
            <ul className="flex flex-col gap-2.5 text-custom-sm" style={{ color: "var(--muted)" }}>
              <li><Link className={col} href={href("/shop")}>All products</Link></li>
              {categories.slice(0, 6).map((c) => (
                <li key={c}><Link className={col} href={href(`/shop?category=${encodeURIComponent(c)}`)}>{c}</Link></li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h2 className="mb-4 text-custom-sm font-bold uppercase tracking-wider text-dark">Help</h2>
            <ul className="flex flex-col gap-2.5 text-custom-sm" style={{ color: "var(--muted)" }}>
              <li><Link className={col} href={href("/cart")}>Your cart</Link></li>
              <li><Link className={col} href={href("/checkout")}>Checkout</Link></li>
              {store.phone && (
                <li><a className={col} href={`tel:${store.phone.replace(/\s/g, "")}`}>Call {store.phone}</a></li>
              )}
            </ul>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t py-5 text-custom-sm" style={{ borderColor: "var(--line)", color: "var(--muted)" }}>
          <p>&copy; {new Date().getFullYear()} {store.name}. All rights reserved.</p>
          <p>
            Powered by{" "}
            <Link href="/" className="font-semibold text-dark hover:underline underline-offset-4">Retailr</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
