"use client";
import React from "react";
import Link from "next/link";
import type { Product } from "@/types/product";
import ProductArt from "@/components/Store/ProductArt";
import FaveButton from "@/components/Store/FaveButton";
import { useStore } from "@/app/context/StoreContext";

const NEW_DAYS = 30;

export const isNew = (p: Product) =>
  !!p.createdAt && Date.now() - +new Date(p.createdAt) < NEW_DAYS * 864e5;

/** "from ₦x" when option prices differ, else plain price. */
export function priceLabel(p: Product, fmt: (n: number) => string) {
  const prices = p.variants?.length
    ? p.variants.map((v) => v.price ?? p.discountedPrice)
    : [p.discountedPrice];
  const lo = Math.min(...prices);
  return Math.max(...prices) !== lo
    ? { from: true, text: fmt(lo) }
    : { from: false, text: fmt(lo) };
}

export function ProductPhoto({
  item,
  className = "",
}: {
  item?: Pick<Product, "title" | "imgs" | "color">;
  className?: string;
}) {
  const src = item?.imgs?.previews?.[0];
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: "var(--tint)" }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={item?.title ?? ""}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <ProductArt
          seed={item?.title ?? "market"}
          color={item?.color}
          showInitial={false}
        />
      )}
    </div>
  );
}

/** Horizontal list-style card used in the cart */
export function MarketCartPhoto({
  item,
  className = "",
}: {
  item?: Pick<Product, "title" | "imgs" | "color">;
  className?: string;
}) {
  return <ProductPhoto item={item} className={className} />;
}

export default function MarketCard({ item }: { item: Product }) {
  const ctx = useStore();
  if (!ctx) return null;
  const { href, fmt } = ctx;
  const soldOut = item.stock !== undefined && item.stock <= 0;
  const price = priceLabel(item, fmt);
  const hasOriginal =
    item.price !== undefined && item.price > item.discountedPrice;

  return (
    <Link href={href(`/product/${item.id}`)} className="group block bg-white rounded border hover:shadow-md transition-shadow duration-200" style={{ borderColor: "var(--line)" }}>
      {/* Image */}
      <div className="relative overflow-hidden rounded-t">
        <ProductPhoto item={item} className="aspect-square w-full" />
        <FaveButton item={item} className="absolute bottom-2 right-2" />
        {/* Badge */}
        {isNew(item) && !soldOut && (
          <span
            className="absolute left-2 top-2 rounded px-2 py-0.5 text-2xs font-bold text-white"
            style={{ background: "var(--brand)" }}
          >
            NEW
          </span>
        )}
        {soldOut && (
          <span className="absolute left-2 top-2 rounded bg-gray-600 px-2 py-0.5 text-2xs font-bold text-white">
            SOLD OUT
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3
          className="line-clamp-2 text-custom-sm font-medium leading-snug text-dark group-hover:underline underline-offset-2"
        >
          {item.title}
        </h3>
        {item.category && (
          <p className="mt-0.5 text-2xs" style={{ color: "var(--muted)" }}>
            {item.category}
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-baseline gap-1.5">
          <span className="font-bold text-dark">
            {price.from && <span className="mr-0.5 text-2xs font-normal">from</span>}
            {price.text}
          </span>
          {hasOriginal && (
            <span className="text-2xs line-through" style={{ color: "var(--muted)" }}>
              {fmt(item.price!)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
