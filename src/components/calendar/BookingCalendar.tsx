"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DateClickArg } from "@fullcalendar/interaction";
import type { EventClickArg, EventContentArg, EventSourceFuncArg } from "@fullcalendar/core";
import { Modal } from "@/components/ui/modal";
import StatusBadge, { label } from "@/components/saas/StatusBadge";
import { OutlineButton, PrimaryButton } from "@/components/saas/Form";
import { useBizMoney } from "@/hooks/useBizMoney";
import { listBookings, setBookingStatus } from "@/services/business";
import { formatWhen } from "@/lib/zoned";
import type { Booking, BookingStatus } from "@/types/saas";

const COLORS: Record<BookingStatus, string> = {
  pending: "#f79009",
  confirmed: "#465fff",
  completed: "#12b76a",
  cancelled: "#98a2b3",
  no_show: "#d92d20",
};
const ALL: BookingStatus[] = ["pending", "confirmed", "completed", "cancelled", "no_show"];
const isOpen = (b: Booking) => b.status === "pending" || b.status === "confirmed";

/** A month, week or day view of bookings. Click a booking for its details, click an empty time to book someone in. */
export default function BookingCalendar({
  timezone, refreshKey, onBook, onChanged,
}: {
  timezone: string;
  /** Change it to make the calendar load again (after a booking was made elsewhere). */
  refreshKey: number;
  onBook: (date: string, time?: string) => void;
  onChanged: () => void;
}) {
  const fmt = useBizMoney();
  const ref = useRef<FullCalendar>(null);
  const [shown, setShown] = useState<Set<BookingStatus>>(new Set<BookingStatus>(["pending", "confirmed", "completed"]));
  const [selected, setSelected] = useState<Booking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(
    async (arg: EventSourceFuncArg, ok: (e: object[]) => void, fail: (e: Error) => void) => {
      setError(null);
      try {
        const rows = await listBookings({ from: arg.startStr, to: arg.endStr, limit: 500 });
        ok(
          rows.filter((b) => shown.has(b.status)).map((b) => ({
            id: b.id, title: `${b.serviceName} · ${b.customerName}`, start: b.startsAt, end: b.endsAt,
            backgroundColor: COLORS[b.status], borderColor: COLORS[b.status], textColor: "#ffffff",
            extendedProps: { booking: b },
          })),
        );
      } catch (e) {
        const err = e instanceof Error ? e : new Error("Could not load bookings.");
        setError(err.message);
        fail(err);
      }
    },
    [shown],
  );

  // reload when the filter chips or the parent say so
  useEffect(() => { ref.current?.getApi().refetchEvents(); }, [shown, refreshKey]);

  const toggle = (s: BookingStatus) => setShown((cur) => {
    const next = new Set(cur);
    if (next.has(s)) { if (next.size > 1) next.delete(s); } else next.add(s);
    return next;
  });

  const onDateClick = (a: DateClickArg) => {
    // dateStr is in the business's zone: "2026-10-26" (month view) or "2026-10-26T10:00:00+01:00" (week and day views)
    onBook(a.dateStr.slice(0, 10), a.dateStr.length > 10 ? a.dateStr.slice(11, 16) : undefined);
  };

  const act = async (status: Exclude<BookingStatus, "pending">) => {
    if (!selected) return;
    if (status === "cancelled" && !window.confirm(`Cancel ${selected.customerName}'s booking? They will be emailed.`)) return;
    setBusy(true);
    setError(null);
    try {
      setSelected(await setBookingStatus(selected.id, status));
      ref.current?.getApi().refetchEvents();
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update the booking.");
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Show:</span>
        {ALL.map((s) => {
          const on = shown.has(s);
          return (
            <button
              key={s}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(s)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all ${on ? "border-transparent text-white" : "border-gray-300 bg-transparent text-gray-400 dark:border-gray-700 dark:text-gray-600"}`}
              style={on ? { background: COLORS[s] } : undefined}
            >
              {label(s)}
            </button>
          );
        })}
        <button type="button" onClick={() => setShown(new Set(ALL))} className="ml-auto text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400">Show all</button>
      </div>

      {error && <p role="alert" className="rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300">{error}</p>}

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="custom-calendar">
          <FullCalendar
            key={timezone}
            ref={ref}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            timeZone={timezone}
            headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay" }}
            events={load}
            eventClick={(c: EventClickArg) => { setError(null); setSelected(c.event.extendedProps.booking as Booking); }}
            dateClick={onDateClick}
            eventContent={renderEvent}
            height="auto"
            dayMaxEvents={4}
            nowIndicator
            slotMinTime="06:00:00"
            slotMaxTime="22:00:00"
            scrollTime="08:00:00"
            eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
            slotLabelFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
          />
        </div>
      </div>

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} className="max-w-[560px] p-6 lg:p-8 m-4 max-h-[92vh] overflow-y-auto">
        {selected && (
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <StatusBadge status={selected.status} />
                <h2 className="mt-2 break-words text-lg font-semibold text-gray-800 dark:text-white/90">{selected.serviceName}{selected.variantName ? ` · ${selected.variantName}` : ""}</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{formatWhen(selected.startsAt, timezone)} · {selected.durationMins} min</p>
              </div>
              <span className="mt-1 h-4 w-4 shrink-0 rounded-full" style={{ background: COLORS[selected.status] }} />
            </div>
            <dl className="divide-y divide-gray-100 rounded-xl border border-gray-200 px-4 text-sm dark:divide-gray-800 dark:border-gray-800">
              {([
                ["Customer", selected.customerName],
                ["Phone", selected.customerPhone],
                ["Email", selected.customerEmail],
                ["Price", fmt(selected.price)],
                ["Notes", selected.notes],
                ["Booked", selected.source === "admin" ? "By your team" : "Online"],
              ] as [string, string | undefined][]).filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="grid grid-cols-[110px_1fr] gap-2 py-2.5">
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{k}</dt>
                  <dd className="break-words text-gray-800 dark:text-white/90">{v}</dd>
                </div>
              ))}
            </dl>
            {error && <p role="alert" className="text-sm text-error-600">{error}</p>}
            <div className="flex flex-wrap justify-end gap-2">
              {selected.status === "pending" && <PrimaryButton type="button" disabled={busy} onClick={() => act("confirmed")}>Confirm</PrimaryButton>}
              {isOpen(selected) && <OutlineButton type="button" disabled={busy} onClick={() => act("completed")}>Mark completed</OutlineButton>}
              {isOpen(selected) && <OutlineButton type="button" disabled={busy} onClick={() => act("no_show")}>No-show</OutlineButton>}
              {isOpen(selected) && <OutlineButton type="button" disabled={busy} onClick={() => act("cancelled")}>Cancel booking</OutlineButton>}
              <OutlineButton type="button" onClick={() => setSelected(null)}>Close</OutlineButton>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

const renderEvent = (info: EventContentArg) => (
  <div className="flex w-full items-center gap-1 overflow-hidden rounded px-1.5 py-0.5 text-xs font-medium text-white" style={{ background: info.event.backgroundColor }} title={info.event.title}>
    {info.timeText && <span className="shrink-0 text-[10px] opacity-80">{info.timeText}</span>}
    <span className="truncate">{info.event.title}</span>
  </div>
);
