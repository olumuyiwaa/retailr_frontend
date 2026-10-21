"use client";
import Link from "next/link";
import { useBizCurrency, useBizMoney } from "@/hooks/useBizMoney";
import { useAuth } from "@/app/context/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import { getBilling, getBusinessOverview, getBusinessProfile } from "@/services/business";
import { storePath } from "@/lib/store";
import { Card, CardHeader, ErrorNote, PageHeader, PageLoading } from "@/components/saas/Card";
import { AreaSeriesChart, DonutChart } from "@/components/saas/Charts";
import { AlertBanner, Gauge, KpiTile, MiniStats, Panel, PanelEmpty, QuickLinks, SetupChecklist } from "@/components/saas/Dash";
import StatusBadge, { label } from "@/components/saas/StatusBadge";
import { relativeTime, shortDate } from "@/lib/format";

const DAY = 86400000;
const STATUS_COLORS: Record<string, string> = {
  pending: "#f79009", processing: "#465fff", shipped: "#7a5af8", delivered: "#12b76a", cancelled: "#f04438", refunded: "#98a2b3",
};
const pctChip = (n: number) => `${n >= 0 ? "▲" : "▼"} ${Math.abs(n).toFixed(1)}%`;

export default function BusinessDashboard() {
  const { user } = useAuth();
  const fmt = useBizMoney();
  const currency = useBizCurrency();
  const bid = user!.businessId!;
  const { data, loading, error, reload } = useAsync(
    async () => {
      const [overview, profile, billing] = await Promise.all([getBusinessOverview(bid), getBusinessProfile(bid), getBilling(bid).catch(() => null)]); // only owners may open billing
      return { overview, profile, billing };
    },
    [bid]
  );
  if (loading) return <PageLoading />;
  if (error || !data) return <ErrorNote message={error ?? "Could not load dashboard."} onRetry={reload} />;

  const { overview: o, profile, billing } = data;
  const sub = billing?.subscription;
  const statusData = o.ordersByStatus.filter((s) => s.count > 0);
  const attention = o.pendingOrders + o.unpaidOrders + o.outOfStock;

  // Account status strip, most urgent first
  const trialDays = sub?.trialEndsAt ? Math.ceil((new Date(sub.trialEndsAt).getTime() - Date.now()) / DAY) : null;
  const banner: { tone: "red" | "amber" | "blue"; text: string; cta?: boolean } | null =
    profile.status === "suspended"
      ? { tone: "red", text: "Your store is offline because the account is suspended. Contact Retailr support to get it back online." }
      : profile.status === "pending"
        ? { tone: "amber", text: "Your store is waiting for approval. It will go live as soon as Retailr confirms your details." }
        : sub?.status === "past_due"
          ? { tone: "red", cta: true, text: "Your last payment failed. Update your payment method to keep your store online." }
          : sub?.status === "cancelled"
            ? { tone: "amber", cta: true, text: "Your subscription is cancelled, so your store is offline. Choose a plan to bring it back." }
            : sub?.status === "trialing" && trialDays !== null
              ? {
                  tone: trialDays <= 5 ? "amber" : "blue",
                  cta: true,
                  text: trialDays <= 0 ? "Your free trial ends today." : `Your free trial ends in ${trialDays} day${trialDays === 1 ? "" : "s"}${sub.trialEndsAt ? ` (${shortDate(sub.trialEndsAt)})` : ""}.`,
                }
              : null;

  const setup = [
    { key: "product", title: "Add your first product", hint: "Give shoppers something to buy.", done: o.productsTotal > 0, href: "/admin/business/products", cta: "Add product" },
    { key: "publish", title: "Publish a product", hint: "Draft products stay hidden from your store.", done: o.activeProducts > 0, href: "/admin/business/products", cta: "Open products" },
    { key: "sale", title: "Make your first sale", hint: "Share your store link with your first customers.", done: o.totalOrders > 0, href: "/admin/business/settings", cta: "Get store link" },
    { key: "team", title: "Invite a teammate", hint: "Let someone help you fulfil orders.", done: o.teamSize > 1, href: "/admin/business/team", cta: "Invite" },
  ];
  const setupDone = setup.every((s) => s.done);

  const attentionRows = [
    { show: o.pendingOrders > 0, text: `${o.pendingOrders} order${o.pendingOrders === 1 ? "" : "s"} waiting to be processed`, href: "/admin/business/orders", tone: "bg-warning-500" },
    { show: o.unpaidOrders > 0, text: `${o.unpaidOrders} unpaid order${o.unpaidOrders === 1 ? "" : "s"} (${fmt(o.unpaidAmount)})`, href: "/admin/business/orders", tone: "bg-warning-500" },
    { show: o.outOfStock > 0, text: `${o.outOfStock} product${o.outOfStock === 1 ? "" : "s"} out of stock`, href: "/admin/business/products", tone: "bg-error-500" },
    { show: o.lowStockCount > 0, text: `${o.lowStockCount} product${o.lowStockCount === 1 ? "" : "s"} running low`, href: "/admin/business/products", tone: "bg-warning-500" },
  ].filter((r) => r.show);

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user!.name.split(" ")[0]}`}
        subtitle={`Here's how ${profile.name} is doing.`}
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/business/products" className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600">
              + Add product
            </Link>
            <a
              href={storePath(profile.slug)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-white/[0.04]"
            >
              View my store ↗
            </a>
          </div>
        }
      />

      <div className="space-y-4 md:space-y-6">
        {banner && (
          <AlertBanner tone={banner.tone} action={banner.cta ? { href: "/admin/business/billing", label: "Manage plan" } : undefined}>
            {banner.text}
          </AlertBanner>
        )}

        {!setupDone && <SetupChecklist steps={setup} />}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
          <KpiTile
            label="Revenue (30d)"
            value={fmt(o.revenue30d)}
            hint="vs previous 30 days"
            chip={o.totalOrders ? pctChip(o.revenueChangePct) : undefined}
            chipTone={o.revenueChangePct >= 0 ? "good" : "bad"}
          />
          <KpiTile
            label="Orders (30d)"
            value={String(o.orders30d)}
            hint={`${o.totalOrders} all time`}
            href="/admin/business/orders"
            chip={o.totalOrders ? pctChip(o.ordersChangePct) : undefined}
            chipTone={o.ordersChangePct >= 0 ? "good" : "bad"}
          />
          <KpiTile
            label="Needs attention"
            value={String(attention)}
            hint={attention ? "Orders and stock to look at" : "Nothing waiting on you"}
            href={o.pendingOrders + o.unpaidOrders > 0 ? "/admin/business/orders" : "/admin/business/products"}
            chip={attention ? "Action needed" : "All clear"}
            chipTone={attention ? "warn" : "good"}
          />
          <KpiTile label="Customers" value={String(o.customers)} hint={`${o.newCustomers30d} new in 30 days`} href="/admin/business/customers" />
        </div>

        <div className="grid grid-cols-12 gap-4 md:gap-6">
          <Card className="col-span-12 xl:col-span-8">
            <CardHeader title="Revenue" subtitle="Paid orders per day, last 30 days" />
            <div className="px-1 pb-4 sm:px-2">
              <AreaSeriesChart data={o.revenueSeries} name="Revenue" currency={currency} />
            </div>
          </Card>
          <div className="col-span-12 xl:col-span-4">
            <Gauge
              title="Fulfilment rate"
              subtitle="Orders delivered"
              pct={o.fulfilmentRatePct}
              note={o.totalOrders ? `${o.cancelRatePct.toFixed(0)}% of orders were cancelled.` : "Your rate shows once you have orders."}
              stats={[
                { label: "Pending", value: String(o.pendingOrders) },
                { label: "Unpaid", value: fmt(o.unpaidAmount) },
                { label: "Avg. order", value: fmt(Math.round(o.avgOrderValue)) },
              ]}
              action={{ href: "/admin/business/orders", label: "Orders" }}
            />
          </div>
        </div>

        <MiniStats
          items={[
            { label: "Average order value", value: fmt(Math.round(o.avgOrderValue)) },
            { label: "Cancel rate", value: `${o.cancelRatePct.toFixed(0)}%` },
            { label: "Waiting for payment", value: fmt(o.unpaidAmount) },
            { label: "Live products", value: `${o.activeProducts} of ${o.productsTotal}` },
          ]}
        />

        <div className="grid grid-cols-12 items-start gap-4 md:gap-6">
          <Panel title="Recent orders" action={{ href: "/admin/business/orders", label: "View all" }} className="col-span-12 xl:col-span-8">
            {o.recentOrders.length === 0 ? (
              <PanelEmpty>Orders will show up here as customers buy.</PanelEmpty>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {o.recentOrders.map((r) => (
                  <li key={r.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="truncate text-theme-sm font-medium text-gray-800 dark:text-white/90">
                        {r.number} · {r.customerName}
                      </p>
                      <p className="mt-0.5 truncate text-theme-xs text-gray-500">
                        {r.items[0]?.name}
                        {r.items.length > 1 ? ` +${r.items.length - 1} more` : ""} · {relativeTime(r.placedAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <StatusBadge status={r.status} />
                      <span className="text-theme-xs font-medium text-gray-600 dark:text-gray-300">{fmt(r.total)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
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
                  { href: "/admin/business/sales/new", label: "Record a sale", hint: "In person, WhatsApp, Instagram" },
                  { href: "/admin/business/reports", label: "Reports", hint: "Sales, channels, best sellers" },
                  { href: "/admin/business/products", label: "Products", hint: "Add or edit items" },
                  { href: "/admin/business/orders", label: "Orders", hint: "Process and ship" },
                  { href: "/admin/business/customers", label: "Customers", hint: "See who's buying" },
                  { href: "/admin/business/settings", label: "Store settings", hint: "Name, colour, link" },
                ]}
              />
            </Panel>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4 md:gap-6">
          <Panel title="Top products" action={{ href: "/admin/business/products", label: "All products" }} className="col-span-12 xl:col-span-6">
            {o.topProducts.length === 0 ? (
              <PanelEmpty>No sales yet.</PanelEmpty>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {o.topProducts.map((p) => (
                  <li key={p.id} className="flex items-center justify-between py-3 text-theme-sm first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <span className="h-9 w-9 rounded-lg" style={{ background: p.imageColor }} />
                      <span className="text-gray-800 dark:text-white/90">{p.name}</span>
                    </div>
                    <span className="text-gray-500">{p.sold} sold</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Card className="col-span-12 xl:col-span-6">
            <CardHeader title="Orders by status" />
            <div className="px-3 pb-4">
              {statusData.length ? (
                <DonutChart labels={statusData.map((s) => label(s.status))} values={statusData.map((s) => s.count)} colors={statusData.map((s) => STATUS_COLORS[s.status])} />
              ) : (
                <p className="px-3 py-10 text-center text-theme-sm text-gray-500">No orders yet.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
