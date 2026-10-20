"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import StoreCrumbs from "./StoreCrumbs";
import ProductThumb from "@/components/Common/ProductThumb";
import { useStore } from "@/app/context/StoreContext";
import { removeAllItemsFromCart, selectTotalPrice } from "@/redux/features/cart-slice";
import { AppDispatch, useAppSelector } from "@/redux/store";
import { useSelector } from "react-redux";
import { placeOrder, validateCoupon } from "@/services/store";
import type { StorePaymentMethod } from "@/types/saas";

const input =
  "rounded-xl border border-[color:var(--line)] bg-white placeholder:text-dark-5 w-full py-3 px-4 text-dark outline-none duration-200 focus:border-[color:var(--brand)] focus:ring-2 focus:ring-blue/20";

const METHODS: { id: StorePaymentMethod; title: string; hint: string }[] = [
  { id: "cod", title: "Pay on delivery", hint: "Pay in cash when your order arrives." },
  { id: "bank", title: "Direct bank transfer", hint: "The business will contact you with their bank details." },
  { id: "card", title: "Card (demo)", hint: "Demo only — no real payment is taken." },
];


export default function StoreCheckout() {
  const ctx = useStore();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const items = useAppSelector((s) => s.cartReducer.items);
  const total = useSelector(selectTotalPrice);

  const [f, setF] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    address: "", city: "", country: ctx?.store?.country ?? "", notes: "",
  });
  const [chosen, setChosen] = useState<StorePaymentMethod>("cod");
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponMsg, setCouponMsg] = useState<string | null>(null);
  const [couponBusy, setCouponBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!ctx?.store) return null;
  const { store, href, fmt } = ctx;
  // the owner decides which options the store offers (older API responses don't say, so offer everything)
  const offered = store.paymentMethods ?? METHODS.map((m) => m.id);
  const methods = METHODS.filter((m) => offered.includes(m.id));
  const payment = methods.some((m) => m.id === chosen) ? chosen : methods[0]?.id;
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF((v) => ({ ...v, [k]: e.target.value }));

  if (items.length === 0) {
    return (
      <>
        <section className="py-24 text-center">
          <h1 className="mb-2 text-4xl font-bold text-dark">Your cart is empty</h1>
          <p className="pb-7">Your cart is empty — add something before checking out.</p>
          <Link href={href("/shop")} className="inline-flex h-12 items-center font-medium text-white bg-dark px-9 rounded-full hover:bg-opacity-95">
            Continue Shopping
          </Link>
        </section>
      </>
    );
  }

  const discount = coupon?.discount ?? 0;
  const payable = Math.round((total - discount) * 100) / 100;

  const applyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponBusy(true);
    setCouponMsg(null);
    try {
      setCoupon(await validateCoupon(store.slug, couponInput, total));
      setCouponInput("");
    } catch (err) {
      setCoupon(null);
      setCouponMsg(err instanceof Error ? err.message : "Could not check that code.");
    } finally {
      setCouponBusy(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!f.firstName.trim() || !f.lastName.trim()) return setError("Please enter your first and last name.");
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) return setError("Please enter a valid email address.");
    if (f.phone.replace(/\D/g, "").length < 7) return setError("Please enter a valid phone number.");
    if (!payment) return setError("This store isn't taking orders online right now. Please contact the business.");
    if (!f.address.trim() || !f.city.trim() || !f.country.trim()) return setError("Please enter your full delivery address.");

    setBusy(true);
    try {
      const order = await placeOrder({
        slug: store.slug,
        customer: { name: `${f.firstName.trim()} ${f.lastName.trim()}`, email: f.email, phone: f.phone },
        shippingAddress: `${f.address.trim()}, ${f.city.trim()}, ${f.country.trim()}`,
        notes: f.notes,
        paymentMethod: payment,
        couponCode: coupon?.code,
        items: items.map((i) => ({ productId: i.productId ?? i.id, variantId: i.variantId, qty: i.quantity })),
      });
      dispatch(removeAllItemsFromCart());
      ctx.reload(); // refresh stock levels shown in the store
      router.push(href(`/order/${order.publicToken}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't place your order. Please try again.");
      setBusy(false);
    }
  };

  return (
    <>
      <section className="overflow-hidden pb-8 pt-8 sm:pt-10">
        <div className="store-container w-full mx-auto px-4 sm:px-8">
          <StoreCrumbs trail={[{ label: "Cart", to: href("/cart") }, { label: "Checkout" }]} />
          <h1 className="mb-8 mt-5 text-4xl font-bold text-dark sm:text-5xl">Checkout</h1>
          <form onSubmit={submit} noValidate>
            <div className="flex flex-col lg:flex-row gap-7.5 xl:gap-11">
              <div className="lg:max-w-[920px] w-full">
                <h2 className="mb-5 font-display text-2xl font-bold text-dark">Delivery details</h2>
                <div className="bg-white rounded-3xl ring-1 ring-inset ring-[color:var(--line)] p-4 sm:p-8.5">
                  <div className="flex flex-col lg:flex-row gap-5 sm:gap-8 mb-5">
                    <div className="w-full">
                      <label htmlFor="firstName" className="block mb-2.5">First Name <span className="text-red">*</span></label>
                      <input id="firstName" className={input} value={f.firstName} onChange={set("firstName")} autoComplete="given-name" />
                    </div>
                    <div className="w-full">
                      <label htmlFor="lastName" className="block mb-2.5">Last Name <span className="text-red">*</span></label>
                      <input id="lastName" className={input} value={f.lastName} onChange={set("lastName")} autoComplete="family-name" />
                    </div>
                  </div>
                  <div className="flex flex-col lg:flex-row gap-5 sm:gap-8 mb-5">
                    <div className="w-full">
                      <label htmlFor="email" className="block mb-2.5">Email <span className="text-red">*</span></label>
                      <input id="email" type="email" className={input} value={f.email} onChange={set("email")} autoComplete="email" />
                    </div>
                    <div className="w-full">
                      <label htmlFor="phone" className="block mb-2.5">Phone <span className="text-red">*</span></label>
                      <input id="phone" type="tel" className={input} value={f.phone} onChange={set("phone")} autoComplete="tel" />
                    </div>
                  </div>
                  <div className="mb-5">
                    <label htmlFor="address" className="block mb-2.5">Street address <span className="text-red">*</span></label>
                    <input id="address" className={input} value={f.address} onChange={set("address")} placeholder="House number and street name" autoComplete="street-address" />
                  </div>
                  <div className="flex flex-col lg:flex-row gap-5 sm:gap-8 mb-5">
                    <div className="w-full">
                      <label htmlFor="city" className="block mb-2.5">Town / City <span className="text-red">*</span></label>
                      <input id="city" className={input} value={f.city} onChange={set("city")} autoComplete="address-level2" />
                    </div>
                    <div className="w-full">
                      <label htmlFor="country" className="block mb-2.5">Country <span className="text-red">*</span></label>
                      <input id="country" className={input} value={f.country} onChange={set("country")} autoComplete="country-name" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="notes" className="block mb-2.5">Order notes (optional)</label>
                    <textarea id="notes" rows={4} className={input} value={f.notes} onChange={set("notes")} placeholder="Notes about your order, e.g. special notes for delivery." />
                  </div>
                </div>
              </div>

              <div className="max-w-[455px] w-full">
                <div className="bg-white rounded-3xl ring-1 ring-inset ring-[color:var(--line)]">
                  <div className="border-b border-[color:var(--line)] py-5 px-4 sm:px-8.5">
                    <h3 className="font-display text-xl font-bold text-dark">Your order</h3>
                  </div>
                  <div className="pt-2.5 pb-8.5 px-4 sm:px-8.5">
                    <div className="flex items-center justify-between py-5 border-b border-[color:var(--line)]">
                      <h4 className="font-medium text-dark">Product</h4>
                      <h4 className="font-medium text-dark text-right">Subtotal</h4>
                    </div>
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-3 py-5 border-b border-[color:var(--line)]">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="block h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl">
                            <ProductThumb item={item} variant="thumbnail" size={44} />
                          </span>
                          <p className="text-dark truncate">{item.title} <span className="text-dark-4">× {item.quantity}</span></p>
                        </div>
                        <p className="text-dark text-right">{fmt(item.discountedPrice * item.quantity)}</p>
                      </div>
                    ))}
                    <div className="flex items-center justify-between py-5 border-b border-[color:var(--line)]">
                      <p className="text-dark">Delivery</p>
                      <p className="text-dark text-right">Arranged by {store.name}</p>
                    </div>
                    <div className="py-5 border-b border-[color:var(--line)]">
                      {coupon ? (
                        <div className="flex items-center justify-between text-dark">
                          <p>
                            Discount <span className="rounded-full bg-[color:var(--tint)] px-2.5 py-0.5 text-custom-sm font-medium">{coupon.code}</span>{" "}
                            <button type="button" onClick={() => setCoupon(null)} className="text-custom-sm underline">Remove</button>
                          </p>
                          <p className="text-right">−{fmt(discount)}</p>
                        </div>
                      ) : (
                        <>
                          <div className="flex gap-2">
                            <input
                              aria-label="Discount code"
                              className={input}
                              placeholder="Discount code"
                              value={couponInput}
                              onChange={(e) => setCouponInput(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyCoupon(); } }}
                            />
                            <button type="button" onClick={applyCoupon} disabled={couponBusy || !couponInput.trim()} className="shrink-0 rounded-xl px-5 font-medium disabled:opacity-50" style={{ background: "var(--brand)", color: "var(--brand-fg)" }}>
                              {couponBusy ? "…" : "Apply"}
                            </button>
                          </div>
                          {couponMsg && <p role="alert" className="mt-2 text-custom-sm text-red-dark">{couponMsg}</p>}
                        </>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-5">
                      <p className="font-medium text-lg text-dark">Total</p>
                      <p className="font-medium text-lg text-dark text-right">{fmt(payable)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl ring-1 ring-inset ring-[color:var(--line)] mt-7.5">
                  <div className="border-b border-[color:var(--line)] py-5 px-4 sm:px-8.5">
                    <h3 className="font-display text-xl font-bold text-dark">Payment method</h3>
                  </div>
                  <div className="p-4 sm:p-8.5">
                    <div className="flex flex-col gap-3" role="radiogroup" aria-label="Payment method">
                      {methods.map((m) => (
                        <label key={m.id} className="flex cursor-pointer select-none items-start gap-4">
                          <input
                            type="radio"
                            name="payment"
                            value={m.id}
                            checked={payment === m.id}
                            onChange={() => setChosen(m.id)}
                            className="sr-only"
                          />
                          <span
                            aria-hidden
                            className={`mt-4 flex h-4 w-4 flex-shrink-0 rounded-full ${payment === m.id ? "border-4 border-blue" : "border border-gray-4"}`}
                          />
                          <span
                            className={`w-full rounded-2xl border py-3.5 px-5 ease-out duration-200 ${
                              payment === m.id ? "border-[color:var(--brand)] bg-[color:var(--tint)]" : "border-[color:var(--line)] bg-white"
                            }`}
                          >
                            <span className="block text-dark">{m.title}</span>
                            <span className="block text-custom-sm text-dark-4">{m.id === "bank" && store.bankDetails ? "Transfer to the account below; the business confirms your order once it arrives." : m.hint}</span>
                            {m.id === "bank" && store.bankDetails && payment === "bank" && (
                              <span className="mt-2 block whitespace-pre-line rounded-lg bg-white/70 px-3 py-2 text-custom-sm font-medium text-dark">{store.bankDetails}</span>
                            )}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {error && (
                  <p role="alert" className="mt-5 rounded-md bg-red-light-6 border border-red-light-4 px-4 py-3 text-red-dark">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full flex justify-center font-medium text-white bg-blue h-14 items-center px-6 rounded-full ease-out duration-200 hover:brightness-90 mt-7.5 disabled:opacity-60"
                >
                  {busy ? "Placing your order…" : `Place order · ${fmt(payable)}`}
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
