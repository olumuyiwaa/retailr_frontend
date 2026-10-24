"use client";
import React from "react";
import Link from "next/link";
import { useDispatch } from "react-redux";
import StoreCrumbs from "./StoreCrumbs";
import ProductThumb from "@/components/Common/ProductThumb";
import { useStore } from "@/app/context/StoreContext";
import { removeAllItemsFromCart, removeItemFromCart, selectTotalPrice, updateCartItemQuantity } from "@/redux/features/cart-slice";
import { AppDispatch, useAppSelector } from "@/redux/store";
import { useSelector } from "react-redux";

const card = "rounded-3xl bg-white ring-1 ring-inset ring-[color:var(--line)]";

export default function StoreCart() {
  const ctx = useStore();
  const dispatch = useDispatch<AppDispatch>();
  const items = useAppSelector((s) => s.cartReducer.items);
  const total = useSelector(selectTotalPrice);
  if (!ctx?.store) return null;
  const { href, fmt } = ctx;

  if (items.length === 0) {
    return (
      <section className="store-container mx-auto px-4 py-24 text-center sm:px-8">
        <h1 className="mb-2 text-4xl font-bold text-dark">Your cart is empty!</h1>
        <p className="mb-8">Pick something you like and it will show up here.</p>
        <Link href={href("/shop")} className="inline-flex h-12 items-center rounded-full px-8 font-medium" style={{ background: "var(--brand)", color: "var(--brand-fg)" }}>
          Continue shopping
        </Link>
      </section>
    );
  }

  const stepBtn = "flex h-9 w-9 items-center justify-center text-lg text-dark disabled:opacity-35";

  return (
    <section className="store-container mx-auto px-4 pb-8 pt-8 sm:px-8 sm:pt-10">
      <StoreCrumbs trail={[{ label: "Cart" }]} />
      <div className="mb-8 mt-5 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-4xl font-bold text-dark sm:text-5xl">Your Cart</h1>
        <button onClick={() => dispatch(removeAllItemsFromCart())} className="pb-1 text-custom-sm font-medium text-dark underline underline-offset-4">
          Clear cart
        </button>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_380px]">
        <ul className={`${card} divide-y divide-[color:var(--line)] px-4 sm:px-7`}>
          {items.map((item) => {
            const max = item.stock ?? Infinity;
            return (
              <li key={item.id} className="flex gap-4 py-5 sm:gap-6">
                <Link href={href(`/product/${item.productId ?? item.id}`)} className="block h-24 w-20 shrink-0 overflow-hidden rounded-xl sm:h-28 sm:w-24" aria-label={item.title}>
                  <ProductThumb item={item} variant="thumbnail" size={96} />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col justify-between">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-display text-lg font-semibold text-dark">
                        <Link href={href(`/product/${item.productId ?? item.id}`)}>{item.title}</Link>
                      </h3>
                      <p className="text-custom-sm">{fmt(item.discountedPrice)} each</p>
                    </div>
                    <p className="font-display text-lg font-semibold text-dark">{fmt(item.discountedPrice * item.quantity)}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center rounded-full ring-1 ring-inset ring-[color:var(--line)]">
                      <button
                        className={stepBtn}
                        aria-label={`Decrease ${item.title}`}
                        disabled={item.quantity <= 1}
                        onClick={() => dispatch(updateCartItemQuantity({ id: item.id, quantity: item.quantity - 1 }))}
                      >
                        −
                      </button>
                      <span className="w-8 text-center font-medium text-dark" aria-live="polite">{item.quantity}</span>
                      <button
                        className={stepBtn}
                        aria-label={`Increase ${item.title}`}
                        disabled={item.quantity >= max}
                        onClick={() => dispatch(updateCartItemQuantity({ id: item.id, quantity: item.quantity + 1 }))}
                      >
                        +
                      </button>
                    </div>
                    <button onClick={() => dispatch(removeItemFromCart(item.id))} className="text-custom-sm underline underline-offset-4 hover:text-dark">
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <aside className={`${card} p-6 sm:p-7 lg:sticky lg:top-28`}>
          <h2 className="font-display text-2xl font-bold text-dark">Order summary</h2>
          <dl className="mt-5 space-y-3 text-custom-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd className="font-medium text-dark">{fmt(total)}</dd></div>
            <div className="flex justify-between"><dt>Delivery</dt><dd className="text-dark">Arranged by {ctx.store.name}</dd></div>
          </dl>
          <div className="mt-5 flex items-baseline justify-between border-t pt-5" style={{ borderColor: "var(--line)" }}>
            <span className="font-medium text-dark">Total</span>
            <span className="font-display text-3xl font-bold text-dark">{fmt(total)}</span>
          </div>
          <Link
            href={href("/checkout")}
            className="mt-6 flex h-14 items-center justify-center rounded-full font-medium ease-out duration-200 hover:brightness-90"
            style={{ background: "var(--brand)", color: "var(--brand-fg)" }}
          >
            Checkout
          </Link>
          <Link href={href("/shop")} className="mt-4 block text-center text-custom-sm font-medium text-dark underline underline-offset-4">
            Continue shopping
          </Link>
        </aside>
      </div>
    </section>
  );
}
