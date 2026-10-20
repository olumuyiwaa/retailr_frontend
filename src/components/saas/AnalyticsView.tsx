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

/** Whole numbers for the headline; one decimal under 10% so small rates don't read as 0%. */
const pct = (n: number) => (n >= 10 || n === 0 ? `${Math.round(n)}%` : `${n.toFixed(1)}%`);

function Funnel({ steps }: { steps: SiteAnalytics["funnel"] }) {
  const top = steps[0]?.count ?? 0;
  const last = steps[steps.length - 1];
  // the last step (orders, sign-ups) isn't always counted per tracked visit, so only quote a rate that makes sense
  const overall = top > 0 && last && last.count <= top ? (last.count / top) * 100 : null;
  return (
    <div>
      {overall !== null && (
        <p className="mb-5 text-theme-sm text-gray-500 dark:text-gray-400">
          <span className="mr-1.5 text-2xl font-semibold text-gray-800 dark:text-white/90">{pct(overall)}</span>
          of visits ended in “{last.label.toLowerCase()}”
        </p>
      )}
      <ol>
        {steps.map((s, i) => {
          const prev = i === 0 ? null : steps[i - 1].count;
          const continued = prev && s.count <= prev ? Math.round((s.count / prev) * 100) : null;
          const width = top > 0 ? Math.min(100, Math.max(s.count > 0 ? 3 : 0, (s.count / top) * 100)) : 0;
          return (
            <li key={s.label}>
              {i > 0 && (
                <div className="flex h-7 items-center gap-2 pl-3 text-theme-xs text-gray-400" aria-hidden={continued === null}>
                  {continued !== null && (
                    <>
                      <span className="h-full w-px bg-gray-200 dark:bg-gray-700" />
                      <span>{continued}% continue</span>
                      {s.count < (prev ?? 0) && <span className="text-gray-300 dark:text-gray-600">·</span>}
                      {s.count < (prev ?? 0) && <span>{((prev ?? 0) - s.count).toLocaleString()} drop off</span>}
                    </>
                  )}
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="relative h-11 min-w-0 flex-1 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                  <div className="h-full rounded-lg bg-brand-500" style={{ width: `${width}%`, opacity: 1 - i * 0.14 }} />
                  <span className="absolute inset-y-0 left-3 flex items-center text-theme-sm font-medium text-gray-800 mix-blend-normal dark:text-white/90">
                    <span className="rounded bg-white/80 px-1.5 py-0.5 backdrop-blur-sm dark:bg-gray-900/70">{s.label}</span>
                  </span>
                </div>
                <span className="w-14 shrink-0 text-right text-base font-semibold text-gray-800 dark:text-white/90">{s.count.toLocaleString()}</span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
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
