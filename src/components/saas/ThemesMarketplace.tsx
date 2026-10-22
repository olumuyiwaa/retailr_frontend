"use client";
/**
 * ThemesMarketplace — client-side marketplace grid for the /themes page.
 * Supports filter by category, sort by name, and a live search bar.
 * Each card links to the detail section anchor on the same page.
 */
import React, { useMemo, useState } from "react";
import ThemeThumb from "./ThemeThumb";
import type { ThemeMeta } from "@/app/(site)/themes/page";

interface ThemeEntry {
  id: string;
  name: string;
  description: string;
  swatches: [string, string, string];
  meta: ThemeMeta | null;
}

const CATEGORIES = ["All", "General", "Boutique", "Fashion", "Marketplace"];

export default function ThemesMarketplace({ themes }: { themes: ThemeEntry[] }) {
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    let items = themes;
    if (cat !== "All") items = items.filter((t) => t.meta?.category === cat);
    if (q.trim()) {
      const term = q.trim().toLowerCase();
      items = items.filter(
        (t) =>
          t.name.toLowerCase().includes(term) ||
          t.description.toLowerCase().includes(term) ||
          t.meta?.bestFor.some((b) => b.toLowerCase().includes(term))
      );
    }
    return items;
  }, [themes, cat, q]);

  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 lg:px-10 2xl:max-w-[90rem]">
      {/* ── Toolbar ── */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Category pill filter */}
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCat(c)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                cat === c
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-600 ring-1 ring-inset ring-gray-200 hover:ring-gray-300 hover:text-gray-900"
              }`}
            >
              {c}
              <span className={`ml-1.5 text-xs ${cat === c ? "text-white/70" : "text-gray-400"}`}>
                {c === "All" ? themes.length : themes.filter((t) => t.meta?.category === c).length}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <label className="flex h-10 w-full items-center gap-2 rounded-full bg-white px-4 ring-1 ring-inset ring-gray-200 focus-within:ring-2 focus-within:ring-brand-400 sm:w-56">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden className="shrink-0 text-gray-400">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search themes…"
            aria-label="Search themes"
            className="w-full bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
          />
        </label>
      </div>

      {/* ── Results count ── */}
      <p className="mb-5 text-sm text-gray-500">
        {list.length} {list.length === 1 ? "theme" : "themes"}
        {cat !== "All" && ` in ${cat}`}
        {q.trim() && ` matching "${q.trim()}"`}
      </p>

      {/* ── Grid ── */}
      {list.length === 0 ? (
        <div className="py-20 text-center">
          <p className="font-semibold text-gray-800">No themes match that search.</p>
          <button onClick={() => { setCat("All"); setQ(""); }} className="mt-3 text-sm text-brand-500 underline underline-offset-4">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((t) => {
            const [bg, , accent] = t.swatches;
            return (
              <a
                key={t.id}
                href={`#${t.id}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:border-brand-300 hover:shadow-theme-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
              >
                {/* Theme preview */}
                <div className="overflow-hidden">
                  <ThemeThumb swatches={t.swatches} layout={t.meta?.layout ?? "classic"} />
                </div>

                {/* Card info */}
                <div className="flex flex-1 flex-col p-4">
                  {/* Category badge */}
                  {t.meta?.category && (
                    <span
                      className="mb-2 w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold"
                      style={{ background: bg, color: accent }}
                    >
                      {t.meta.category}
                    </span>
                  )}

                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors">{t.name}</h3>
                    {/* Swatch dots */}
                    <div className="flex shrink-0 gap-0.5">
                      {t.swatches.map((c) => (
                        <span key={c} className="h-3.5 w-3.5 rounded-full ring-1 ring-gray-200" style={{ background: c }} />
                      ))}
                    </div>
                  </div>

                  <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-gray-500">{t.description}</p>

                  {/* Best-for tags */}
                  {t.meta?.bestFor && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {t.meta.bestFor.slice(0, 2).map((b) => (
                        <span key={b} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">{b}</span>
                      ))}
                      {t.meta.bestFor.length > 2 && (
                        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-400">+{t.meta.bestFor.length - 2}</span>
                      )}
                    </div>
                  )}

                  {/* Preview link */}
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-500 group-hover:gap-2 transition-all">
                    See details
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
