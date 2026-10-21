"use client";
import { useMemo, useState } from "react";
import { useBizMoney } from "@/hooks/useBizMoney";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/app/context/AuthContext";
import { createBooking, getBookingSettings, listBookings, listProducts, saveBookingSettings, setBookingStatus } from "@/services/business";
import { Card, CardHeader, ErrorNote, PageHeader, PageLoading, StatCard } from "@/components/saas/Card";
import DataTable, { type Column } from "@/components/saas/DataTable";
import RowActions from "@/components/saas/RowActions";
import StatusBadge from "@/components/saas/StatusBadge";
import { Field, inputCls, OutlineButton, PrimaryButton } from "@/components/saas/Form";
import { Modal } from "@/components/ui/modal";
import { formatShort, zonedToIso } from "@/lib/zoned";
import type { Booking, BookingSettings, OpeningPeriod, WeekDay } from "@/types/saas";

const DAYS: { key: WeekDay; label: string }[] = [
  { key: "mon", label: "Monday" }, { key: "tue", label: "Tuesday" }, { key: "wed", label: "Wednesday" }, { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" }, { key: "sat", label: "Saturday" }, { key: "sun", label: "Sunday" },
];
const ZONES = ["Africa/Lagos", "Africa/Accra", "Africa/Nairobi", "Africa/Johannesburg", "Africa/Cairo", "Europe/London", "America/New_York", "UTC"];
const isOpen = (b: Booking) => b.status === "pending" || b.status === "confirmed";

export default function BookingsPage() {
  const { user } = useAuth();
  const fmt = useBizMoney();
  const bid = user!.businessId!;
  const canEditHours = user!.teamRole !== "staff";
  // the last 30 days and everything ahead, soonest first
  const since = useMemo(() => new Date(Date.now() - 30 * 86_400_000).toISOString(), []);
  const { data, loading, error, reload } = useAsync(() => listBookings({ from: since }), [since]);
  const { data: settings, reload: reloadSettings } = useAsync(() => getBookingSettings(), []);
  const { data: products } = useAsync(() => listProducts(bid), [bid]);
  const [rowError, setRowError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  if (loading) return <PageLoading />;
  if (error || !data) return <ErrorNote message={error ?? "Could not load bookings."} onRetry={reload} />;

  const act = async (b: Booking, status: Parameters<typeof setBookingStatus>[1]) => {
    setRowError(null);
    try { await setBookingStatus(b.id, status); reload(); }
    catch (e) { setRowError(e instanceof Error ? e.message : "Could not update the booking."); }
  };

  const now = Date.now();
  const upcoming = data.filter((b) => isOpen(b) && new Date(b.endsAt).getTime() > now);
  const pending = data.filter((b) => b.status === "pending");
  const today = data.filter((b) => isOpen(b) && new Date(b.startsAt).toDateString() === new Date().toDateString());
  const bookable = (products ?? []).filter((p) => p.kind === "service" && p.bookable && p.status !== "draft");

  const columns: Column<Booking>[] = [
    { key: "when", header: "When", sortValue: (b) => b.startsAt, render: (b) => <span className="font-medium text-gray-800 dark:text-white/90">{formatShort(b.startsAt, b.timezone)}</span> },
    { key: "service", header: "Service", sortValue: (b) => b.serviceName, render: (b) => <span>{b.serviceName}{b.variantName ? ` · ${b.variantName}` : ""}<span className="block text-theme-xs text-gray-500">{b.durationMins} min</span></span> },
    { key: "customer", header: "Customer", sortValue: (b) => b.customerName, render: (b) => <span>{b.customerName}<span className="block text-theme-xs text-gray-500">{b.customerPhone || b.customerEmail}</span></span> },
    { key: "price", header: "Price", sortValue: (b) => b.price, render: (b) => fmt(b.price) },
    { key: "status", header: "Status", sortValue: (b) => b.status, render: (b) => <StatusBadge status={b.status} /> },
    {
      key: "actions", header: "", className: "text-right whitespace-nowrap",
      render: (b) => (
        <RowActions
          label={`Actions for ${b.customerName}'s booking`}
          actions={[
            { label: "Confirm", hidden: b.status !== "pending", onClick: () => act(b, "confirmed") },
            { label: "Mark completed", hidden: !isOpen(b), onClick: () => act(b, "completed") },
            { label: "Mark as no-show", hidden: !isOpen(b), onClick: () => act(b, "no_show") },
            { label: "Cancel booking", tone: "danger", hidden: !isOpen(b), onClick: () => { if (window.confirm(`Cancel ${b.customerName}'s booking? They will be emailed.`)) act(b, "cancelled"); } },
          ]}
        />
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Bookings"
        subtitle="Appointments customers book from your store"
        action={<PrimaryButton onClick={() => setAdding(true)} disabled={bookable.length === 0}>+ New booking</PrimaryButton>}
      />
      <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-3">
        <StatCard label="Today" value={String(today.length)} hint="bookings" />
        <StatCard label="Upcoming" value={String(upcoming.length)} hint="confirmed or waiting" />
        <StatCard label="To confirm" value={String(pending.length)} hint={settings?.autoConfirm === false ? "waiting for you" : "none needed (auto-confirm is on)"} />
      </div>
      {bookable.length === 0 && (
        <div className="mb-6"><ErrorNote message="No bookable services yet. Add a service on the Products page and switch on “Customers book a time slot”." /></div>
      )}
      {rowError && <div className="mb-4"><ErrorNote message={rowError} /></div>}
      <DataTable
        rows={data}
        columns={columns}
        rowKey={(b) => b.id}
        searchText={(b) => `${b.customerName} ${b.serviceName} ${b.customerEmail ?? ""} ${b.customerPhone ?? ""}`}
        searchPlaceholder="Search customer or service…"
        filter={{
          label: "Show",
          options: [{ label: "Upcoming", value: "upcoming" }, { label: "Needs confirming", value: "pending" }, { label: "Completed", value: "completed" }, { label: "Cancelled", value: "cancelled" }, { label: "No-shows", value: "no_show" }],
          match: (b, v) => (v === "upcoming" ? isOpen(b) && new Date(b.endsAt).getTime() > now : b.status === v),
        }}
        emptyTitle="No bookings yet"
        emptyBody="Once customers book a service, it shows up here."
      />

      {settings && <HoursCard key={JSON.stringify(settings)} settings={settings} canEdit={canEditHours} onSaved={reloadSettings} />}

      <Modal isOpen={adding} onClose={() => setAdding(false)} className="max-w-[520px] p-6 sm:p-8 m-4 max-h-[92vh] overflow-y-auto">
        {adding && settings && <NewBookingForm services={bookable} tz={settings.timezone} onDone={() => { setAdding(false); reload(); }} />}
      </Modal>
    </>
  );
}

function NewBookingForm({ services, tz, onDone }: { services: Awaited<ReturnType<typeof listProducts>>; tz: string; onDone: () => void }) {
  const [productId, setProductId] = useState(services[0]?.id ?? "");
  const [variantId, setVariantId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("10:00");
  const [c, setC] = useState({ name: "", phone: "", email: "", notes: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const svc = services.find((s) => s.id === productId);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!c.name.trim()) return setError("Enter the customer's name.");
    if (svc?.variants?.length && !variantId) return setError("Choose an option.");
    setBusy(true);
    setError(null);
    try {
      await createBooking({
        productId, variantId: variantId || undefined, startsAt: zonedToIso(date, time, tz),
        customer: { name: c.name, phone: c.phone || undefined, email: c.email || undefined }, notes: c.notes || undefined,
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the booking.");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">New booking</h3>
      <Field label="Service">
        <select value={productId} onChange={(e) => { setProductId(e.target.value); setVariantId(""); }} className={inputCls}>
          {services.map((s) => <option key={s.id} value={s.id}>{s.name}{s.durationMins ? ` (${s.durationMins} min)` : ""}</option>)}
        </select>
      </Field>
      {!!svc?.variants?.length && (
        <Field label="Option">
          <select value={variantId} onChange={(e) => setVariantId(e.target.value)} className={inputCls}>
            <option value="">Choose…</option>
            {svc.variants.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </Field>
      )}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Date"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} /></Field>
        <Field label={`Time (${tz})`}><input type="time" step={900} value={time} onChange={(e) => setTime(e.target.value)} className={inputCls} /></Field>
      </div>
      <Field label="Customer name"><input value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} className={inputCls} /></Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Phone"><input type="tel" value={c.phone} onChange={(e) => setC({ ...c, phone: e.target.value })} className={inputCls} /></Field>
        <Field label="Email (optional)"><input type="email" value={c.email} onChange={(e) => setC({ ...c, email: e.target.value })} className={inputCls} /></Field>
      </div>
      <Field label="Notes (optional)"><textarea rows={2} value={c.notes} onChange={(e) => setC({ ...c, notes: e.target.value })} className={inputCls} /></Field>
      {error && <p role="alert" className="rounded-lg bg-error-50 px-4 py-3 text-sm text-error-600">{error}</p>}
      <div className="flex justify-end gap-3"><OutlineButton type="button" onClick={onDone}>Cancel</OutlineButton><PrimaryButton disabled={busy}>{busy ? "Saving…" : "Book it"}</PrimaryButton></div>
    </form>
  );
}

function HoursCard({ settings, canEdit, onSaved }: { settings: BookingSettings; canEdit: boolean; onSaved: () => void }) {
  const [hours, setHours] = useState<BookingSettings["hours"]>(settings.hours);
  const [tz, setTz] = useState(settings.timezone);
  const [notice, setNotice] = useState(String(settings.noticeHours));
  const [auto, setAuto] = useState(settings.autoConfirm);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const setPeriods = (d: WeekDay, p: OpeningPeriod[]) => setHours((h) => ({ ...h, [d]: p }));
  const zones = ZONES.includes(tz) ? ZONES : [tz, ...ZONES];

  const save = async () => {
    setBusy(true);
    setMsg(null);
    try {
      await saveBookingSettings({ timezone: tz, hours, noticeHours: Math.max(0, Number(notice) || 0), autoConfirm: auto });
      setMsg({ ok: true, text: "Saved." });
      onSaved();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Could not save." });
    } finally { setBusy(false); }
  };

  return (
    <Card className="mt-8">
      <CardHeader title="Opening hours" subtitle={settings.configured ? "When customers can book" : "Not set yet: Monday to Friday, 09:00 to 17:00 applies until you save"} />
      <div className="space-y-5 p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Time zone"><select disabled={!canEdit} value={tz} onChange={(e) => setTz(e.target.value)} className={inputCls}>{zones.map((z) => <option key={z}>{z}</option>)}</select></Field>
          <Field label="Minimum notice (hours)"><input disabled={!canEdit} type="number" min={0} max={168} value={notice} onChange={(e) => setNotice(e.target.value)} className={inputCls} /></Field>
          <Field label="New bookings">
            <select disabled={!canEdit} value={auto ? "auto" : "manual"} onChange={(e) => setAuto(e.target.value === "auto")} className={inputCls}>
              <option value="auto">Confirm automatically</option>
              <option value="manual">I confirm each one</option>
            </select>
          </Field>
        </div>
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {DAYS.map(({ key, label }) => {
            const periods = hours[key] ?? [];
            return (
              <li key={key} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                <label className="flex w-36 items-center gap-2 text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                  <input type="checkbox" disabled={!canEdit} checked={periods.length > 0} onChange={(e) => setPeriods(key, e.target.checked ? [{ start: "09:00", end: "17:00" }] : [])} />
                  {label}
                </label>
                {periods.length === 0 ? <span className="text-theme-sm text-gray-400">Closed</span> : (
                  <div className="flex flex-wrap items-center gap-2">
                    {periods.map((p, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5">
                        <input aria-label={`${label} opens`} disabled={!canEdit} type="time" value={p.start} onChange={(e) => setPeriods(key, periods.map((x, j) => (j === i ? { ...x, start: e.target.value } : x)))} className={`${inputCls} !w-28`} />
                        <span className="text-gray-400">to</span>
                        <input aria-label={`${label} closes`} disabled={!canEdit} type="time" value={p.end} onChange={(e) => setPeriods(key, periods.map((x, j) => (j === i ? { ...x, end: e.target.value } : x)))} className={`${inputCls} !w-28`} />
                        {canEdit && periods.length > 1 && <button type="button" aria-label="Remove period" onClick={() => setPeriods(key, periods.filter((_, j) => j !== i))} className="px-1 text-error-600">✕</button>}
                      </span>
                    ))}
                    {canEdit && periods.length < 3 && <button type="button" onClick={() => setPeriods(key, [...periods, { start: "14:00", end: "18:00" }])} className="text-theme-sm font-medium text-brand-500 hover:text-brand-600">+ Add a break</button>}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        {canEdit ? (
          <div className="flex items-center gap-4">
            <PrimaryButton onClick={save} disabled={busy}>{busy ? "Saving…" : "Save hours"}</PrimaryButton>
            {msg && <span role={msg.ok ? "status" : "alert"} className={`text-sm ${msg.ok ? "text-success-600" : "text-error-600"}`}>{msg.text}</span>}
          </div>
        ) : <p className="text-theme-xs text-gray-500">Only managers and the owner can change opening hours.</p>}
      </div>
    </Card>
  );
}
