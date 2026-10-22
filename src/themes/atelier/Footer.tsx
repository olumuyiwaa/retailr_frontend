"use client";
import React from "react";
import Link from "next/link";
import { useStore } from "@/app/context/StoreContext";
import { whatsappLink } from "./whatsapp";

export default function AtelierFooter() {
  const ctx = useStore();
  if (!ctx?.store) return null;
  const { store, categories, href } = ctx;
  const wa = whatsappLink(store.phone);
  const l = "ease-out duration-200 hover:text-white";
  return (
    <footer className="mt-24" style={{ background: "var(--ink)", color: "rgba(255,255,255,.72)" }}>
      <div className="mx-auto w-full max-w-[1680px] px-5 sm:px-8 lg:px-12 2xl:px-20">
        <div className="grid gap-12 pb-12 pt-16 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="text-2xl font-semibold text-white">{store.name}</p>
            <p className="mt-4 max-w-[380px]">{store.description || `${store.category} from ${store.city}, ${store.country}.`}</p>
          </div>
          <div>
            <h2 className="mb-4 font-medium text-white">Shop</h2>
            <ul className="flex flex-col gap-2.5">
              <li><Link className={l} href={href("/shop")}>All products</Link></li>
              {categories.slice(0, 6).map((c) => (
                <li key={c}><Link className={l} href={href(`/shop?category=${encodeURIComponent(c)}`)}>{c}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="mb-4 font-medium text-white">Help</h2>
            <ul className="flex flex-col gap-2.5">
              <li><Link className={l} href={href("/cart")}>Your bag</Link></li>
              <li><Link className={l} href={href("/checkout")}>Checkout</Link></li>
              {wa && <li><a className={l} href={wa} target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a></li>}
              {store.phone && <li><a className={l} href={`tel:${store.phone.replace(/\s/g, "")}`}>{store.phone}</a></li>}
            </ul>
          </div>
        </div>
        <div className="flex flex-wrap justify-between gap-3 border-t py-6 text-custom-sm" style={{ borderColor: "rgba(255,255,255,.14)" }}>
          <p>&copy; {new Date().getFullYear()} {store.name}</p>
          <p>Store powered by{" "}<Link href="/" className="font-medium text-white hover:underline">Retailr</Link></p>
        </div>
      </div>
    </footer>
  );
}
