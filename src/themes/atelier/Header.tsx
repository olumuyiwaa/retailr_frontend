"use client";
import React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import StoreLogo from "@/components/Store/StoreLogo";
import { useStore } from "@/app/context/StoreContext";
import { useCartModalContext } from "@/app/context/CartSidebarModalContext";
import { useAppSelector } from "@/redux/store";
import { selectWishlistItems } from "@/redux/features/wishlist-slice";

export default function AtelierHeader() {
  const ctx = useStore();
  const pathname = usePathname();
  const params = useSearchParams();
  const { openCartModal } = useCartModalContext();
  const count = useAppSelector((s) => s.cartReducer.items.reduce((n, i) => n + i.quantity, 0));
  const wishCount = useAppSelector((s) => selectWishlistItems(s).length);
  if (!ctx?.store) return <div className="h-[110px]" aria-hidden />;
  const { store, categories, href, products } = ctx;
  const cat = params.get("category");
  const onShop = pathname === href("/shop");
  const hasServices = (products ?? []).some((p) => p.kind === "service");
  const hasProducts = (products ?? []).some((p) => (p.kind ?? "product") === "product");
  const link = (on: boolean) => `whitespace-nowrap text-custom-sm ease-out duration-200 hover:text-dark ${on ? "font-medium text-dark" : ""}`;

  return (
    <>
      <div className="px-4 py-2.5 text-center text-custom-xs" style={{ background: "var(--ink)", color: "rgba(255,255,255,.85)" }}>
        Pay on delivery or by bank transfer · Shipping from {store.city}, {store.country}
      </div>
      <header className="sticky top-0 z-50 border-b backdrop-blur" style={{ background: "color-mix(in srgb, var(--wash) 94%, transparent)", borderColor: "var(--line)" }}>
        <div className="mx-auto flex h-[68px] w-full max-w-[1680px] items-center gap-8 px-5 sm:px-8 lg:px-12 2xl:px-20">
          <Link href={href("/")} className="flex shrink-0 items-center gap-2.5 text-dark" aria-label={`${store.name} home`}>
            {store.logo && <StoreLogo name={store.name} logo={store.logo} size={32} />}
            <span className="text-xl font-semibold tracking-tight">{store.name}</span>
          </Link>
          <nav className="ml-auto hidden items-center gap-7 lg:flex" aria-label="Shop">
            <Link href={href("/shop")} className={link(onShop && !cat)}>{hasServices && hasProducts ? "Products" : "Shop all"}</Link>
            {hasServices && (
              <Link href={href("/shop?kind=service")} className={link(onShop && !cat)}>Services</Link>
            )}
            {categories.slice(0, 5).map((c) => (
              <Link key={c} href={href(`/shop?category=${encodeURIComponent(c)}`)} className={link(onShop && cat === c)}>{c}</Link>
            ))}
          </nav>
          <button type="button" onClick={openCartModal} className="ml-auto font-medium text-dark lg:ml-4" aria-label={`Open bag, ${count} item${count === 1 ? "" : "s"}`}>
            Bag ({count})
          </button>
          <Link
            href={href("/wishlist")}
            aria-label={`Favourites${wishCount > 0 ? `, ${wishCount} saved` : ""}`}
            className="relative flex h-9 w-9 items-center justify-center text-dark transition-opacity hover:opacity-70"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={wishCount > 0 ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {wishCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-2xs font-bold text-white" style={{ background: "var(--ink)" }} aria-hidden>
                {wishCount > 9 ? "9+" : wishCount}
              </span>
            )}
          </Link>
        </div>
        <nav className="flex gap-6 overflow-x-auto border-t px-5 py-2.5 lg:hidden" style={{ borderColor: "var(--line)" }} aria-label="Shop categories">
          <Link href={href("/shop")} className={link(onShop && !cat)}>{hasServices && hasProducts ? "Products" : "Shop all"}</Link>
          {hasServices && (
            <Link href={href("/shop?kind=service")} className={link(onShop && !cat)}>Services</Link>
          )}
          {categories.map((c) => (
            <Link key={c} href={href(`/shop?category=${encodeURIComponent(c)}`)} className={link(onShop && cat === c)}>{c}</Link>
          ))}
        </nav>
      </header>
    </>
  );
}
