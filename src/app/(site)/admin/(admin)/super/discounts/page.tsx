"use client";
import { useState } from "react";
import { useConfirm } from "@/components/ui/confirm";
import { useAsync } from "@/hooks/useAsync";
import { deletePlanCoupon, listBusinesses, listPlanCoupons, listPlans, savePlanCoupon, setPlanCouponStatus, type PlanCouponRow } from "@/services/platform";
import { ErrorNote, PageHeader, PageLoading, StatCard } from "@/components/saas/Card";
import DataTable, { type Column } from "@/components/saas/DataTable";
import StatusBadge from "@/components/saas/StatusBadge";
import { Field, inputCls, OutlineButton, PrimaryButton } from "@/components/saas/Form";
import RowActions from "@/components/saas/RowActions";
import { Modal } from "@/components/ui/modal";
import { money, shortDate } from "@/lib/format";
import { planCouponLabel } from "@/lib/planCoupon";

const effective = (c: PlanCouponRow): string =>
  c.status === "disabled" ? "disabled"
  : c.expiresAt && new Date(c.expiresAt).getTime() < Date.now() ? "expired"
  : c.maxUses != null && c.usedCount >= c.maxUses ? "used_up"
  : "active";

export default function PlanDiscountsPage() {
  const confirm = useConfirm();
  const { data, loading, error, reload } = useAsync(listPlanCoupons);
  const { data: plans } = useAsync(listPlans);
  const { data: businesses } = useAsync(listBusinesses);
  const [editing, setEditing] = useState<PlanCouponRow | "new" | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  if (loading) return <PageLoading />;
  if (error || !data) return <ErrorNote message={error ?? "Could not load discounts."} onRetry={reload} />;

  const run = async (fn: () => Promise<unknown>) => {
    setRowError(null);
    try { await fn(); reload(); } catch (e) { setRowError(e instanceof Error ? e.message : "Something went wrong."); }
  };

  const columns: Column<PlanCouponRow>[] = [
    {
      key: "code", header: "Code", sortValue: (c) => c.code,
      render: (c) => (
        <div>
          <span className="font-mono font-semibold text-gray-800 dark:text-white/90">{c.code}</span>
          {c.note && <p className="text-theme-xs text-gray-500">{c.note}</p>}
        </div>
      ),
    },
    { key: "value", header: "Discount", sortValue: (c) => c.value, render: (c) => planCouponLabel(c) },
    { key: "for", header: "Available to", render: (c) => `${c.businessName ?? "Any business"} · ${c.planNames.length ? c.planNames.join(", ") : "all paid plans"}` },
    { key: "used", header: "Used", sortValue: (c) => c.usedCount, render: (c) => (c.maxUses != null ? `${c.usedCount} / ${c.maxUses}` : String(c.usedCount)) },
    { key: "exp", header: "Expires", render: (c) => (c.expiresAt ? shortDate(c.expiresAt) : "Never") },
    { key: "status", header: "Status", render: (c) => <StatusBadge status={effective(c)} /> },
    {
      key: "actions", header: "", className: "text-right whitespace-nowrap",
      render: (c) => (
        <RowActions
          label={`Actions for ${c.code}`}
          actions={[
            { label: "Edit", onClick: () => { setFormError(null); setEditing(c); } },
            { label: c.status === "active" ? "Disable" : "Enable", onClick: () => run(() => setPlanCouponStatus(c.id, c.status === "active" ? "disabled" : "active")) },
            { label: "Delete", tone: "danger", onClick: async () => { if (await confirm({ title: `Delete ${c.code}?`, message: "Businesses that already use it keep their discount; no one new can apply it.", confirmLabel: "Delete code", tone: "danger" })) run(() => deletePlanCoupon(c.id)); } },
          ]}
        />
      ),
    },
  ];

  const c = editing && editing !== "new" ? editing : null;
  const paidPlans = (plans ?? []).filter((p) => p.priceMonthly > 0);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const num = (k: string) => (String(f.get(k)).trim() === "" ? undefined : Number(f.get(k)));
    const exp = String(f.get("expiresAt"));
    setSaving(true);
    setFormError(null);
    try {
      await savePlanCoupon(c?.id ?? null, {
        code: String(f.get("code")),
        type: f.get("type") === "fixed" ? "fixed" : "percent",
        value: Number(f.get("value")),
        planIds: f.getAll("planIds").map(String),
        businessId: String(f.get("businessId") || "") || undefined,
        maxUses: num("maxUses"),
        expiresAt: exp ? new Date(`${exp}T23:59:59`).toISOString() : undefined,
        note: String(f.get("note") ?? ""),
      });
      setEditing(null);
      reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not save the discount.");
    } finally {
      setSaving(false);
    }
  };

  const live = data.filter((x) => effective(x) === "active");
  return (
    <>
      <PageHeader
        title="Subscription discounts"
        subtitle="Codes businesses can enter when they subscribe or change plan."
        action={<PrimaryButton onClick={() => { setFormError(null); setEditing("new"); }}>+ New discount</PrimaryButton>}
      />
      {rowError && <div className="mb-4"><ErrorNote message={rowError} /></div>}
      <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Discount codes" value={String(data.length)} hint={`${data.filter((x) => x.status === "disabled").length} disabled`} />
        <StatCard label="Active now" value={String(live.length)} hint={`${data.filter((x) => effective(x) === "expired").length} expired`} />
        <StatCard label="Businesses using one" value={String(data.reduce((n, x) => n + x.redeemed, 0))} hint={`${data.reduce((n, x) => n + x.usedCount, 0)} redemptions in total`} />
        <StatCard label="Discounted per month" value={money(data.reduce((n, x) => n + x.discountPerMonth, 0))} hint="from active subscriptions" />
      </div>
      <DataTable rows={data} columns={columns} rowKey={(x) => x.id} searchText={(x) => `${x.code} ${x.note ?? ""}`} searchPlaceholder="Search codes…" />

      <Modal isOpen={editing !== null} onClose={() => setEditing(null)} className="max-w-[520px] p-6 sm:p-8 m-4">
        <form onSubmit={submit} className="space-y-4" key={c?.id ?? "new"}>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">{c ? "Edit discount" : "New discount"}</h3>
          <Field label="Code"><input name="code" defaultValue={c?.code} placeholder="LAUNCH20" className={`${inputCls} uppercase`} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Type">
              <select name="type" defaultValue={c?.type ?? "percent"} className={inputCls}>
                <option value="percent">Percentage</option>
                <option value="fixed">Fixed amount (USD)</option>
              </select>
            </Field>
            <Field label="Value"><input name="value" type="number" min="0" step="any" defaultValue={c?.value} className={inputCls} /></Field>
          </div>
          <Field label="Available to">
            <select name="businessId" defaultValue={c?.businessId ?? ""} className={inputCls}>
              <option value="">Any business</option>
              {(businesses ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </Field>
          <fieldset>
            <legend className="mb-1.5 text-theme-sm font-medium text-gray-700 dark:text-gray-400">Plans <span className="font-normal text-gray-400">(none ticked = all paid plans)</span></legend>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {paidPlans.map((p) => (
                <label key={p.id} className="inline-flex items-center gap-2 text-theme-sm text-gray-700 dark:text-gray-300">
                  <input type="checkbox" name="planIds" value={p.id} defaultChecked={c?.planIds?.includes(p.id)} /> {p.name}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Max uses (optional)"><input name="maxUses" type="number" min="1" defaultValue={c?.maxUses} className={inputCls} /></Field>
            <Field label="Expires (optional)"><input name="expiresAt" type="date" defaultValue={c?.expiresAt?.slice(0, 10)} className={inputCls} /></Field>
          </div>
          <Field label="Note (optional)"><input name="note" defaultValue={c?.note} placeholder="What this is for" className={inputCls} /></Field>
          <p className="text-theme-xs text-gray-500">The discount comes off each billing period for as long as the business stays on that plan.</p>
          {formError && <ErrorNote message={formError} />}
          <div className="flex justify-end gap-3 pt-2">
            <OutlineButton type="button" onClick={() => setEditing(null)}>Cancel</OutlineButton>
            <PrimaryButton busy={saving}>Save discount</PrimaryButton>
          </div>
        </form>
      </Modal>
    </>
  );
}
