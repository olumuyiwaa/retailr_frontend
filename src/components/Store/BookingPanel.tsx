"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/app/context/StoreContext";
import { bookService, getSlots } from "@/services/store";
import type { BookingSlots } from "@/types/saas";
import type { Product } from "@/types/product";

const input =
  "h-11 w-full rounded-lg border bg-white px-3.5 text-sm text-dark placeholder:text-gray-400 focus:outline-hidden focus:ring-2";
const line = { borderColor: "var(--line)" } as React.CSSProperties;

const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Pick a day and a time, give your details, book. Used instead of "Add to cart" on bookable services, in every theme. */
export default function BookingPanel({ product, variantId, price }: { product: Product; variantId?: string; price: number }) {
  const ctx = useStore();
  const router = useRouter();
  const today = useMemo(() => ymd(new Date()), []);
  const [date, setDate] = useState(today);
  const [data, setData] = useState<BookingSlots | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const slug = ctx?.store?.slug;
  useEffect(() => {
    if (!slug) return;
    let stale = false;
    setLoading(true);
    setLoadError(null);
    setSlot(null);
    getSlots(slug, String(product.id), date)
      .then((d) => { if (!stale) setData(d); })
      .catch((e) => { if (!stale) { setData(null); setLoadError(e instanceof Error ? e.message : "Could not load times."); } })
      .finally(() => { if (!stale) setLoading(false); });
    return () => { stale = true; };
  }, [slug, product.id, date, nonce]);

  if (!ctx?.store) return null;
  const { href, fmt } = ctx;
  const chosen = data?.slots.find((s) => s.startsAt === slot);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slot) return setError("Pick a time first.");
    setBusy(true);
    setError(null);
    try {
      const b = await bookService({
        slug: ctx.store!.slug, serviceId: String(product.id), optionId: variantId, startsAt: slot,
        customer: { name: form.name, email: form.email, phone: form.phone }, notes: form.notes,
      });
      router.push(href(`/booking/${b.publicToken}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't book that. Please try again.");
      setBusy(false);
      setNonce((n) => n + 1); // the slot may have just been taken: refresh the list
    }
  };

  return (
    <form onSubmit={submit} className="mt-8 space-y-5 rounded-xl border bg-white p-5" style={line} aria-label={`Book ${product.title}`}>
      <div>
        <label htmlFor="booking-date" className="mb-1.5 block text-custom-sm font-medium text-dark">Choose a day</label>
        <input id="booking-date" type="date" min={today} value={date} onChange={(e) => e.target.value && setDate(e.target.value)} className={input} style={line} />
      </div>

      <div>
        <p className="mb-2 text-custom-sm font-medium text-dark">Choose a time{data?.timezone ? <span className="font-normal" style={{ color: "var(--muted)" }}> · {data.timezone} time</span> : null}</p>
        {loading ? (
          <p className="text-custom-sm" style={{ color: "var(--muted)" }}>Checking availability…</p>
        ) : loadError ? (
          <p role="alert" className="text-custom-sm text-error-600">{loadError}</p>
        ) : data && data.slots.length === 0 ? (
          <p className="text-custom-sm" style={{ color: "var(--muted)" }}>Nothing free on this day. Try another date.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4" role="group" aria-label="Available times">
            {data?.slots.map((s) => {
              const on = s.startsAt === slot;
              return (
                <button
                  key={s.startsAt}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setSlot(s.startsAt)}
                  className={`rounded-lg px-2 py-2.5 text-custom-sm font-medium ring-1 ring-inset duration-150 ${on ? "" : "bg-white text-dark hover:bg-[color:var(--tint)]"}`}
                  style={on ? { background: "var(--brand)", color: "var(--brand-fg)", ["--tw-ring-color" as string]: "var(--brand)" } : { ["--tw-ring-color" as string]: "var(--line)" }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {slot && (
        <div className="space-y-3">
          <input className={input} style={line} required autoComplete="name" placeholder="Your name" aria-label="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <input className={input} style={line} required type="email" autoComplete="email" placeholder="Email" aria-label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input className={input} style={line} required type="tel" autoComplete="tel" placeholder="Phone" aria-label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <textarea className={`${input} h-20 py-2.5`} style={line} maxLength={1000} placeholder="Anything we should know? (optional)" aria-label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
      )}

      {error && <p role="alert" className="rounded-lg bg-error-50 px-4 py-3 text-sm text-error-600">{error}</p>}

      <button
        type="submit"
        disabled={busy || !slot}
        className="inline-flex h-12 w-full items-center justify-center rounded-full px-8 font-medium duration-200 hover:brightness-90 disabled:cursor-not-allowed disabled:opacity-50"
        style={{ background: "var(--brand)", color: "var(--brand-fg)" }}
      >
        {busy ? "Booking…" : chosen ? `Book ${chosen.label} · ${fmt(price)}` : "Pick a time to book"}
      </button>
      <p className="text-center text-custom-xs" style={{ color: "var(--muted)" }}>You pay when you arrive. You can cancel from your confirmation link.</p>
    </form>
  );
}
