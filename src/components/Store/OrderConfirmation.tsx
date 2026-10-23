"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useStore } from "@/app/context/StoreContext";
import { getOrderForConfirmation } from "@/services/store";
import type { Order } from "@/types/saas";
import BankTransferDetails from "./BankTransferDetails";

const NEXT_STEPS: Record<string, string> = {
  cod: "Please have the exact amount ready — you'll pay when your order is delivered.",
  bank: "Please transfer the total to the account below, using your order number as the reference. The business confirms your order once the money arrives.",
  card: "Your demo card payment went through. No real money was taken.",
  cash: "Your cash payment has been recorded.",
  pos: "Your card payment has been recorded.",
};


export default function OrderConfirmation({ orderId }: { orderId: string }) {
  const ctx = useStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");
  const storeId = ctx?.store?.id;

  useEffect(() => {
    if (!storeId) return;
    let cancelled = false;
    getOrderForConfirmation(orderId)
      .then((o) => { if (!cancelled) { setOrder(o); setState("ready"); } })
      .catch(() => { if (!cancelled) setState("missing"); });
    return () => { cancelled = true; };
  }, [storeId, orderId]);

  if (!ctx?.store) return null;
  const { store, href, fmt } = ctx;

  if (state === "loading") {
    return (
      <>
        <section className="py-20 text-center" aria-busy="true"><p>Loading your order…</p></section>
      </>
    );
  }
  if (state === "missing" || !order) {
    return (
      <>
        <section className="py-20 text-center">
          <p className="mb-6">We couldn&apos;t find that order.</p>
          <Link href={href("/shop")} className="inline-flex h-12 items-center font-medium text-white bg-blue px-7 rounded-full hover:brightness-90">Back to shop</Link>
        </section>
      </>
    );
  }

  return (
    <>
      <section className="overflow-hidden py-12 sm:py-16">
        <div className="store-container w-full mx-auto px-4 sm:px-8 xl:px-8">
          <div className="mx-auto max-w-[720px] bg-white rounded-3xl ring-1 ring-inset ring-[color:var(--line)] p-6 sm:p-10">
            <div className="text-center mb-8">
              <span style={{ background: "var(--brand)", color: "var(--brand-fg)" }} className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full text-3xl" aria-hidden>✓</span>
              <h1 className="font-bold text-dark text-4xl mb-2">Thank you, {order.customerName.split(" ")[0]}!</h1>
              <p>
                Your order <span className="font-medium text-dark">{order.number}</span> has been placed with {store.name}.
              </p>
            </div>

            <div className="rounded-2xl border border-[color:var(--line)] mb-6">
              {order.items.map((i) => (
                <div key={`${i.productId || i.serviceId}-${i.variantId ?? i.optionId ?? ""}`} className="flex items-center justify-between px-5 py-4 border-b border-[color:var(--line)]">
                  <p className="text-dark">{i.name} <span className="text-dark-4">× {i.qty}</span></p>
                  <p className="text-dark">{fmt(i.qty * i.price)}</p>
                </div>
              ))}
              {order.discount ? (
                <div className="flex items-center justify-between px-5 py-4 border-b border-[color:var(--line)]">
                  <p className="text-dark">Discount{order.couponCode ? ` (${order.couponCode})` : ""}</p>
                  <p className="text-dark">−{fmt(order.discount)}</p>
                </div>
              ) : null}
              <div className="flex items-center justify-between px-5 py-4">
                <p className="font-medium text-dark">Total</p>
                <p className="font-medium text-dark">{fmt(order.total)}</p>
              </div>
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 mb-8 text-custom-sm">
              <div><dt className="text-dark-4">Deliver to</dt><dd className="text-dark">{order.shippingAddress}</dd></div>
              <div><dt className="text-dark-4">Contact</dt><dd className="text-dark">{order.customerEmail} · {order.customerPhone}</dd></div>
              <div className="sm:col-span-2"><dt className="text-dark-4">What happens next</dt><dd className="text-dark">{order.paymentMethod ? NEXT_STEPS[order.paymentMethod] : ""}</dd></div>
            </dl>
            {order.paymentMethod === "bank" && store.bankAccount && (
              <div className="mb-8 rounded-2xl border border-[color:var(--line)] bg-[color:var(--tint)] p-4">
                <p className="mb-2 font-medium text-dark">Pay {fmt(order.total)} to</p>
                <BankTransferDetails account={store.bankAccount} reference={order.number} />
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href={href(`/invoice/${order.id}`)} className="inline-flex h-12 items-center rounded-full px-8 font-medium text-dark ring-1 ring-inset ring-[color:var(--line)] hover:bg-[color:var(--tint)]">
                View receipt
              </Link>
              <Link href={href("/shop")} className="inline-flex h-12 items-center font-medium text-white bg-blue px-9 rounded-full ease-out duration-200 hover:brightness-90">
                Continue shopping
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
