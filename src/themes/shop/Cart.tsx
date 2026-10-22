"use client";
import React from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { useStore } from "@/app/context/StoreContext";
import {
  removeAllItemsFromCart,
  removeItemFromCart,
  selectTotalPrice,
  updateCartItemQuantity,
} from "@/redux/features/cart-slice";
import { AppDispatch, useAppSelector } from "@/redux/store";
import { ShopPhoto } from "./Card";

const WRAP = "mx-auto w-full max-w-[1680px] px-5 sm:px-8 lg:px-12 2xl:px-20";
const lineStyle = { borderColor: "var(--line)" };

export default function ShopCart() {
  const ctx = useStore();
  const dispatch = useDispatch<AppDispatch>();
  const items = useAppSelector((s) => s.cartReducer.items);
  const total = useSelector(selectTotalPrice);

  if (!ctx?.store) return null;
  const { store, href, fmt } = ctx;

  if (items.length === 0) {
    return (
      <section className={`${WRAP} py-24 text-center`}>
        <svg className="mx-auto mb-5 text-[color:var(--line)]" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
        <h1 className="mb-2 text-3xl font-bold text-dark">Your cart is empty</h1>
        <p className="mb-8 text-base" style={{ color: "var(--muted)" }}>Find something you love and add it here.</p>
        <Link href={href("/shop")} className="inline-flex h-11 items-center rounded-full bg-dark px-8 font-semibold text-white transition-opacity hover:opacity-85">
          Continue shopping
        </Link>
      </section>
    );
  }

  const qtyBtn = "flex h-8 w-8 items-center justify-center rounded-full text-base font-medium text-dark transition-colors hover:bg-[color:var(--tint)] disabled:opacity-30";

  return (
    <section className={`${WRAP} pb-10 pt-7`}>
      {/* Header */}
      <nav aria-label="Breadcrumb" className="mb-4 text-custom-sm" style={{ color: "var(--muted)" }}>
        <Link href={href("/")} className="transition-colors hover:text-dark">Home</Link>
        <span className="mx-1.5" aria-hidden>/</span>
        <span className="text-dark">Cart</span>
      </nav>
      <div className="mb-7 flex items-end justify-between gap-3">
        <h1 className="text-3xl font-bold text-dark sm:text-4xl">Your cart</h1>
        <button
          onClick={() => dispatch(removeAllItemsFromCart())}
          className="pb-0.5 text-custom-sm underline underline-offset-4 transition-colors hover:text-dark"
          style={{ color: "var(--muted)" }}
        >
          Clear cart
        </button>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_360px]">
        {/* Items */}
        <ul className="divide-y rounded-2xl border" style={lineStyle}>
          {items.map((item) => {
            const max = item.stock ?? Infinity;
            return (
              <li key={item.id} className="flex gap-4 p-4 sm:gap-5 sm:p-5" style={lineStyle}>
                <Link href={href(`/product/${item.productId ?? item.id}`)} className="block w-20 shrink-0 sm:w-24" aria-label={item.title}>
                  <ShopPhoto item={item} className="aspect-square w-full rounded-xl" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col justify-between">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-dark leading-snug">
                        <Link href={href(`/product/${item.productId ?? item.id}`)}>{item.title}</Link>
                      </h3>
                      <p className="mt-0.5 text-custom-sm" style={{ color: "var(--muted)" }}>{fmt(item.discountedPrice)} each</p>
                    </div>
                    <p className="shrink-0 font-bold text-dark">{fmt(item.discountedPrice * item.quantity)}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1 rounded-full border px-1 py-0.5" style={lineStyle}>
                      <button className={qtyBtn} aria-label={`Decrease ${item.title}`} disabled={item.quantity <= 1} onClick={() => dispatch(updateCartItemQuantity({ id: item.id, quantity: item.quantity - 1 }))}>−</button>
                      <span className="w-7 text-center font-semibold text-dark" aria-live="polite">{item.quantity}</span>
                      <button className={qtyBtn} aria-label={`Increase ${item.title}`} disabled={item.quantity >= max} onClick={() => dispatch(updateCartItemQuantity({ id: item.id, quantity: item.quantity + 1 }))}>+</button>
                    </div>
                    <button
                      onClick={() => dispatch(removeItemFromCart(item.id))}
                      className="text-custom-sm underline underline-offset-4 transition-colors hover:text-dark"
                      style={{ color: "var(--muted)" }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {/* Order summary */}
        <aside className="rounded-2xl border p-6 lg:sticky lg:top-28" style={lineStyle}>
          <h2 className="text-xl font-bold text-dark">Order summary</h2>
          <dl className="mt-5 space-y-3 text-custom-sm">
            <div className="flex justify-between">
              <dt style={{ color: "var(--muted)" }}>Subtotal</dt>
              <dd className="font-semibold text-dark">{fmt(total)}</dd>
            </div>
            <div className="flex justify-between">
              <dt style={{ color: "var(--muted)" }}>Delivery</dt>
              <dd className="text-dark">Arranged by {store.name}</dd>
            </div>
          </dl>
          <div className="mt-5 flex items-baseline justify-between border-t pt-5" style={lineStyle}>
            <span className="font-semibold text-dark">Total</span>
            <span className="text-2xl font-bold text-dark">{fmt(total)}</span>
          </div>
          <Link
            href={href("/checkout")}
            className="mt-5 flex h-12 items-center justify-center rounded-full bg-dark font-semibold text-white transition-opacity hover:opacity-85"
          >
            Checkout
          </Link>
          <Link
            href={href("/shop")}
            className="mt-3 block text-center text-custom-sm underline underline-offset-4 transition-colors hover:text-dark"
            style={{ color: "var(--muted)" }}
          >
            Continue shopping
          </Link>
        </aside>
      </div>
    </section>
  );
}
