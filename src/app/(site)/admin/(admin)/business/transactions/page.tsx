"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import { useBizMoney } from "@/hooks/useBizMoney";
import { listOrders } from "@/services/business";
import { Card, ErrorNote, PageHeader, PageLoading, StatCard } from "@/components/saas/Card";
import DataTable, { type Column } from "@/components/saas/DataTable";
import StatusBadge from "@/components/saas/StatusBadge";
import { shortDate } from "@/lib/format";
import { CHANNEL_LABELS, channelOf, PAYMENT_LABELS } from "@/lib/orderMeta";
import type { Order, PaymentMethod, PaymentStatus } from "@/types/saas";

const METHOD_LABEL = (m?: PaymentMethod) => (m ? PAYMENT_LABELS[m] ?? m : "—");

export default function TransactionsPage() {
  const { user } = useAuth();
  const fmt = useBizMoney();
  const bid = user!.businessId!;
  const { data, loading, error, reload } = useAsync(() => listOrders(bid), [bid]);
  const [payFilter, setPayFilter] = useState<"all" | PaymentStatus>("all");
  const [methodFilter, setMethodFilter] = useState<"all" | PaymentMethod>("all");

  const rows = useMemo(() => {
    if (!data) return [] as Order[];
    return data
      .filter((o) => (payFilter === "all" ? true : o.paymentStatus === payFilter))
      .filter((o) => (methodFilter === "all" ? true : o.paymentMethod === methodFilter))
      .slice()
      .sort((a, b) => +new Date(b.placedAt) - +new Date(a.placedAt));
  }, [data, payFilter, methodFilter]);

  const stats = useMemo(() => {
    const list = data ?? [];
    const sum = (pred: (o: Order) => boolean) => list.filter(pred).reduce((s, o) => s + o.total, 0);
    return {
      paid: sum((o) => o.paymentStatus === "paid"),
      unpaid: sum((o) => o.paymentStatus === "unpaid"),
      refunded: sum((o) => o.paymentStatus === "refunded"),
      count: list.length,
      paidCount: list.filter((o) => o.paymentStatus === "paid").length,
      unpaidCount: list.filter((o) => o.paymentStatus === "unpaid").length,
    };
  }, [data]);

  if (loading) return <PageLoading />;
  if (error || !data) return <ErrorNote message={error ?? "Could not load transactions."} onRetry={reload} />;

  const methods = Array.from(
    new Set(data.map((o) => o.paymentMethod).filter(Boolean) as PaymentMethod[]),
  ).sort();

  const columns: Column<Order>[] = [
    {
      key: "date",
      header: "Date",
      sortValue: (o) => o.placedAt,
      render: (o) => shortDate(o.placedAt),
    },
    {
      key: "ref",
      header: "Reference",
      sortValue: (o) => o.number,
      render: (o) => (
        <Link href={`/admin/business/orders?highlight=${o.id}`} className="font-medium text-brand-500 hover:underline">
          {o.number}
        </Link>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      sortValue: (o) => o.customerName,
      render: (o) => o.customerName || "Walk-in",
    },
    {
      key: "method",
      header: "Method",
      sortValue: (o) => o.paymentMethod ?? "",
      render: (o) => <span className="text-gray-600 dark:text-gray-400">{METHOD_LABEL(o.paymentMethod)}</span>,
    },
    {
      key: "channel",
      header: "Channel",
      sortValue: (o) => channelOf(o),
      render: (o) => CHANNEL_LABELS[channelOf(o)],
    },
    {
      key: "amount",
      header: "Amount",
      sortValue: (o) => o.total,
      render: (o) => (
        <span className={o.paymentStatus === "refunded" ? "text-error-600" : o.paymentStatus === "unpaid" ? "text-warning-600" : "font-medium text-gray-800 dark:text-white/90"}>
          {fmt(o.total)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Payment",
      sortValue: (o) => o.paymentStatus,
      render: (o) => <StatusBadge status={o.paymentStatus} />,
    },
  ];

  return (
    <>
      <PageHeader
        title="Transactions"
        subtitle="Money in from online orders and recorded sales."
        action={
          <Link
            href="/admin/business/sales/new"
            className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-5 py-3 text-sm font-medium text-white hover:bg-brand-600"
          >
            Record a sale
          </Link>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Received" value={fmt(stats.paid)} hint={`${stats.paidCount} paid`} />
        <StatCard label="Outstanding" value={fmt(stats.unpaid)} hint={`${stats.unpaidCount} unpaid`} />
        <StatCard label="Refunded" value={fmt(stats.refunded)} />
        <StatCard label="All transactions" value={String(stats.count)} />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {([
          ["all", "All"],
          ["paid", "Paid"],
          ["unpaid", "Unpaid"],
          ["refunded", "Refunded"],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setPayFilter(value)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
              payFilter === value
                ? "bg-brand-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
            }`}
          >
            {label}
          </button>
        ))}
        {methods.length > 0 && (
          <select
            className="ml-auto rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value as "all" | PaymentMethod)}
          >
            <option value="all">All methods</option>
            {methods.map((m) => (
              <option key={m} value={m}>
                {PAYMENT_LABELS[m]}
              </option>
            ))}
          </select>
        )}
      </div>

      <Card>
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(o) => o.id}
          searchText={(o) => `${o.number} ${o.customerName} ${o.paymentMethod ?? ""} ${channelOf(o)}`}
          searchPlaceholder="Search reference, customer…"
          emptyTitle="No transactions yet"
          emptyBody="When customers pay online or you record a sale, it will show up here."
        />
      </Card>
    </>
  );
}
