"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useBizMoney } from "@/hooks/useBizMoney";
import { useAuth } from "@/app/context/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import { getBusinessProfile, listCustomers, listProducts, recordSale } from "@/services/business";
import { Card, CardHeader, ErrorNote, PageHeader, PageLoading } from "@/components/saas/Card";
import { Field, inputCls, OutlineButton, PrimaryButton } from "@/components/saas/Form";
import { CHANNELS, PAYMENT_LABELS, RECORD_PAYMENT_METHODS } from "@/lib/orderMeta";
import type { Order, PaymentMethod, Product, SalesChannel } from "@/types/saas";

interface Line {
  key: string;
  productId: string;
  variantId?: string;
  name: string;
  qty: number;
  /** what the customer pays per unit (can be negotiated down/up) */
  price: number;
  max: number;
}

const lineKey = (productId: string, variantId?: string) => `${productId}:${variantId ?? ""}`;

const pill = (on: boolean) =>
  `rounded-lg px-3.5 py-2 text-theme-sm font-medium ring-1 ring-inset transition ${
    on
      ? "bg-brand-500 text-white ring-brand-500"
      : "bg-white text-gray-700 ring-gray-300 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-400 dark:ring-gray-700"
  }`;

export default function RecordSalePage() {
  const { user } = useAuth();
  const fmt = useBizMoney();
  const bid = user!.businessId!;
  const { data, loading, error, reload } = useAsync(
    async () => {
      const [products, customers, profile] = await Promise.all([listProducts(bid), listCustomers(bid), getBusinessProfile(bid)]);
      return { products, customers, profile };
    },
    [bid]
  );

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(null); // product whose variants are showing
  const [lines, setLines] = useState<Line[]>([]);
  const [customerMode, setCustomerMode] = useState<"walk_in" | "existing" | "new">("walk_in");
  const [customerId, setCustomerId] = useState("");
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "", email: "" });
  const [channel, setChannel] = useState<SalesChannel>("in_store");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [paid, setPaid] = useState(true);
  const [handedOver, setHandedOver] = useState(true);
  const [discount, setDiscount] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState<Order | null>(null);

  const sellable = useMemo(
    () =>
      (data?.products ?? [])
        .filter((p) => p.status !== "draft")
        .filter((p) => !query.trim() || `${p.name} ${p.sku} ${p.category}`.toLowerCase().includes(query.trim().toLowerCase())),
    [data, query]
  );

  if (loading) return <PageLoading />;
  if (error || !data) return <ErrorNote message={error ?? "Could not load your products."} onRetry={reload} />;

  const subtotal = lines.reduce((s, l) => s + l.qty * l.price, 0);
  const discountNum = Math.max(0, Number(discount) || 0);
  const total = Math.max(0, Math.round((subtotal - discountNum) * 100) / 100);

  const addLine = (p: Product, variantId?: string) => {
    const variant = variantId ? p.variants?.find((v) => v.id === variantId) : undefined;
    const max = p.kind === "service" ? 99 : variant ? variant.stock : p.stock;
    if (max <= 0) return;
    const key = lineKey(p.id, variantId);
    setFormError(null);
    setLines((cur) => {
      const existing = cur.find((l) => l.key === key);
      if (existing) return cur.map((l) => (l.key === key ? { ...l, qty: Math.min(l.max, l.qty + 1) } : l));
      return [
        ...cur,
        { key, productId: p.id, variantId, name: variant ? `${p.name} (${variant.name})` : p.name, qty: 1, price: variant?.price ?? p.price, max },
      ];
    });
    setOpen(null);
  };

  const patchLine = (key: string, patch: Partial<Line>) => setLines((cur) => cur.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  const removeLine = (key: string) => setLines((cur) => cur.filter((l) => l.key !== key));

  const reset = () => {
    setLines([]);
    setCustomerMode("walk_in");
    setCustomerId("");
    setNewCustomer({ name: "", phone: "", email: "" });
    setChannel("in_store");
    setMethod("cash");
    setPaid(true);
    setHandedOver(true);
    setDiscount("");
    setNotes("");
    setFormError(null);
    setDone(null);
    reload();
  };

  const submit = async () => {
    setFormError(null);
    if (lines.length === 0) return setFormError("Add at least one product to the sale.");
    if (customerMode === "existing" && !customerId) return setFormError("Pick a customer, or switch to walk-in.");
    if (customerMode === "new" && !newCustomer.name.trim()) return setFormError("Enter the new customer's name.");
    setSaving(true);
    try {
      const order = await recordSale(bid, {
        customerId: customerMode === "existing" ? customerId : undefined,
        newCustomer: customerMode === "new" ? newCustomer : undefined,
        items: lines.map((l) => ({ productId: l.productId, variantId: l.variantId, qty: l.qty, price: l.price })),
        channel,
        paymentMethod: method,
        paid,
        handedOver,
        discount: discountNum || undefined,
        notes,
      });
      setDone(order);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Could not record the sale.");
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <>
        <PageHeader title="Sale recorded" />
        <Card className="mx-auto max-w-xl p-6 text-center sm:p-10">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success-50 text-2xl text-success-600 dark:bg-success-500/15">✓</div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">{done.number} · {fmt(done.total)}</h2>
          <p className="mt-1 text-theme-sm text-gray-500">
            {done.customerName} · {done.paymentStatus === "paid" ? "Paid" : "Payment still owed"} · stock updated
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <PrimaryButton onClick={reset}>Record another sale</PrimaryButton>
            <a
              href={`/s/${data.profile.slug}/invoice/${done.id}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-lg px-5 py-3 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:text-gray-400 dark:ring-gray-700"
            >
              View invoice
            </a>
            <Link href="/admin/business/orders" className="inline-flex items-center justify-center rounded-lg px-5 py-3 text-sm font-medium text-brand-500 hover:text-brand-600">
              Go to orders
            </Link>
          </div>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Record a sale" subtitle="Log sales made in person, on WhatsApp, Instagram or by phone. Stock and reports update straight away." />
      <div className="grid gap-6 lg:grid-cols-5">
        {/* product picker */}
        <Card className="lg:col-span-3">
          <CardHeader title="Pick products" subtitle="Tap a product to add it. Tap again to add one more." />
          <div className="p-5 sm:p-6">
            <input className={inputCls} placeholder="Search by name, SKU or category…" value={query} onChange={(e) => setQuery(e.target.value)} />
            {sellable.length === 0 ? (
              <p className="py-10 text-center text-theme-sm text-gray-500">
                {data.products.length === 0 ? "You haven't added any products yet." : "No products match your search."}
              </p>
            ) : (
              <ul className="mt-4 grid max-h-[560px] gap-2.5 overflow-y-auto sm:grid-cols-2">
                {sellable.map((p) => {
                  const hasVariants = !!p.variants?.length;
                  const isService = p.kind === "service";
                  const soldOut = !isService && p.stock <= 0;
                  const inCart = lines.filter((l) => l.productId === p.id).reduce((n, l) => n + l.qty, 0);
                  return (
                    <li key={p.id} className="rounded-xl border border-gray-200 dark:border-gray-800">
                      <button
                        type="button"
                        disabled={soldOut}
                        onClick={() => (hasVariants ? setOpen(open === p.id ? null : p.id) : addLine(p))}
                        className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-white/[0.03]"
                      >
                        {p.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.image} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover" />
                        ) : (
                          <span className="h-11 w-11 shrink-0 rounded-lg" style={{ background: p.imageColor }} />
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-theme-sm font-medium text-gray-800 dark:text-white/90">{p.name}</span>
                          <span className="block text-theme-xs text-gray-500">
                            {fmt(p.price)} · {isService ? `Service${p.durationMins ? ` · ${p.durationMins} min` : ""}` : soldOut ? "Sold out" : `${p.stock} in stock`}
                          </span>
                        </span>
                        {inCart > 0 && <span className="rounded-full bg-brand-500 px-2 py-0.5 text-xs font-medium text-white">{inCart}</span>}
                      </button>
                      {hasVariants && open === p.id && (
                        <div className="flex flex-wrap gap-2 border-t border-gray-100 p-3 dark:border-gray-800">
                          {p.variants!.map((v) => (
                            <button
                              key={v.id}
                              type="button"
                              disabled={!isService && v.stock <= 0}
                              onClick={() => addLine(p, v.id)}
                              className="rounded-lg px-3 py-1.5 text-theme-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-400 dark:ring-gray-700"
                            >
                              {v.name}{isService ? "" : ` · ${v.stock > 0 ? `${v.stock} left` : "sold out"}`}
                            </button>
                          ))}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Card>

        {/* the sale */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="This sale" />
            <div className="p-5 sm:p-6">
              {lines.length === 0 ? (
                <p className="py-6 text-center text-theme-sm text-gray-500">Nothing added yet.</p>
              ) : (
                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                  {lines.map((l) => (
                    <li key={l.key} className="space-y-2 py-3 first:pt-0 last:pb-0">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90">{l.name}</p>
                        <button type="button" onClick={() => removeLine(l.key)} className="text-theme-xs text-error-600 hover:text-error-700">Remove</button>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="inline-flex items-center rounded-lg ring-1 ring-inset ring-gray-300 dark:ring-gray-700">
                          <button type="button" aria-label="Fewer" className="px-3 py-1.5 text-gray-600 disabled:opacity-40" disabled={l.qty <= 1} onClick={() => patchLine(l.key, { qty: l.qty - 1 })}>−</button>
                          <span className="min-w-8 text-center text-theme-sm text-gray-800 dark:text-white/90">{l.qty}</span>
                          <button type="button" aria-label="More" className="px-3 py-1.5 text-gray-600 disabled:opacity-40" disabled={l.qty >= l.max} onClick={() => patchLine(l.key, { qty: l.qty + 1 })}>+</button>
                        </div>
                        <span className="text-theme-xs text-gray-400">×</span>
                        <input
                          aria-label={`Price for ${l.name}`}
                          type="number"
                          min={0}
                          step="any"
                          className="h-9 w-28 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden dark:border-gray-700 dark:text-white/90"
                          value={l.price}
                          onChange={(e) => patchLine(l.key, { price: Number(e.target.value) })}
                        />
                        <span className="ml-auto text-theme-sm font-medium text-gray-800 dark:text-white/90">{fmt(l.qty * l.price)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4 space-y-3 border-t border-gray-100 pt-4 dark:border-gray-800">
                <Field label="Discount (optional)" hint="A flat amount taken off the total">
                  <input type="number" min={0} step="any" className={inputCls} value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0" />
                </Field>
                <div className="flex justify-between text-theme-sm text-gray-500"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
                {discountNum > 0 && <div className="flex justify-between text-theme-sm text-success-600"><span>Discount</span><span>−{fmt(Math.min(discountNum, subtotal))}</span></div>}
                <div className="flex justify-between text-lg font-semibold text-gray-800 dark:text-white/90"><span>Total</span><span>{fmt(total)}</span></div>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Customer" />
            <div className="space-y-4 p-5 sm:p-6">
              <div className="flex flex-wrap gap-2">
                <button type="button" className={pill(customerMode === "walk_in")} onClick={() => setCustomerMode("walk_in")}>Walk-in</button>
                <button type="button" className={pill(customerMode === "existing")} onClick={() => setCustomerMode("existing")}>Existing</button>
                <button type="button" className={pill(customerMode === "new")} onClick={() => setCustomerMode("new")}>New customer</button>
              </div>
              {customerMode === "existing" && (
                <select className={inputCls} value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                  <option value="">Choose a customer…</option>
                  {data.customers.map((c) => <option key={c.id} value={c.id}>{c.name}{c.phone ? ` · ${c.phone}` : ""}</option>)}
                </select>
              )}
              {customerMode === "new" && (
                <div className="space-y-3">
                  <input className={inputCls} placeholder="Name" value={newCustomer.name} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })} />
                  <input className={inputCls} placeholder="Phone (optional)" value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} />
                  <input className={inputCls} placeholder="Email (optional)" type="email" value={newCustomer.email} onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })} />
                </div>
              )}
              {customerMode === "walk_in" && <p className="text-theme-xs text-gray-500">No customer record is kept. Choose a customer if you want to track repeat buyers and message them later.</p>}
            </div>
          </Card>

          <Card>
            <CardHeader title="How was it sold & paid?" />
            <div className="space-y-5 p-5 sm:p-6">
              <div>
                <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Sales channel</p>
                <div className="flex flex-wrap gap-2">
                  {CHANNELS.map((c) => <button key={c.id} type="button" className={pill(channel === c.id)} onClick={() => setChannel(c.id)}>{c.label}</button>)}
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">Payment method</p>
                <div className="flex flex-wrap gap-2">
                  {RECORD_PAYMENT_METHODS.map((m) => <button key={m} type="button" className={pill(method === m)} onClick={() => setMethod(m)}>{PAYMENT_LABELS[m]}</button>)}
                </div>
              </div>
              <label className="flex items-start gap-3 text-theme-sm text-gray-700 dark:text-gray-400">
                <input type="checkbox" className="mt-1 h-4 w-4" checked={paid} onChange={(e) => setPaid(e.target.checked)} />
                <span><span className="font-medium text-gray-800 dark:text-white/90">Customer has paid</span><br /><span className="text-theme-xs text-gray-500">Untick if they still owe you. It will show as unpaid in Orders.</span></span>
              </label>
              <label className="flex items-start gap-3 text-theme-sm text-gray-700 dark:text-gray-400">
                <input type="checkbox" className="mt-1 h-4 w-4" checked={handedOver} onChange={(e) => setHandedOver(e.target.checked)} />
                <span><span className="font-medium text-gray-800 dark:text-white/90">Goods already handed over</span><br /><span className="text-theme-xs text-gray-500">Untick if you still need to deliver. It will show as processing.</span></span>
              </label>
              <Field label="Note (optional)">
                <input className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Pick up Saturday" />
              </Field>
            </div>
          </Card>

          {formError && <ErrorNote message={formError} />}
          <div className="flex flex-wrap gap-3">
            <PrimaryButton busy={saving} onClick={submit} className="flex-1">Record sale · {fmt(total)}</PrimaryButton>
            {lines.length > 0 && <OutlineButton onClick={() => setLines([])}>Clear</OutlineButton>}
          </div>
        </div>
      </div>
    </>
  );
}
