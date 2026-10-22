"use client";
import { useState } from "react";
import { useBizCurrency, useBizMoney } from "@/hooks/useBizMoney";
import { useAuth } from "@/app/context/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import { getSalesReport, type ReportDays } from "@/services/business";
import { Card, CardHeader, EmptyState, ErrorNote, PageHeader, PageLoading, StatCard } from "@/components/saas/Card";
import { AreaSeriesChart, DonutChart } from "@/components/saas/Charts";
import { CHANNEL_LABELS, PAYMENT_LABELS } from "@/lib/orderMeta";

const RANGES: { days: ReportDays; label: string }[] = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
  { days: 365, label: "12 months" },
];

export default function ReportsPage() {
  const { user } = useAuth();
  const fmt = useBizMoney();
  const currency = useBizCurrency();
  const bid = user!.businessId!;
  const [days, setDays] = useState<ReportDays>(30);
  const { data, loading, error, reload } = useAsync(() => getSalesReport(bid, days), [bid, days]);

  const picker = (
    <div className="inline-flex rounded-lg bg-gray-100 p-1 dark:bg-gray-800" role="tablist" aria-label="Report period">
      {RANGES.map((r) => (
        <button
          key={r.days}
          role="tab"
          aria-selected={days === r.days}
          onClick={() => setDays(r.days)}
          className={`rounded-md px-3 py-1.5 text-theme-sm font-medium transition ${
            days === r.days ? "bg-white text-gray-800 shadow-theme-xs dark:bg-gray-900 dark:text-white/90" : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );

  if (error) return <ErrorNote message={error} onRetry={reload} />;

  return (
    <>
      <PageHeader title="Reports" subtitle="Paid sales across your online store and everything you record yourself." action={picker} />
      {loading || !data ? (
        <PageLoading />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Sales" value={fmt(data.revenue)} change={data.revenueChangePct} hint="vs the previous period" />
            <StatCard label="Expenses" value={fmt(data.expenses ?? 0)} hint="In this period" />
            <StatCard label="Profit" value={fmt(data.profit ?? data.revenue)} hint="Sales minus expenses" />
            <StatCard label="Still owed to you" value={fmt(data.outstanding)} hint={`${data.orders} paid orders · ${data.newCustomers} new customers`} />
          </div>

          <Card>
            <CardHeader title="Sales over time" subtitle={days <= 30 ? "Per day" : days <= 90 ? "Per week" : "Per month"} />
            <div className="px-3 pb-4 sm:px-5">
              {data.orders === 0 ? (
                <EmptyState title="No paid sales in this period" body="Try a longer period, or record a sale to see it here." />
              ) : (
                <AreaSeriesChart data={data.series} name="Sales" currency={currency} />
              )}
            </div>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader title="Where sales come from" subtitle="Share of sales by channel" />
              <div className="p-5 sm:p-6">
                {data.byChannel.length === 0 ? (
                  <EmptyState title="No data yet" />
                ) : (
                  <>
                    <DonutChart labels={data.byChannel.map((c) => CHANNEL_LABELS[c.channel])} values={data.byChannel.map((c) => Math.round(c.revenue))} />
                    <ul className="mt-4 divide-y divide-gray-100 dark:divide-gray-800">
                      {data.byChannel.map((c) => (
                        <li key={c.channel} className="flex justify-between py-2.5 text-theme-sm">
                          <span className="text-gray-700 dark:text-gray-400">{CHANNEL_LABELS[c.channel]} <span className="text-gray-400">· {c.orders} orders</span></span>
                          <span className="font-medium text-gray-800 dark:text-white/90">{fmt(c.revenue)}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </Card>

            <Card>
              <CardHeader title="How customers pay" subtitle="Paid orders by payment method" />
              <div className="p-5 sm:p-6">
                {data.byPayment.length === 0 ? (
                  <EmptyState title="No data yet" />
                ) : (
                  <ul className="space-y-4">
                    {data.byPayment.map((p) => {
                      const pct = data.revenue ? (p.revenue / data.revenue) * 100 : 0;
                      return (
                        <li key={p.method}>
                          <div className="mb-1.5 flex justify-between text-theme-sm">
                            <span className="text-gray-700 dark:text-gray-400">{p.method === "unknown" ? "Not recorded" : PAYMENT_LABELS[p.method]} <span className="text-gray-400">· {p.orders} orders</span></span>
                            <span className="font-medium text-gray-800 dark:text-white/90">{fmt(p.revenue)}</span>
                          </div>
                          <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800"><div className="h-2 rounded-full bg-brand-500" style={{ width: `${pct}%` }} /></div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader title="Best-selling products" subtitle="Ranked by sales" />
              <div className="p-5 sm:p-6">
                {data.topProducts.length === 0 ? (
                  <EmptyState title="No data yet" />
                ) : (
                  <ol className="divide-y divide-gray-100 dark:divide-gray-800">
                    {data.topProducts.map((p, i) => (
                      <li key={p.name} className="flex items-center gap-3 py-2.5 text-theme-sm">
                        <span className="w-5 text-theme-xs text-gray-400">{i + 1}</span>
                        <span className="min-w-0 flex-1 truncate text-gray-800 dark:text-white/90">{p.name}</span>
                        <span className="text-gray-500">{p.qty} sold</span>
                        <span className="w-28 text-right font-medium text-gray-800 dark:text-white/90">{fmt(p.revenue)}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </Card>

            <Card>
              <CardHeader title="Top customers" subtitle="Who spent the most (walk-ins excluded)" />
              <div className="p-5 sm:p-6">
                {data.topCustomers.length === 0 ? (
                  <EmptyState title="No data yet" />
                ) : (
                  <ol className="divide-y divide-gray-100 dark:divide-gray-800">
                    {data.topCustomers.map((c, i) => (
                      <li key={c.id} className="flex items-center gap-3 py-2.5 text-theme-sm">
                        <span className="w-5 text-theme-xs text-gray-400">{i + 1}</span>
                        <span className="min-w-0 flex-1 truncate text-gray-800 dark:text-white/90">{c.name}</span>
                        <span className="text-gray-500">{c.orders} orders</span>
                        <span className="w-28 text-right font-medium text-gray-800 dark:text-white/90">{fmt(c.revenue)}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
