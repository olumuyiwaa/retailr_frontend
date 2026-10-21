"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import StoreLogo from "@/components/Store/StoreLogo";
import { useStore } from "@/app/context/StoreContext";
import { useCartModalContext } from "@/app/context/CartSidebarModalContext";
import { useAppSelector } from "@/redux/store";
import { selectTotalPrice } from "@/redux/features/cart-slice";
import { useSelector } from "react-redux";

export default function ShowcaseHeader() {
  const ctx = useStore();
  const router = useRouter();
  const pathname = usePathname();
  const { openCartModal } = useCartModalContext();
  const count = useAppSelector((s) => s.cartReducer.items.reduce((n, i) => n + i.quantity, 0));
  const total = useSelector(selectTotalPrice);
  const [q, setQ] = useState("");

  if (!ctx?.store) return <div className="h-[72px]" aria-hidden />;
  const { store, categories, href, products, fmt } = ctx;
  const hasServices = (products ?? []).some((p) => p.kind === "service");
  const hasProducts = (products ?? []).some((p) => (p.kind ?? "product") === "product");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = q.trim();
    router.push(href(t ? `/shop?q=${encodeURIComponent(t)}` : "/shop"));
  };
  const link = (active: boolean) => `font-medium text-custom-sm ease-out duration-200 hover:text-blue ${active ? "text-blue" : "text-dark"}`;

  return (
    <header className="sticky top-0 z-50 bg-white shadow-1">
      <div className="store-container mx-auto flex flex-wrap items-center gap-x-6 gap-y-3 px-4 py-4 sm:px-8">
        <Link href={href("/")} className="flex items-center gap-2.5 text-dark" aria-label={`${store.name} home`}>
          <StoreLogo name={store.name} logo={store.logo} />
          <span className="text-xl font-bold">{store.name}</span>
        </Link>

        <form onSubmit={submit} role="search" className="order-last w-full md:order-none md:ml-4 md:max-w-[460px] md:flex-1">
          <div className="flex overflow-hidden rounded-[5px] border border-gray-3 bg-gray-1">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={`Search ${store.name}`}
              aria-label="Search products"
              className="h-11 w-full bg-transparent px-4 text-custom-sm text-dark outline-none"
            />
            <button type="submit" className="bg-blue px-5 text-custom-sm font-medium text-white">
              Search
            </button>
          </div>
        </form>

        <button type="button" onClick={openCartModal} aria-label={`Open cart, ${count} item${count === 1 ? "" : "s"}`} className="ml-auto flex items-center gap-3 text-dark">
          <span className="relative">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 8h14l-1 12H6L5 8Z" />
              <path d="M9 8V6a3 3 0 0 1 6 0v2" />
            </svg>
            <span className="absolute -right-2 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-blue px-1 text-2xs font-medium text-white">{count}</span>
          </span>
          <span className="hidden text-left leading-tight sm:block">
            <span className="block text-2xs uppercase text-dark-4">cart</span>
            <span className="block text-custom-sm font-medium">{fmt(total)}</span>
          </span>
        </button>
      </div>

      <nav className="border-t border-gray-3" aria-label="Shop">
        <div className="store-container mx-auto flex items-center gap-6 overflow-x-auto px-4 py-3 sm:px-8">
          <Link href={href("/")} className={link(pathname === href("/"))}>Home</Link>
          <Link href={href("/shop")} className={link(pathname === href("/shop"))}>{hasServices && hasProducts ? "Products" : "All products"}</Link>
          {hasServices && (
            <Link href={href("/shop?kind=service")} className={link(pathname === href("/shop"))}>Services</Link>
          )}
          {categories.slice(0, 6).map((c) => (
            <Link key={c} href={href(`/shop?category=${encodeURIComponent(c)}`)} className={`${link(false)} whitespace-nowrap`}>
              {c}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
