"use client";
import { useConfirm } from "@/components/ui/confirm";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import { changePlan, getBilling, verifyPayment } from "@/services/business";
import { validatePlanCoupon } from "@/services/planCoupons";
import { planCouponLabel, planDiscountUsd } from "@/lib/planCoupon";
import type { PlanCoupon } from "@/types/saas";
import { Card, CardHeader, ErrorNote, PageHeader, PageLoading, StatCard } from "@/components/saas/Card";
import StatusBadge from "@/components/saas/StatusBadge";
import { Field, inputCls, OutlineButton, PrimaryButton, UsageBar } from "@/components/saas/Form";
import { money, shortDate } from "@/lib/format";
import CurrencySwitcher from "@/components/saas/CurrencySwitcher";
import { formatCurrency, planAmount, planPriceLabel, useCurrency } from "@/lib/currency";

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
  const [codeInput, setCodeInput] = useState("");
  const [coupon, setCoupon] = useState<PlanCoupon | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  // coming back from the payment page: ask the API how the payment ended (it can take a moment to settle)
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("reference");
    if (!ref) return;
    let cancelled = false;
    const clean = () => window.history.replaceState(null, "", window.location.pathname);
    (async () => {
      setNotice("Confirming your payment…");
      for (let i = 0; i < 15 && !cancelled; i++) {
        try {
          const r = await verifyPayment(ref);
          if (r.status === "paid") { setNotice("Payment received. Your plan is active."); clean(); reload(); return; }
          if (r.status === "failed") { setNotice(null); setActionError("Your payment didn't go through. You haven't been charged. Please try again."); clean(); return; }
        } catch (e) {
          setNotice(null);
          setActionError(e instanceof Error ? e.message : "We couldn't confirm your payment.");
          clean();
          return;
        }
        await new Promise((r) => setTimeout(r, 4000));
      }
      if (!cancelled) { setNotice("We're still waiting for your bank. Your plan will update as soon as the payment is confirmed."); clean(); }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <PageLoading />;
  if (error || !data) return <ErrorNote message={error ?? "Could not load billing."} onRetry={reload} />;
  const { plan, subscription, usage, invoices, plans } = data;

  const applyCode = async () => {
    setCodeError(null);
    setChecking(true);
    try {
      // validated against the cheapest paid plan it could work on; each card re-checks its own plan below
      const paid = plans.filter((p) => p.priceMonthly > 0);
      let found: PlanCoupon | null = null;
      let lastErr = "That discount code isn't valid.";
      for (const p of paid) {
        try { found = await validatePlanCoupon(codeInput, p.id); break; } catch (e) { lastErr = e instanceof Error ? e.message : lastErr; }
      }
      if (!found) throw new Error(lastErr);
      setCoupon(found);
    } catch (e) {
      setCoupon(null);
      setCodeError(e instanceof Error ? e.message : "Could not check that code.");
    } finally {
      setChecking(false);
    }
  };
  const couponFor = (planId: string) => (coupon && (!coupon.planIds?.length || coupon.planIds.includes(planId)) ? coupon : null);

  const choose = async (planId: string, name: string) => {
    if (!(await confirm({ title: `Switch to the ${name} plan?`, message: `You'll be on the ${name} plan, billed ${cycle}.`, confirmLabel: "Switch plan" }))) return;
    setBusyPlan(planId);
    setActionError(null);
    setNotice(null);
    try {
      const r = await changePlan(bid, planId, cycle, couponFor(planId)?.code);
      if (r.redirected) return; // on the way to the payment page
      setCoupon(null);
      setCodeInput("");
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
      {subscription?.status === "past_due" && data.payments?.enabled && (
        <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-warning-50 px-4 py-3 text-sm text-warning-700 dark:bg-warning-500/10 dark:text-orange-400">
          <span>Your last payment didn&apos;t go through. Pay now to keep your store running without interruption.</span>
          <PrimaryButton onClick={() => choose(plan.id, plan.name)} disabled={busyPlan !== null}>Pay now</PrimaryButton>
        </div>
      )}

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
                {subscription.amount === 0 ? "Free plan" : `${money(subscription.amount)} / ${subscription.cycle === "yearly" ? "year" : "month"}`}
                {subscription.couponCode ? ` (code ${subscription.couponCode}, saves ${money(subscription.discount ?? 0)})` : ""} ·{" "}
                {subscription.amount === 0 ? "no renewal" : subscription.status === "trialing" ? `trial ends ${shortDate(subscription.trialEndsAt ?? subscription.currentPeriodEnd)}` : `renews ${shortDate(subscription.currentPeriodEnd)}`}
              </p>
            )}
            <div className="space-y-4 border-t border-gray-100 pt-4 dark:border-gray-800">
              <UsageBar label="Products" used={usage.products.used} limit={usage.products.limit} />
              <UsageBar label="Team members" used={usage.staff.used} limit={usage.staff.limit} />
              <UsageBar label="Orders this month" used={usage.ordersThisMonth.used} limit={usage.ordersThisMonth.limit} />
              <UsageBar label="Storage" used={usage.storageGb.used} limit={usage.storageGb.limit} unit=" GB" />
              {usage.smsThisMonth && (
                <UsageBar label="SMS this month" used={usage.smsThisMonth.used} limit={usage.smsThisMonth.limit} />
              )}
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
          <div className="px-5 pt-4 sm:px-6">
            <Field label="Discount code">
              <div className="flex gap-2">
                <input value={codeInput} onChange={(e) => { setCodeInput(e.target.value); setCoupon(null); setCodeError(null); }} placeholder="Have a code?" className={`${inputCls} uppercase`} />
                <OutlineButton type="button" onClick={applyCode} disabled={checking || !codeInput.trim()}>{checking ? "Checking…" : "Apply"}</OutlineButton>
              </div>
            </Field>
            {coupon && <p role="status" className="mt-2 text-theme-sm text-success-600">{coupon.code} applied: {planCouponLabel(coupon)}{coupon.planIds?.length ? " on the plans marked below" : ""}.</p>}
            {codeError && <p role="alert" className="mt-2 text-theme-sm text-error-600">{codeError}</p>}
          </div>
          <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 sm:p-6">
            {plans.map((p) => {
              const cp = couponFor(p.id);
              const listUsd = cycle === "yearly" ? p.priceYearly : p.priceMonthly;
              const ratio = cp && listUsd > 0 ? 1 - planDiscountUsd(cp, listUsd) / listUsd : 1;
              const current = p.id === plan.id && subscription?.cycle === cycle;
              return (
                <div key={p.id} className={`flex flex-col rounded-xl border p-4 ${p.id === plan.id ? "border-brand-500" : "border-gray-200 dark:border-gray-800"}`}>
                  <p className="font-semibold text-gray-800 dark:text-white/90">{p.name}</p>
                  <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">
                    {cp && ratio < 1 && <span className="mr-2 text-base font-normal text-gray-400 line-through">{planPriceLabel(p, cycle, currency)}</span>}
                    {cp && ratio < 1 ? formatCurrency(planAmount(p, cycle, currency) * ratio, currency) : planPriceLabel(p, cycle, currency)}
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
            <p className="px-6 pb-6 pt-4 text-theme-sm text-gray-500">No invoices yet — you&apos;re still on your free trial.</p>
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
