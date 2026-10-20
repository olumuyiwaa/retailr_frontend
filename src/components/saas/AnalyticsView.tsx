"use client";
import React from "react";
import type { SiteAnalytics } from "@/types/saas";
import { Card, CardHeader, EmptyState, StatCard } from "./Card";
import { DonutChart, TrafficChart } from "./Charts";
import { compact } from "@/lib/format";
import type { AnalyticsDays } from "@/services/analytics";

export const RANGES: { days: AnalyticsDays; label: string }[] = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
  { days: 365, label: "12 months" },
];

export function RangePicker({ days, onChange }: { days: AnalyticsDays; onChange: (d: AnalyticsDays) => void }) {
  return (
    <div className="inline-flex rounded-lg bg-gray-100 p-1 dark:bg-gray-800" role="tablist" aria-label="Period">
      {RANGES.map((r) => (
        <button
          key={r.days}
          role="tab"
          aria-selected={days === r.days}
          onClick={() => onChange(r.days)}
          className={`rounded-md px-3 py-1.5 text-theme-sm font-medium transition ${
            days === r.days ? "bg-white text-gray-800 shadow-theme-xs dark:bg-gray-900 dark:text-white/90" : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}

const SOURCE_LABELS: Record<string, string> = { direct: "Direct", whatsapp: "WhatsApp", instagram: "Instagram", facebook: "Facebook", search: "Search engines", other: "Other sites" };
const DEVICE_LABELS: Record<string, string> = { mobile: "Phone", desktop: "Computer", tablet: "Tablet" };

/** A ranked list with proportional bars. */
export function BarList({ rows, empty = "No data yet" }: { rows: { label: string; value: number; hint?: string }[]; empty?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (rows.length === 0) return <EmptyState title={empty} />;
  return (
    <ul className="space-y-3.5">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="mb-1.5 flex justify-between gap-3 text-theme-sm">
            <span className="min-w-0 truncate text-gray-700 dark:text-gray-300">{r.label}</span>
            <span className="shrink-0 font-medium text-gray-800 dark:text-white/90">
              {compact(r.value)}
              {r.hint && <span className="ml-1.5 font-normal text-gray-400">{r.hint}</span>}
            </span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800">
            <div className="h-2 rounded-full bg-brand-500" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Funnel({ steps }: { steps: SiteAnalytics["funnel"] }) {
  const top = Math.max(1, steps[0]?.count ?? 1);
  return (
    <ol className="space-y-3">
      {steps.map((s, i) => {
        const prev = i === 0 ? null : steps[i - 1].count;
        const stepPct = prev ? Math.round((s.count / prev) * 100) : null;
        return (
          <li key={s.label}>
            <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-theme-sm">
              <span className="min-w-0 break-words text-gray-700 dark:text-gray-300">{s.label}</span>
              <span className="whitespace-nowrap font-medium text-gray-800 dark:text-white/90">
                {s.count.toLocaleString()}
                {stepPct !== null && <span className="ml-2 text-theme-xs font-normal text-gray-400">{stepPct}% of previous</span>}
              </span>
            </div>
            <div className="h-7 overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800">
              <div className="h-7 rounded-md bg-brand-500/90" style={{ width: `${Math.min(100, Math.max(2, (s.count / top) * 100))}%`, opacity: 1 - i * 0.12 }} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** Everything both analytics pages share: KPIs, traffic over time, funnel, sources, devices, countries, pages. */
export default function AnalyticsView({
  data,
  conversionLabel,
  funnelTitle,
  funnelSubtitle,
  extra,
}: {
  data: SiteAnalytics;
  conversionLabel: string;
  funnelTitle: string;
  funnelSubtitle: string;
  extra?: React.ReactNode;
}) {
  const none = data.sessions.value === 0;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Visitors" value={data.visitors.value.toLocaleString()} change={data.visitors.changePct} hint="Unique each day" />
        <StatCard label="Visits" value={data.sessions.value.toLocaleString()} change={data.sessions.changePct} hint="Sessions" />
        <StatCard label="Page views" value={data.pageViews.value.toLocaleString()} change={data.pageViews.changePct} hint={data.sessions.value ? `${(data.pageViews.value / data.sessions.value).toFixed(1)} per visit` : undefined} />
        <StatCard label={conversionLabel} value={`${data.conversionRate.value.toFixed(1)}%`} change={data.conversionRate.changePct} hint="Of visits" />
      </div>

      <Card>
        <CardHeader title="Traffic over time" subtitle={data.days <= 30 ? "Per day" : data.days <= 90 ? "Per week" : "Per month"} />
        <div className="px-3 pb-4 sm:px-5">
          {none ? (
            <EmptyState title="No traffic in this period" body="Try a longer period." />
          ) : (
            <TrafficChart
              labels={data.series.map((s) => s.label)}
              series={[
                { name: "Visitors", data: data.series.map((s) => s.visitors), color: "#465fff" },
                { name: "Page views", data: data.series.map((s) => s.pageViews), color: "#12b76a" },
              ]}
            />
          )}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title={funnelTitle} subtitle={funnelSubtitle} />
          <div className="p-5 sm:p-6">{none ? <EmptyState title="No data yet" /> : <Funnel steps={data.funnel} />}</div>
        </Card>
        <Card>
          <CardHeader title="Most visited pages" subtitle="Page views in this period" />
          <div className="p-5 sm:p-6">
            <BarList rows={data.pages.map((p) => ({ label: p.label, value: p.views }))} />
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader title="Where visitors come from" subtitle="Visits by source" />
          <div className="p-5 sm:p-6">
            {data.sources.length === 0 ? (
              <EmptyState title="No data yet" />
            ) : (
              <DonutChart labels={data.sources.map((s) => SOURCE_LABELS[s.source] ?? s.source)} values={data.sources.map((s) => s.sessions)} height={280} />
            )}
          </div>
        </Card>
        <Card>
          <CardHeader title="Devices" subtitle="Visits by device" />
          <div className="p-5 sm:p-6">
            {data.devices.length === 0 ? (
              <EmptyState title="No data yet" />
            ) : (
              <DonutChart labels={data.devices.map((d) => DEVICE_LABELS[d.device] ?? d.device)} values={data.devices.map((d) => d.sessions)} height={280} colors={["#465fff", "#f79009", "#98a2b3"]} />
            )}
          </div>
        </Card>
        <Card>
          <CardHeader title="Countries" subtitle="Visits by country" />
          <div className="p-5 sm:p-6">
            <BarList rows={data.countries.map((c) => ({ label: c.country, value: c.sessions }))} />
          </div>
        </Card>
      </div>

      {extra}
    </div>
  );
}
