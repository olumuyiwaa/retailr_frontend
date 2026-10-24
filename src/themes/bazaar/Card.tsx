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
  alt,
}: {
  item?: Pick<Product, "title" | "imgs" | "color">;
  className?: string;
  /** Override the alt text ("" when the title is already next to the photo). */
  alt?: string;
}) {
  const src = item?.imgs?.previews?.[0];
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ background: "var(--tint)" }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt ?? item?.title ?? ""}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      ) : (
        <ProductArt seed={item?.title ?? "bazaar"} color={item?.color} showInitial={false} />
      )}
    </div>
  );
}

/** Dense 1688-style card: square image, orange price first, compact title. */
export default function BazaarCard({ item }: { item: Product }) {
  const ctx = useStore();
  if (!ctx) return null;
  const { href, fmt } = ctx;
  const soldOut = item.stock !== undefined && item.stock <= 0;
  const price = priceLabel(item, fmt);
  const hasOriginal = item.price !== undefined && item.price > item.discountedPrice;
  const discount =
    hasOriginal && item.price
      ? Math.round(((item.price - item.discountedPrice) / item.price) * 100)
      : 0;

  const low = !soldOut && item.stock !== undefined && item.stock <= 5;

  return (
    <article
      className="group relative flex flex-col overflow-hidden rounded border bg-white transition-shadow hover:shadow-md"
      style={{ borderColor: "var(--line)" }}
    >
      <Link href={href(`/product/${item.id}`)} className="flex flex-1 flex-col">
        <div className="relative overflow-hidden">
          <ProductPhoto item={item} alt="" className="aspect-square w-full" />
          {hasOriginal && !soldOut && discount > 0 && (
            <span className="absolute left-1.5 top-1.5 rounded px-1.5 py-0.5 text-[11px] font-bold text-white" style={{ background: "var(--brand)" }}>
              -{discount}%
            </span>
          )}
          {isNew(item) && !soldOut && !hasOriginal && (
            <span className="absolute left-1.5 top-1.5 rounded px-1.5 py-0.5 text-[11px] font-bold text-white" style={{ background: "#00875A" }}>
              NEW
            </span>
          )}
          {soldOut && (
            <span className="absolute left-1.5 top-1.5 rounded bg-gray-700 px-1.5 py-0.5 text-[11px] font-bold text-white">
              SOLD OUT
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-0.5 p-2.5">
          <div className="flex flex-wrap items-baseline gap-1.5">
            <span className="text-base font-extrabold leading-none" style={{ color: "var(--brand)" }}>
              {price.from && <span className="mr-0.5 text-[11px] font-semibold">from </span>}
              {price.text}
            </span>
            {hasOriginal && (
              <span className="text-[11px] line-through" style={{ color: "var(--muted)" }}>
                {fmt(item.price!)}
              </span>
            )}
          </div>
          <h3 className="line-clamp-2 text-[13px] font-medium leading-snug text-dark group-hover:underline underline-offset-2">
            {item.title}
          </h3>
          {(item.category || low) && (
            <p className="mt-auto pt-1 text-[11px]" style={{ color: "var(--muted)" }}>
              {item.category}
              {low && (
                <span className="font-semibold" style={{ color: "var(--brand)" }}>
                  {item.category ? " · " : ""}Only {item.stock} left
                </span>
              )}
            </p>
          )}
        </div>
      </Link>
      {/* Sibling of the link (a button inside an anchor is invalid HTML) */}
      <FaveButton item={item} iconSize={18} className="absolute right-1.5 top-1.5" />
    </article>
  );
}
