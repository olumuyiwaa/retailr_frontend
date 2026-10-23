"use client";
import { useState } from "react";
import { updateBusinessProfile } from "@/services/business";
import { Card, CardHeader } from "./Card";
import { Field, inputCls, OutlineButton, PrimaryButton } from "./Form";
import type { Business, DeliveryConfig, DeliveryZone } from "@/types/saas";

type Draft = { id?: string; kind: DeliveryZone["kind"]; name: string; fee: string; note: string };
const toDraft = (z: DeliveryZone): Draft => ({ id: z.id, kind: z.kind, name: z.name, fee: String(z.fee), note: z.note ?? "" });

/** Where the business delivers and what it charges, plus pickup, free shipping and international orders. */
export default function DeliveryOptions({ businessId, business, className = "mb-0" }: { businessId: string; business: Business; className?: string }) {
  const d: DeliveryConfig = business.delivery ?? { pickup: { enabled: false }, zones: [], freeShippingThreshold: null };
  const [zones, setZones] = useState<Draft[]>(d.zones.map(toDraft));
  const [pickup, setPickup] = useState({ enabled: d.pickup.enabled, address: d.pickup.address ?? "", hours: d.pickup.hours ?? "", instructions: d.pickup.instructions ?? "" });
  const [threshold, setThreshold] = useState(d.freeShippingThreshold ? String(d.freeShippingThreshold) : "");
  const [note, setNote] = useState(d.note ?? "");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canFree = business.canSetFreeShipping !== false;
  const dirty = () => setSaved(false);

  const add = (kind: Draft["kind"]) => { dirty(); setZones((z) => [...z, { kind, name: "", fee: "", note: "" }]); };
  const change = (i: number, k: keyof Draft, v: string) => { dirty(); setZones((z) => z.map((x, j) => (j === i ? { ...x, [k]: v } : x))); };
  const remove = (i: number) => { dirty(); setZones((z) => z.filter((_, j) => j !== i)); };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    for (const z of zones) {
      if (!z.name.trim()) return setError("Give every delivery zone a name.");
      const fee = Number(z.fee);
      if (z.fee.trim() === "" || !Number.isFinite(fee) || fee < 0) return setError(`Enter a delivery fee for ${z.name.trim()} (0 for free).`);
    }
    if (pickup.enabled && !pickup.address.trim()) return setError("Add your pickup address before turning pickup on.");
    const t = Number(threshold);
    if (threshold.trim() && (!Number.isFinite(t) || t <= 0)) return setError("Enter a free-shipping amount greater than zero, or leave it empty.");
    setBusy(true);
    try {
      const res = await updateBusinessProfile(businessId, {
        delivery: {
          pickup: { enabled: pickup.enabled, address: pickup.address.trim(), hours: pickup.hours.trim(), instructions: pickup.instructions.trim() },
          zones: zones.map((z) => ({ ...(z.id ? { id: z.id } : {}), kind: z.kind, name: z.name.trim(), fee: Number(z.fee), ...(z.note.trim() ? { note: z.note.trim() } : {}) })),
          freeShippingThreshold: threshold.trim() && canFree ? t : null,
          note: note.trim(),
        },
      });
      // pick up the ids the server gave new zones so a second save doesn't duplicate them
      if (res?.delivery) setZones(res.delivery.zones.map(toDraft));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your delivery options.");
    } finally {
      setBusy(false);
    }
  };

  const section = (kind: Draft["kind"], title: string, hint: string, placeholder: string) => {
    const rows = zones.map((z, i) => ({ z, i })).filter((r) => r.z.kind === kind);
    return (
      <div className="space-y-3">
        <div>
          <h4 className="text-theme-sm font-medium text-gray-800 dark:text-white/90">{title}</h4>
          <p className="text-theme-xs text-gray-500">{hint}</p>
        </div>
        {rows.map(({ z, i }) => (
          <div key={i} className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 p-3 sm:grid-cols-[1fr_9rem_auto] dark:border-gray-800">
            <input aria-label="Zone name" value={z.name} onChange={(e) => change(i, "name", e.target.value)} maxLength={100} placeholder={placeholder} className={inputCls} />
            <input aria-label={`Fee (${business.currency})`} value={z.fee} onChange={(e) => change(i, "fee", e.target.value)} inputMode="decimal" placeholder={`Fee (${business.currency})`} className={inputCls} />
            <button type="button" onClick={() => remove(i)} className="text-theme-sm text-error-600 hover:underline">Remove</button>
            <input aria-label="Note" value={z.note} onChange={(e) => change(i, "note", e.target.value)} maxLength={300} placeholder="Note shown to shoppers (optional), e.g. 1–2 days" className={`${inputCls} sm:col-span-3`} />
          </div>
        ))}
        <OutlineButton type="button" onClick={() => add(kind)}>+ Add {kind === "local" ? "zone" : "country"}</OutlineButton>
      </div>
    );
  };

  return (
    <Card className={className}>
      <CardHeader title="Delivery" subtitle="Set where you deliver and what it costs. Shoppers pick an option at checkout." />
      <form onSubmit={save} className="space-y-6 p-5 sm:p-6">
        {section("local", "Delivery zones", "Group places with the same fee, e.g. “Lekki / VI / Ikoyi” or “Mainland Lagos”.", "e.g. Lekki / VI / Ikoyi")}
        {section("international", "International shipping", "Add each country you ship to, with its fee in " + business.currency + ".", "e.g. United Kingdom")}

        <Field label="Shipping note (optional)" hint="Shown at checkout, e.g. “Rates cover up to 2kg; extra weight is billed separately.”">
          <input value={note} onChange={(e) => { dirty(); setNote(e.target.value); }} maxLength={300} className={inputCls} />
        </Field>

        <fieldset className="space-y-3 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
          <legend className="px-1 text-theme-sm font-medium text-gray-800 dark:text-white/90">Free shipping</legend>
          <Field label={`Free delivery for orders of (${business.currency})`} hint={canFree ? "Leave empty to always charge the zone fee." : "Free-shipping thresholds are included on paid plans. Upgrade to use them."}>
            <input value={threshold} onChange={(e) => { dirty(); setThreshold(e.target.value); }} inputMode="decimal" disabled={!canFree} placeholder="e.g. 50000" className={inputCls} />
          </Field>
        </fieldset>

        <fieldset className="space-y-3 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
          <legend className="px-1 text-theme-sm font-medium text-gray-800 dark:text-white/90">Store pickup</legend>
          <label className="flex cursor-pointer items-center gap-3">
            <input type="checkbox" checked={pickup.enabled} onChange={(e) => { dirty(); setPickup((p) => ({ ...p, enabled: e.target.checked })); }} className="h-4 w-4 accent-brand-500" />
            <span className="text-theme-sm text-gray-800 dark:text-white/90">Let shoppers collect their order (no delivery fee)</span>
          </label>
          <Field label="Pickup address"><input value={pickup.address} onChange={(e) => { dirty(); setPickup((p) => ({ ...p, address: e.target.value })); }} maxLength={300} className={inputCls} /></Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Pickup hours (optional)"><input value={pickup.hours} onChange={(e) => { dirty(); setPickup((p) => ({ ...p, hours: e.target.value })); }} maxLength={200} placeholder="e.g. Mon–Sat, 9am–6pm" className={inputCls} /></Field>
            <Field label="Instructions (optional)"><input value={pickup.instructions} onChange={(e) => { dirty(); setPickup((p) => ({ ...p, instructions: e.target.value })); }} maxLength={500} placeholder="e.g. Call on arrival" className={inputCls} /></Field>
          </div>
        </fieldset>

        {error && <p role="alert" className="text-theme-sm text-error-600">{error}</p>}
        <div className="flex items-center gap-3">
          <PrimaryButton busy={busy}>Save delivery options</PrimaryButton>
          {saved && <span role="status" className="text-theme-sm text-success-600">Saved</span>}
        </div>
      </form>
    </Card>
  );
}
