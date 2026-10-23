"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import StoreLogo from "@/components/Store/StoreLogo";
import { useStore } from "@/app/context/StoreContext";
import { useCartModalContext } from "@/app/context/CartSidebarModalContext";
import { useAppSelector } from "@/redux/store";
import { selectWishlistItems } from "@/redux/features/wishlist-slice";

/**
 * 1688-inspired header: thin utility bar, large orange-outlined search,
 * secondary actions, and a horizontal category strip.
 */
export default function BazaarHeader() {
  const ctx = useStore();
  const pathname = usePathname();
  const params = useSearchParams();
  const { openCartModal } = useCartModalContext();
  const count = useAppSelector((s) => s.cartReducer.items.reduce((n, i) => n + i.quantity, 0));
  const wishCount = useAppSelector((s) => selectWishlistItems(s).length);
  const [search, setSearch] = useState(params.get("q") ?? "");
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!ctx?.store) return <div className="h-[120px]" aria-hidden />;
  const { store, categories, href } = ctx;
  const cat = params.get("category");
  const onShop = pathname === href("/shop");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) window.location.href = href(`/shop?q=${encodeURIComponent(search.trim())}`);
  };

  return (
    <>
      {/* Utility bar */}
      <div className="border-b text-[11px]" style={{ background: "#FAFAFA", borderColor: "var(--line)", color: "var(--muted)" }}>
        <div className="mx-auto flex h-8 max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-10">
          <p className="truncate">
            Wholesale-style storefront · Ships from {store.city || store.country}
          </p>
          <div className="hidden items-center gap-4 sm:flex">
            {store.phone && (
              <a href={`tel:${store.phone.replace(/\s/g, "")}`} className="hover:text-dark">
                {store.phone}
              </a>
            )}
            <Link href={href("/shop")} className="hover:text-dark">
              All products
            </Link>
          </div>
        </div>
      </div>

      {/* Main header */}
      <header className="sticky top-0 z-50 border-b bg-white shadow-sm" style={{ borderColor: "var(--line)" }}>
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:gap-5 lg:px-10">
          <Link href={href("/")} className="flex shrink-0 items-center gap-2" aria-label={`${store.name} home`}>
            {store.logo && <StoreLogo name={store.name} logo={store.logo} size={36} />}
            <span className="text-lg font-extrabold tracking-tight text-dark sm:text-xl">{store.name}</span>
          </Link>

          {/* Search — 1688-style orange outline */}
          <form onSubmit={handleSearch} className="order-3 w-full flex-1 md:order-none md:min-w-[280px]" role="search">
            <div
              className="flex overflow-hidden rounded-full border-2 bg-white"
              style={{ borderColor: "var(--brand)" }}
            >
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Find products…"
                aria-label="Search products"
                className="min-w-0 flex-1 px-4 py-2.5 text-sm text-dark outline-none"
              />
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 text-sm font-bold text-white transition-opacity hover:opacity-90"
                style={{ background: "var(--brand)" }}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" />
                </svg>
                <span className="hidden sm:inline">Search</span>
              </button>
            </div>
          </form>

          <div className="ml-auto flex items-center gap-3 sm:gap-4">
            <Link
              href={href("/wishlist")}
              className="relative flex flex-col items-center gap-0.5 text-dark/70 hover:text-dark"
              aria-label={`Favourites${wishCount ? `, ${wishCount} saved` : ""}`}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill={wishCount ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {wishCount > 0 && (
                <span className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-0.5 text-[10px] font-bold text-white" style={{ background: "var(--brand)" }}>
                  {wishCount > 9 ? "9+" : wishCount}
                </span>
              )}
              <span className="hidden text-[10px] sm:block">Saved</span>
            </Link>
            <button
              type="button"
              onClick={openCartModal}
              className="relative flex flex-col items-center gap-0.5 text-dark/70 hover:text-dark"
              aria-label={`Open cart, ${count} items`}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <path d="M6 6h15l-1.5 9h-12z" />
                <circle cx="9" cy="20" r="1" fill="currentColor" />
                <circle cx="18" cy="20" r="1" fill="currentColor" />
                <path d="M6 6L5 3H2" />
              </svg>
              {count > 0 && (
                <span className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-0.5 text-[10px] font-bold text-white" style={{ background: "var(--brand)" }}>
                  {count > 9 ? "9+" : count}
                </span>
              )}
              <span className="hidden text-[10px] sm:block">Cart</span>
            </button>
            <button
              type="button"
              className="rounded border px-2 py-1 text-sm md:hidden"
              style={{ borderColor: "var(--line)" }}
              aria-expanded={mobileOpen}
              aria-label="Categories"
              onClick={() => setMobileOpen((v) => !v)}
            >
              ☰
            </button>
          </div>
        </div>

        {/* Category strip */}
        <div className="border-t" style={{ borderColor: "var(--line)", background: "#FFF" }}>
          <div className="mx-auto flex max-w-[1440px] items-center gap-1 overflow-x-auto px-4 py-1.5 sm:px-6 lg:px-10">
            <Link
              href={href("/shop")}
              className={`shrink-0 rounded px-2.5 py-1.5 text-xs font-semibold ${onShop && !cat ? "text-white" : "text-dark hover:bg-black/5"}`}
              style={onShop && !cat ? { background: "var(--brand)" } : undefined}
            >
              All
            </Link>
            {categories.map((c) => {
              const on = cat === c;
              return (
                <Link
                  key={c}
                  href={href(`/shop?category=${encodeURIComponent(c)}`)}
                  className={`shrink-0 rounded px-2.5 py-1.5 text-xs font-medium ${on ? "text-white" : "text-dark/80 hover:bg-black/5"}`}
                  style={on ? { background: "var(--brand)" } : undefined}
                >
                  {c}
                </Link>
              );
            })}
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t px-4 py-3 md:hidden" style={{ borderColor: "var(--line)" }}>
            <ul className="flex flex-col gap-1">
              {categories.map((c) => (
                <li key={c}>
                  <Link
                    href={href(`/shop?category=${encodeURIComponent(c)}`)}
                    className="block rounded px-2 py-2 text-sm hover:bg-black/5"
                    onClick={() => setMobileOpen(false)}
                  >
                    {c}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </header>
    </>
  );
}
