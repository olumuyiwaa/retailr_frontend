"use client";
import { useConfirm } from "@/components/ui/confirm";
import { useState } from "react";
import { useBizMoney } from "@/hooks/useBizMoney";
import { useAuth } from "@/app/context/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import { deleteCoupon, listCoupons, listOrders, saveCoupon, setCouponStatus } from "@/services/business";
import { ErrorNote, PageHeader, PageLoading, StatCard } from "@/components/saas/Card";
import DataTable, { type Column } from "@/components/saas/DataTable";
import StatusBadge from "@/components/saas/StatusBadge";
import { Field, inputCls, OutlineButton, PrimaryButton } from "@/components/saas/Form";
import RowActions from "@/components/saas/RowActions";
import { Modal } from "@/components/ui/modal";
import { shortDate } from "@/lib/format";
import type { Coupon } from "@/types/saas";

const effective = (c: Coupon): string =>
  c.status === "disabled" ? "disabled"
  : c.expiresAt && new Date(c.expiresAt).getTime() < Date.now() ? "expired"
  : c.maxUses != null && c.usedCount >= c.maxUses ? "used_up"
  : "active";

export default function CouponsPage() {
  const { user } = useAuth();
  const confirm = useConfirm();
  const fmt = useBizMoney();
  const bid = user!.businessId!;
  const { data, loading, error, reload } = useAsync(() => listCoupons(bid), [bid]);
  const { data: orders } = useAsync(() => listOrders(bid), [bid]);
  const [editing, setEditing] = useState<Coupon | "new" | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  if (loading) return <PageLoading />;
  if (error || !data) return <ErrorNote message={error ?? "Could not load discounts."} onRetry={reload} />;

  const run = async (fn: () => Promise<unknown>) => {
    setRowError(null);
    try { await fn(); reload(); } catch (e) { setRowError(e instanceof Error ? e.message : "Something went wrong."); }
  };

  const columns: Column<Coupon>[] = [
    { key: "code", header: "Code", sortValue: (c) => c.code, render: (c) => <span className="font-mono font-semibold text-gray-800 dark:text-white/90">{c.code}</span> },
    { key: "value", header: "Discount", render: (c) => (c.type === "percent" ? `${c.value}% off` : `${fmt(c.value)} off`) },
    { key: "min", header: "Minimum order", render: (c) => (c.minOrder ? fmt(c.minOrder) : "—") },
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
            { label: c.status === "active" ? "Disable" : "Enable", onClick: () => run(() => setCouponStatus(bid, c.id, c.status === "active" ? "disabled" : "active")) },
            { label: "Delete", tone: "danger", onClick: async () => { if (await confirm({ title: `Delete ${c.code}?`, message: "Customers will no longer be able to use this code.", confirmLabel: "Delete code", tone: "danger" })) run(() => deleteCoupon(bid, c.id)); } },
          ]}
        />
      ),
    },
  ];

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const num = (k: string) => (String(f.get(k)).trim() === "" ? undefined : Number(f.get(k)));
    const exp = String(f.get("expiresAt"));
    setSaving(true);
    setFormError(null);
    try {
      await saveCoupon(bid, editing && editing !== "new" ? editing.id : null, {
        code: String(f.get("code")),
        type: f.get("type") as Coupon["type"],
        value: Number(f.get("value")),
        minOrder: num("minOrder"),
        maxUses: num("maxUses"),
        expiresAt: exp ? new Date(exp + "T23:59:59").toISOString() : undefined,
      });
      setEditing(null);
      reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  };

  const c = editing && editing !== "new" ? editing : null;

  return (
    <>
      <PageHeader title="Discounts" subtitle="Coupon codes your customers can use at checkout." action={<PrimaryButton onClick={() => { setFormError(null); setEditing("new"); }}>+ New coupon</PrimaryButton>} />
      {rowError && <div className="mb-4"><ErrorNote message={rowError} /></div>}
      {(() => {
        const live = data.filter((x) => effective(x) === "active");
        const used = (orders ?? []).filter((o) => o.couponCode);
        const given = used.reduce((n, o) => n + (o.discount ?? 0), 0);
        const top = [...data].sort((a, b) => b.usedCount - a.usedCount)[0];
        return (
          <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
            <StatCard label="Coupons" value={String(data.length)} hint={`${data.filter((x) => x.status === "disabled").length} disabled`} />
            <StatCard label="Active now" value={String(live.length)} hint={`${data.filter((x) => effective(x) === "expired").length} expired`} />
            <StatCard label="Times used" value={String(data.reduce((n, x) => n + x.usedCount, 0))} hint={top && top.usedCount > 0 ? `Most used: ${top.code}` : "No uses yet"} />
            <StatCard label="Discount given" value={fmt(given)} hint={`across ${used.length} order${used.length === 1 ? "" : "s"}`} />
          </div>
        );
      })()}
      <DataTable rows={data} columns={columns} rowKey={(x) => x.id} />

      <Modal isOpen={editing !== null} onClose={() => setEditing(null)} className="max-w-[480px] p-6 sm:p-8 m-4">
        <form onSubmit={submit} className="space-y-4" key={c?.id ?? "new"}>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">{c ? "Edit coupon" : "New coupon"}</h3>
          <Field label="Code"><input name="code" defaultValue={c?.code} placeholder="WELCOME10" className={`${inputCls} uppercase`} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Type">
              <select name="type" defaultValue={c?.type ?? "percent"} className={inputCls}>
                <option value="percent">Percentage</option>
                <option value="fixed">Fixed amount</option>
              </select>
            </Field>
            <Field label="Value"><input name="value" type="number" min="0" step="any" defaultValue={c?.value} className={inputCls} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Minimum order (optional)"><input name="minOrder" type="number" min="0" defaultValue={c?.minOrder} className={inputCls} /></Field>
            <Field label="Max uses (optional)"><input name="maxUses" type="number" min="1" defaultValue={c?.maxUses} className={inputCls} /></Field>
          </div>
          <Field label="Expires (optional)"><input name="expiresAt" type="date" defaultValue={c?.expiresAt?.slice(0, 10)} className={inputCls} /></Field>
          {formError && <ErrorNote message={formError} />}
          <div className="flex justify-end gap-3 pt-2">
            <OutlineButton type="button" onClick={() => setEditing(null)}>Cancel</OutlineButton>
            <PrimaryButton busy={saving}>Save coupon</PrimaryButton>
          </div>
        </form>
      </Modal>
    </>
  );
}
