"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useAsync } from "@/hooks/useAsync";
import { listPlans } from "@/services/plans";
import CurrencySwitcher from "./CurrencySwitcher";
import { formatCurrency, planAmount, planPriceLabel, useCurrency } from "@/lib/currency";

export default function PricingCards() {
  const { data, loading, error } = useAsync(listPlans);
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");
  const [currency] = useCurrency();

  return (
    <div>
      <div className="mb-10 flex flex-wrap items-center justify-center gap-3">
        <div className="inline-flex rounded-lg bg-gray-100 p-1 text-sm">
          {(["monthly", "yearly"] as const).map((c) => (
            <button key={c} onClick={() => setCycle(c)} className={`rounded-md px-4 py-2 font-medium ${cycle === c ? "bg-white shadow-theme-xs text-gray-800" : "text-gray-500"}`}>
              {c === "monthly" ? "Monthly" : "Yearly · 2 months free"}
            </button>
          ))}
        </div>
        <CurrencySwitcher />
      </div>
      {loading && <p className="text-gray-500">Loading plans…</p>}
      {error && <p role="alert" className="text-error-600">Could not load plans. Please refresh.</p>}
      <div className="grid gap-6 text-left sm:grid-cols-2 xl:grid-cols-4">
        {data?.filter((p) => p.isActive).map((p) => {
          const free = planAmount(p, "monthly", "USD") === 0;
          const monthly = cycle === "yearly" ? planAmount(p, "yearly", currency) / 12 : planAmount(p, "monthly", currency);
          return (
            <div key={p.id} className={`flex flex-col rounded-2xl border bg-white p-7 ${p.highlighted ? "border-brand-500 shadow-theme-lg ring-1 ring-brand-500" : "border-gray-200"}`}>
              {p.highlighted && <span className="mb-3 w-fit rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-600">Most popular</span>}
              <h3 className="text-xl font-semibold">{p.name}</h3>
              <p className="mt-1 min-h-[40px] text-sm text-gray-500">{p.description}</p>
              <p className="mt-6 text-4xl font-bold">
                {free ? "Free" : formatCurrency(monthly, currency)}
                {!free && <span className="text-base font-normal text-gray-500"> / month</span>}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                {free ? "No card needed" : cycle === "yearly" ? `${planPriceLabel(p, "yearly", currency)} billed yearly` : "Billed monthly"} · {p.transactionFeePct}% transaction fee
              </p>
              <ul className="mt-6 flex-1 space-y-3 text-sm text-gray-600">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2"><span className="text-success-500">✓</span>{f}</li>
                ))}
              </ul>
              <Link href={`/get-started?plan=${p.id}&cycle=${cycle}`} className={`mt-8 rounded-lg px-5 py-3 text-center text-sm font-medium ${p.highlighted ? "bg-brand-500 text-white hover:bg-brand-600" : "bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"}`}>
                {free ? "Start for free" : "Start 14-day free trial"}
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
