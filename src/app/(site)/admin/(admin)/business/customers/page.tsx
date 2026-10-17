"use client";
import { useBizMoney } from "@/hooks/useBizMoney";
import { useAuth } from "@/app/context/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import { getCustomerDetail, getGroupMembers, listCustomers, listGroups } from "@/services/business";
import { ErrorNote, PageHeader, PageLoading, StatCard } from "@/components/saas/Card";
import DataTable, { type Column } from "@/components/saas/DataTable";
import { initials, shortDate } from "@/lib/format";
import StatusBadge from "@/components/saas/StatusBadge";
import RowActions from "@/components/saas/RowActions";
import { Modal } from "@/components/ui/modal";
import { OutlineButton } from "@/components/saas/Form";
import type { Customer } from "@/types/saas";
import { useState } from "react";
import Link from "next/link";

const makeColumns = (fmt: (n: number) => string, view: (c: Customer) => void): Column<Customer>[] => [
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
  {
    key: "actions", header: "", className: "text-right whitespace-nowrap",
    render: (c) => <RowActions label={`Actions for ${c.name}`} actions={[{ label: "View details", onClick: () => view(c) }]} />,
  },
];

function Detail({ bid, id, onClose, fmt }: { bid: string; id: string; onClose: () => void; fmt: (n: number) => string }) {
  const { data, loading, error } = useAsync(() => getCustomerDetail(bid, id), [bid, id]);
  if (loading) return <p className="py-10 text-center text-theme-sm text-gray-500">Loading…</p>;
  if (error || !data) return <p className="py-10 text-center text-theme-sm text-error-600">{error ?? "Could not load customer."}</p>;
  const { customer: c } = data;
  const row = (k: string, v?: string) => (
    <div className="flex justify-between gap-4 py-2 text-theme-sm"><dt className="text-gray-500">{k}</dt><dd className="text-right text-gray-800 dark:text-white/90">{v || "—"}</dd></div>
  );
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">{initials(c.name)}</span>
        <div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">{c.name}</h3>
          <p className="text-theme-sm text-gray-500">Customer since {shortDate(c.joinedAt)}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 text-center">
        {[["Orders", String(c.orders)], ["Total spent", fmt(c.totalSpent)], ["Avg. order", fmt(data.avgOrder)]].map(([k, v]) => (
          <div key={k} className="rounded-xl border border-gray-200 p-3 dark:border-gray-800">
            <p className="text-theme-xs text-gray-500">{k}</p>
            <p className="mt-1 font-semibold text-gray-800 dark:text-white/90">{v}</p>
          </div>
        ))}
      </div>
      <dl className="divide-y divide-gray-100 dark:divide-gray-800">
        {row("Email", c.email)}
        {row("Phone", c.phone)}
        {row("City", c.city)}
        {row("Last delivery address", data.address)}
        {row("Last order", data.lastOrderAt ? shortDate(data.lastOrderAt) : undefined)}
        {row("Groups", data.groups.join(", "))}
      </dl>
      <div>
        <p className="mb-2 text-theme-sm font-medium text-gray-800 dark:text-white/90">Order history</p>
        {data.orders.length === 0 ? (
          <p className="text-theme-sm text-gray-500">No orders yet.</p>
        ) : (
          <ul className="max-h-56 divide-y divide-gray-100 overflow-y-auto rounded-xl border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
            {data.orders.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-theme-sm">
                <div>
                  <p className="font-medium text-gray-800 dark:text-white/90">{o.number}</p>
                  <p className="text-theme-xs text-gray-500">{shortDate(o.placedAt)} · {o.items.reduce((n, i) => n + i.qty, 0)} items</p>
                </div>
                <div className="flex items-center gap-2"><StatusBadge status={o.status} /><span className="w-20 text-right">{fmt(o.total)}</span></div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex justify-end gap-3">
        {c.email && <a href={`mailto:${c.email}`} className="inline-flex items-center rounded-lg px-4 py-2.5 text-sm font-medium text-brand-500 hover:text-brand-600">Email</a>}
        <Link href="/admin/business/orders" className="inline-flex items-center rounded-lg px-4 py-2.5 text-sm font-medium text-brand-500 hover:text-brand-600">All orders</Link>
        <OutlineButton onClick={onClose}>Close</OutlineButton>
      </div>
    </div>
  );
}

export default function CustomersPage() {
  const { user } = useAuth();
  const fmt = useBizMoney();
  const [viewing, setViewing] = useState<string | null>(null);
  const columns = makeColumns(fmt, (c) => setViewing(c.id));
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
        onRowClick={(c) => setViewing(c.id)}
        searchText={(c) => `${c.name} ${c.email} ${c.city}`}
        searchPlaceholder="Search customers…"
        filter={all && all.groups.length > 0 ? { label: "Group", options: all.groups.map((g) => ({ label: g.name, value: g.id })), match: (c, v) => all.members[v]?.has(c.id) ?? false } : undefined}
        emptyTitle="No customers yet"
        emptyBody="Customers appear here after their first order."
      />
      <Modal isOpen={viewing !== null} onClose={() => setViewing(null)} className="max-w-[560px] p-6 sm:p-8 m-4">
        {viewing && <Detail bid={bid} id={viewing} fmt={fmt} onClose={() => setViewing(null)} />}
      </Modal>
    </>
  );
}
