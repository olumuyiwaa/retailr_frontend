"use client";
import BookingPanel from "./BookingPanel";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import StoreCrumbs from "./StoreCrumbs";
import StoreProductCard from "./StoreProductCard";
import StoreGallery from "./StoreGallery";
import { useStore } from "@/app/context/StoreContext";
import { useCartModalContext } from "@/app/context/CartSidebarModalContext";
import { addItemToCart } from "@/redux/features/cart-slice";
import { AppDispatch, useAppSelector } from "@/redux/store";

const ring = { ["--tw-ring-color" as string]: "var(--line)" } as React.CSSProperties;

export default function StoreProductDetails({ productId }: { productId: string }) {
  const ctx = useStore();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { openCartModal } = useCartModalContext();
  const cartItems = useAppSelector((s) => s.cartReducer.items);
  const [qty, setQty] = useState(1);
  const [variantId, setVariantId] = useState<string | null>(null);

  if (!ctx?.store) return null;
  const { store, products, href, fmt } = ctx;
  const product = products.find((p) => String(p.id) === productId);

  if (!product) {
    return (
      <section className="store-container mx-auto px-4 py-24 text-center sm:px-8">
        <h1 className="mb-2 text-4xl font-bold text-dark">Product not found</h1>
        <p className="mb-7">This product doesn&apos;t exist or is no longer available.</p>
        <Link href={href("/shop")} className="inline-flex h-12 items-center rounded-full px-8 font-medium" style={{ background: "var(--brand)", color: "var(--brand-fg)" }}>
          Back to shop
        </Link>
      </section>
    );
  }

  const variants = product.variants ?? [];
  const variant = variants.find((v) => v.id === variantId) ?? (variants.length ? variants.find((v) => v.stock > 0) ?? variants[0] : undefined);
  const unitPrice = variant?.price ?? product.discountedPrice;
  const stock = variant ? variant.stock : product.stock ?? Infinity;
  const soldOut = stock <= 0;
  const lineId = variant ? `${product.id}::${variant.id}` : product.id;
  const inCart = cartItems.find((i) => i.id === lineId)?.quantity ?? 0;
  const room = Math.max(0, stock - inCart); // how many more can still be added
  const related = products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);

  const add = () => {
    if (room <= 0) return;
    dispatch(
      addItemToCart({
        ...product,
        id: lineId,
        title: variant ? `${product.title} · ${variant.name}` : product.title,
        price: unitPrice,
        discountedPrice: unitPrice,
        stock,
        productId: variant ? String(product.id) : undefined,
        variantId: variant?.id,
        quantity: Math.min(qty, room),
      })
    );
  };

  const stepBtn = "flex h-12 w-12 items-center justify-center text-xl text-dark ease-out duration-200 disabled:opacity-35";

  return (
    <>
      <section className="store-container mx-auto px-4 pb-6 pt-8 sm:px-8 sm:pt-10">
        <StoreCrumbs
          trail={[
            { label: "Shop", to: href("/shop") },
            ...(product.category ? [{ label: product.category, to: href(`/shop?category=${encodeURIComponent(product.category)}`) }] : []),
            { label: product.title },
          ]}
        />

        <div className="mt-8 grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <StoreGallery key={String(product.id)} title={product.title} images={product.imgs?.previews ?? []} color={product.color} />
          </div>

          <div className="max-w-[540px]">
            <h1 className="text-4xl font-bold leading-[1.05] text-dark sm:text-5xl">{product.title}</h1>

            <p className="mt-5 font-display text-3xl font-semibold text-dark">{fmt(unitPrice)}</p>
            {product.kind === "service" && product.durationMins && <p className="mt-1 text-sm text-body">{product.durationMins} min</p>}

            <p className="mt-3 text-custom-sm font-medium" style={{ color: soldOut ? "#b42318" : "var(--ink)" }}>
              {soldOut ? "Sold out" : product.kind === "service" ? "Available" : stock <= 5 ? `Only ${stock} left` : "In stock"}
            </p>

            {variants.length > 0 && (
              <fieldset className="mt-6">
                <legend className="mb-2.5 text-custom-sm font-medium text-dark">
                  Choose an option{variant ? <span className="font-normal"> · {variant.name}</span> : null}
                </legend>
                <div className="flex flex-wrap gap-2.5">
                  {variants.map((v) => {
                    const out = v.stock <= 0;
                    const on = variant?.id === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        aria-pressed={on}
                        disabled={out}
                        onClick={() => { setVariantId(v.id); setQty(1); }}
                        className={`min-w-[3rem] rounded-full px-5 py-2.5 text-custom-sm font-medium ring-1 ring-inset duration-200 disabled:cursor-not-allowed disabled:line-through disabled:opacity-40 ${on ? "" : "bg-white text-dark hover:bg-[color:var(--tint)]"}`}
                        style={on ? { background: "var(--brand)", color: "var(--brand-fg)", ["--tw-ring-color" as string]: "var(--brand)" } : { ["--tw-ring-color" as string]: "var(--line)" }}
                      >
                        {v.name}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )}

            {product.description && <p className="mt-6 text-lg leading-relaxed">{product.description}</p>}

            {product.bookable ? (
              <BookingPanel product={product} variantId={variant?.id} price={unitPrice} />
            ) : (
              <>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <div className="flex items-center rounded-full bg-white ring-1 ring-inset" style={ring}>
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  disabled={qty <= 1 || soldOut}
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className={stepBtn}
                >
                  −
                </button>
                <span className="flex h-12 w-10 items-center justify-center font-medium text-dark" aria-live="polite">
                  {soldOut ? 0 : Math.min(qty, Math.max(room, 1))}
                </span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  disabled={soldOut || qty >= room}
                  onClick={() => setQty((q) => Math.min(room, q + 1))}
                  className={stepBtn}
                >
                  +
                </button>
              </div>
              {inCart > 0 && <span className="text-custom-sm">{inCart} already in your cart</span>}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                disabled={soldOut || room <= 0}
                onClick={() => {
                  add();
                  openCartModal();
                }}
                className="inline-flex h-14 items-center justify-center rounded-full px-8 font-medium ease-out duration-200 hover:brightness-90 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ background: "var(--brand)", color: "var(--brand-fg)" }}
              >
                {soldOut ? "Sold out" : room <= 0 ? "Max in cart" : "Add to cart"}
              </button>
              <button
                type="button"
                disabled={soldOut || (room <= 0 && inCart === 0)}
                onClick={() => {
                  add();
                  router.push(href("/checkout"));
                }}
                className="inline-flex h-14 items-center justify-center rounded-full px-8 font-medium text-dark ring-1 ring-inset ease-out duration-200 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                style={{ ["--tw-ring-color" as string]: "color-mix(in srgb, var(--ink) 35%, transparent)" } as React.CSSProperties}
              >
                Buy now
              </button>
            </div>

              </>
            )}

            <dl className="mt-10 divide-y border-y text-custom-sm" style={{ borderColor: "var(--line)" }}>
              {[
                ...(product.specs ?? []).map((s): [string, string] => [s.label, s.value]),
                ["Payment", "Cash on delivery or bank transfer"],
                ["Ships from", `${store.city}, ${store.country}`],
                ...(product.category ? [["Category", product.category]] : []),
                ...(product.sku ? [["SKU", product.sku]] : []),
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-6 py-3.5" style={{ borderColor: "var(--line)" }}>
                  <dt>{k}</dt>
                  <dd className="text-right font-medium text-dark">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="store-container mx-auto px-4 pt-14 sm:px-8">
          <h2 className="mb-8 text-3xl font-bold text-dark sm:text-4xl">You may also like</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
            {related.map((item) => (
              <StoreProductCard item={item} key={item.id} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
