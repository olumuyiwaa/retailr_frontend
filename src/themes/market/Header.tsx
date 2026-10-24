"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import StoreLogo from "@/components/Store/StoreLogo";
import { useStore } from "@/app/context/StoreContext";
import { useCartModalContext } from "@/app/context/CartSidebarModalContext";
import { useAppSelector } from "@/redux/store";
import { selectWishlistItems } from "@/redux/features/wishlist-slice";

/** Navy top bar + white search row + category strip. */
export default function MarketHeader() {
  const ctx = useStore();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { openCartModal } = useCartModalContext();
  const count = useAppSelector((s) =>
    s.cartReducer.items.reduce((n, i) => n + i.quantity, 0)
  );
  const wishCount = useAppSelector((s) => selectWishlistItems(s).length);
  const [search, setSearch] = useState(params.get("q") ?? "");
  const [mobileOpen, setMobileOpen] = useState(false);
  const urlQ = params.get("q") ?? "";

  // keep the box in step with the URL, and close the menu after navigating (adjust state while rendering)
  const loc = `${pathname}?${params.toString()}`;
  const [prevQ, setPrevQ] = useState(urlQ);
  const [prevLoc, setPrevLoc] = useState(loc);
  if (prevQ !== urlQ) {
    setPrevQ(urlQ);
    setSearch(urlQ);
  }
  if (prevLoc !== loc) {
    setPrevLoc(loc);
    setMobileOpen(false);
  }

  if (!ctx?.store) return <div className="h-[120px]" aria-hidden />;
  const { store, categories, href, products } = ctx;

  const cat = params.get("category");
  const svc = params.get("kind") === "service";
  const onShop = pathname === href("/shop");
  const hasServices = (products ?? []).some((p) => p.kind === "service");
  const hasProducts = (products ?? []).some((p) => (p.kind ?? "product") === "product");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const term = search.trim();
    router.push(href(term ? `/shop?q=${encodeURIComponent(term)}` : "/shop"));
    setMobileOpen(false);
  };

  /* ── category pill styles ── */
  const catLink = (on: boolean) =>
    `whitespace-nowrap px-3 py-3 text-custom-sm font-medium transition-colors duration-150 ${
      on
        ? "text-white border-b-2 border-white"
        : "text-white/80 hover:text-white hover:border-b-2 hover:border-white/50 border-b-2 border-transparent"
    }`;

  return (
    <>
      {/* ── Top bar: navy background with logo + search + cart ── */}
      <header
        className="sticky top-0 z-50 shadow-md"
        style={{ background: "var(--ink)" }}
      >
        <div className="mx-auto flex h-[64px] w-full max-w-[1680px] items-center gap-4 px-5 sm:px-8 lg:px-12 2xl:px-20">
          {/* Logo */}
          <Link
            href={href("/")}
            className="flex shrink-0 items-center gap-2.5 text-white"
            aria-label={`${store.name} home`}
          >
            {store.logo && (
              <StoreLogo name={store.name} logo={store.logo} size={34} />
            )}
            <span className="text-xl font-bold tracking-tight leading-none">
              {store.name}
            </span>
          </Link>

          {/* Search bar (hidden on mobile) */}
          <form
            onSubmit={handleSearch}
            className="mx-4 hidden flex-1 md:flex"
            role="search"
          >
            <div className="flex w-full overflow-hidden rounded-md bg-white">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${store.name}…`}
                aria-label="Search products"
                className="min-w-0 flex-1 px-4 py-2.5 text-custom-sm text-dark outline-none"
              />
              <button
                type="submit"
                aria-label="Search"
                className="flex h-full items-center px-5 font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: "var(--brand)" }}
              >
                Search
              </button>
            </div>
          </form>

          {/* Right actions */}
          <div className="ml-auto flex items-center gap-4 md:ml-0">
            {/* Favourites */}
            <Link
              href={href("/wishlist")}
              aria-label={`Favourites${wishCount > 0 ? `, ${wishCount} saved` : ""}`}
              className="relative flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 text-white"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill={wishCount > 0 ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {wishCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-2xs font-bold text-white" style={{ background: "var(--brand)" }} aria-hidden>
                  {wishCount > 9 ? "9+" : wishCount}
                </span>
              )}
              <span className="text-2xs hidden sm:block" aria-hidden>Saved</span>
            </Link>
            {/* Cart */}
            <button
              type="button"
              onClick={openCartModal}
              aria-label={`Open cart, ${count} item${count === 1 ? "" : "s"}`}
              className="relative flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 text-white"
            >
              {/* Cart icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9m5-9v9m4-9v9m5-9l2 9"
                />
              </svg>
              {count > 0 && (
                <span
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-2xs font-bold text-white"
                  style={{ background: "var(--brand)" }}
                  aria-hidden="true"
                >
                  {count > 99 ? "99+" : count}
                </span>
              )}
              <span className="text-2xs hidden sm:block" aria-hidden>Cart</span>
            </button>

            {/* Mobile menu toggle */}
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center text-white md:hidden"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* ── Category strip ── */}
        <nav
          aria-label="Product categories"
          className="border-t border-white/10"
          style={{ background: "color-mix(in srgb, var(--ink) 90%, black)" }}
        >
          <div className="mx-auto flex w-full max-w-[1680px] items-center overflow-x-auto px-5 sm:px-8 lg:px-12 2xl:px-20">
            <Link
              href={href("/shop")}
              className={catLink(onShop && !cat && !svc)}
              aria-current={onShop && !cat && !svc ? "page" : undefined}
            >
              {hasServices && hasProducts ? "All Products" : "Shop All"}
            </Link>
            {hasServices && (
              <Link href={href("/shop?kind=service")} className={catLink(onShop && !cat && svc)} aria-current={onShop && !cat && svc ? "page" : undefined}>
                Services
              </Link>
            )}
            {categories.slice(0, 8).map((c) => (
              <Link
                key={c}
                href={href(`/shop?category=${encodeURIComponent(c)}`)}
                className={catLink(onShop && cat === c)}
                aria-current={onShop && cat === c ? "page" : undefined}
              >
                {c}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      {/* ── Mobile search (below header) ── */}
      {mobileOpen && (
        <div
          className="md:hidden border-b px-5 py-3 sm:px-8"
          style={{ background: "var(--ink)", borderColor: "rgba(255,255,255,.15)" }}
        >
          <form onSubmit={handleSearch} className="flex overflow-hidden rounded-md bg-white" role="search">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${store.name}…`}
              aria-label="Search products"
              className="min-w-0 flex-1 px-4 py-2.5 text-custom-sm text-dark outline-none"
            />
            <button
              type="submit"
              aria-label="Search"
              className="flex items-center px-5 font-semibold text-white"
              style={{ background: "var(--brand)" }}
            >
              Search
            </button>
          </form>
          <nav aria-label="Mobile shop links" className="mt-3 flex flex-col gap-1">
            <Link href={href("/shop")} className="rounded px-2 py-3 text-custom-sm text-white/85 hover:bg-white/10 hover:text-white">
              {hasServices && hasProducts ? "All Products" : "Shop All"}
            </Link>
            {hasServices && (
              <Link href={href("/shop?kind=service")} className="rounded px-2 py-3 text-custom-sm text-white/85 hover:bg-white/10 hover:text-white">
                Services
              </Link>
            )}
            {categories.map((c) => (
              <Link key={c} href={href(`/shop?category=${encodeURIComponent(c)}`)} className="rounded px-2 py-3 text-custom-sm text-white/85 hover:bg-white/10 hover:text-white">
                {c}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
