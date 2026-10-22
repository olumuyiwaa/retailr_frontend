"use client";
import StoreLogo from "./StoreLogo";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useStore } from "@/app/context/StoreContext";
import { getOrderForConfirmation } from "@/services/store";
import type { Order } from "@/types/saas";

const PAY: Record<string, string> = { cod: "Pay on delivery", bank: "Bank transfer", card: "Card (demo)", cash: "Cash", pos: "POS / card machine" };
const date = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

/** Printable invoice / receipt for one order. */

export default function StoreInvoice({ orderId }: { orderId: string }) {
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

  if (state !== "ready" || !order) {
    return <section className="py-20 text-center"><p>{state === "loading" ? "Loading invoice…" : "We couldn't find that invoice."}</p></section>;
  }

  const subtotal = order.items.reduce((s, i) => s + i.qty * i.price, 0);
  const paid = order.paymentStatus === "paid";
  const docNo = `INV-${order.number.replace("#", "")}`;

  return (
    <section className="py-10 sm:py-14">
      {/* hide the shop chrome when printing */}
      <style>{`@media print { header, footer, .print-hide { display: none !important; } body { background: #fff !important; } }`}</style>
      <div className="store-container mx-auto w-full px-4 sm:px-8">
        <div className="print-hide mx-auto mb-5 flex max-w-[780px] items-center justify-between">
          <Link href={href(`/order/${order.id}`)} className="text-custom-sm underline">← Back to order</Link>
          <button type="button" onClick={() => window.print()} className="inline-flex h-11 items-center rounded-full px-7 font-medium" style={{ background: "var(--brand)", color: "var(--brand-fg)" }}>
            Print / save as PDF
          </button>
        </div>

        <article className="mx-auto max-w-[780px] rounded-3xl bg-white p-6 ring-1 ring-inset ring-[color:var(--line)] sm:p-12 print:rounded-none print:p-0 print:ring-0" aria-label={`Invoice ${docNo}`}>
          <header className="flex flex-wrap items-start justify-between gap-6 border-b border-[color:var(--line)] pb-8">
            <div>
              {store.logo && <div className="mb-3"><StoreLogo name={store.name} logo={store.logo} size={56} /></div>}
              <p className="font-display text-2xl font-bold text-dark">{store.name}</p>
              <p className="mt-1 text-custom-sm">{store.city}, {store.country}{store.phone ? ` · ${store.phone}` : ""}</p>
            </div>
            <div className="text-right">
              <p className="font-display text-3xl font-bold uppercase tracking-wide text-dark">{paid ? "Receipt" : "Invoice"}</p>
              <p className="mt-1 text-custom-sm">{docNo}</p>
              <p className="text-custom-sm">Issued {date(order.placedAt)}</p>
            </div>
          </header>

          <div className="grid gap-6 py-8 text-custom-sm sm:grid-cols-2">
            <div>
              <p className="mb-1 text-dark-4">Billed to</p>
              <p className="font-medium text-dark">{order.customerName}</p>
              {order.customerEmail && <p>{order.customerEmail}</p>}
              {order.customerPhone && <p>{order.customerPhone}</p>}
              {order.shippingAddress && <p>{order.shippingAddress}</p>}
            </div>
            <div className="sm:text-right">
              <p className="mb-1 text-dark-4">Payment</p>
              <p className="font-medium text-dark">{order.paymentMethod ? PAY[order.paymentMethod] : "—"}</p>
              <p className="mt-1">
                <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: paid ? "#dcfae6" : "#fef0c7", color: paid ? "#067647" : "#93370d" }}>
                  {paid ? "Paid" : "Payment due"}
                </span>
              </p>
            </div>
          </div>

          <table className="w-full text-left text-custom-sm">
            <thead>
              <tr className="border-y border-[color:var(--line)] text-dark-4">
                <th className="py-3 font-medium">Item</th>
                <th className="py-3 text-right font-medium">Qty</th>
                <th className="py-3 text-right font-medium">Price</th>
                <th className="py-3 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((i) => (
                <tr key={`${i.productId || i.serviceId}-${i.variantId ?? i.optionId ?? ""}`} className="border-b border-[color:var(--line)] text-dark">
                  <td className="py-3.5">{i.name}</td>
                  <td className="py-3.5 text-right">{i.qty}</td>
                  <td className="py-3.5 text-right">{fmt(i.price)}</td>
                  <td className="py-3.5 text-right">{fmt(i.qty * i.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <dl className="ml-auto mt-6 w-full max-w-[280px] space-y-2 text-custom-sm text-dark">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{fmt(subtotal)}</dd></div>
            {order.discount ? <div className="flex justify-between"><dt>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</dt><dd>−{fmt(order.discount)}</dd></div> : null}
            <div className="flex justify-between border-t border-[color:var(--line)] pt-3 text-lg font-semibold"><dt>Total</dt><dd>{fmt(order.total)}</dd></div>
            <div className="flex justify-between text-dark-4"><dt>{paid ? "Amount paid" : "Amount due"}</dt><dd>{fmt(order.total)}</dd></div>
          </dl>

          <p className="mt-12 text-center text-custom-sm">Thank you for shopping with {store.name}.</p>
        </article>
      </div>
    </section>
  );
}
