"use client";
import React from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { useStore } from "@/app/context/StoreContext";
import { removeAllItemsFromCart, removeItemFromCart, selectTotalPrice, updateCartItemQuantity } from "@/redux/features/cart-slice";
import { AppDispatch, useAppSelector } from "@/redux/store";
import { Photo } from "./Card";

const line = { borderColor: "var(--line)" };

export default function AtelierCart() {
  const ctx = useStore();
  const dispatch = useDispatch<AppDispatch>();
  const items = useAppSelector((s) => s.cartReducer.items);
  const total = useSelector(selectTotalPrice);
  if (!ctx?.store) return null;
  const { store, href, fmt } = ctx;
  const btn = "flex h-12 items-center justify-center rounded-md font-medium text-white ease-out duration-200 hover:opacity-90";

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-[1680px] px-5 py-24 text-center sm:px-8">
        <h1 className="mb-2 text-4xl font-bold text-dark">Your bag is empty</h1>
        <p className="mb-8">Pick something you like and it will show up here.</p>
        <Link href={href("/shop")} className={`${btn} mx-auto w-fit px-8`} style={{ background: "var(--ink)" }}>Continue shopping</Link>
      </section>
    );
  }

  const step = "flex h-10 w-10 items-center justify-center text-lg text-dark disabled:opacity-35";
  return (
    <section className="mx-auto w-full max-w-[1680px] px-5 pb-8 pt-10 sm:px-8 lg:px-12 2xl:px-20">
      <nav aria-label="Breadcrumb" className="text-custom-sm"><Link href={href("/")} className="hover:text-dark">Home</Link> / <span className="text-dark">Bag</span></nav>
      <div className="mb-8 mt-4 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-4xl font-bold text-dark sm:text-5xl">Your bag</h1>
        <button onClick={() => dispatch(removeAllItemsFromCart())} className="py-2 text-custom-sm text-dark underline underline-offset-4">Clear bag</button>
      </div>
      <div className="grid items-start gap-10 lg:grid-cols-[1fr_380px]">
        <ul className="divide-y border-y" style={line}>
          {items.map((item) => {
            const max = item.stock ?? Infinity;
            return (
              <li key={item.id} className="flex gap-4 py-5 sm:gap-6" style={line}>
                <Link href={href(`/product/${item.productId ?? item.id}`)} className="block w-20 shrink-0 sm:w-24" aria-label={item.title}>
                  <Photo item={item} className="aspect-[4/5] w-full rounded" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col justify-between">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-medium text-dark"><Link href={href(`/product/${item.productId ?? item.id}`)}>{item.title}</Link></h3>
                      <p className="text-custom-sm">{fmt(item.discountedPrice)} each</p>
                    </div>
                    <p className="font-semibold text-dark">{fmt(item.discountedPrice * item.quantity)}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center rounded-md border bg-white/60" style={line}>
                      <button className={step} aria-label={`Decrease ${item.title}`} disabled={item.quantity <= 1} onClick={() => dispatch(updateCartItemQuantity({ id: item.id, quantity: item.quantity - 1 }))}>−</button>
                      <span className="w-8 text-center font-medium text-dark" aria-live="polite">{item.quantity}</span>
                      <button className={step} aria-label={`Increase ${item.title}`} disabled={item.quantity >= max} onClick={() => dispatch(updateCartItemQuantity({ id: item.id, quantity: item.quantity + 1 }))}>+</button>
                    </div>
                    <button onClick={() => dispatch(removeItemFromCart(item.id))} className="py-2 text-custom-sm underline underline-offset-4 hover:text-dark">Remove</button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <aside className="rounded-md border bg-white/60 p-6 lg:sticky lg:top-28" style={line}>
          <h2 className="text-xl font-semibold text-dark">Summary</h2>
          <dl className="mt-5 space-y-3 text-custom-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd className="font-medium text-dark">{fmt(total)}</dd></div>
            <div className="flex justify-between"><dt>Delivery</dt><dd className="text-dark">Arranged by {store.name}</dd></div>
          </dl>
          <div className="mt-5 flex items-baseline justify-between border-t pt-5" style={line}>
            <span className="font-medium text-dark">Total</span>
            <span className="text-2xl font-bold text-dark">{fmt(total)}</span>
          </div>
          <Link href={href("/checkout")} className={`${btn} mt-6 h-14`} style={{ background: "var(--ink)" }}>Checkout</Link>
          <Link href={href("/shop")} className="mt-4 block text-center text-custom-sm text-dark underline underline-offset-4">Continue shopping</Link>
        </aside>
      </div>
    </section>
  );
}
