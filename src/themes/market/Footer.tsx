"use client";
import React from "react";
import Link from "next/link";
import { useStore } from "@/app/context/StoreContext";

export default function MarketFooter() {
  const ctx = useStore();
  if (!ctx?.store) return null;
  const { store, categories, href } = ctx;

  const colLink =
    "text-custom-sm text-white/70 transition-colors duration-150 hover:text-white";

  return (
    <footer style={{ background: "var(--ink)" }}>
      {/* Top strip */}
      <div
        className="border-b"
        style={{ borderColor: "rgba(255,255,255,.08)", background: "var(--brand)" }}
      >
        <div className="mx-auto flex w-full max-w-[1680px] flex-wrap items-center justify-between gap-4 px-5 py-3 sm:px-8 lg:px-12 2xl:px-20">
          <p className="text-custom-sm font-semibold text-white">
            {store.name} — {store.category}
          </p>
          <Link
            href={href("/shop")}
            className="rounded border border-white/40 px-5 py-1.5 text-custom-sm font-bold text-white transition-colors hover:bg-white hover:text-dark"
          >
            Shop Now
          </Link>
        </div>
      </div>

      {/* Main columns */}
      <div className="mx-auto w-full max-w-[1680px] px-5 sm:px-8 lg:px-12 2xl:px-20">
        <div className="grid gap-10 pb-10 pt-12 sm:grid-cols-2 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-2">
            <p className="text-xl font-extrabold text-white">{store.name}</p>
            <p className="mt-3 max-w-[340px] text-custom-sm text-white/65 leading-relaxed">
              {store.description ||
                `${store.category} from ${store.city}, ${store.country}. Browse our full catalogue.`}
            </p>
            {store.phone && (
              <a
                href={`tel:${store.phone.replace(/\s/g, "")}`}
                className="mt-4 inline-block text-custom-sm text-white/70 hover:text-white"
              >
                📞 {store.phone}
              </a>
            )}
          </div>

          {/* Shop */}
          <div>
            <h2 className="mb-4 text-custom-sm font-bold uppercase tracking-widest text-white/50">
              Shop
            </h2>
            <ul className="flex flex-col gap-2.5">
              <li>
                <Link href={href("/shop")} className={colLink}>
                  All Products
                </Link>
              </li>
              {categories.slice(0, 6).map((c) => (
                <li key={c}>
                  <Link
                    href={href(`/shop?category=${encodeURIComponent(c)}`)}
                    className={colLink}
                  >
                    {c}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h2 className="mb-4 text-custom-sm font-bold uppercase tracking-widest text-white/50">
              Help
            </h2>
            <ul className="flex flex-col gap-2.5">
              <li>
                <Link href={href("/cart")} className={colLink}>
                  Your Cart
                </Link>
              </li>
              <li>
                <Link href={href("/checkout")} className={colLink}>
                  Checkout
                </Link>
              </li>
              <li>
                <span className={`${colLink} cursor-default`}>
                  Ships from {store.city}
                </span>
              </li>
              <li>
                <span className={`${colLink} cursor-default`}>
                  Pay on delivery or bank transfer
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-wrap items-center justify-between gap-3 border-t py-5 text-2xs text-white/50"
          style={{ borderColor: "rgba(255,255,255,.08)" }}
        >
          <p>
            &copy; {new Date().getFullYear()} {store.name}. All rights reserved.
          </p>
          <p>
            Store powered by{" "}
            <span className="font-semibold text-white/80">Retailr</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
