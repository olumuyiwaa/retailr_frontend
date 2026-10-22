"use client";
/**
 * FaveButton — a heart toggle backed by Redux + localStorage.
 * Drop it inside any product card's image container (position it absolutely)
 * or inline next to a product title.
 *
 * Usage:
 *   <FaveButton item={product} className="absolute bottom-2.5 right-2.5" />
 */
import React from "react";
import { useDispatch } from "react-redux";
import type { Product } from "@/types/product";
import { toggleWishlistItem, selectWishlistIds } from "@/redux/features/wishlist-slice";
import { AppDispatch, useAppSelector } from "@/redux/store";

interface FaveButtonProps {
  item: Pick<Product, "id" | "title" | "price" | "discountedPrice" | "imgs" | "storeId">;
  /** Extra classes placed on the <button> element (e.g. absolute positioning). */
  className?: string;
  /** Size of the icon in px. Defaults to 16. */
  iconSize?: number;
}

export default function FaveButton({ item, className = "", iconSize = 16 }: FaveButtonProps) {
  const dispatch = useDispatch<AppDispatch>();
  const ids = useAppSelector(selectWishlistIds);
  const saved = ids.has(String(item.id));

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(
      toggleWishlistItem({
        id: item.id,
        title: item.title,
        price: item.price ?? item.discountedPrice,
        discountedPrice: item.discountedPrice,
        quantity: 1,
        storeId: item.storeId,
        imgs: item.imgs,
      })
    );
  };

  return (
    <button
      type="button"
      aria-label={saved ? `Remove ${item.title} from favourites` : `Save ${item.title} to favourites`}
      aria-pressed={saved}
      onClick={toggle}
      className={`flex items-center justify-center rounded-full bg-white shadow transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${className}`}
      style={{ width: iconSize + 16, height: iconSize + 16 }}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill={saved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={saved ? "text-rose-500" : "text-dark"}
        aria-hidden
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}
