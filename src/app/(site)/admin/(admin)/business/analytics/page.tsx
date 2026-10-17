"use client";
import { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import { getBusinessAnalytics, type AnalyticsDays } from "@/services/analytics";
import { Card, CardHeader, EmptyState, ErrorNote, PageHeader, PageLoading } from "@/components/saas/Card";
import AnalyticsView, { RangePicker } from "@/components/saas/AnalyticsView";

export default function BusinessAnalyticsPage() {
  const { user } = useAuth();
  const bid = user!.businessId!;
  const [days, setDays] = useState<AnalyticsDays>(30);
  const { data, loading, error, reload } = useAsync(() => getBusinessAnalytics(bid, days), [bid, days]);

  if (error) return <ErrorNote message={error} onRetry={reload} />;

  return (
    <>
      <PageHeader
        title="Site analytics"
        subtitle="Who visits your online store, where they come from and how many go on to order. In-person and chat sales are in Reports."
        action={<RangePicker days={days} onChange={setDays} />}
      />
      {loading || !data ? (
        <PageLoading />
      ) : (
        <AnalyticsView
          data={data}
          conversionLabel="Conversion rate"
          funnelTitle="From visit to order"
          funnelSubtitle="How shoppers move through your store"
          extra={
            <Card>
              <CardHeader title="Most viewed products" subtitle="Views and online orders in this period" />
              {data.topProducts.length === 0 ? (
                <EmptyState title="No product views yet" body="Share your store link to start getting visitors." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-theme-sm">
                    <thead className="border-y border-gray-100 text-theme-xs uppercase text-gray-500 dark:border-gray-800">
                      <tr>
                        <th className="px-5 py-3 font-medium sm:px-6">Product</th>
                        <th className="px-3 py-3 text-right font-medium">Views</th>
                        <th className="px-3 py-3 text-right font-medium">Sold online</th>
                        <th className="px-5 py-3 text-right font-medium sm:px-6">Views per sale</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {data.topProducts.map((p) => (
                        <tr key={p.id}>
                          <td className="px-5 py-3 font-medium text-gray-800 dark:text-white/90 sm:px-6">{p.name}</td>
                          <td className="px-3 py-3 text-right">{p.views.toLocaleString()}</td>
                          <td className="px-3 py-3 text-right">{p.orders}</td>
                          <td className="px-5 py-3 text-right text-gray-500 sm:px-6">{p.orders ? Math.round(p.views / p.orders) : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          }
        />
      )}
    </>
  );
}
