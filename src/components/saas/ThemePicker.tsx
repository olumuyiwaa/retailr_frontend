"use client";
import { useState } from "react";
import { THEMES, getTheme } from "@/themes/registry";
import { updateBusinessProfile } from "@/services/business";
import { listPlans } from "@/services/plans";
import { useAsync } from "@/hooks/useAsync";
import { ErrorNote } from "./Card";
import ThemeThumb from "./ThemeThumb";

export default function ThemePicker({ businessId, planId, current, onSaved }: { businessId: string; planId?: string; current?: string; onSaved?: () => void }) {
  const { data: plans } = useAsync(() => listPlans(), []);
  const plan = plans?.find((p) => p.id === planId);
  // until the plans load (or if the plan is unknown) nothing is locked; the server still enforces it
  const allowed = (id: string) => !plan || id === "classic" || plan.themes.includes(id);
  const [active, setActive] = useState(getTheme(current).id);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const choose = async (id: string) => {
    if (id === active || busy || !allowed(id)) return;
    const prev = active;
    setError(null);
    setBusy(id);
    setActive(id);
    try {
      await updateBusinessProfile(businessId, { theme: id });
      onSaved?.();
    } catch (e) {
      setActive(prev);
      setError(e instanceof Error ? e.message : "Could not change your theme.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="p-5 sm:p-6">
      <div role="radiogroup" aria-label="Storefront theme" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {THEMES.map((t) => {
          const on = active === t.id;
          const locked = !allowed(t.id);
          return (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={on}
              disabled={!!busy || locked}
              title={locked ? `Not included in the ${plan?.name} plan. Upgrade to use it.` : undefined}
              onClick={() => choose(t.id)}
              className={`rounded-xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                on ? "border-brand-500 ring-2 ring-brand-500/30" : "border-gray-200 hover:border-gray-300 dark:border-gray-800"
              } ${locked ? "cursor-not-allowed opacity-60" : ""
              }`}
            >
              <ThemeThumb swatches={t.swatches} layout={t.id === "showcase" ? "showcase" : t.id === "atelier" ? "atelier" : t.id === "market" ? "market" : "classic"} />
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="font-medium text-gray-800 dark:text-white/90">{t.name}</span>
                {locked && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-theme-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">Upgrade</span>}
                {on && <span className="rounded-full bg-brand-50 px-2 py-0.5 text-theme-xs font-medium text-brand-600">{busy === t.id ? "Saving…" : "Active"}</span>}
              </div>
              <p className="mt-1 text-theme-sm text-gray-500">{t.description}</p>
            </button>
          );
        })}
      </div>
      {error && <div className="mt-3"><ErrorNote message={error} /></div>}
    </div>
  );
}
