"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useDispatch } from "react-redux";
import { useStore } from "@/app/context/StoreContext";
import { useCartModalContext } from "@/app/context/CartSidebarModalContext";
import { addItemToCart } from "@/redux/features/cart-slice";
import { AppDispatch, useAppSelector } from "@/redux/store";
import BookingPanel from "@/components/Store/BookingPanel";
import ShopCard, { ShopPhoto } from "./Card";
import { payPhrase } from "@/lib/paymentCopy";

const WRAP = "mx-auto w-full max-w-[1680px] px-5 sm:px-8 lg:px-12 2xl:px-20";
const lineStyle = { borderColor: "var(--line)" };

function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group border-b py-4" style={lineStyle}>
      <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-dark">
        {title}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-open:rotate-180" aria-hidden>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </summary>
      <div className="pt-3 text-custom-sm leading-relaxed" style={{ color: "var(--muted)" }}>{children}</div>
    </details>
  );
}

export default function ShopProduct({ productId }: { productId: string }) {
  const ctx = useStore();
  const dispatch = useDispatch<AppDispatch>();
  const { openCartModal } = useCartModalContext();
  const cartItems = useAppSelector((s) => s.cartReducer.items);
  const [qty, setQty] = useState(1);
  const [variantId, setVariantId] = useState<string | null>(null);
  const [shot, setShot] = useState(0);
  const [seenId, setSeenId] = useState(productId);
  // a different product (e.g. from "You might also like") starts fresh
  if (seenId !== productId) {
    setSeenId(productId);
    setQty(1);
    setVariantId(null);
    setShot(0);
  }

  if (!ctx?.store) return null;
  const { store, products, href, fmt } = ctx;
  const product = products.find((p) => String(p.id) === productId);

  if (!product) {
    return (
      <section className={`${WRAP} py-24 text-center`}>
        <h1 className="mb-2 text-4xl font-bold text-dark">Product not found</h1>
        <p className="mb-6 text-body">This product doesn&apos;t exist or is no longer available.</p>
        <Link href={href("/shop")} className="inline-flex h-11 items-center rounded-full bg-dark px-8 font-semibold text-white">
          Back to shop
        </Link>
      </section>
    );
  }

  const photos = product.imgs?.previews ?? [];
  const idx = Math.min(shot, Math.max(photos.length - 1, 0));
  const variants = product.variants ?? [];
  const variant = variants.find((v) => v.id === variantId) ?? (variants.length ? variants.find((v) => v.stock > 0) ?? variants[0] : undefined);
  const unit = variant?.price ?? product.discountedPrice;
  const stock = variant ? variant.stock : product.stock ?? Infinity;
  const soldOut = stock <= 0;
  const lineId = variant ? `${product.id}::${variant.id}` : product.id;
  const inCart = cartItems.find((i) => i.id === lineId)?.quantity ?? 0;
  const room = Math.max(0, stock - inCart);
  const related = products.filter((p) => p.id !== product.id && (!product.category || p.category === product.category)).slice(0, 5);
  const hasDiscount = variant?.price === undefined && product.price !== undefined && product.price > product.discountedPrice;

  const add = () => {
    if (room <= 0) return;
    dispatch(
      addItemToCart({
        ...product,
        id: lineId,
        title: variant ? `${product.title} · ${variant.name}` : product.title,
        price: unit,
        discountedPrice: unit,
        stock,
        productId: variant ? String(product.id) : undefined,
        variantId: variant?.id,
        quantity: Math.min(qty, room),
      })
    );
    openCartModal();
  };

  const details: [string, string][] = [
    ...(product.specs ?? []).map((s): [string, string] => [s.label, s.value]),
    ...(product.category ? ([["Category", product.category]] as [string, string][]) : []),
    ...(product.sku ? ([["SKU", product.sku]] as [string, string][]) : []),
    ...(product.kind === "service" ? [] : ([["Ships from", `${store.city}, ${store.country}`]] as [string, string][])),
    ["Payment", payPhrase(store.paymentMethods, "cash")],
  ];

  const qtyBtn = "flex h-10 w-10 items-center justify-center rounded-full text-lg font-medium text-dark transition-colors hover:bg-[color:var(--tint)] disabled:opacity-30";

  return (
    <>
      <section className={`${WRAP} pb-8 pt-6`}>
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 text-custom-sm" style={{ color: "var(--muted)" }}>
          <Link href={href("/")} className="transition-colors hover:text-dark">Home</Link>
          {product.category && (
            <>
              <span className="mx-1.5" aria-hidden>/</span>
              <Link href={href(`/shop?category=${encodeURIComponent(product.category)}`)} className="transition-colors hover:text-dark">{product.category}</Link>
            </>
          )}
          <span className="mx-1.5" aria-hidden>/</span>
          <span className="text-dark">{product.title}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
          {/* Photo gallery */}
          <div>
            <ShopPhoto
              item={photos.length ? { ...product, imgs: { thumbnails: photos, previews: [photos[idx]] } } : product}
              className="aspect-square w-full rounded-2xl"
            />
            {photos.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto" role="group" aria-label="Product photos">
                {photos.map((src, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setShot(i)}
                    aria-label={`Show photo ${i + 1}`}
                    aria-pressed={i === idx}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-opacity ${i === idx ? "opacity-100" : "border-transparent opacity-55 hover:opacity-80"}`}
                    style={i === idx ? { borderColor: "var(--ink)" } : undefined}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product info */}
          <div>
            {product.category && (
              <p className="mb-1.5 text-custom-sm font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                {product.category}
              </p>
            )}
            <h1 className="text-2xl font-bold leading-tight text-dark sm:text-3xl">{product.title}</h1>

            {/* Price */}
            <div className="mt-4 flex items-baseline gap-3 flex-wrap">
              <span className="text-2xl font-bold text-dark">{fmt(unit)}</span>
              {hasDiscount && (
                <>
                  <span className="text-lg line-through" style={{ color: "var(--muted)" }}>{fmt(product.price!)}</span>
                  <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-custom-sm font-semibold text-rose-600">
                    {Math.round(((product.price! - product.discountedPrice) / product.price!) * 100)}% off
                  </span>
                </>
              )}
            </div>
            {product.kind === "service" && !!product.durationMins && (
              <p className="mt-1 text-custom-sm" style={{ color: "var(--muted)" }}>{product.durationMins} min</p>
            )}

            {/* Description */}
            {product.description && (
              <p className="mt-4 text-base leading-relaxed" style={{ color: "var(--muted)" }}>{product.description}</p>
            )}

            {/* Variants */}
            {variants.length > 0 && (
              <fieldset className="mt-6">
                <legend className="mb-2.5 text-custom-sm font-semibold text-dark">
                  Option{variant && <span className="font-normal" style={{ color: "var(--muted)" }}> · {variant.name}</span>}
                </legend>
                <div className="flex flex-wrap gap-2">
                  {variants.map((v) => {
                    const on = variant?.id === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        aria-pressed={on}
                        disabled={v.stock <= 0}
                        onClick={() => { setVariantId(v.id); setQty(1); }}
                        className={`min-w-[3rem] rounded-full border px-4 py-2.5 text-custom-sm font-medium transition-colors disabled:cursor-not-allowed disabled:line-through disabled:opacity-40 ${on ? "bg-dark text-white" : "bg-white text-dark hover:border-dark"}`}
                        style={!on ? lineStyle : undefined}
                      >
                        {v.name}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )}

            {product.bookable ? (
              <BookingPanel key={String(product.id)} product={product} variantId={variant?.id} price={unit} />
            ) : (
              <div className="mt-5 flex gap-3">
                {/* Qty stepper */}
                <div className="flex items-center gap-1 rounded-full border px-1" style={lineStyle}>
                  <button type="button" aria-label="Decrease quantity" className={qtyBtn} disabled={qty <= 1 || soldOut} onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
                  <span className="w-8 text-center font-semibold text-dark" aria-live="polite">{soldOut ? 0 : Math.min(qty, Math.max(room, 1))}</span>
                  <button type="button" aria-label="Increase quantity" className={qtyBtn} disabled={soldOut || qty >= room} onClick={() => setQty((q) => Math.min(room, q + 1))}>+</button>
                </div>
                {/* Add to cart */}
                <button
                  type="button"
                  disabled={soldOut || room <= 0}
                  onClick={add}
                  className="h-12 flex-1 rounded-full bg-dark font-semibold text-white transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {soldOut ? "Sold out" : room <= 0 ? "Max in cart" : "Add to cart"}
                </button>
              </div>
            )}

            {!product.bookable && !soldOut && stock <= 5 && <p className="mt-3 text-custom-sm font-semibold text-rose-700">Only {stock} left in stock</p>}
            {!product.bookable && inCart > 0 && <p className="mt-2 text-custom-sm" style={{ color: "var(--muted)" }}>{inCart} already in your cart</p>}

            {/* Details accordion */}
            <div className="mt-8">
              <Accordion title="Details & specifications">
                {details.length ? (
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
                    {details.map(([k, v], i) => (
                      <div key={`${k}-${i}`}>
                        <dt className="font-medium text-dark">{k}</dt>
                        <dd className="mt-0.5">{v}</dd>
                      </div>
                    ))}
                  </dl>
                ) : "No additional details."}
              </Accordion>
              <Accordion title={product.kind === "service" ? "Payment" : "Delivery & payment"}>
                {product.kind === "service" ? "" : `Orders ship from ${store.city}, ${store.country}. `}{payPhrase(store.paymentMethods)}
                {store.phone ? <>; call {store.phone} for queries.</> : "."}
              </Accordion>
            </div>
          </div>
        </div>
      </section>

      {/* Related products */}
      {related.length > 0 && (
        <section className={`${WRAP} pt-10 pb-16`}>
          <h2 className="mb-5 text-xl font-bold text-dark sm:text-2xl">You might also like</h2>
          <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 lg:grid-cols-5">
            {related.map((p) => <ShopCard key={p.id} item={p} />)}
          </div>
        </section>
      )}
    </>
  );
}
