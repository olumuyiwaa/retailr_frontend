"use client";
import { useState } from "react";
import { useBizMoney } from "@/hooks/useBizMoney";
import { useAuth } from "@/app/context/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import { getBusinessProfile, listOrders, markReceiptSent, updateOrderStatus } from "@/services/business";
import { ErrorNote, PageHeader, PageLoading, StatCard } from "@/components/saas/Card";
import DataTable, { type Column } from "@/components/saas/DataTable";
import StatusBadge, { label } from "@/components/saas/StatusBadge";
import { inputCls, OutlineButton, PrimaryButton } from "@/components/saas/Form";
import { Modal } from "@/components/ui/modal";
import { shortDate } from "@/lib/format";
import { CHANNEL_LABELS, channelOf, PAYMENT_LABELS } from "@/lib/orderMeta";
import Link from "next/link";
import type { Order, OrderStatus } from "@/types/saas";

const STATUSES: OrderStatus[] = ["pending", "processing", "shipped", "delivered", "cancelled", "refunded"];

export default function OrdersPage() {
  const { user } = useAuth();
  const fmt = useBizMoney();
  const bid = user!.businessId!;
  const { data, loading, error, reload } = useAsync(() => listOrders(bid), [bid]);
  const { data: profile } = useAsync(() => getBusinessProfile(bid), [bid]);
  const slug = profile?.slug ?? "";
  const [selected, setSelected] = useState<Order | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (loading) return <PageLoading />;
  if (error || !data) return <ErrorNote message={error ?? "Could not load orders."} onRetry={reload} />;

  const sendReceipt = async () => {
    if (!selected) return;
    setBusy(true);
    setActionError(null);
    try {
      setSelected(await markReceiptSent(bid, selected.id));
      reload();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Could not send receipt.");
    } finally {
      setBusy(false);
    }
  };

  const setStatus = async (status: OrderStatus) => {
    if (!selected) return;
    setBusy(true);
    setActionError(null);
    try {
      const updated = await updateOrderStatus(bid, selected.id, status);
      setSelected(updated);
      reload();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Could not update order.");
    } finally {
      setBusy(false);
    }
  };

  const columns: Column<Order>[] = [
    { key: "no", header: "Order", sortValue: (o) => o.number, render: (o) => <span className="font-medium text-gray-800 dark:text-white/90">{o.number}</span> },
    { key: "cust", header: "Customer", sortValue: (o) => o.customerName, render: (o) => o.customerName },
    { key: "items", header: "Items", render: (o) => o.items.reduce((s, i) => s + i.qty, 0) },
    { key: "chan", header: "Channel", sortValue: (o) => channelOf(o), render: (o) => <span className="text-gray-600 dark:text-gray-400">{CHANNEL_LABELS[channelOf(o)]}</span> },
    { key: "total", header: "Total", sortValue: (o) => o.total, render: (o) => fmt(o.total) },
    { key: "pay", header: "Payment", sortValue: (o) => o.paymentStatus, render: (o) => <StatusBadge status={o.paymentStatus} /> },
    { key: "status", header: "Status", sortValue: (o) => o.status, render: (o) => <StatusBadge status={o.status} /> },
    { key: "date", header: "Placed", sortValue: (o) => o.placedAt, render: (o) => shortDate(o.placedAt) },
  ];

  return (
    <>
      <PageHeader
        title="Orders"
        subtitle={`${data.length} orders`}
        action={<Link href="/admin/business/sales/new" className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-5 py-3 text-sm font-medium text-white hover:bg-brand-600">Record a sale</Link>}
      />
      <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Orders" value={String(data.length)} hint={`${data.filter((o) => o.status === "delivered").length} delivered`} />
        <StatCard label="To process" value={String(data.filter((o) => o.status === "pending" || o.status === "processing").length)} hint={`${data.filter((o) => o.status === "shipped").length} on the way`} />
        <StatCard label="Revenue" value={fmt(data.filter((o) => o.paymentStatus === "paid").reduce((n, o) => n + o.total, 0))} hint={`${data.filter((o) => o.paymentStatus === "paid").length} paid orders`} />
        <StatCard
          label="Awaiting payment"
          value={fmt(data.filter((o) => o.paymentStatus === "unpaid" && o.status !== "cancelled").reduce((n, o) => n + o.total, 0))}
          hint={`${data.filter((o) => o.paymentStatus === "unpaid" && o.status !== "cancelled").length} unpaid orders`}
        />
      </div>
      <DataTable
        rows={data}
        columns={columns}
        rowKey={(o) => o.id}
        onRowClick={(o) => { setActionError(null); setSelected(o); }}
        searchText={(o) => `${o.number} ${o.customerName}`}
        searchPlaceholder="Search order # or customer…"
        filter={{ label: "Status", options: STATUSES.map((s) => ({ label: label(s), value: s })), match: (o, v) => o.status === v }}
        emptyTitle="No orders yet"
        emptyBody="Orders from your storefront will appear here."
      />

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} className="max-w-[560px] p-6 sm:p-8 m-4 max-h-[92vh] overflow-y-auto">
        {selected && (
          <div className="space-y-5">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">Order {selected.number}</h3>
              <p className="text-theme-sm text-gray-500">{selected.customerName} · {shortDate(selected.placedAt)}</p>
            </div>
            <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
              {selected.items.map((i) => (
                <li key={`${i.productId}-${i.variantId ?? ""}`} className="flex justify-between px-4 py-3 text-theme-sm">
                  <span className="text-gray-800 dark:text-white/90">{i.qty} × {i.name}</span>
                  <span className="text-gray-600 dark:text-gray-400">{fmt(i.qty * i.price)}</span>
                </li>
              ))}
              {selected.discount ? (
                <li className="flex justify-between px-4 py-3 text-theme-sm text-success-600">
                  <span>Discount{selected.couponCode ? ` (${selected.couponCode})` : ""}</span><span>−{fmt(selected.discount)}</span>
                </li>
              ) : null}
              <li className="flex justify-between px-4 py-3 text-theme-sm font-semibold text-gray-800 dark:text-white/90">
                <span>Total</span><span>{fmt(selected.total)}</span>
              </li>
            </ul>
            <div className="flex items-center gap-3">
              <StatusBadge status={selected.paymentStatus} />
              <StatusBadge status={selected.status} />
              <span className="text-theme-xs text-gray-500">{CHANNEL_LABELS[channelOf(selected)]}</span>
              {selected.paymentMethod && (
                <span className="text-theme-xs text-gray-500">
                  {PAYMENT_LABELS[selected.paymentMethod]}
                </span>
              )}
            </div>
            {(selected.shippingAddress || selected.customerEmail || selected.notes) && (
              <dl className="grid grid-cols-3 gap-y-3 rounded-xl bg-gray-50 p-4 text-theme-sm dark:bg-white/5">
                {selected.shippingAddress && (<><dt className="text-gray-500">Deliver to</dt><dd className="col-span-2 text-gray-800 dark:text-white/90">{selected.shippingAddress}</dd></>)}
                {selected.customerEmail && (<><dt className="text-gray-500">Email</dt><dd className="col-span-2 break-all text-gray-800 dark:text-white/90">{selected.customerEmail}</dd></>)}
                {selected.customerPhone && (<><dt className="text-gray-500">Phone</dt><dd className="col-span-2 text-gray-800 dark:text-white/90">{selected.customerPhone}</dd></>)}
                {selected.notes && (<><dt className="text-gray-500">Notes</dt><dd className="col-span-2 text-gray-800 dark:text-white/90">{selected.notes}</dd></>)}
              </dl>
            )}
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Update status</span>
              <select disabled={busy} className={inputCls} value={selected.status} onChange={(e) => setStatus(e.target.value as OrderStatus)}>
                {STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
              </select>
            </label>
            {actionError && <ErrorNote message={actionError} />}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-theme-xs text-gray-500">
                {selected.receiptSentAt ? `Receipt sent ${shortDate(selected.receiptSentAt)}` : "Receipt not sent yet"}
              </p>
              <div className="flex flex-wrap gap-3">
                <a href={`/s/${slug}/invoice/${selected.id}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-lg px-4 py-3 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:text-gray-400 dark:ring-gray-700">
                  View invoice
                </a>
                <OutlineButton disabled={busy || !selected.customerEmail} onClick={sendReceipt}>
                  {selected.receiptSentAt ? "Resend receipt" : "Send receipt"}
                </OutlineButton>
                <PrimaryButton onClick={() => setSelected(null)}>Close</PrimaryButton>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
