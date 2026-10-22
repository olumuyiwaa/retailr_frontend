"use client";
import { useState } from "react";
import { useAsync } from "@/hooks/useAsync";
import { listPlans, savePlan } from "@/services/platform";
import { Card, ErrorNote, PageHeader, PageLoading } from "@/components/saas/Card";
import { Field, inputCls, OutlineButton, PrimaryButton } from "@/components/saas/Form";
import { Modal } from "@/components/ui/modal";
import { money } from "@/lib/format";
import { formatCurrency, planAmount } from "@/lib/currency";
import { THEMES } from "@/themes/registry";
import type { Plan } from "@/types/saas";

type PlanRow = Plan & { subscribers: number };

export default function PlansPage() {
  const { data, loading, error, reload } = useAsync(listPlans);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (loading) return <PageLoading />;
  if (error || !data) return <ErrorNote message={error ?? "Could not load plans."} onRetry={reload} />;

  const num = (v: FormDataEntryValue | null) => Number(v ?? 0);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editing) return;
    const f = new FormData(e.currentTarget);
    const next: Plan = {
      ...editing,
      name: String(f.get("name")).trim(),
      description: String(f.get("description")).trim(),
      priceMonthly: num(f.get("priceMonthly")),
      priceYearly: num(f.get("priceYearly")),
      localPrices: {
        ...editing.localPrices,
        NGN: { monthly: num(f.get("ngnMonthly")), yearly: num(f.get("ngnYearly")) },
      },
      transactionFeePct: num(f.get("fee")),
      limits: {
        products: num(f.get("products")),
        staff: num(f.get("staff")),
        ordersPerMonth: num(f.get("orders")),
        storageGb: num(f.get("storage")),
        smsPerMonth: num(f.get("sms")),
      },
      features: String(f.get("features")).split("\n").map((s) => s.trim()).filter(Boolean),
      themes: ["classic", ...f.getAll("themes").map(String).filter((t) => t !== "classic")],
      isActive: f.get("isActive") === "on",
    };
    if (!next.name) return setFormError("Plan name is required.");
    if (next.priceMonthly < 0 || next.priceYearly < 0) return setFormError("Prices cannot be negative.");
    setSaving(true);
    setFormError(null);
    try {
      await savePlan(next);
      setEditing(null);
      reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not save plan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="Plans" subtitle="Pricing tiers businesses can subscribe to. Use -1 for unlimited." />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 md:gap-6">
        {data.map((p: PlanRow) => (
          <Card key={p.id} className={`flex flex-col p-6 ${p.highlighted ? "ring-2 ring-brand-500" : ""}`}>
            <div className="flex items-start justify-between">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">{p.name}</h3>
              {!p.isActive && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-white/5">Hidden</span>}
            </div>
            <p className="mt-1 text-theme-sm text-gray-500">{p.description}</p>
            <p className="mt-4 text-3xl font-bold text-gray-800 dark:text-white/90">
              {p.priceMonthly === 0 ? "Free" : <>{formatCurrency(planAmount(p, "monthly", "NGN"), "NGN")}<span className="text-base font-normal text-gray-500"> / mo</span></>}
            </p>
            <p className="text-theme-xs text-gray-500">
              {p.priceMonthly === 0 ? "No card needed" : `${money(p.priceMonthly)} / mo in USD · ${formatCurrency(planAmount(p, "yearly", "NGN"), "NGN")} yearly`} · {p.transactionFeePct}% transaction fee
            </p>
            <ul className="mt-5 flex-1 space-y-2 text-theme-sm text-gray-600 dark:text-gray-400">
              {p.features.map((f) => (
                <li key={f} className="flex gap-2"><span className="text-success-500">✓</span>{f}</li>
              ))}
            </ul>
            <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-800">
              <span className="text-theme-sm text-gray-500">{p.subscribers} subscribers</span>
              <OutlineButton className="!px-4 !py-2" onClick={() => { setFormError(null); setEditing(p); }}>Edit</OutlineButton>
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={!!editing} onClose={() => setEditing(null)} className="max-w-[640px] p-6 sm:p-8 m-4 max-h-[92vh] overflow-y-auto">
        {editing && (
          <form onSubmit={submit} className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">Edit {editing.name} plan</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Name"><input name="name" defaultValue={editing.name} className={inputCls} /></Field>
              <Field label="Transaction fee (%)"><input name="fee" type="number" step="0.1" min="0" defaultValue={editing.transactionFeePct} className={inputCls} /></Field>
              <Field label="Monthly price (USD)"><input name="priceMonthly" type="number" min="0" defaultValue={editing.priceMonthly} className={inputCls} /></Field>
              <Field label="Yearly price (USD)"><input name="priceYearly" type="number" min="0" defaultValue={editing.priceYearly} className={inputCls} /></Field>
              <Field label="Monthly price (NGN)"><input name="ngnMonthly" type="number" min="0" defaultValue={editing.localPrices?.NGN?.monthly ?? 0} className={inputCls} /></Field>
              <Field label="Yearly price (NGN)"><input name="ngnYearly" type="number" min="0" defaultValue={editing.localPrices?.NGN?.yearly ?? 0} className={inputCls} /></Field>
              <Field label="Product limit"><input name="products" type="number" min="-1" defaultValue={editing.limits.products} className={inputCls} /></Field>
              <Field label="Team member limit"><input name="staff" type="number" min="-1" defaultValue={editing.limits.staff} className={inputCls} /></Field>
              <Field label="Orders / month limit"><input name="orders" type="number" min="-1" defaultValue={editing.limits.ordersPerMonth} className={inputCls} /></Field>
              <Field label="Storage (GB)"><input name="storage" type="number" min="0" defaultValue={editing.limits.storageGb} className={inputCls} /></Field>
              <Field label="SMS / month limit"><input name="sms" type="number" min="-1" defaultValue={editing.limits.smsPerMonth ?? 50} className={inputCls}/>
              </Field>
            </div>
            <Field label="Description"><input name="description" defaultValue={editing.description} className={inputCls} /></Field>
            <Field label="Features" hint="One per line">
              <textarea name="features" rows={6} defaultValue={editing.features.join("\n")} className={`${inputCls} h-auto py-3`} />
            </Field>
            <Field label="Storefront themes" hint="Themes businesses on this plan can choose. Classic is always included.">
              <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1">
                {THEMES.map((t) => (
                  <label key={t.id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-400">
                    <input type="checkbox" name="themes" value={t.id} defaultChecked={t.id === "classic" || editing.themes.includes(t.id)} disabled={t.id === "classic"} />
                    {t.name}
                  </label>
                ))}
              </div>
            </Field>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-400">
              <input type="checkbox" name="isActive" defaultChecked={editing.isActive} /> Available for new subscriptions
            </label>
            {formError && <ErrorNote message={formError} />}
            <div className="flex justify-end gap-3 pt-2">
              <OutlineButton type="button" onClick={() => setEditing(null)}>Cancel</OutlineButton>
              <PrimaryButton busy={saving}>Save plan</PrimaryButton>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
