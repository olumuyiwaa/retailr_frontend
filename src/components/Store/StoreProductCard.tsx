"use client";
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import type { Product } from "@/types/product";
import ProductThumb from "@/components/Common/ProductThumb";
import { useStoreHref, useStoreMoney } from "@/app/context/StoreContext";
import { useCartModalContext } from "@/app/context/CartSidebarModalContext";
import { addItemToCart } from "@/redux/features/cart-slice";
import type { AppDispatch } from "@/redux/store";

export default function StoreProductCard({ item }: { item: Product }) {
  const href = useStoreHref();
  const fmt = useStoreMoney();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { openCartModal } = useCartModalContext();
  const soldOut = item.stock !== undefined && item.stock <= 0;
  const low = !soldOut && item.stock !== undefined && item.stock <= 5;
  const to = href(`/product/${item.id}`);

  const hasVariants = !!item.variants?.length;
  const prices = hasVariants ? item.variants!.map((v) => v.price ?? item.discountedPrice) : [item.discountedPrice];
  const lowest = Math.min(...prices);
  const varies = Math.max(...prices) !== lowest;

  const add = () => {
    if (soldOut) return;
    if (hasVariants) {
      router.push(to);
      return;
    }
    dispatch(addItemToCart({ ...item, quantity: 1 }));
    openCartModal();
  };

  return (
    <article className="group">
      <div className="relative overflow-hidden rounded-2xl">
        <Link href={to} aria-label={item.title} className="relative block aspect-[4/5] overflow-hidden bg-[color:var(--tint)]">
          <div className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-[1.04]">
            <ProductThumb item={item} />
            {item.imgs?.previews?.[1] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.imgs.previews[1]} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            )}
          </div>
        </Link>

        {(soldOut || low) && (
          <span
            className="absolute left-3 top-3 rounded-full px-3 py-1 text-custom-xs font-medium"
            style={soldOut ? { background: "var(--ink)", color: "#fff" } : { background: "#fff", color: "var(--ink)" }}
          >
            {soldOut ? "Sold out" : `Only ${item.stock} left`}
          </span>
        )}

        <button
          type="button"
          onClick={add}
          disabled={soldOut}
          aria-label={soldOut ? `${item.title} is sold out` : hasVariants ? `Choose options for ${item.title}` : `Add ${item.title} to cart`}
          className="absolute bottom-3 right-3 flex h-11 items-center gap-2 rounded-full px-4 text-custom-sm font-medium shadow-lg transition duration-200 disabled:hidden sm:translate-y-3 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:focus-visible:translate-y-0 sm:focus-visible:opacity-100"
          style={{ background: "var(--brand)", color: "var(--brand-fg)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
            <path d="M12 5v14M5 12h14" />
          </svg>
          {hasVariants ? "Options" : "Add"}
        </button>
      </div>

      <div className="mt-3.5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-display text-lg font-semibold leading-snug text-dark">
            <Link href={to} className="ease-out duration-200 hover:underline decoration-1 underline-offset-4">
              {item.title}
            </Link>
          </h3>
          {item.category && <p className="mt-0.5 text-custom-sm">{item.category}</p>}
        </div>
        <p className="font-display text-lg font-semibold text-dark">{varies ? "From " : ""}{fmt(lowest)}</p>
      </div>
    </article>
  );
}
