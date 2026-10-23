"use client";
import { useState } from "react";
import { updateBusinessProfile } from "@/services/business";
import { Card, CardHeader } from "./Card";
import { Field, inputCls, PrimaryButton } from "./Form";
import type { BankAccount, Business, StorePaymentMethod } from "@/types/saas";

const OPTIONS: { id: StorePaymentMethod; title: string; hint: string }[] = [
  { id: "cod", title: "Pay on delivery", hint: "Shoppers pay cash when the order arrives." },
  { id: "bank", title: "Bank transfer", hint: "Shoppers see your account details at checkout and pay you directly. Needs your bank details below." },
  { id: "card", title: "Card (demo)", hint: "Demo only: no real payment is taken." },
];

const EMPTY: BankAccount = { bankName: "", accountNumber: "", accountName: "", instructions: "", branch: "", sortCode: "", swiftCode: "", iban: "" };
const clean = (a: BankAccount): BankAccount => Object.fromEntries(Object.entries(a).map(([k, v]) => [k, (v ?? "").trim()]).filter(([k, v]) => v || ["bankName", "accountNumber", "accountName"].includes(k as string))) as unknown as BankAccount;

/** The owner decides which payment options their storefront checkout offers. Bank transfer needs complete bank details first. */
export default function PaymentOptions({ businessId, business, className = "mb-6 max-w-5xl" }: { businessId: string; business: Business; className?: string }) {
  // card is a demo, so it is only offered when the server allows it
  const options = OPTIONS.filter((o) => o.id !== "card" || business.cardAvailable);
  const [methods, setMethods] = useState<StorePaymentMethod[]>((business.paymentMethods ?? ["cod"]).filter((m) => options.some((o) => o.id === m)));
  const [bank, setBank] = useState<BankAccount>({ ...EMPTY, ...(business.bankAccount ?? {}) });
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bankComplete = !!(bank.bankName.trim() && bank.accountNumber.trim() && bank.accountName.trim());

  const toggle = (id: StorePaymentMethod) => {
    setSaved(false);
    setMethods((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]));
  };
  const setField = (k: keyof BankAccount) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSaved(false);
    setBank((b) => ({ ...b, [k]: e.target.value }));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (methods.length === 0) return setError("Offer at least one way to pay.");
    if (methods.includes("bank") && !bankComplete) return setError("Add your bank name, account number and account name before offering bank transfer.");
    const anyBank = Object.values(bank).some((v) => (v ?? "").trim());
    if (anyBank && !bankComplete) return setError("Bank name, account number and account name are all needed. Clear the bank fields to leave them out.");
    setBusy(true);
    try {
      // keep the order the options are listed in, not the order they were ticked
      await updateBusinessProfile(businessId, {
        paymentMethods: OPTIONS.map((o) => o.id).filter((id) => methods.includes(id)),
        bankAccount: bankComplete ? clean(bank) : null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your payment options.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader title="Payment options" subtitle="Choose how shoppers can pay at your checkout." />
      <form onSubmit={save} className="space-y-4 p-5 sm:p-6">
        <div className="space-y-3">
          {options.map((o) => (
            <label key={o.id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-800">
              <input type="checkbox" checked={methods.includes(o.id)} onChange={() => toggle(o.id)} className="mt-1 h-4 w-4 accent-brand-500" />
              <span>
                <span className="block text-theme-sm font-medium text-gray-800 dark:text-white/90">{o.title}</span>
                <span className="block text-theme-xs text-gray-500">{o.hint}</span>
              </span>
            </label>
          ))}
        </div>

        <fieldset className="space-y-4 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
          <legend className="px-1 text-theme-sm font-medium text-gray-800 dark:text-white/90">Bank account for transfers</legend>
          {!bankComplete && methods.includes("bank") && <p className="text-theme-xs text-warning-600">Bank transfer stays hidden from shoppers until these three are filled in.</p>}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Bank name"><input value={bank.bankName} onChange={setField("bankName")} maxLength={80} placeholder="e.g. GTBank" className={inputCls} /></Field>
            <Field label="Account number"><input value={bank.accountNumber} onChange={setField("accountNumber")} maxLength={34} inputMode="numeric" placeholder="e.g. 0123456789" className={inputCls} /></Field>
            <div className="sm:col-span-2"><Field label="Account name"><input value={bank.accountName} onChange={setField("accountName")} maxLength={100} placeholder="Name on the account" className={inputCls} /></Field></div>
          </div>
          <Field label="Instructions (optional)">
            <textarea value={bank.instructions ?? ""} onChange={setField("instructions")} rows={2} maxLength={500} placeholder="e.g. Use your order number as the reference and send proof of payment on WhatsApp." className={`${inputCls} h-auto py-3`} />
          </Field>
          <details className="text-theme-sm" open={!!(bank.branch || bank.sortCode || bank.swiftCode || bank.iban)}>
            <summary className="cursor-pointer font-medium text-gray-700 dark:text-gray-400">More bank details (optional)</summary>
            <p className="mt-1 text-theme-xs text-gray-500">Useful for customers paying from abroad or from another bank.</p>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Branch"><input value={bank.branch ?? ""} onChange={setField("branch")} maxLength={80} className={inputCls} /></Field>
              <Field label="Sort code"><input value={bank.sortCode ?? ""} onChange={setField("sortCode")} maxLength={20} className={inputCls} /></Field>
              <Field label="SWIFT / BIC"><input value={bank.swiftCode ?? ""} onChange={setField("swiftCode")} maxLength={20} placeholder="8 or 11 characters" className={inputCls} /></Field>
              <Field label="IBAN"><input value={bank.iban ?? ""} onChange={setField("iban")} maxLength={34} className={inputCls} /></Field>
            </div>
          </details>
        </fieldset>

        {error && <p role="alert" className="text-theme-sm text-error-600">{error}</p>}
        <div className="flex items-center gap-3">
          <PrimaryButton busy={busy}>Save payment options</PrimaryButton>
          {saved && <span role="status" className="text-theme-sm text-success-600">Saved</span>}
        </div>
      </form>
    </Card>
  );
}
