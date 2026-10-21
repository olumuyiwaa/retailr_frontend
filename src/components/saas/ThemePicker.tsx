"use client";
import { useState } from "react";
import { THEMES, getTheme } from "@/themes/registry";
import { updateBusinessProfile } from "@/services/business";
import { ErrorNote } from "./Card";
import ThemeThumb from "./ThemeThumb";

export default function ThemePicker({ businessId, current, onSaved }: { businessId: string; current?: string; onSaved?: () => void }) {
  const [active, setActive] = useState(getTheme(current).id);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const choose = async (id: string) => {
    if (id === active || busy) return;
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
          return (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={on}
              disabled={!!busy}
              onClick={() => choose(t.id)}
              className={`rounded-xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                on ? "border-brand-500 ring-2 ring-brand-500/30" : "border-gray-200 hover:border-gray-300 dark:border-gray-800"
              }`}
            >
              <ThemeThumb swatches={t.swatches} layout={t.id === "showcase" ? "showcase" : t.id === "atelier" ? "atelier" : "classic"} />
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="font-medium text-gray-800 dark:text-white/90">{t.name}</span>
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
