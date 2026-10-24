"use client";
import { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import { getBusinessProfile, updateBusinessProfile } from "@/services/business";
import { Card, CardHeader, ErrorNote, PageHeader, PageLoading } from "@/components/saas/Card";
import { Field, inputCls, OutlineButton, PrimaryButton } from "@/components/saas/Form";
import { storePath, useStoreUrl } from "@/lib/store";
import { CURRENCIES } from "@/lib/money";
import { setBizCurrency } from "@/hooks/useBizMoney";
import { fileToDataUrl } from "@/lib/image";
import ThemePicker from "@/components/saas/ThemePicker";
import PaymentOptions from "@/components/saas/PaymentOptions";
import DeliveryOptions from "@/components/saas/DeliveryOptions";
import type { Currency } from "@/types/saas";

const CATEGORIES = ["Fashion & Textiles", "Food & Groceries", "Beauty & Wellness", "Crafts & Decor", "Coffee & Tea", "Jewellery", "Other"];

export default function StoreSettingsPage() {
  const { user } = useAuth();
  const bid = user!.businessId!;
  const { data, loading, error, reload } = useAsync(() => getBusinessProfile(bid), [bid]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const url = useStoreUrl(data?.slug);
  const [curSaving, setCurSaving] = useState(false);
  const [curSaved, setCurSaved] = useState(false);
  const [logoBusy, setLogoBusy] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);

  if (loading) return <PageLoading />;
  if (error || !data) return <ErrorNote message={error ?? "Could not load settings."} onRetry={reload} />;

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name")).trim();
    if (!name) return setFormError("Store name is required.");
    setSaving(true);
    setFormError(null);
    try {
      await updateBusinessProfile(bid, {
        name,
        category: String(f.get("category")),
        description: String(f.get("description")).trim(),
        phone: String(f.get("phone")).trim(),
        country: String(f.get("country")).trim(),
        city: String(f.get("city")).trim(),
        brandColor: String(f.get("brandColor")),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not save settings.");
    } finally {
      setSaving(false);
    }
  };

  const changeLogo = async (file: File | null) => {
    setLogoError(null);
    setLogoBusy(true);
    try {
      // keep transparency (PNG) and shrink so it fits in the demo database
      const logo = file ? await fileToDataUrl(file, 360, 0.9, { png: true }) : null;
      await updateBusinessProfile(bid, { logo });
      reload();
    } catch (err) {
      setLogoError(err instanceof Error ? err.message : "Could not update your logo.");
    } finally {
      setLogoBusy(false);
    }
  };

  const saveCurrency = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const currency = String(new FormData(e.currentTarget).get("currency")) as Currency;
    setCurSaving(true);
    try {
      await updateBusinessProfile(bid, { currency });
      setBizCurrency(bid, currency);
      setCurSaved(true);
      setTimeout(() => setCurSaved(false), 2500);
    } finally {
      setCurSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="Store settings" subtitle="How your business appears to customers." />

      {/*
        Desktop: main settings stack on the left; logo + currency occupy the
        empty right rail. Mobile: logo/currency stack above the rest.
      */}
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_17.5rem]">
        <div className="order-2 min-w-0 space-y-6 xl:order-1">
          <Card>
            <CardHeader title="Your storefront" subtitle="Share this link with customers so they can shop with you." />
            <div className="space-y-3 p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-3">
                <code className="min-w-0 flex-1 truncate rounded-lg bg-gray-100 px-4 py-3 text-sm text-gray-700 dark:bg-white/5 dark:text-gray-300">
                  {url || storePath(data.slug)}
                </code>
                <OutlineButton
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(url);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    } catch {
                      /* clipboard unavailable */
                    }
                  }}
                >
                  {copied ? "Copied" : "Copy link"}
                </OutlineButton>
                <a
                  href={storePath(data.slug)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-5 py-3 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
                >
                  View store ↗
                </a>
              </div>
              {data.status !== "active" && data.status !== "trial" && (
                <p className="text-theme-sm text-warning-600">
                  Your store is currently offline ({data.status}). It goes live once your account is active.
                </p>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Storefront theme" subtitle="Change how your store looks to shoppers. Your products and settings stay the same." />
            <ThemePicker businessId={bid} planId={data.planId} current={data.theme} brand={data.brandColor} />
          </Card>

          <PaymentOptions businessId={bid} business={data} className="mb-0" />

          <DeliveryOptions businessId={bid} business={data} />

          <Card>
            <CardHeader title="Business profile" subtitle="Shown on your storefront." />
            <form onSubmit={submit} className="space-y-4 p-5 sm:p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Store name">
                  <input name="name" defaultValue={data.name} className={inputCls} />
                </Field>
                <Field label="Category">
                  <select name="category" defaultValue={data.category} className={inputCls}>
                    {CATEGORIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Country">
                  <input name="country" defaultValue={data.country} className={inputCls} />
                </Field>
                <Field label="City">
                  <input name="city" defaultValue={data.city} className={inputCls} />
                </Field>
                <Field label="Phone">
                  <input name="phone" defaultValue={data.phone} className={inputCls} />
                </Field>
                <Field label="Brand colour">
                  <input name="brandColor" type="color" defaultValue={data.brandColor} className={`${inputCls} p-1`} />
                </Field>
              </div>
              <Field label="About your business">
                <textarea name="description" rows={4} defaultValue={data.description} className={`${inputCls} h-auto py-3`} />
              </Field>
              {formError && <ErrorNote message={formError} />}
              <div className="flex items-center gap-3 pt-2">
                <PrimaryButton busy={saving}>Save changes</PrimaryButton>
                {saved && (
                  <span role="status" className="text-theme-sm text-success-600">
                    Saved
                  </span>
                )}
              </div>
            </form>
          </Card>
        </div>

        <aside className="order-1 space-y-6 xl:order-2 xl:sticky xl:top-24 xl:self-start">
          <Card>
            <CardHeader title="Logo" subtitle="Header, invoices and receipts." />
            <div className="space-y-3 p-5 sm:p-6">
              <div className="flex flex-col items-start gap-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-white/5">
                  {data.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={data.logo} alt={`${data.name} logo`} className="h-full w-full object-contain p-2" />
                  ) : (
                    <span
                      className="flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold text-white"
                      style={{ background: data.brandColor }}
                      aria-hidden
                    >
                      {data.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <label
                      className={`inline-flex cursor-pointer items-center rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:text-gray-400 dark:ring-gray-700 ${logoBusy ? "pointer-events-none opacity-60" : ""}`}
                    >
                      {logoBusy ? "Saving…" : data.logo ? "Replace logo" : "Upload logo"}
                      <input
                        type="file"
                        accept="image/*"
                        aria-label="Business logo"
                        className="sr-only"
                        disabled={logoBusy}
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null;
                          e.target.value = "";
                          if (file) changeLogo(file);
                        }}
                      />
                    </label>
                    {data.logo && !logoBusy && (
                      <button
                        type="button"
                        onClick={() => changeLogo(null)}
                        className="text-sm font-medium text-error-600 hover:text-error-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-theme-xs text-gray-500">
                    Square image works best. Without a logo, the store shows its first letter in your brand colour.
                  </p>
                </div>
              </div>
              {logoError && <ErrorNote message={logoError} />}
            </div>
          </Card>

          <Card>
            <CardHeader title="Currency" subtitle="Storefront, invoices and reports." />
            <form onSubmit={saveCurrency} className="space-y-3 p-5 sm:p-6">
              <Field label="Currency">
                <select name="currency" defaultValue={data.currency} className={inputCls}>
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.symbol} · {c.label} ({c.code})
                    </option>
                  ))}
                </select>
              </Field>
              <p className="text-theme-xs text-gray-500">
                Doesn&apos;t convert existing prices — update products and coupons to match.
              </p>
              <div className="flex items-center gap-3">
                <PrimaryButton busy={curSaving}>Save</PrimaryButton>
                {curSaved && (
                  <span role="status" className="text-theme-sm text-success-600">
                    Saved
                  </span>
                )}
              </div>
            </form>
          </Card>
        </aside>
      </div>
    </>
  );
}
