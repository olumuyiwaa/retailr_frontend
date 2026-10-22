"use client";
import { useState } from "react";
import { createBooking } from "@/services/business";
import { Field, inputCls, OutlineButton, PrimaryButton } from "@/components/saas/Form";
import { zonedToIso } from "@/lib/zoned";
import type { Product } from "@/types/saas";

/** Books a customer in on the team's behalf (a phone call, a walk-in). Times are in the business's time zone. */
export default function NewBookingForm({ services, tz, initialDate, initialTime, onDone }: { services: Product[]; tz: string; initialDate?: string; initialTime?: string; onDone: () => void }) {
  const [productId, setProductId] = useState(services[0]?.id ?? "");
  const [variantId, setVariantId] = useState("");
  const [date, setDate] = useState(initialDate ?? new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(initialTime ?? "10:00");
  const [c, setC] = useState({ name: "", phone: "", email: "", notes: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const svc = services.find((s) => s.id === productId);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!c.name.trim()) return setError("Enter the customer's name.");
    if (svc?.variants?.length && !variantId) return setError("Choose an option.");
    setBusy(true);
    setError(null);
    try {
      await createBooking({
        productId, variantId: variantId || undefined, startsAt: zonedToIso(date, time, tz),
        customer: { name: c.name, phone: c.phone || undefined, email: c.email || undefined }, notes: c.notes || undefined,
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the booking.");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">New booking</h3>
      <Field label="Service">
        <select value={productId} onChange={(e) => { setProductId(e.target.value); setVariantId(""); }} className={inputCls}>
          {services.map((s) => <option key={s.id} value={s.id}>{s.name}{s.durationMins ? ` (${s.durationMins} min)` : ""}</option>)}
        </select>
      </Field>
      {!!svc?.variants?.length && (
        <Field label="Option">
          <select value={variantId} onChange={(e) => setVariantId(e.target.value)} className={inputCls}>
            <option value="">Choose…</option>
            {svc.variants.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </Field>
      )}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Date"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} /></Field>
        <Field label={`Time (${tz})`}><input type="time" step={900} value={time} onChange={(e) => setTime(e.target.value)} className={inputCls} /></Field>
      </div>
      <Field label="Customer name"><input value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} className={inputCls} /></Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Phone"><input type="tel" value={c.phone} onChange={(e) => setC({ ...c, phone: e.target.value })} className={inputCls} /></Field>
        <Field label="Email (optional)"><input type="email" value={c.email} onChange={(e) => setC({ ...c, email: e.target.value })} className={inputCls} /></Field>
      </div>
      <Field label="Notes (optional)"><textarea rows={2} value={c.notes} onChange={(e) => setC({ ...c, notes: e.target.value })} className={inputCls} /></Field>
      {error && <p role="alert" className="rounded-lg bg-error-50 px-4 py-3 text-sm text-error-600">{error}</p>}
      <div className="flex justify-end gap-3"><OutlineButton type="button" onClick={onDone}>Cancel</OutlineButton><PrimaryButton disabled={busy}>{busy ? "Saving…" : "Book it"}</PrimaryButton></div>
    </form>
  );
}

