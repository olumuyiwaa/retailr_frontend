"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useStore } from "@/app/context/StoreContext";
import { cancelBookingByToken, getBookingByToken } from "@/services/store";
import { formatWhen } from "@/lib/zoned";
import type { Booking } from "@/types/saas";

const STATUS: Record<Booking["status"], { label: string; note: string }> = {
  pending: { label: "Waiting for confirmation", note: "The team will confirm your booking shortly. We'll email you." },
  confirmed: { label: "Confirmed", note: "You're booked in. See you then." },
  completed: { label: "Completed", note: "Thanks for visiting." },
  cancelled: { label: "Cancelled", note: "This booking was cancelled." },
  no_show: { label: "Missed", note: "This booking was marked as missed." },
};

/** The page a customer lands on after booking, and from the link in their email: details, status and cancel. */
export default function BookingConfirmation({ token }: { token: string }) {
  const ctx = useStore();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getBookingByToken(token).then(setBooking).catch(() => setProblem("We couldn't find that booking. Check the link in your email."));
  }, [token]);

  if (!ctx?.store) return null;
  const { fmt, href } = ctx;

  const cancel = async () => {
    if (!window.confirm("Cancel this booking?")) return;
    setBusy(true);
    try { setBooking(await cancelBookingByToken(token)); setProblem(null); }
    catch (e) { setProblem(e instanceof Error ? e.message : "Could not cancel. Please contact the business."); }
    finally { setBusy(false); }
  };

  const open = booking && (booking.status === "pending" || booking.status === "confirmed") && new Date(booking.startsAt).getTime() > Date.now();

  return (
    <section className="store-container mx-auto max-w-[640px] px-4 py-14 sm:px-8">
      {!booking && !problem && <p style={{ color: "var(--muted)" }}>Loading your booking…</p>}
      {problem && <p role="alert" className="rounded-lg bg-error-50 px-4 py-3 text-sm text-error-600">{problem}</p>}
      {booking && (
        <>
          <p className="text-custom-sm font-medium" style={{ color: "var(--muted)" }}>{ctx.store.name}</p>
          <h1 className="mt-1 text-3xl font-bold text-dark sm:text-4xl">{STATUS[booking.status].label}</h1>
          <p className="mt-2" style={{ color: "var(--muted)" }}>{STATUS[booking.status].note}</p>

          <dl className="mt-8 divide-y rounded-xl border bg-white text-custom-sm" style={{ borderColor: "var(--line)" }}>
            {[
              ["Service", booking.variantName ? `${booking.serviceName} · ${booking.variantName}` : booking.serviceName],
              ["When", formatWhen(booking.startsAt, booking.timezone)],
              ["Duration", `${booking.durationMins} min`],
              ["Price", `${fmt(booking.price)} (pay when you arrive)`],
              ["Name", booking.customerName],
              ...(booking.notes ? [["Notes", booking.notes]] : []),
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-6 px-5 py-3.5" style={{ borderColor: "var(--line)" }}>
                <dt>{k}</dt>
                <dd className="text-right font-medium text-dark">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={href("/shop")} className="inline-flex h-12 items-center rounded-full px-7 font-medium" style={{ background: "var(--brand)", color: "var(--brand-fg)" }}>Back to the shop</Link>
            {open && (
              <button type="button" disabled={busy} onClick={cancel} className="inline-flex h-12 items-center rounded-full px-7 font-medium text-dark ring-1 ring-inset disabled:opacity-50" style={{ ["--tw-ring-color" as string]: "var(--line)" } as React.CSSProperties}>
                {busy ? "Cancelling…" : "Cancel booking"}
              </button>
            )}
          </div>
          {ctx.store.phone && <p className="mt-6 text-custom-sm" style={{ color: "var(--muted)" }}>Need to change the time? Call {ctx.store.phone}.</p>}
        </>
      )}
    </section>
  );
}
