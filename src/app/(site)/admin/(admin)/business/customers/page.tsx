"use client";
import { useBizMoney } from "@/hooks/useBizMoney";
import { useAuth } from "@/app/context/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import { getGroupMembers, listCustomers, listGroups } from "@/services/business";
import { ErrorNote, PageHeader, PageLoading, StatCard } from "@/components/saas/Card";
import DataTable, { type Column } from "@/components/saas/DataTable";
import { initials, shortDate } from "@/lib/format";
import type { Customer } from "@/types/saas";

const makeColumns = (fmt: (n: number) => string): Column<Customer>[] => [
  {
    key: "name", header: "Customer", sortValue: (c) => c.name,
    render: (c) => (
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">{initials(c.name)}</span>
        <div>
          <p className="font-medium text-gray-800 dark:text-white/90">{c.name}</p>
          <p className="text-theme-xs text-gray-500">{c.email}</p>
        </div>
      </div>
    ),
  },
  { key: "city", header: "City", sortValue: (c) => c.city, render: (c) => c.city },
  { key: "orders", header: "Orders", sortValue: (c) => c.orders, render: (c) => c.orders },
  { key: "spent", header: "Total spent", sortValue: (c) => c.totalSpent, render: (c) => fmt(c.totalSpent) },
  { key: "joined", header: "Joined", sortValue: (c) => c.joinedAt, render: (c) => shortDate(c.joinedAt) },
];

export default function CustomersPage() {
  const { user } = useAuth();
  const fmt = useBizMoney();
  const columns = makeColumns(fmt);
  const bid = user!.businessId!;
  const { data: all, loading, error, reload } = useAsync(async () => {
    const [customers, groups] = await Promise.all([listCustomers(bid), listGroups(bid)]);
    const members = Object.fromEntries(await Promise.all(groups.map(async (g) => [g.id, new Set((await getGroupMembers(bid, g.id)).map((c) => c.id))] as const)));
    return { customers, groups, members };
  }, [bid]);
  const data = all?.customers;
  if (loading) return <PageLoading />;
  if (error || !data) return <ErrorNote message={error ?? "Could not load customers."} onRetry={reload} />;
  const cutoff = Date.now() - 30 * 86400000;
  const newCount = data.filter((c) => new Date(c.joinedAt).getTime() >= cutoff).length;
  const repeat = data.filter((c) => c.orders >= 2).length;
  const buyers = data.filter((c) => c.orders > 0);
  const revenue = data.reduce((n, c) => n + c.totalSpent, 0);
  return (
    <>
      <PageHeader title="Customers" subtitle={`${data.length} customers`} />
      <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Customers" value={String(data.length)} hint={`${buyers.length} have ordered`} />
        <StatCard label="New this month" value={String(newCount)} hint="joined in the last 30 days" />
        <StatCard label="Repeat customers" value={String(repeat)} hint={buyers.length ? `${Math.round((repeat / buyers.length) * 100)}% of buyers` : "No orders yet"} />
        <StatCard label="Avg. spend" value={fmt(buyers.length ? revenue / buyers.length : 0)} hint="per customer who ordered" />
      </div>
      <DataTable
        rows={data}
        columns={columns}
        rowKey={(c) => c.id}
        searchText={(c) => `${c.name} ${c.email} ${c.city}`}
        searchPlaceholder="Search customers…"
        filter={all && all.groups.length > 0 ? { label: "Group", options: all.groups.map((g) => ({ label: g.name, value: g.id })), match: (c, v) => all.members[v]?.has(c.id) ?? false } : undefined}
        emptyTitle="No customers yet"
        emptyBody="Customers appear here after their first order."
      />
    </>
  );
}
