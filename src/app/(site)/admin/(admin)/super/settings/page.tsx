"use client";
import { useState } from "react";
import { useAsync } from "@/hooks/useAsync";
import { getPaymentProviders, savePaymentProviders } from "@/services/platform";
import { Card, CardHeader, ErrorNote, PageHeader } from "@/components/saas/Card";
import { Field, inputCls, PrimaryButton } from "@/components/saas/Form";

// Platform-level settings. Persisted to localStorage only for now; the real
// backend will own these values.
const KEY = "retailr:platform-settings";
const defaults = { platformName: "Retailr", supportEmail: "support@retailr.com", trialDays: 14, currency: "USD", requireApproval: true };

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
  } catch {
    return defaults;
  }
}

/** Which payment providers businesses can pay Retailr through, and which is the default. The keys themselves stay in the server's environment. */
function PaymentProvidersCard() {
  const { data, loading, error, reload } = useAsync(() => getPaymentProviders(), []);
  const [on, setOn] = useState<string[] | null>(null);
  const [def, setDef] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const enabled = on ?? data?.providers.filter((p) => p.enabled).map((p) => p.name) ?? [];
  const current = def ?? data?.providers.find((p) => p.isDefault)?.name ?? enabled[0] ?? "";

  const toggle = (name: string) => {
    const next = enabled.includes(name) ? enabled.filter((n) => n !== name) : [...enabled, name];
    setOn(next);
    if (!next.includes(current)) setDef(next[0] ?? null);
  };

  const save = async () => {
    setBusy(true);
    setMsg(null);
    try {
      await savePaymentProviders(enabled, current);
      setOn(null);
      setDef(null);
      reload();
      setMsg({ ok: true, text: "Saved. New payments now use this choice." });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Could not save." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="mb-6 max-w-2xl">
      <CardHeader title="Payment providers" subtitle="How businesses pay for their Retailr plan. Payments already started and card renewals stay with the provider that took them." />
      <div className="space-y-4 p-5 sm:p-6">
        {loading && <p className="text-theme-sm text-gray-500">Loading…</p>}
        {error && <ErrorNote message={error} onRetry={reload} />}
        {data && !data.paymentsEnabled && <ErrorNote message="Online payments are off on this server (PAYMENTS_DRIVER is none), so plan changes apply without a charge." />}
        {data?.providers.map((p) => (
          <div key={p.name} className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
            <label className="flex flex-1 items-center gap-3 text-sm font-medium text-gray-800 dark:text-white/90">
              <input type="checkbox" disabled={!p.configured} checked={p.configured && enabled.includes(p.name)} onChange={() => toggle(p.name)} />
              {p.label}
              <span className={`rounded-full px-2 py-0.5 text-theme-xs font-medium ${p.configured ? "bg-success-50 text-success-600" : "bg-gray-100 text-gray-500 dark:bg-white/10"}`}>
                {p.configured ? "Keys set" : "Not set up"}
              </span>
            </label>
            <label className="flex items-center gap-2 text-theme-sm text-gray-600 dark:text-gray-400">
              <input type="radio" name="defaultProvider" disabled={!p.configured || !enabled.includes(p.name)} checked={current === p.name} onChange={() => setDef(p.name)} />
              Default
            </label>
            {!p.configured && <p className="w-full text-theme-xs text-gray-500">To use it, add {p.requiredEnv.join(" and ")} to the server environment and list <code>{p.name}</code> in PAYMENTS_DRIVER.</p>}
          </div>
        ))}
        {data && data.paymentsEnabled && (
          <div className="flex items-center gap-3">
            <PrimaryButton type="button" busy={busy} onClick={save} disabled={enabled.length === 0}>Save providers</PrimaryButton>
            {msg && <span role="status" className={`text-theme-sm ${msg.ok ? "text-success-600" : "text-error-600"}`}>{msg.text}</span>}
          </div>
        )}
      </div>
    </Card>
  );
}

export default function SettingsPage() {
  const [s, setS] = useState(load);
  const [saved, setSaved] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch {
      /* ignore */
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <>
      <PageHeader title="Platform settings" subtitle="Defaults applied to every business on Retailr." />
      <PaymentProvidersCard />
      <Card className="max-w-2xl">
        <CardHeader title="General" />
        <form onSubmit={submit} className="space-y-4 p-5 sm:p-6">
          <Field label="Platform name"><input className={inputCls} value={s.platformName} onChange={(e) => setS({ ...s, platformName: e.target.value })} /></Field>
          <Field label="Support email"><input type="email" className={inputCls} value={s.supportEmail} onChange={(e) => setS({ ...s, supportEmail: e.target.value })} /></Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Free trial length (days)"><input type="number" min={0} className={inputCls} value={s.trialDays} onChange={(e) => setS({ ...s, trialDays: Number(e.target.value) })} /></Field>
            <Field label="Billing currency">
              <select className={inputCls} value={s.currency} onChange={(e) => setS({ ...s, currency: e.target.value })}>
                {["USD", "NGN", "GHS", "KES", "ZAR"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-400">
            <input type="checkbox" checked={s.requireApproval} onChange={(e) => setS({ ...s, requireApproval: e.target.checked })} />
            Require super admin approval before a new business goes live
          </label>
          <div className="flex items-center gap-3 pt-2">
            <PrimaryButton>Save settings</PrimaryButton>
            {saved && <span role="status" className="text-theme-sm text-success-600">Saved</span>}
          </div>
        </form>
      </Card>
    </>
  );
}
