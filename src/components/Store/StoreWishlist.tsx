"use client";
import React from "react";
import Link from "next/link";
import { useDispatch } from "react-redux";
import { useStore } from "@/app/context/StoreContext";
import { selectWishlistItems, removeItemFromWishlist } from "@/redux/features/wishlist-slice";
import { addItemToCart } from "@/redux/features/cart-slice";
import { AppDispatch, useAppSelector } from "@/redux/store";
import { useCartModalContext } from "@/app/context/CartSidebarModalContext";
import FaveButton from "./FaveButton";

const HeartEmptyIcon = () => (
  <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

export default function StoreWishlist() {
  const ctx = useStore();
  const dispatch = useDispatch<AppDispatch>();
  const { openCartModal } = useCartModalContext();
  const items = useAppSelector(selectWishlistItems);

  if (!ctx?.store) return null;
  const { store, href, fmt, products } = ctx;

  // Empty state
  if (items.length === 0) {
    return (
      <section className="store-container mx-auto py-24 text-center">
        <div className="mx-auto mb-5 w-fit" style={{ color: "var(--line)" }}>
          <HeartEmptyIcon />
        </div>
        <h1 className="mb-2 text-3xl font-bold text-dark">Your favourites are empty</h1>
        <p className="mb-8 text-base" style={{ color: "var(--muted, #767676)" }}>
          Tap the heart on any product to save it here.
        </p>
        <Link
          href={href("/shop")}
          className="inline-flex h-11 items-center rounded-full bg-dark px-8 font-semibold text-white transition-opacity hover:opacity-85"
        >
          Browse the store
        </Link>
      </section>
    );
  }

  return (
    <section className="store-container mx-auto pb-12 pt-8">
      {/* Header */}
      <nav aria-label="Breadcrumb" className="mb-4 text-custom-sm" style={{ color: "var(--muted, #767676)" }}>
        <Link href={href("/")} className="transition-colors hover:text-dark">Home</Link>
        <span className="mx-1.5" aria-hidden>/</span>
        <span className="text-dark">Favourites</span>
      </nav>

      <div className="mb-8 flex items-end justify-between gap-3">
        <h1 className="text-3xl font-bold text-dark sm:text-4xl">
          Favourites
          <span className="ml-3 text-xl font-normal" style={{ color: "var(--muted, #767676)" }}>
            ({items.length})
          </span>
        </h1>
        <button
          onClick={() => items.forEach((i) => dispatch(removeItemFromWishlist(i.id)))}
          className="pb-0.5 text-custom-sm underline underline-offset-4 transition-colors hover:text-dark"
          style={{ color: "var(--muted, #767676)" }}
        >
          Clear all
        </button>
      </div>

      {/* Grid — mirrors the shop grid layout */}
      <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {items.map((item) => {
          // Try to find the live product to get fresh stock / pricing
          const live = products.find((p) => String(p.id) === String(item.id));
          const soldOut = live ? (live.stock !== undefined && live.stock <= 0) : false;
          const hasVariants = !!(live?.variants?.length);
          const displayPrice = live ? live.discountedPrice : item.discountedPrice;
          const originalPrice = live?.price;
          const hasDiscount = originalPrice !== undefined && originalPrice > displayPrice;

          const addToCart = (e: React.MouseEvent) => {
            e.preventDefault();
            if (!live || soldOut) return;
            if (hasVariants || live.bookable) {
              window.location.href = href(`/product/${item.id}`);
              return;
            }
            dispatch(addItemToCart({ ...live, quantity: 1 }));
            openCartModal();
          };

          const src = item.imgs?.previews?.[0];

          return (
            <li key={item.id}>
              <Link href={href(`/product/${item.id}`)} className="group block">
                {/* Image */}
                <div className="relative overflow-hidden rounded-2xl bg-[color:var(--tint)]">
                  <div className="aspect-square w-full">
                    {src ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={src}
                        alt={item.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="h-full w-full" style={{ background: "var(--tint)" }} />
                    )}
                  </div>

                  {/* Remove from favourites */}
                  <FaveButton
                    item={{ ...item, price: item.price ?? item.discountedPrice }}
                    className="absolute right-2.5 top-2.5"
                    iconSize={15}
                  />

                  {/* Sold-out badge */}
                  {soldOut && (
                    <span className="absolute left-2.5 top-2.5 rounded-full bg-dark px-2.5 py-0.5 text-2xs font-medium text-white">
                      Sold out
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="mt-3 px-0.5">
                  <h2 className="line-clamp-2 text-custom-sm font-medium leading-snug text-dark group-hover:underline underline-offset-4">
                    {item.title}
                  </h2>
                  <div className="mt-1 flex items-baseline gap-2 flex-wrap">
                    <span className="font-semibold text-dark">{fmt(displayPrice)}</span>
                    {hasDiscount && (
                      <span className="text-custom-sm line-through" style={{ color: "var(--muted, #767676)" }}>
                        {fmt(originalPrice!)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>

              {/* Add to cart */}
              <button
                type="button"
                onClick={addToCart}
                disabled={soldOut}
                className="mt-3 w-full rounded-full border py-2 text-custom-sm font-semibold text-dark transition-colors hover:bg-dark hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                style={{ borderColor: "var(--line)" }}
              >
                {soldOut ? "Sold out" : hasVariants ? "Choose options" : "Add to cart"}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
