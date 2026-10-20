"use client";
import { useState } from "react";
import { updateBusinessProfile } from "@/services/business";
import { Card, CardHeader } from "./Card";
import { Field, inputCls, PrimaryButton } from "./Form";
import type { Business, StorePaymentMethod } from "@/types/saas";

const OPTIONS: { id: StorePaymentMethod; title: string; hint: string }[] = [
  { id: "cod", title: "Pay on delivery", hint: "Shoppers pay cash when the order arrives." },
  { id: "bank", title: "Bank transfer", hint: "Shoppers see your account details and pay you directly." },
  { id: "card", title: "Card (demo)", hint: "Demo only for now: no real payment is taken, so leave this off for a live store." },
];

/** The owner decides which payment options their storefront checkout offers. */
export default function PaymentOptions({ businessId, business }: { businessId: string; business: Business }) {
  const [methods, setMethods] = useState<StorePaymentMethod[]>(business.paymentMethods ?? ["cod", "bank", "card"]);
  const [bank, setBank] = useState(business.bankDetails ?? "");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (id: StorePaymentMethod) => {
    setSaved(false);
    setMethods((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (methods.length === 0) return setError("Offer at least one way to pay.");
    if (methods.includes("bank") && !bank.trim()) return setError("Add your bank details so shoppers know where to pay.");
    setBusy(true);
    try {
      // keep the order the options are listed in, not the order they were ticked
      await updateBusinessProfile(businessId, { paymentMethods: OPTIONS.map((o) => o.id).filter((id) => methods.includes(id)), bankDetails: bank.trim() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your payment options.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="mb-6 max-w-5xl">
      <CardHeader title="Payment options" subtitle="Choose how shoppers can pay at your checkout." />
      <form onSubmit={save} className="space-y-4 p-5 sm:p-6">
        <div className="space-y-3">
          {OPTIONS.map((o) => (
            <label key={o.id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-800">
              <input type="checkbox" checked={methods.includes(o.id)} onChange={() => toggle(o.id)} className="mt-1 h-4 w-4 accent-brand-500" />
              <span>
                <span className="block text-theme-sm font-medium text-gray-800 dark:text-white/90">{o.title}</span>
                <span className="block text-theme-xs text-gray-500">{o.hint}</span>
              </span>
            </label>
          ))}
        </div>
        {methods.includes("bank") && (
          <Field label="Bank details">
            <textarea
              value={bank}
              onChange={(e) => { setBank(e.target.value); setSaved(false); }}
              rows={3}
              maxLength={500}
              placeholder={"Account name\nAccount number\nBank"}
              className={inputCls}
            />
          </Field>
        )}
        {error && <p role="alert" className="text-theme-sm text-error-600">{error}</p>}
        <div className="flex items-center gap-3">
          <PrimaryButton busy={busy}>Save payment options</PrimaryButton>
          {saved && <span role="status" className="text-theme-sm text-success-600">Saved</span>}
        </div>
      </form>
    </Card>
  );
}
