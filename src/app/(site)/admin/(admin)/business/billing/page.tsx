"use client";
import { useConfirm } from "@/components/ui/confirm";
import { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import { changePlan, getBilling } from "@/services/business";
import { Card, CardHeader, ErrorNote, PageHeader, PageLoading, StatCard } from "@/components/saas/Card";
import StatusBadge from "@/components/saas/StatusBadge";
import { OutlineButton, PrimaryButton, UsageBar } from "@/components/saas/Form";
import { money, shortDate } from "@/lib/format";
import CurrencySwitcher from "@/components/saas/CurrencySwitcher";
import { planAmount, planPriceLabel, useCurrency } from "@/lib/currency";

export default function BillingPage() {
  const { user } = useAuth();
  const confirm = useConfirm();
  const bid = user!.businessId!;
  const { data, loading, error, reload } = useAsync(() => getBilling(bid), [bid]);
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");
  const [currency] = useCurrency();
  const [busyPlan, setBusyPlan] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (loading) return <PageLoading />;
  if (error || !data) return <ErrorNote message={error ?? "Could not load billing."} onRetry={reload} />;
  const { plan, subscription, usage, invoices, plans } = data;

  const choose = async (planId: string, name: string) => {
    if (!(await confirm({ title: `Switch to the ${name} plan?`, message: `You'll be on the ${name} plan, billed ${cycle}.`, confirmLabel: "Switch plan" }))) return;
    setBusyPlan(planId);
    setActionError(null);
    setNotice(null);
    try {
      await changePlan(bid, planId, cycle);
      setNotice(`You're now on the ${name} plan.`);
      reload();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Could not change plan.");
    } finally {
      setBusyPlan(null);
    }
  };

  return (
    <>
      <PageHeader title="Billing & plan" subtitle="Manage your Retailr subscription." />
      {notice && <div role="status" className="mb-4 rounded-xl bg-success-50 px-4 py-3 text-sm text-success-700 dark:bg-success-500/10 dark:text-success-400">{notice}</div>}
      {actionError && <div className="mb-4"><ErrorNote message={actionError} /></div>}

      <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Current plan" value={plan.name} hint={subscription ? (subscription.cycle === "yearly" ? "billed yearly" : "billed monthly") : undefined} />
        <StatCard
          label={subscription?.status === "trialing" ? "Trial ends" : "Next renewal"}
          value={subscription && subscription.amount > 0 ? shortDate(subscription.status === "trialing" ? subscription.trialEndsAt ?? subscription.currentPeriodEnd : subscription.currentPeriodEnd) : "—"}
          hint={subscription && subscription.amount > 0 ? `${money(subscription.amount)} per ${subscription.cycle === "yearly" ? "year" : "month"}` : "Free plan, no renewal"}
        />
        <StatCard label="Total paid" value={money(invoices.filter((i) => i.status === "paid").reduce((n, i) => n + i.amount, 0))} hint={`${invoices.filter((i) => i.status === "paid").length} paid invoices`} />
        <StatCard
          label="Outstanding"
          value={money(invoices.filter((i) => (i.status === "pending" || i.status === "failed")).reduce((n, i) => n + i.amount, 0))}
          hint={`${invoices.filter((i) => (i.status === "pending" || i.status === "failed")).length} unpaid invoices`}
        />
      </div>

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <Card className="col-span-12 xl:col-span-5">
          <CardHeader title="Current plan" />
          <div className="space-y-4 p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold text-gray-800 dark:text-white/90">{plan.name}</p>
              {subscription && <StatusBadge status={subscription.status} />}
            </div>
            {subscription && (
              <p className="text-theme-sm text-gray-500">
                {subscription.amount === 0 ? "Free plan" : `${money(subscription.amount)} / ${subscription.cycle === "yearly" ? "year" : "month"}`} ·{" "}
                {subscription.amount === 0 ? "no renewal" : subscription.status === "trialing" ? `trial ends ${shortDate(subscription.trialEndsAt ?? subscription.currentPeriodEnd)}` : `renews ${shortDate(subscription.currentPeriodEnd)}`}
              </p>
            )}
            <div className="space-y-4 border-t border-gray-100 pt-4 dark:border-gray-800">
              <UsageBar label="Products" used={usage.products.used} limit={usage.products.limit} />
              <UsageBar label="Team members" used={usage.staff.used} limit={usage.staff.limit} />
              <UsageBar label="Orders this month" used={usage.ordersThisMonth.used} limit={usage.ordersThisMonth.limit} />
              <UsageBar label="Storage" used={usage.storageGb.used} limit={usage.storageGb.limit} unit=" GB" />
            </div>
          </div>
        </Card>

        <Card className="col-span-12 xl:col-span-7">
          <CardHeader
            title="Change plan"
            action={
              <div className="flex flex-wrap items-center gap-2">
              <CurrencySwitcher />
              <div className="inline-flex rounded-lg bg-gray-100 p-1 text-theme-sm dark:bg-white/5">
                {(["monthly", "yearly"] as const).map((c) => (
                  <button key={c} onClick={() => setCycle(c)} className={`rounded-md px-3 py-1.5 font-medium ${cycle === c ? "bg-white text-gray-800 shadow-theme-xs dark:bg-gray-800 dark:text-white" : "text-gray-500"}`}>
                    {c === "monthly" ? "Monthly" : "Yearly · save ~17%"}
                  </button>
                ))}
              </div>
              </div>
            }
          />
          <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 sm:p-6">
            {plans.map((p) => {
              const current = p.id === plan.id && subscription?.cycle === cycle;
              return (
                <div key={p.id} className={`flex flex-col rounded-xl border p-4 ${p.id === plan.id ? "border-brand-500" : "border-gray-200 dark:border-gray-800"}`}>
                  <p className="font-semibold text-gray-800 dark:text-white/90">{p.name}</p>
                  <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">
                    {planPriceLabel(p, cycle, currency)}
                    {planAmount(p, "monthly", "USD") > 0 && <span className="text-sm font-normal text-gray-500"> /{cycle === "yearly" ? "yr" : "mo"}</span>}
                  </p>
                  <p className="mt-2 flex-1 text-theme-xs text-gray-500">
                    {p.limits.products === -1 ? "Unlimited" : p.limits.products} products · {p.limits.staff} team
                  </p>
                  <div className="mt-4">
                    {current ? (
                      <OutlineButton disabled className="w-full !py-2">Current plan</OutlineButton>
                    ) : (
                      <PrimaryButton busy={busyPlan === p.id} onClick={() => choose(p.id, p.name)} className="w-full !py-2">Choose</PrimaryButton>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="col-span-12">
          <CardHeader title="Billing history" />
          {invoices.length === 0 ? (
            <p className="px-6 pb-6 pt-4 text-theme-sm text-gray-500">No invoices yet — you're still on your free trial.</p>
          ) : (
            <ul className="divide-y divide-gray-100 px-5 pb-3 pt-3 dark:divide-gray-800 sm:px-6">
              {invoices.map((i) => (
                <li key={i.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-theme-sm">
                  <div>
                    <p className="text-gray-800 dark:text-white/90">{i.description}</p>
                    <p className="text-theme-xs text-gray-500">{shortDate(i.issuedAt)} · <span className="font-mono">{i.id.toUpperCase()}</span></p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-gray-800 dark:text-white/90">{money(i.amount)}</span>
                    <StatusBadge status={i.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
