"use client";
import React from "react";
import Link from "next/link";
import type { Product } from "@/types/product";
import ProductArt from "@/components/Store/ProductArt";
import FaveButton from "@/components/Store/FaveButton";
import { useStore } from "@/app/context/StoreContext";

const NEW_DAYS = 30;

export const isNew = (p: Product) => !!p.createdAt && Date.now() - +new Date(p.createdAt) < NEW_DAYS * 864e5;

/** "from ₦x" when options are priced differently, else the plain price. */
export function priceLabel(p: Product, fmt: (n: number) => string) {
  const prices = p.variants?.length ? p.variants.map((v) => v.price ?? p.discountedPrice) : [p.discountedPrice];
  const lo = Math.min(...prices);
  return Math.max(...prices) !== lo ? { from: true, text: fmt(lo) } : { from: false, text: fmt(lo) };
}

export function Photo({ item, className = "" }: { item?: Pick<Product, "title" | "imgs" | "color">; className?: string }) {
  const src = item?.imgs?.previews?.[0];
  return (
    <div className={`relative overflow-hidden bg-[color:var(--tint)] ${className}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={item?.title ?? ""} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <ProductArt seed={item?.title ?? "atelier"} color={item?.color} showInitial={false} />
      )}
    </div>
  );
}

export default function AtelierCard({ item }: { item: Product }) {
  const ctx = useStore();
  if (!ctx) return null;
  const { href, fmt } = ctx;
  const soldOut = item.stock !== undefined && item.stock <= 0;
  const price = priceLabel(item, fmt);
  return (
    <Link href={href(`/product/${item.id}`)} className="group block">
      <div className="relative">
        <Photo item={item} className="aspect-[4/5] rounded-md" />
        <FaveButton item={item} className="absolute bottom-2 right-2" />
        {isNew(item) && !soldOut && <span className="absolute left-3 top-3 rounded bg-white px-2 py-0.5 text-2xs font-medium text-dark">New</span>}
        {soldOut && <span className="absolute left-3 top-3 rounded bg-dark px-2 py-0.5 text-2xs font-medium text-white">Sold out</span>}
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-3">
        <h3 className="font-medium text-dark underline-offset-4 group-hover:underline">{item.title}</h3>
        <p className="shrink-0 text-custom-sm">
          {price.from && <span className="mr-1">from</span>}
          <span className="font-semibold text-dark">{price.text}</span>
        </p>
      </div>
      {item.category && <p className="text-custom-sm">{item.category}</p>}
    </Link>
  );
}
