"use client";
import BookingPanel from "@/components/Store/BookingPanel";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { useStore } from "@/app/context/StoreContext";
import { useCartModalContext } from "@/app/context/CartSidebarModalContext";
import { addItemToCart } from "@/redux/features/cart-slice";
import { AppDispatch, useAppSelector } from "@/redux/store";
import MarketCard, { ProductPhoto } from "./Card";
import { payPhrase } from "@/lib/paymentCopy";

const divider = { borderColor: "var(--line)" };

/** Keyed by product so quantity, option and photo selection reset when navigating between products. */
export default function MarketProduct({ productId }: { productId: string }) {
  return <ProductView key={productId} productId={productId} />;
}

function ProductView({ productId }: { productId: string }) {
  const ctx = useStore();
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { openCartModal } = useCartModalContext();
  const cartItems = useAppSelector((s) => s.cartReducer.items);
  const [qty, setQty] = useState(1);
  const [variantId, setVariantId] = useState<string | null>(null);
  const [shot, setShot] = useState(0);

  if (!ctx?.store) return null;
  const { store, products, href, fmt } = ctx;
  const product = products.find((p) => String(p.id) === productId);

  if (!product) {
    return (
      <section className="mx-auto max-w-[1680px] px-5 py-24 text-center sm:px-8">
        <h1 className="mb-2 text-4xl font-bold text-dark">Product not found</h1>
        <p className="mb-6" style={{ color: "var(--muted)" }}>
          This product is no longer available.
        </p>
        <Link
          href={href("/shop")}
          className="inline-flex h-12 items-center rounded px-7 font-bold text-white"
          style={{ background: "var(--brand)" }}
        >
          Back to shop
        </Link>
      </section>
    );
  }

  const photos = product.imgs?.previews ?? [];
  const idx = Math.min(shot, Math.max(photos.length - 1, 0));
  const variants = product.variants ?? [];
  const variant =
    variants.find((v) => v.id === variantId) ??
    (variants.length
      ? variants.find((v) => v.stock > 0) ?? variants[0]
      : undefined);
  const unit = variant?.price ?? product.discountedPrice;
  const stock = variant ? variant.stock : product.stock ?? Infinity;
  const soldOut = stock <= 0;
  const lineId = variant ? `${product.id}::${variant.id}` : product.id;
  const inCart = cartItems.find((i) => i.id === lineId)?.quantity ?? 0;
  const room = Math.max(0, stock - inCart);
  const related = products
    .filter(
      (p) =>
        p.id !== product.id &&
        (p.kind ?? "product") === (product.kind ?? "product") &&
        (!product.category || p.category === product.category)
    )
    .slice(0, 5);
  const hasOriginal =
    product.price !== undefined && product.price > product.discountedPrice;

  const put = () => {
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
  };
  const add = () => {
    if (room <= 0) return;
    put();
    openCartModal();
  };
  const buyNow = () => {
    put();
    router.push(href("/checkout"));
  };

  const step =
    "flex h-11 w-11 items-center justify-center text-xl text-dark disabled:opacity-35";

  return (
    <div style={{ background: "var(--wash)" }}>
      <section className="mx-auto w-full max-w-[1680px] px-5 sm:px-8 lg:px-12 2xl:px-20 pb-8 pt-6">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="text-custom-sm mb-6"
          style={{ color: "var(--muted)" }}
        >
          <Link href={href("/")} className="hover:text-dark hover:underline">
            Home
          </Link>{" "}
          /{" "}
          {product.category && (
            <>
              <Link
                href={href(
                  `/shop?category=${encodeURIComponent(product.category)}`
                )}
                className="hover:text-dark hover:underline"
              >
                {product.category}
              </Link>{" "}
              /{" "}
            </>
          )}
          <span className="text-dark font-medium">{product.title}</span>
        </nav>

        <div className="grid gap-8 bg-white rounded-lg border p-6 sm:p-8 lg:grid-cols-[1.1fr_1fr] lg:gap-12" style={divider}>
          {/* Images */}
          <div>
            <ProductPhoto
              item={
                photos.length
                  ? {
                      ...product,
                      imgs: {
                        thumbnails: photos,
                        previews: [photos[idx]],
                      },
                    }
                  : product
              }
              className="aspect-square w-full rounded-lg"
            />
            {photos.length > 1 && (
              <div
                className="mt-3 flex gap-2 overflow-x-auto"
                role="group"
                aria-label="Product photos"
              >
                {photos.map((src, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setShot(i)}
                    aria-label={`Show photo ${i + 1}`}
                    aria-pressed={i === idx}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded border-2 transition-opacity ${
                      i === idx ? "opacity-100" : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                    style={i === idx ? { borderColor: "var(--brand)" } : undefined}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            {product.category && (
              <Link
                href={href(`/shop?category=${encodeURIComponent(product.category)}`)}
                className="text-2xs font-bold uppercase tracking-widest hover:underline"
                style={{ color: "var(--brand)" }}
              >
                {product.category}
              </Link>
            )}
            <h1 className="mt-1 text-3xl font-extrabold leading-tight text-dark sm:text-4xl">
              {product.title}
            </h1>

            {/* Price */}
            <div className="mt-4 flex flex-wrap items-baseline gap-3">
              <span className="text-3xl font-extrabold text-dark">{fmt(unit)}</span>
              {hasOriginal && (
                <span
                  className="text-lg line-through"
                  style={{ color: "var(--muted)" }}
                >
                  {fmt(product.price!)}
                </span>
              )}
              {hasOriginal && (
                <span
                  className="rounded px-2 py-0.5 text-custom-sm font-bold text-white"
                  style={{ background: "var(--brand)" }}
                >
                  SALE
                </span>
              )}
            </div>

            {product.kind === "service" && !!product.durationMins && product.durationMins > 0 && (
              <p className="mt-1 text-custom-sm" style={{ color: "var(--muted)" }}>
                Duration: {product.durationMins} min
              </p>
            )}

            {product.description && (
              <p className="mt-5 leading-relaxed text-dark/80">
                {product.description}
              </p>
            )}

            {/* Variants */}
            {variants.length > 0 && (
              <fieldset className="mt-6">
                <legend className="mb-2.5 text-custom-sm font-semibold text-dark">
                  Option{variant ? `: ${variant.name}` : ""}
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
                        onClick={() => {
                          setVariantId(v.id);
                          setQty(1);
                        }}
                        className={`min-w-[3rem] rounded border px-4 py-2.5 text-custom-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:line-through disabled:opacity-40 ${
                          on ? "text-white" : "bg-white text-dark hover:bg-[color:var(--tint)]"
                        }`}
                        style={
                          on
                            ? { background: "var(--ink)", borderColor: "var(--ink)" }
                            : { borderColor: "var(--line)" }
                        }
                      >
                        {v.name}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )}

            {product.bookable ? (
              <BookingPanel product={product} variantId={variant?.id} price={unit} />
            ) : (
              <>
            {/* Qty + Add to cart */}
            <div className="mt-6 flex flex-wrap gap-3">
              <div
                className="flex items-center rounded border bg-white"
                style={divider}
              >
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  className={step}
                  disabled={qty <= 1 || soldOut}
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                >
                  −
                </button>
                <span
                  className="w-10 text-center font-bold text-dark"
                  aria-live="polite"
                >
                  {soldOut ? 0 : Math.min(qty, Math.max(room, 1))}
                </span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  className={step}
                  disabled={soldOut || qty >= room}
                  onClick={() => setQty((q) => Math.min(room, q + 1))}
                >
                  +
                </button>
              </div>

              <button
                type="button"
                disabled={soldOut || room <= 0}
                onClick={add}
                className="h-11 min-w-[9rem] flex-1 rounded font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ background: soldOut ? "var(--muted)" : "var(--brand)" }}
              >
                {soldOut ? "Sold Out" : room <= 0 ? "Max in Cart" : "Add to Cart"}
              </button>
              <button
                type="button"
                disabled={soldOut || (room <= 0 && inCart === 0)}
                onClick={buyNow}
                className="h-11 rounded border bg-white px-5 font-bold text-dark transition-colors hover:bg-[color:var(--tint)] disabled:cursor-not-allowed disabled:opacity-50"
                style={{ borderColor: "var(--ink)" }}
              >
                Buy Now
              </button>
            </div>

            {!soldOut && typeof stock === "number" && stock <= 5 && (
              <p className="mt-3 text-custom-sm font-semibold" style={{ color: "var(--brand)" }}>
                Only {stock} left in stock!
              </p>
            )}
            {inCart > 0 && (
              <p className="mt-2 text-custom-sm" style={{ color: "var(--muted)" }}>
                {inCart} already in your cart —{" "}
                <Link href={href("/cart")} className="underline hover:text-dark">
                  view cart
                </Link>
              </p>
            )}

              </>
            )}

            {/* Specs */}
            {(!!product.specs?.length || !!product.sku || product.kind !== "service") && (
              <dl
                className="mt-7 grid grid-cols-2 gap-x-6 gap-y-4 border-t pt-6 text-custom-sm"
                style={divider}
              >
                {(product.specs ?? []).map((s) => (
                  <div key={s.label}>
                    <dt style={{ color: "var(--muted)" }}>{s.label}</dt>
                    <dd className="mt-0.5 font-medium text-dark">{s.value}</dd>
                  </div>
                ))}
                {product.sku && (
                  <div>
                    <dt style={{ color: "var(--muted)" }}>SKU</dt>
                    <dd className="mt-0.5 font-medium text-dark">{product.sku}</dd>
                  </div>
                )}
                {product.kind !== "service" && (
                  <div>
                    <dt style={{ color: "var(--muted)" }}>Ships from</dt>
                    <dd className="mt-0.5 font-medium text-dark">
                      {[store.city, store.country].filter(Boolean).join(", ")}
                    </dd>
                  </div>
                )}
              </dl>
            )}

            {/* Delivery note (not for services) */}
            {product.kind !== "service" && (
              <div
                className="mt-6 rounded-lg border p-4 text-custom-sm"
                style={{ borderColor: "var(--line)", background: "var(--tint)" }}
              >
                <p className="font-semibold text-dark">
                  <span aria-hidden>🚚 </span>Delivery
                </p>
                <p className="mt-1" style={{ color: "var(--muted)" }}>
                  {[store.city, store.country].filter(Boolean).length > 0 &&
                    `Ships from ${[store.city, store.country].filter(Boolean).join(", ")}. `}
                  {payPhrase(store.paymentMethods)}.{" "}
                  {store.phone && (
                    <>
                      Questions?{" "}
                      <a
                        href={`tel:${store.phone.replace(/\s/g, "")}`}
                        className="underline hover:text-dark"
                      >
                        {store.phone}
                      </a>
                    </>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Related products */}
      {related.length > 0 && (
        <section className="mx-auto w-full max-w-[1680px] px-5 sm:px-8 lg:px-12 2xl:px-20 pb-14">
          <h2 className="mb-5 text-2xl font-extrabold text-dark">
            You Might Also Like
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {related.map((p) => (
              <MarketCard key={p.id} item={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
