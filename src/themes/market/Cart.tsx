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
import { ProductPhoto } from "./Card";

const divider = { borderColor: "var(--line)" };

export default function MarketCart() {
  const ctx = useStore();
  const dispatch = useDispatch<AppDispatch>();
  const items = useAppSelector((s) => s.cartReducer.items);
  const total = useSelector(selectTotalPrice);

  if (!ctx?.store) return null;
  const { store, href, fmt } = ctx;

  const btn =
    "flex h-12 items-center justify-center rounded font-bold text-white transition-opacity hover:opacity-90";

  if (items.length === 0) {
    return (
      <section
        className="mx-auto max-w-[1680px] px-5 py-24 text-center sm:px-8"
        style={{ background: "var(--wash)" }}
      >
        {/* Empty cart icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="mx-auto mb-4 h-16 w-16"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.3}
          style={{ color: "var(--muted)" }}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9m5-9v9m4-9v9m5-9l2 9"
          />
        </svg>
        <h1 className="mb-2 text-3xl font-extrabold text-dark">
          Your cart is empty
        </h1>
        <p className="mb-8" style={{ color: "var(--muted)" }}>
          Looks like you haven&apos;t added anything yet.
        </p>
        <Link
          href={href("/shop")}
          className={`${btn} mx-auto w-fit px-10`}
          style={{ background: "var(--brand)" }}
        >
          Continue Shopping
        </Link>
      </section>
    );
  }

  const step =
    "flex h-9 w-9 items-center justify-center text-lg text-dark disabled:opacity-35";

  return (
    <section
      className="min-h-screen"
      style={{ background: "var(--wash)" }}
    >
      <div className="mx-auto w-full max-w-[1680px] px-5 sm:px-8 lg:px-12 2xl:px-20 pb-12 pt-6">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="text-custom-sm mb-4"
          style={{ color: "var(--muted)" }}
        >
          <Link href={href("/")} className="hover:text-dark hover:underline">
            Home
          </Link>{" "}
          / <span className="font-medium text-dark">Cart</span>
        </nav>

        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-3xl font-extrabold text-dark sm:text-4xl">
            Shopping Cart{" "}
            <span className="text-xl font-semibold" style={{ color: "var(--muted)" }}>
              ({items.length} item{items.length === 1 ? "" : "s"})
            </span>
          </h1>
          <button
            onClick={() => dispatch(removeAllItemsFromCart())}
            className="text-custom-sm underline underline-offset-4 hover:text-dark"
            style={{ color: "var(--muted)" }}
          >
            Clear cart
          </button>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
          {/* Items list */}
          <div className="rounded-lg border bg-white" style={divider}>
            <ul className="divide-y" style={divider}>
              {items.map((item) => {
                const max = item.stock ?? Infinity;
                return (
                  <li key={item.id} className="flex gap-4 p-4 sm:gap-6 sm:p-5">
                    <Link
                      href={href(`/product/${item.productId ?? item.id}`)}
                      className="block w-20 shrink-0 sm:w-24"
                      aria-label={item.title}
                    >
                      <ProductPhoto
                        item={item}
                        className="aspect-square w-full rounded"
                      />
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-dark">
                            <Link
                              href={href(`/product/${item.productId ?? item.id}`)}
                              className="hover:underline"
                            >
                              {item.title}
                            </Link>
                          </h3>
                          <p
                            className="mt-0.5 text-custom-sm"
                            style={{ color: "var(--muted)" }}
                          >
                            {fmt(item.discountedPrice)} each
                          </p>
                        </div>
                        <p className="shrink-0 font-bold text-dark">
                          {fmt(item.discountedPrice * item.quantity)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div
                          className="flex items-center rounded border bg-white"
                          style={divider}
                        >
                          <button
                            className={step}
                            aria-label={`Decrease ${item.title}`}
                            disabled={item.quantity <= 1}
                            onClick={() =>
                              dispatch(
                                updateCartItemQuantity({
                                  id: item.id,
                                  quantity: item.quantity - 1,
                                })
                              )
                            }
                          >
                            −
                          </button>
                          <span
                            className="w-9 text-center font-semibold text-dark"
                            aria-live="polite"
                          >
                            {item.quantity}
                          </span>
                          <button
                            className={step}
                            aria-label={`Increase ${item.title}`}
                            disabled={item.quantity >= max}
                            onClick={() =>
                              dispatch(
                                updateCartItemQuantity({
                                  id: item.id,
                                  quantity: item.quantity + 1,
                                })
                              )
                            }
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => dispatch(removeItemFromCart(item.id))}
                          className="text-custom-sm underline underline-offset-4 hover:text-dark"
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
          </div>

          {/* Order summary */}
          <aside
            className="rounded-lg border bg-white p-6 lg:sticky lg:top-28"
            style={divider}
          >
            <h2 className="text-xl font-extrabold text-dark">Order Summary</h2>
            <dl className="mt-5 space-y-3 text-custom-sm">
              <div className="flex justify-between">
                <dt style={{ color: "var(--muted)" }}>Subtotal</dt>
                <dd className="font-semibold text-dark">{fmt(total)}</dd>
              </div>
              <div className="flex justify-between">
                <dt style={{ color: "var(--muted)" }}>Shipping</dt>
                <dd className="text-dark">Arranged by {store.name}</dd>
              </div>
            </dl>
            <div
              className="mt-5 flex items-baseline justify-between border-t pt-5"
              style={divider}
            >
              <span className="font-semibold text-dark">Total</span>
              <span className="text-2xl font-extrabold text-dark">{fmt(total)}</span>
            </div>
            <Link
              href={href("/checkout")}
              className={`${btn} mt-6 h-14 text-lg`}
              style={{ background: "var(--brand)" }}
            >
              Proceed to Checkout
            </Link>
            <Link
              href={href("/shop")}
              className="mt-4 block text-center text-custom-sm font-medium hover:underline underline-offset-2"
              style={{ color: "var(--brand)" }}
            >
              ← Continue Shopping
            </Link>
          </aside>
        </div>
      </div>
    </section>
  );
}
