"use client";
import React from "react";
import Link from "next/link";
import type { Product } from "@/types/product";
import ProductArt from "@/components/Store/ProductArt";
import FaveButton from "@/components/Store/FaveButton";
import { useStore } from "@/app/context/StoreContext";

const NEW_DAYS = 30;

export const isNew = (p: Product) => !!p.createdAt && Date.now() - +new Date(p.createdAt) < NEW_DAYS * 864e5;

export function priceLabel(p: Product, fmt: (n: number) => string) {
  const prices = p.variants?.length ? p.variants.map((v) => v.price ?? p.discountedPrice) : [p.discountedPrice];
  const lo = Math.min(...prices);
  return Math.max(...prices) !== lo ? { from: true, text: fmt(lo) } : { from: false, text: fmt(lo) };
}

export function ShopPhoto({ item, className = "" }: { item?: Pick<Product, "title" | "imgs" | "color">; className?: string }) {
  const src = item?.imgs?.previews?.[0];
  return (
    <div className={`relative overflow-hidden bg-[color:var(--tint)] ${className}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={item?.title ?? ""} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <ProductArt seed={item?.title ?? "shop"} color={item?.color} showInitial={false} />
      )}
    </div>
  );
}

/** Heart / save button — backed by Redux + localStorage. */
export default function ShopCard({ item }: { item: Product }) {
  const ctx = useStore();
  if (!ctx) return null;
  const { href, fmt } = ctx;
  const soldOut = item.stock !== undefined && item.stock <= 0;
  const price = priceLabel(item, fmt);
  const hasDiscount = item.price !== undefined && item.price > item.discountedPrice;

  return (
    <Link href={href(`/product/${item.id}`)} className="group block">
      <div className="relative">
        <ShopPhoto item={item} className="aspect-square w-full rounded-xl" />
        <FaveButton item={item} className="absolute bottom-2.5 right-2.5" />
        {/* Discount badge */}
        {hasDiscount && !soldOut && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-rose-500 px-2 py-0.5 text-2xs font-semibold text-white">
            {Math.round(((item.price! - item.discountedPrice) / item.price!) * 100)}% off
          </span>
        )}
        {soldOut && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-dark px-2 py-0.5 text-2xs font-medium text-white">
            Sold out
          </span>
        )}
        {isNew(item) && !soldOut && !hasDiscount && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-blue-600 px-2 py-0.5 text-2xs font-medium text-white">
            New
          </span>
        )}
      </div>

      <div className="mt-2.5 px-0.5">
        {item.category && (
          <p className="text-2xs font-medium uppercase tracking-wider" style={{ color: "var(--muted)" }}>
            {item.category}
          </p>
        )}
        <h3 className="mt-0.5 line-clamp-2 text-custom-sm font-medium leading-snug text-dark group-hover:underline underline-offset-4">
          {item.title}
        </h3>
        <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
          <span className="font-semibold text-dark">
            {price.from && <span className="mr-0.5 font-normal text-custom-sm">from </span>}
            {price.text}
          </span>
          {hasDiscount && (
            <span className="text-custom-sm line-through" style={{ color: "var(--muted)" }}>
              {fmt(item.price!)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
