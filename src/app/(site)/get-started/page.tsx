"use client";
import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthProvider, homeFor, useAuth } from "@/app/context/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import { listPlans } from "@/services/platform";
import MarketingShell, { MARKETING_WIDTH } from "@/components/saas/MarketingShell";
import { Field, inputCls, OutlineButton, PrimaryButton } from "@/components/saas/Form";
import CurrencySwitcher from "@/components/saas/CurrencySwitcher";
import { validatePlanCoupon } from "@/services/planCoupons";
import { planCouponLabel } from "@/lib/planCoupon";
import { planAmount, planPriceLabel, useCurrency } from "@/lib/currency";

const CATEGORIES = ["Fashion & Textiles", "Food & Groceries", "Beauty & Wellness", "Crafts & Decor", "Coffee & Tea", "Jewellery", "Other"];

function SignupFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const { register } = useAuth();
  const { data: plans } = useAsync(listPlans);
  const [currency] = useCurrency();

  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    ownerName: "", email: "", password: "",
    businessName: "", category: CATEGORIES[0], country: "", city: "", phone: "",
    planId: params.get("plan") ?? "plan_growth",
    cycle: (params.get("cycle") === "yearly" ? "yearly" : "monthly") as "monthly" | "yearly",
    couponCode: params.get("code") ?? "",
  });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const [codeNote, setCodeNote] = useState<{ ok: boolean; text: string } | null>(null);
  const checkCode = async () => {
    try {
      const c = await validatePlanCoupon(form.couponCode, form.planId);
      setCodeNote({ ok: true, text: `${c.code} applied: ${planCouponLabel(c)}.` });
    } catch (e) {
      setCodeNote({ ok: false, text: e instanceof Error ? e.message : "Could not check that code." });
    }
  };

  const next = () => {
    setError(null);
    if (step === 1) {
      if (!form.ownerName.trim()) return setError("Please enter your name.");
      if (!/^\S+@\S+\.\S+$/.test(form.email)) return setError("Enter a valid email address.");
      if (form.password.length < 8) return setError("Password must be at least 8 characters.");
    }
    if (step === 2) {
      if (!form.businessName.trim()) return setError("Please enter your business name.");
      if (!form.country.trim() || !form.city.trim()) return setError("Please enter your country and city.");
    }
    setStep((s) => s + 1);
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const u = await register({ ...form, ownerName: form.ownerName.trim(), businessName: form.businessName.trim() });
      router.replace(homeFor(u.role));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create your account.");
      setBusy(false);
    }
  };

  const labels = ["Your account", "Your business", "Choose a plan"];

  return (
    <div className={`${MARKETING_WIDTH} py-14 lg:grid lg:grid-cols-[minmax(0,560px)_1fr] lg:gap-20 lg:py-20`}>
    <div>
      <ol className="mb-8 flex items-center gap-2 text-sm">
        {labels.map((l, i) => (
          <li key={l} className={`flex flex-1 items-center gap-2 ${i + 1 <= step ? "text-brand-600" : "text-gray-400"}`}>
            <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${i + 1 <= step ? "bg-brand-500 text-white" : "bg-gray-100"}`}>{i + 1}</span>
            <span className="hidden sm:inline">{l}</span>
          </li>
        ))}
      </ol>

      <h1 className="text-2xl font-semibold">{labels[step - 1]}</h1>
      <p className="mt-1 text-sm text-gray-500">{step === 3 ? "Start with a 14-day free trial. No card required." : "It takes about a minute."}</p>

      <div className="mt-6 space-y-4">
        {step === 1 && (
          <>
            <Field label="Full name"><input className={inputCls} value={form.ownerName} onChange={set("ownerName")} autoComplete="name" /></Field>
            <Field label="Email"><input type="email" className={inputCls} value={form.email} onChange={set("email")} autoComplete="email" /></Field>
            <Field label="Password" hint="At least 8 characters"><input type="password" className={inputCls} value={form.password} onChange={set("password")} autoComplete="new-password" /></Field>
          </>
        )}
        {step === 2 && (
          <>
            <Field label="Business name"><input className={inputCls} value={form.businessName} onChange={set("businessName")} /></Field>
            <Field label="Category">
              <select className={inputCls} value={form.category} onChange={set("category")}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Country"><input className={inputCls} value={form.country} onChange={set("country")} /></Field>
              <Field label="City"><input className={inputCls} value={form.city} onChange={set("city")} /></Field>
            </div>
            <Field label="Phone (optional)"><input className={inputCls} value={form.phone} onChange={set("phone")} /></Field>
          </>
        )}
        {step === 3 && (
          <>
            <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-lg bg-gray-100 p-1 text-sm">
              {(["monthly", "yearly"] as const).map((c) => (
                <button key={c} type="button" onClick={() => setForm((f) => ({ ...f, cycle: c }))} className={`rounded-md px-4 py-2 font-medium ${form.cycle === c ? "bg-white shadow-theme-xs" : "text-gray-500"}`}>
                  {c === "monthly" ? "Monthly" : "Yearly"}
                </button>
              ))}
            </div>
            <CurrencySwitcher />
            </div>
            <div className="space-y-3">
              {plans?.filter((p) => p.isActive).map((p) => (
                <label key={p.id} className={`flex cursor-pointer items-center justify-between gap-4 rounded-xl border p-4 ${form.planId === p.id ? "border-brand-500 bg-brand-25" : "border-gray-200"}`}>
                  <span className="flex items-center gap-3">
                    <input type="radio" name="plan" checked={form.planId === p.id} onChange={() => { setCodeNote(null); setForm((f) => ({ ...f, planId: p.id })); }} />
                    <span>
                      <span className="block font-semibold">{p.name}</span>
                      <span className="block text-xs text-gray-500">{p.limits.products === -1 ? "Unlimited" : p.limits.products} products · {p.limits.staff} team members</span>
                    </span>
                  </span>
                  <span className="text-right font-semibold">{planPriceLabel(p, form.cycle, currency)}{planAmount(p, "monthly", "USD") > 0 && <span className="text-xs font-normal text-gray-500">/{form.cycle === "yearly" ? "yr" : "mo"}</span>}</span>
                </label>
              ))}
            </div>
            {(plans?.find((p) => p.id === form.planId)?.priceMonthly ?? 0) > 0 && (
              <div className="mt-5">
                <label htmlFor="couponCode" className="mb-1.5 block text-sm font-medium text-gray-700">Discount code <span className="font-normal text-gray-400">(optional)</span></label>
                <div className="flex gap-2">
                  <input id="couponCode" value={form.couponCode} onChange={(e) => { setForm((f) => ({ ...f, couponCode: e.target.value })); setCodeNote(null); }} placeholder="e.g. LAUNCH20" className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm uppercase" />
                  <OutlineButton type="button" onClick={checkCode} disabled={!form.couponCode.trim()}>Apply</OutlineButton>
                </div>
                {codeNote && <p role="status" className={`mt-2 text-sm ${codeNote.ok ? "text-success-600" : "text-error-600"}`}>{codeNote.text}</p>}
              </div>
            )}
          </>
        )}
      </div>

      {error && <p role="alert" className="mt-4 rounded-lg bg-error-50 px-4 py-3 text-sm text-error-600">{error}</p>}

      <div className="mt-8 flex items-center justify-between">
        {step > 1 ? <OutlineButton onClick={() => { setError(null); setStep(step - 1); }}>Back</OutlineButton> : <span />}
        {step < 3 ? <PrimaryButton onClick={next}>Continue</PrimaryButton> : <PrimaryButton busy={busy} onClick={submit}>{plans?.find((p) => p.id === form.planId)?.priceMonthly === 0 ? "Create free store" : "Start free trial"}</PrimaryButton>}
      </div>
      <p className="mt-8 text-center text-sm text-gray-500">Already have an account? <Link href="/admin/login" className="font-medium text-brand-500">Sign in</Link></p>
    </div>

    <aside className="hidden lg:block" aria-label="What you get">
      <div className="sticky top-28 rounded-3xl bg-brand-950 p-10 text-white">
        <p className="text-sm font-medium text-brand-100/80">Everything you need to sell online</p>
        <h2 className="mt-3 text-3xl font-semibold leading-tight">Open your shop in minutes, not weeks.</h2>
        <ul className="mt-8 space-y-4 text-brand-100/90">
          {["14-day free trial, no card required", "Your own storefront link to share anywhere", "Orders, customers and reports in one dashboard", "Upgrade, downgrade or cancel anytime"].map((t) => (
            <li key={t} className="flex gap-3">
              <span aria-hidden className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 text-sm">✓</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
    </div>
  );
}

export default function GetStartedPage() {
  return (
    <MarketingShell>
      <AuthProvider>
        <Suspense fallback={null}>
          <SignupFlow />
        </Suspense>
      </AuthProvider>
    </MarketingShell>
  );
}
