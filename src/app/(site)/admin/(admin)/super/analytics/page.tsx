"use client";
import Link from "next/link";
import { useState } from "react";
import { useAsync } from "@/hooks/useAsync";
import { getPlatformAnalytics, type AnalyticsDays } from "@/services/analytics";
import { Card, CardHeader, EmptyState, ErrorNote, PageHeader, PageLoading, StatCard } from "@/components/saas/Card";
import AnalyticsView, { RangePicker } from "@/components/saas/AnalyticsView";

export default function PlatformAnalyticsPage() {
  const [days, setDays] = useState<AnalyticsDays>(30);
  const { data, loading, error, reload } = useAsync(() => getPlatformAnalytics(days), [days]);

  if (error) return <ErrorNote message={error} onRetry={reload} />;

  return (
    <>
      <PageHeader
        title="Site analytics"
        subtitle="Traffic to the Retailr marketing site and sign-ups, plus how every store on the platform is doing."
        action={<RangePicker days={days} onChange={setDays} />}
      />
      {loading || !data ? (
        <PageLoading />
      ) : (
        <AnalyticsView
          data={data}
          conversionLabel="Sign-up rate"
          funnelTitle="From visit to sign-up"
          funnelSubtitle="How marketing-site visitors become businesses"
          extra={
            <>
              <div>
                <h2 className="mb-3 text-lg font-semibold text-gray-800 dark:text-white/90">All storefronts</h2>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard label="Store visitors" value={data.stores.visitors.toLocaleString()} hint="Across every store" />
                  <StatCard label="Store visits" value={data.stores.sessions.toLocaleString()} />
                  <StatCard label="Online orders" value={data.stores.orders.toLocaleString()} />
                  <StatCard label="Store conversion" value={`${data.stores.conversionRate.toFixed(1)}%`} hint="Visits that ordered" />
                </div>
              </div>
              <Card>
                <CardHeader title="Busiest stores" subtitle="By visitors in this period" />
                {data.topStores.length === 0 ? (
                  <EmptyState title="No store traffic yet" />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-theme-sm">
                      <thead className="border-y border-gray-100 text-theme-xs uppercase text-gray-500 dark:border-gray-800">
                        <tr>
                          <th className="px-5 py-3 font-medium sm:px-6">Store</th>
                          <th className="px-3 py-3 text-right font-medium">Visitors</th>
                          <th className="px-3 py-3 text-right font-medium">Visits</th>
                          <th className="px-3 py-3 text-right font-medium">Orders</th>
                          <th className="px-5 py-3 text-right font-medium sm:px-6">Conversion</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {data.topStores.map((s) => (
                          <tr key={s.id}>
                            <td className="px-5 py-3 font-medium text-gray-800 dark:text-white/90 sm:px-6">
                              <Link href={`/admin/super/businesses/${s.id}`} className="hover:text-brand-600">{s.name}</Link>
                            </td>
                            <td className="px-3 py-3 text-right">{s.visitors.toLocaleString()}</td>
                            <td className="px-3 py-3 text-right">{s.sessions.toLocaleString()}</td>
                            <td className="px-3 py-3 text-right">{s.orders}</td>
                            <td className="px-5 py-3 text-right text-gray-500 sm:px-6">{s.conversionRate.toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </>
          }
        />
      )}
    </>
  );
}
