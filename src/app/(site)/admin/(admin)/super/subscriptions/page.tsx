"use client";
import Link from "next/link";
import { useAsync } from "@/hooks/useAsync";
import { listSubscriptions, type SubscriptionRow } from "@/services/platform";
import { ErrorNote, PageHeader, PageLoading, StatCard } from "@/components/saas/Card";
import DataTable, { type Column } from "@/components/saas/DataTable";
import StatusBadge, { label } from "@/components/saas/StatusBadge";
import { money, shortDate } from "@/lib/format";

const columns: Column<SubscriptionRow>[] = [
  {
    key: "biz", header: "Business", sortValue: (s) => s.businessName,
    render: (s) => <Link href={`/admin/super/businesses/${s.businessId}`} className="font-medium text-gray-800 hover:text-brand-500 dark:text-white/90">{s.businessName}</Link>,
  },
  { key: "plan", header: "Plan", sortValue: (s) => s.planName, render: (s) => s.planName },
  { key: "cycle", header: "Billing", render: (s) => (s.cycle === "yearly" ? "Yearly" : "Monthly") },
  { key: "amount", header: "Amount", sortValue: (s) => s.amount, render: (s) => money(s.amount) },
  { key: "status", header: "Status", sortValue: (s) => s.status, render: (s) => <StatusBadge status={s.status} /> },
  { key: "start", header: "Started", sortValue: (s) => s.startedAt, render: (s) => shortDate(s.startedAt) },
  {
    key: "renews", header: "Renews / ends", sortValue: (s) => s.currentPeriodEnd,
    render: (s) => (s.status === "cancelled" ? `Ended ${shortDate(s.cancelledAt ?? s.currentPeriodEnd)}` : shortDate(s.trialEndsAt ?? s.currentPeriodEnd)),
  },
];

export default function SubscriptionsPage() {
  const { data, loading, error, reload } = useAsync(listSubscriptions);
  if (loading) return <PageLoading />;
  if (error || !data) return <ErrorNote message={error ?? "Could not load subscriptions."} onRetry={reload} />;
  return (
    <>
      <PageHeader title="Subscriptions" subtitle="Every business subscription and its billing state." />
      <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Subscriptions" value={String(data.length)} hint={`${data.filter((s) => s.cycle === "yearly").length} billed yearly`} />
        <StatCard label="Active" value={String(data.filter((s) => s.status === "active").length)} hint={`${data.filter((s) => s.status === "trialing").length} trialing`} />
        <StatCard label="Past due" value={String(data.filter((s) => s.status === "past_due").length)} hint={`${data.filter((s) => s.status === "cancelled").length} cancelled`} />
        <StatCard
          label="Recurring revenue"
          value={money(data.filter((s) => s.status === "active" || s.status === "past_due").reduce((n, s) => n + (s.cycle === "yearly" ? s.amount / 12 : s.amount), 0))}
          hint="per month, normalised"
        />
      </div>
      <DataTable
        rows={data}
        columns={columns}
        rowKey={(s) => s.id}
        searchText={(s) => `${s.businessName} ${s.planName}`}
        searchPlaceholder="Search by business or plan…"
        filter={{
          label: "Status",
          options: ["active", "trialing", "past_due", "cancelled"].map((s) => ({ label: label(s), value: s })),
          match: (s, v) => s.status === v,
        }}
      />
    </>
  );
}
