"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import StoreLogo from "./StoreLogo";
import { useStore } from "@/app/context/StoreContext";
import { useCartModalContext } from "@/app/context/CartSidebarModalContext";
import { useAppSelector } from "@/redux/store";
import { selectTotalPrice } from "@/redux/features/cart-slice";

const BagIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M5 8h14l-1 12H6L5 8Z" />
    <path d="M9 8V6a3 3 0 0 1 6 0v2" />
  </svg>
);
const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4-4" />
  </svg>
);

export default function StoreHeader() {
  const ctx = useStore();
  const router = useRouter();
  const pathname = usePathname();
  const { openCartModal } = useCartModalContext();
  const count = useAppSelector((s) => s.cartReducer.items.reduce((n, i) => n + i.quantity, 0));
  const total = useSelector(selectTotalPrice);
  const [menu, setMenu] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => setMenu(false), [pathname]);

  if (!ctx?.store) {
    return <div className="h-[72px] border-b" style={{ borderColor: "var(--line)" }} aria-hidden />;
  }
  const { store, categories, href, fmt, products } = ctx;
  const hasServices = products.some((p) => p.kind === "service");
  const hasProducts = products.some((p) => (p.kind ?? "product") === "product");
  const onShop = pathname === href("/shop");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    router.push(href(term ? `/shop?q=${encodeURIComponent(term)}` : "/shop"));
    setMenu(false);
  };

  const nav = [
    { label: "Home", to: href("/"), active: pathname === href("/") },
    {
      label: hasServices && hasProducts ? "Products" : "Shop",
      to: href("/shop"),
      active: onShop,
    },
    ...(hasServices
      ? [{ label: "Services", to: href("/shop?kind=service"), active: onShop }]
      : []),
  ];
  const topCategories = categories.slice(0, 3);

  const linkCls = (active: boolean) =>
    `relative py-1 font-medium text-custom-sm ease-out duration-200 hover:text-dark ${active ? "text-dark" : ""}`;

  return (
    <>
      <div className="text-custom-xs" style={{ background: "var(--ink)", color: "rgba(255,255,255,.82)" }}>
        <div className="store-container mx-auto flex items-center justify-between gap-4 px-4 py-2 sm:px-8">
          <span>Pay on delivery or by bank transfer</span>
          <span className="hidden sm:inline">
            Shipping from {store.city}, {store.country}
          </span>
        </div>
      </div>

      <header
        className="sticky top-0 z-50 border-b backdrop-blur"
        style={{ background: "color-mix(in srgb, var(--wash) 88%, transparent)", borderColor: "var(--line)" }}
      >
        <div className="store-container mx-auto flex h-[68px] items-center gap-5 px-4 sm:px-8">
          <button
            type="button"
            className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-dark lg:hidden"
            aria-label={menu ? "Close menu" : "Open menu"}
            aria-expanded={menu}
            onClick={() => setMenu((m) => !m)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
              {menu ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 8h16M4 16h16" />}
            </svg>
          </button>

          <Link href={href("/")} className="flex items-center gap-2.5 text-dark" aria-label={`${store.name} home`}>
            <StoreLogo name={store.name} logo={store.logo} />
            <span className="font-display text-xl font-bold tracking-tight">{store.name}</span>
          </Link>

          <nav className="ml-6 hidden items-center gap-6 lg:flex" aria-label="Shop">
            {nav.map((n) => (
              <Link key={n.label} href={n.to} className={linkCls(n.active)}>
                {n.label}
              </Link>
            ))}
            {topCategories.map((c) => (
              <Link key={c} href={href(`/shop?category=${encodeURIComponent(c)}`)} className={linkCls(false)}>
                {c}
              </Link>
            ))}
          </nav>

          <form onSubmit={submit} role="search" className="ml-auto hidden md:block">
            <label className="flex h-10 w-[240px] items-center gap-2 rounded-full bg-white px-4 ring-1 ring-inset focus-within:ring-2" style={{ ["--tw-ring-color" as string]: "var(--line)" }}>
              <span className="text-dark/60">
                <SearchIcon />
              </span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={`Search ${store.name}`}
                aria-label="Search products"
                className="w-full bg-transparent text-custom-sm text-dark outline-none placeholder:text-dark/45"
              />
            </label>
          </form>

          <button
            type="button"
            onClick={openCartModal}
            aria-label={`Open cart, ${count} item${count === 1 ? "" : "s"}`}
            className="ml-auto flex h-10 items-center gap-2.5 rounded-full px-4 font-medium md:ml-0"
            style={{ background: "var(--brand)", color: "var(--brand-fg)" }}
          >
            <BagIcon />
            <span className="text-custom-sm">{count > 0 ? fmt(total) : "Cart"}</span>
            {count > 0 && (
              <span
                className="flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-2xs font-bold"
                style={{ background: "var(--brand-fg)", color: "var(--brand)" }}
              >
                {count}
              </span>
            )}
          </button>
        </div>

        {menu && (
          <div className="border-t px-4 pb-5 pt-3 lg:hidden" style={{ borderColor: "var(--line)" }}>
            <form onSubmit={submit} role="search" className="mb-3">
              <label className="flex h-11 items-center gap-2 rounded-full bg-white px-4 ring-1 ring-inset" style={{ ["--tw-ring-color" as string]: "var(--line)" }}>
                <SearchIcon />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={`Search ${store.name}`}
                  aria-label="Search products"
                  className="w-full bg-transparent text-custom-sm text-dark outline-none"
                />
              </label>
            </form>
            <ul className="flex flex-col">
              {[...nav.map((n) => ({ label: n.label, to: n.to })), ...categories.map((c) => ({ label: c, to: href(`/shop?category=${encodeURIComponent(c)}`) }))].map((n) => (
                <li key={n.label}>
                  <Link href={n.to} className="flex items-center justify-between border-b py-3 font-medium text-dark" style={{ borderColor: "var(--line)" }}>
                    {n.label}
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
