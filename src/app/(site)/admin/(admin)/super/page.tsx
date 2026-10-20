"use client";
import Link from "next/link";
import { useAsync } from "@/hooks/useAsync";
import { getPlatformOverview, listBusinesses, listInvoices, listSubscriptions } from "@/services/platform";
import { Card, CardHeader, ErrorNote, PageHeader, PageLoading } from "@/components/saas/Card";
import { AreaSeriesChart, BarSeriesChart, DonutChart } from "@/components/saas/Charts";
import { AlertBanner, Gauge, KpiTile, MiniStats, Panel, PanelEmpty, QuickLinks } from "@/components/saas/Dash";
import StatusBadge from "@/components/saas/StatusBadge";
import { compact, money, relativeTime } from "@/lib/format";

const pctChip = (n: number) => `${n >= 0 ? "▲" : "▼"} ${Math.abs(n).toFixed(1)}%`;
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export default function SuperOverview() {
  const { data, loading, error, reload } = useAsync(async () => {
    const [overview, businesses, subs, invoices] = await Promise.all([
      getPlatformOverview(),
      listBusinesses(),
      listSubscriptions(),
      listInvoices(),
    ]);
    return { overview, businesses, subs, invoices };
  });
  if (loading) return <PageLoading />;
  if (error || !data) return <ErrorNote message={error ?? "Could not load overview."} onRetry={reload} />;

  const { overview: o, businesses, subs, invoices } = data;
  const pending = businesses.filter((b) => b.status === "pending");
  const pastDue = subs.filter((s) => s.status === "past_due");
  const failed = invoices.filter((i) => i.status === "failed");
  const attention = pending.length + pastDue.length + failed.length;
  const total = businesses.length;
  const activePct = total ? (o.activeBusinesses / total) * 100 : 0;

  const attentionRows = [
    { n: pending.length, text: `${plural(pending.length, "business", "businesses")} waiting for approval`, href: "/admin/super/businesses", tone: "bg-warning-500" },
    { n: pastDue.length, text: `${plural(pastDue.length, "subscription")} past due`, href: "/admin/super/subscriptions", tone: "bg-error-500" },
    { n: failed.length, text: `${plural(failed.length, "failed invoice")}`, href: "/admin/super/invoices", tone: "bg-error-500" },
    { n: o.suspendedBusinesses, text: `${plural(o.suspendedBusinesses, "suspended business", "suspended businesses")}`, href: "/admin/super/businesses", tone: "bg-gray-400" },
  ].filter((r) => r.n > 0);

  return (
    <>
      <PageHeader
        title="Platform overview"
        subtitle="How Retailr is doing across every business."
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/super/businesses" className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600">
              Businesses
            </Link>
            <Link href="/admin/super/subscriptions" className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-white/[0.04]">
              Subscriptions
            </Link>
          </div>
        }
      />

      <div className="space-y-4 md:space-y-6">
        {pending.length > 0 && (
          <AlertBanner tone="amber" action={{ href: "/admin/super/businesses", label: "Review" }}>
            {plural(pending.length, "business", "businesses")} {pending.length === 1 ? "is" : "are"} waiting for approval before going live.
          </AlertBanner>
        )}
        {pastDue.length > 0 && (
          <AlertBanner tone="red" action={{ href: "/admin/super/subscriptions", label: "View subscriptions" }}>
            {plural(pastDue.length, "subscription")} {pastDue.length === 1 ? "is" : "are"} past due.
          </AlertBanner>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
          <KpiTile
            label="Monthly recurring revenue"
            value={money(o.mrr)}
            hint="vs last month"
            href="/admin/super/subscriptions"
            chip={pctChip(o.mrrChangePct)}
            chipTone={o.mrrChangePct >= 0 ? "good" : "bad"}
          />
          <KpiTile
            label="Active businesses"
            value={String(o.activeBusinesses)}
            hint={`${o.trialBusinesses} on trial · ${o.suspendedBusinesses} suspended`}
            href="/admin/super/businesses"
          />
          <KpiTile
            label="Needs attention"
            value={String(attention)}
            hint={attention ? "Approvals and billing to review" : "Nothing waiting on you"}
            href={pending.length ? "/admin/super/businesses" : "/admin/super/subscriptions"}
            chip={attention ? "Action needed" : "All clear"}
            chipTone={attention ? "warn" : "good"}
          />
          <KpiTile
            label="New sign-ups (30d)"
            value={String(o.newSignups30d)}
            hint={`Churn ${o.churnRatePct.toFixed(1)}% in 30 days`}
            href="/admin/super/businesses"
          />
        </div>

        <div className="grid grid-cols-12 gap-4 md:gap-6">
          <Card className="col-span-12 xl:col-span-8">
            <CardHeader title="MRR growth" subtitle="Last 12 months" />
            <div className="px-3 pb-4 sm:px-4">
              <AreaSeriesChart data={o.mrrSeries} name="MRR" currency />
            </div>
          </Card>
          <div className="col-span-12 xl:col-span-4">
            <Gauge
              title="Active businesses"
              subtitle="Share of all businesses"
              pct={activePct}
              note={`${o.activeBusinesses} of ${total} businesses are live and paying.`}
              stats={[
                { label: "Trials", value: String(o.trialBusinesses) },
                { label: "Suspended", value: String(o.suspendedBusinesses) },
                { label: "Sign-ups", value: String(o.newSignups30d) },
              ]}
              action={{ href: "/admin/super/businesses", label: "Details" }}
            />
          </div>
        </div>

        <MiniStats
          items={[
            { label: "Lifetime GMV", value: compact(o.gmv) },
            { label: "Revenue per business", value: o.activeBusinesses ? money(Math.round(o.mrr / o.activeBusinesses)) : "—" },
            { label: "Failed invoices", value: String(failed.length) },
            { label: "Past-due subscriptions", value: String(pastDue.length) },
          ]}
        />

        <div className="grid grid-cols-12 items-start gap-4 md:gap-6">
          <Panel title="Recent sign-ups" action={{ href: "/admin/super/businesses", label: "View all" }} className="col-span-12 xl:col-span-8">
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {o.recentSignups.map((b) => (
                <li key={b.id}>
                  <Link href={`/admin/super/businesses/${b.id}`} className="flex items-center justify-between gap-3 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-white" style={{ background: b.brandColor }}>
                        {b.name[0]}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-theme-sm font-medium text-gray-800 dark:text-white/90">{b.name}</p>
                        <p className="truncate text-theme-xs text-gray-500">
                          {b.category} · {b.city}, {b.country}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={b.status} />
                      <span className="hidden text-theme-xs text-gray-400 sm:block">{relativeTime(b.joinedAt)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>

          <div className="col-span-12 space-y-4 md:space-y-6 xl:col-span-4">
            <Panel title="Needs attention">
              {attentionRows.length === 0 ? (
                <PanelEmpty>You&apos;re all caught up.</PanelEmpty>
              ) : (
                <ul className="space-y-2">
                  {attentionRows.map((r) => (
                    <li key={r.text}>
                      <Link href={r.href} className="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-2.5 text-theme-sm text-gray-700 transition hover:border-brand-300 dark:border-gray-800 dark:text-gray-300">
                        <span className={`h-2 w-2 shrink-0 rounded-full ${r.tone}`} aria-hidden />
                        {r.text}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
            <Panel title="Quick actions">
              <QuickLinks
                items={[
                  { href: "/admin/super/businesses", label: "Businesses", hint: "Approve or suspend" },
                  { href: "/admin/super/plans", label: "Plans", hint: "Pricing and limits" },
                  { href: "/admin/super/subscriptions", label: "Subscriptions", hint: "Billing status" },
                  { href: "/admin/super/invoices", label: "Invoices", hint: "Payments and failures" },
                ]}
              />
            </Panel>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4 md:gap-6">
          <Card className="col-span-12 xl:col-span-7">
            <CardHeader title="New businesses" subtitle="Sign-ups per month" />
            <div className="px-3 pb-4">
              <BarSeriesChart data={o.signupSeries} name="Sign-ups" />
            </div>
          </Card>
          <Card className="col-span-12 xl:col-span-5">
            <CardHeader title="Businesses by plan" />
            <div className="px-3 pb-4">
              <DonutChart labels={o.planDistribution.map((p) => p.name)} values={o.planDistribution.map((p) => p.count)} />
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
