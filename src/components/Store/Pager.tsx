"use client";
import React from "react";

/** Prev / numbers / Next for storefront lists. Long lists collapse to 1 … 4 5 6 … 12. Colours follow the store's brand. */
export default function Pager({
  current, total, onChange, className = "mt-10", rounded = "rounded-full",
}: { current: number; total: number; onChange: (n: number) => void; className?: string; rounded?: string }) {
  if (total <= 1) return null;
  const nums = Array.from({ length: total }, (_, i) => i + 1).filter((n) => n === 1 || n === total || Math.abs(n - current) <= 1);
  const items: (number | "gap")[] = [];
  nums.forEach((n, i) => {
    if (i > 0 && n - nums[i - 1] > 1) items.push("gap");
    items.push(n);
  });
  const edge = `h-11 ${rounded} bg-white px-5 text-custom-sm font-medium text-dark ring-1 ring-inset disabled:opacity-40`;
  const ring = { ["--tw-ring-color" as string]: "var(--line)" } as React.CSSProperties;
  const go = (n: number) => {
    onChange(n);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return (
    <nav className={`flex flex-wrap items-center justify-center gap-2 ${className}`} aria-label="Pagination">
      <button type="button" disabled={current === 1} onClick={() => go(current - 1)} className={edge} style={ring}>Prev</button>
      {items.map((n, i) =>
        n === "gap" ? (
          <span key={`g${i}`} aria-hidden className="px-1 text-dark-4">…</span>
        ) : (
          <button
            key={n}
            type="button"
            onClick={() => go(n)}
            aria-label={`Page ${n}`}
            aria-current={n === current ? "page" : undefined}
            className={`h-11 w-11 ${rounded} text-custom-sm font-medium ${n === current ? "" : "bg-white text-dark ring-1 ring-inset"}`}
            style={n === current ? { background: "var(--brand)", color: "var(--brand-fg)" } : ring}
          >
            {n}
          </button>
        ),
      )}
      <button type="button" disabled={current === total} onClick={() => go(current + 1)} className={edge} style={ring}>Next</button>
    </nav>
  );
}
