"use client";
import { formatCurrency, toUsd } from "@/lib/money";
import Link from "next/link";
import { useAsync } from "@/hooks/useAsync";
import { listBusinesses, type BusinessRow } from "@/services/platform";
import { ErrorNote, PageHeader, PageLoading, StatCard } from "@/components/saas/Card";
import DataTable, { type Column } from "@/components/saas/DataTable";
import StatusBadge, { label } from "@/components/saas/StatusBadge";
import { money, shortDate } from "@/lib/format";

const columns: Column<BusinessRow>[] = [
  {
    key: "name",
    header: "Business",
    sortValue: (b) => b.name,
    render: (b) => (
      <Link href={`/admin/super/businesses/${b.id}`} className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-white" style={{ background: b.brandColor }}>
          {b.name[0]}
        </span>
        <div>
          <p className="font-medium text-gray-800 dark:text-white/90">{b.name}</p>
          <p className="text-theme-xs text-gray-500">{b.ownerEmail}</p>
        </div>
      </Link>
    ),
  },
  { key: "category", header: "Category", render: (b) => b.category },
  { key: "location", header: "Location", render: (b) => `${b.city}, ${b.country}` },
  { key: "plan", header: "Plan", sortValue: (b) => b.planName, render: (b) => b.planName },
  { key: "status", header: "Status", sortValue: (b) => b.status, render: (b) => <StatusBadge status={b.status} /> },
  { key: "mrr", header: "MRR", sortValue: (b) => b.mrr, render: (b) => (b.mrr ? money(b.mrr) : "—") },
  { key: "gmv", header: "Lifetime sales", sortValue: (b) => toUsd(b.stats.revenue, b.currency), render: (b) => formatCurrency(b.stats.revenue, b.currency) },
  { key: "joined", header: "Joined", sortValue: (b) => b.joinedAt, render: (b) => shortDate(b.joinedAt) },
];

export default function BusinessesPage() {
  const { data, loading, error, reload } = useAsync(listBusinesses);
  if (loading) return <PageLoading />;
  if (error || !data) return <ErrorNote message={error ?? "Could not load businesses."} onRetry={reload} />;

  return (
    <>
      <PageHeader title="Businesses" subtitle={`${data.length} businesses on the platform`} />
      <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Businesses" value={String(data.length)} hint={`${data.filter((b) => b.status === "pending").length} awaiting approval`} />
        <StatCard label="Live stores" value={String(data.filter((b) => b.status === "active" || b.status === "trial").length)} hint={`${data.filter((b) => b.status === "trial").length} on trial`} />
        <StatCard label="Suspended or cancelled" value={String(data.filter((b) => b.status === "suspended" || b.status === "cancelled").length)} hint={`${data.filter((b) => b.status === "suspended").length} suspended`} />
        <StatCard label="Monthly recurring revenue" value={money(data.reduce((n, b) => n + b.mrr, 0))} hint={`${data.filter((b) => b.mrr > 0).length} paying businesses`} />
      </div>
      <DataTable
        rows={data}
        columns={columns}
        rowKey={(b) => b.id}
        searchText={(b) => `${b.name} ${b.ownerName} ${b.ownerEmail} ${b.city} ${b.country}`}
        searchPlaceholder="Search businesses, owners, cities…"
        filter={{
          label: "Status",
          options: ["active", "trial", "pending", "suspended", "cancelled"].map((s) => ({ label: label(s), value: s })),
          match: (b, v) => b.status === v,
        }}
      />
    </>
  );
}
