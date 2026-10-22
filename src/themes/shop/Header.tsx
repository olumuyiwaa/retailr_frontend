"use client";
import React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import StoreLogo from "@/components/Store/StoreLogo";
import { useStore } from "@/app/context/StoreContext";
import { useCartModalContext } from "@/app/context/CartSidebarModalContext";
import { useAppSelector } from "@/redux/store";
import { selectWishlistItems } from "@/redux/features/wishlist-slice";

/** Search icon */
function IconSearch({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

/** Cart bag icon */
function IconBag({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

export default function ShopHeader() {
  const ctx = useStore();
  const pathname = usePathname();
  const params = useSearchParams();
  const { openCartModal } = useCartModalContext();
  const count = useAppSelector((s) => s.cartReducer.items.reduce((n, i) => n + i.quantity, 0));
  const wishCount = useAppSelector((s) => selectWishlistItems(s).length);

  if (!ctx?.store) return <div className="h-[60px]" aria-hidden />;
  const { store, categories, href, products } = ctx;
  const cat = params.get("category");
  const onShop = pathname === href("/shop");
  const hasServices = (products ?? []).some((p) => p.kind === "service");
  const hasProducts = (products ?? []).some((p) => (p.kind ?? "product") === "product");

  const navLink = (on: boolean) =>
    `whitespace-nowrap text-custom-sm transition-colors hover:text-dark ${on ? "font-semibold text-dark" : "text-body"}`;

  return (
    <header className="sticky top-0 z-50 border-b bg-white" style={{ borderColor: "var(--line)" }}>
      {/* Top bar */}
      <div className="mx-auto flex h-[60px] w-full max-w-[1680px] items-center gap-4 px-5 sm:px-8 lg:px-12 2xl:px-20">
        {/* Logo */}
        <Link href={href("/")} className="flex shrink-0 items-center gap-2 text-dark" aria-label={`${store.name} home`}>
          {store.logo && <StoreLogo name={store.name} logo={store.logo} size={28} />}
          <span className="text-lg font-bold tracking-tight">{store.name}</span>
        </Link>

        {/* Desktop nav */}
        <nav className="ml-8 hidden items-center gap-6 lg:flex" aria-label="Main">
          <Link href={href("/shop")} className={navLink(onShop && !cat)}>
            {hasServices && hasProducts ? "Products" : "Shop all"}
          </Link>
          {hasServices && (
            <Link href={href("/shop?kind=service")} className={navLink(onShop && params.get("kind") === "service")}>
              Services
            </Link>
          )}
          {categories.slice(0, 4).map((c) => (
            <Link key={c} href={href(`/shop?category=${encodeURIComponent(c)}`)} className={navLink(onShop && cat === c)}>
              {c}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="ml-auto flex items-center gap-2">
          {/* Favourites */}
          <Link
            href={href("/wishlist")}
            aria-label={`Favourites${wishCount > 0 ? `, ${wishCount} saved` : ""}`}
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-dark transition-colors hover:bg-[color:var(--tint)]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill={wishCount > 0 ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={wishCount > 0 ? "text-rose-500" : ""} aria-hidden>
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {wishCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-dark text-2xs font-bold text-white" aria-hidden>
                {wishCount > 9 ? "9+" : wishCount}
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={openCartModal}
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-dark transition-colors hover:bg-[color:var(--tint)]"
            aria-label={`Open cart, ${count} item${count === 1 ? "" : "s"}`}
          >
            <IconBag />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-dark text-2xs font-bold text-white" aria-hidden>
                {count > 9 ? "9+" : count}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Category pill strip — visible on both desktop and mobile */}
      {categories.length > 0 && (
        <nav
          className="border-t overflow-x-auto scrollbar-none"
          style={{ borderColor: "var(--line)" }}
          aria-label="Browse categories"
        >
          <div className="mx-auto flex w-full max-w-[1680px] items-center gap-2 px-5 py-2.5 sm:px-8 lg:px-12 2xl:px-20">
            <Link
              href={href("/shop")}
              className={`shrink-0 rounded-full px-4 py-1.5 text-custom-sm font-medium transition-colors ${onShop && !cat ? "bg-dark text-white" : "bg-[color:var(--tint)] text-dark hover:bg-[color:var(--line)]"}`}
            >
              All
            </Link>
            {categories.map((c) => (
              <Link
                key={c}
                href={href(`/shop?category=${encodeURIComponent(c)}`)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-custom-sm font-medium transition-colors ${onShop && cat === c ? "bg-dark text-white" : "bg-[color:var(--tint)] text-dark hover:bg-[color:var(--line)]"}`}
              >
                {c}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
