"use client";
import BookingPanel from "@/components/Store/BookingPanel";
import React, { useState } from "react";
import Link from "next/link";
import { useDispatch } from "react-redux";
import { useStore } from "@/app/context/StoreContext";
import { useCartModalContext } from "@/app/context/CartSidebarModalContext";
import { addItemToCart } from "@/redux/features/cart-slice";
import { AppDispatch, useAppSelector } from "@/redux/store";
import AtelierCard, { Photo } from "./Card";
import { whatsappLink } from "./whatsapp";
import { payPhrase } from "@/lib/paymentCopy";

const line = { borderColor: "var(--line)" };

function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group border-b py-4" style={line}>
      <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-dark">
        {title}
        <span className="text-xl leading-none transition-transform group-open:rotate-45" aria-hidden>+</span>
      </summary>
      <div className="pt-3 text-custom-sm leading-relaxed">{children}</div>
    </details>
  );
}

export default function AtelierProduct({ productId }: { productId: string }) {
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
      <section className="mx-auto max-w-[1680px] px-5 py-24 text-center sm:px-8">
        <h1 className="mb-2 text-4xl font-bold text-dark">Product not found</h1>
        <p className="mb-6">This product doesn&apos;t exist or is no longer available.</p>
        <Link href={href("/shop")} className="inline-flex h-12 items-center rounded-md px-7 font-medium text-white" style={{ background: "var(--ink)" }}>Back to shop</Link>
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
  const related = products.filter((p) => p.id !== product.id && (!product.category || p.category === product.category)).slice(0, 4);
  const wa = whatsappLink(store.phone, `Hi ${store.name}, I have a question about ${product.title}.`);

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

  const step = "flex h-12 w-11 items-center justify-center text-lg text-dark disabled:opacity-35";
  const details: [string, string][] = [
    ...(product.specs ?? []).map((s): [string, string] => [s.label, s.value]),
    ...(product.category ? ([["Category", product.category]] as [string, string][]) : []),
    ...(product.sku ? ([["SKU", product.sku]] as [string, string][]) : []),
    ...(product.kind === "service" ? [] : ([["Ships from", `${store.city}, ${store.country}`]] as [string, string][])),
    ["Payment", payPhrase(store.paymentMethods, "cash")],
  ];

  return (
    <>
      <section className="mx-auto w-full max-w-[1680px] px-5 pb-6 pt-8 sm:px-8 lg:px-12 2xl:px-20">
        <nav aria-label="Breadcrumb" className="text-custom-sm">
          <Link href={href("/")} className="hover:text-dark">Home</Link> /{" "}
          {product.category && (<><Link href={href(`/shop?category=${encodeURIComponent(product.category)}`)} className="hover:text-dark">{product.category}</Link> / </>)}
          <span className="text-dark">{product.title}</span>
        </nav>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          <div>
            <Photo
              item={photos.length ? { ...product, imgs: { thumbnails: photos, previews: [photos[idx]] } } : product}
              className="aspect-[4/5] w-full rounded-md"
            />
            {photos.length > 1 && (
              <div className="mt-3 flex gap-2.5 overflow-x-auto" role="group" aria-label="Product photos">
                {photos.map((src, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setShot(i)}
                    aria-label={`Show photo ${i + 1}`}
                    aria-pressed={i === idx}
                    className={`h-20 w-16 shrink-0 overflow-hidden rounded border-2 ${i === idx ? "" : "border-transparent opacity-70 hover:opacity-100"}`}
                    style={i === idx ? { borderColor: "var(--ink)" } : undefined}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="max-w-[560px]">
            <h1 className="text-4xl font-bold leading-tight text-dark sm:text-5xl">{product.title}</h1>
            {product.category && <p className="mt-1 text-xl">{product.category}</p>}
            <p className="mt-6 text-3xl font-bold text-dark">{fmt(unit)}</p>
            {product.kind === "service" && !!product.durationMins && <p className="mt-1 text-sm text-body">{product.durationMins} min</p>}
            {product.description && <p className="mt-5 text-lg leading-relaxed text-dark/85">{product.description}</p>}

            {variants.length > 0 && (
              <fieldset className="mt-7">
                <legend className="mb-3 text-custom-sm text-dark"><span className="font-medium">Option</span>{variant && <span> · {variant.name}</span>}</legend>
                <div className="flex flex-wrap gap-2.5">
                  {variants.map((v) => {
                    const on = variant?.id === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        aria-pressed={on}
                        disabled={v.stock <= 0}
                        onClick={() => { setVariantId(v.id); setQty(1); }}
                        className={`min-w-[3.25rem] rounded-md border px-4 py-3 text-custom-sm font-medium disabled:cursor-not-allowed disabled:line-through disabled:opacity-40 ${on ? "text-white" : "bg-white/60 text-dark hover:bg-white"}`}
                        style={on ? { background: "var(--ink)", borderColor: "var(--ink)" } : line}
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
              <>
            <div className="mt-7 flex gap-3">
              <div className="flex items-center rounded-md border bg-white/60" style={line}>
                <button type="button" aria-label="Decrease quantity" className={step} disabled={qty <= 1 || soldOut} onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
                <span className="w-8 text-center font-medium text-dark" aria-live="polite">{soldOut ? 0 : Math.min(qty, Math.max(room, 1))}</span>
                <button type="button" aria-label="Increase quantity" className={step} disabled={soldOut || qty >= room} onClick={() => setQty((q) => Math.min(room, q + 1))}>+</button>
              </div>
              <button
                type="button"
                disabled={soldOut || room <= 0}
                onClick={add}
                className="h-12 flex-1 rounded-md font-medium text-white ease-out duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ background: "var(--ink)" }}
              >
                {soldOut ? "Sold out" : room <= 0 ? "Max in bag" : `Add to bag · ${fmt(unit)}`}
              </button>
            </div>
            {!soldOut && stock <= 5 && <p className="mt-3 text-custom-sm font-medium text-dark">Only {stock} left</p>}
            {inCart > 0 && <p className="mt-3 text-custom-sm">{inCart} already in your bag</p>}
              </>
            )}
            {wa && (
              <p className="mt-4 text-custom-sm">
                Questions about this one?{" "}
                <a href={wa} target="_blank" rel="noopener noreferrer" className="text-dark underline underline-offset-4">Ask us on WhatsApp</a>
              </p>
            )}

            <dl className="mt-9 grid grid-cols-2 gap-x-6 gap-y-5 border-t pt-7 text-custom-sm" style={line}>
              {details.map(([k, v], i) => (
                <div key={`${k}-${i}`}>
                  <dt>{k}</dt>
                  <dd className="mt-0.5 text-base text-dark">{v}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-7 border-t" style={line}>
              <Accordion title={product.kind === "service" ? "Payment" : "Delivery & payment"}>
                {product.kind === "service" ? "" : `Orders ship from ${store.city}, ${store.country}. `}{payPhrase(store.paymentMethods)}
                {store.phone ? <>; call {store.phone} for anything else.</> : "."}
              </Accordion>
            </div>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="mx-auto w-full max-w-[1680px] px-5 pt-14 sm:px-8 lg:px-12 2xl:px-20">
          <h2 className="mb-8 text-3xl font-bold text-dark">You might also like</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
            {related.map((p) => <AtelierCard key={p.id} item={p} />)}
          </div>
        </section>
      )}
    </>
  );
}
