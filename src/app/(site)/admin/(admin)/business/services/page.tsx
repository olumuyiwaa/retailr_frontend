"use client";
import { useConfirm } from "@/components/ui/confirm";
import { useState } from "react";
import { useBizCurrency, useBizMoney } from "@/hooks/useBizMoney";
import { useAuth } from "@/app/context/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import { createCategory, deleteService, getBusinessProfile, listCategories, listServices, MAX_PRODUCT_IMAGES, MAX_PRODUCT_SPECS, saveService, type ServiceInput } from "@/services/business";
import { ErrorNote, PageHeader, PageLoading, StatCard } from "@/components/saas/Card";
import DataTable, { type Column } from "@/components/saas/DataTable";
import StatusBadge from "@/components/saas/StatusBadge";
import { Field, inputCls, OutlineButton, PrimaryButton } from "@/components/saas/Form";
import { Modal } from "@/components/ui/modal";
import { fileToDataUrl } from "@/lib/image";
import RowActions from "@/components/saas/RowActions";
import { specSuggestions } from "@/lib/specPresets";
import type { Service, ServiceOption, ServiceStatus } from "@/types/saas";

type DraftOption = { key: string; name: string; price: string };
let draftKey = 0;
const toDraft = (v?: ServiceOption): DraftOption => ({
  key: v?.id ?? `new${++draftKey}`,
  name: v?.name ?? "",
  price: v?.price !== undefined ? String(v.price) : "",
});

export default function ServicesPage() {
  const { user } = useAuth();
  const confirm = useConfirm();
  const fmt = useBizMoney();
  const currency = useBizCurrency();
  const bid = user!.businessId!;
  const { data, loading, error, reload } = useAsync(() => listServices(bid), [bid]);
  const [editing, setEditing] = useState<Service | "new" | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<DraftOption[]>([]);
  const [addingCat, setAddingCat] = useState(false);
  const [bookable, setBookable] = useState(false);
  const [specs, setSpecs] = useState<{ label: string; value: string }[]>([]);
  const { data: profile } = useAsync(() => getBusinessProfile(bid), [bid]);
  const { data: cats, reload: reloadCats } = useAsync(() => listCategories(bid), [bid]);

  if (loading) return <PageLoading />;
  if (error || !data) return <ErrorNote message={error ?? "Could not load services."} onRetry={reload} />;

  const open = (p: Service | "new") => {
    setFormError(null);
    setAddingCat(false);
    setBookable(p !== "new" ? !!p.bookable : false);
    setSpecs(p !== "new" ? (p.specs ?? []).map((s) => ({ ...s })) : []);
    setImages(p !== "new" ? (p.images?.length ? p.images : p.image ? [p.image] : []) : []);
    setDrafts(p !== "new" ? (p.options ?? []).map(toDraft) : []);
    setEditing(p);
  };

  const pickPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    const room = MAX_PRODUCT_IMAGES - images.length;
    if (room <= 0) return setFormError(`You can add up to ${MAX_PRODUCT_IMAGES} photos.`);
    const picked = files.slice(0, room);
    try {
      const added = await Promise.all(picked.map((f) => fileToDataUrl(f, 640, 0.8)));
      setImages((cur) => [...cur, ...added]);
      setFormError(files.length > room ? `Only the first ${room} photo${room === 1 ? "" : "s"} were added (max ${MAX_PRODUCT_IMAGES}).` : null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not use that photo.");
    }
  };

  const makeCover = (i: number) => setImages((cur) => [cur[i], ...cur.filter((_, k) => k !== i)]);
  const removeImage = (i: number) => setImages((cur) => cur.filter((_, k) => k !== i));

  const setDraft = (key: string, patch: Partial<DraftOption>) =>
    setDrafts((d) => d.map((v) => (v.key === key ? { ...v, ...patch } : v)));

  const remove = async (p: Service) => {
    if (!(await confirm({ title: `Delete "${p.name}"?`, message: "This can't be undone. Past orders and bookings keep their details.", confirmLabel: "Delete service", tone: "danger" }))) return;
    setRowError(null);
    try {
      await deleteService(bid, p.id);
      reload();
    } catch (e) {
      setRowError(e instanceof Error ? e.message : "Could not delete service.");
    }
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const category = addingCat ? String(f.get("newCategory") ?? "").trim() : String(f.get("category") ?? "");
    if (addingCat && !category) return setFormError("Enter a name for the new category, or pick an existing one.");
    const input: ServiceInput = {
      name: String(f.get("name")).trim(),
      category,
      description: String(f.get("description")).trim(),
      price: Number(f.get("price")),
      durationMins: f.get("durationMins") ? Number(f.get("durationMins")) : null,
      bookable,
      ...(bookable ? { maxConcurrent: Number(f.get("maxConcurrent")) || 1 } : {}),
      status: f.get("status") as ServiceStatus,
      images,
      specs,
      options: drafts.map((d) => ({
        ...(d.key.startsWith("new") ? {} : { id: d.key }),
        name: d.name,
        ...(d.price.trim() !== "" ? { price: Number(d.price) } : {}),
      })),
    };
    if (!input.name) return setFormError("Service name is required.");
    if (bookable && !input.durationMins) return setFormError("Add how long the service takes so customers can pick a time.");
    if (!(input.price >= 0)) return setFormError("Enter a valid price.");
    setSaving(true);
    setFormError(null);
    try {
      if (addingCat) {
        try {
          await createCategory(bid, category);
        } catch (err) {
          if (!(err instanceof Error && err.message.startsWith("You already have"))) throw err;
        }
        reloadCats();
      }
      await saveService(bid, input, editing !== "new" && editing ? editing.id : undefined);
      setEditing(null);
      reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not save service.");
    } finally {
      setSaving(false);
    }
  };

  const p = editing && editing !== "new" ? editing : null;
  const services = data;

  const columns: Column<Service>[] = [
    {
      key: "name", header: "Service", sortValue: (row) => row.name,
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={row.image} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
          ) : (
            <span className="h-10 w-10 shrink-0 rounded-lg" style={{ background: row.imageColor }} />
          )}
          <div>
            <p className="font-medium text-gray-800 dark:text-white/90">{row.name}</p>
            <p className="text-theme-xs text-gray-500">
              {row.category || "Service"}
              {row.options?.length ? ` · ${row.options.length} options` : ""}
              {row.bookable ? " · bookable" : ""}
            </p>
          </div>
        </div>
      ),
    },
    { key: "price", header: "Price", sortValue: (row) => row.price, render: (row) => fmt(row.price) },
    {
      key: "duration", header: "Duration", sortValue: (row) => row.durationMins ?? 0,
      render: (row) => (row.durationMins ? `${row.durationMins} min` : <span className="text-gray-400">—</span>),
    },
    { key: "sold", header: "Booked or sold", sortValue: (row) => row.sold, render: (row) => row.sold },
    { key: "status", header: "Status", sortValue: (row) => row.status, render: (row) => <StatusBadge status={row.status} /> },
    {
      key: "actions", header: "", className: "text-right whitespace-nowrap",
      render: (row) => (
        <RowActions
          label={`Actions for ${row.name}`}
          actions={[
            { label: "Edit", onClick: () => open(row) },
            { label: "Delete", tone: "danger", onClick: () => remove(row) },
          ]}
        />
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Services"
        subtitle={`${services.length} service${services.length === 1 ? "" : "s"} · no stock to track`}
        action={<PrimaryButton onClick={() => open("new")}>+ Add service</PrimaryButton>}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Services" value={String(services.length)} hint={`${services.filter((x) => x.status === "draft").length} in draft`} />
        <StatCard label="Active" value={String(services.filter((x) => x.status === "active").length)} hint="visible on your store" />
        <StatCard label="Bookable" value={String(services.filter((x) => x.bookable).length)} hint="customers pick a time slot" />
        <StatCard label="Times sold" value={String(services.reduce((n, x) => n + x.sold, 0))} hint="across all services" />
      </div>
      {rowError && <div className="mb-4"><ErrorNote message={rowError} /></div>}
      <DataTable
        rows={services}
        columns={columns}
        rowKey={(x) => x.id}
        searchText={(x) => `${x.name} ${x.category}`}
        searchPlaceholder="Search services…"
        filter={{
          label: "Show",
          options: [{ label: "Active", value: "active" }, { label: "Draft", value: "draft" }],
          match: (x, v) => x.status === v,
        }}
        emptyTitle="No services yet"
        emptyBody="Add a service you offer: haircuts, repairs, classes, consultations and more."
      />

      <Modal isOpen={!!editing} onClose={() => setEditing(null)} className="max-w-[600px] p-6 sm:p-8 m-4 max-h-[92vh] overflow-y-auto">
        {editing && (
          <form onSubmit={submit} className="space-y-4" key={p?.id ?? "new"}>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">{p ? "Edit service" : "Add service"}</h3>
            <Field label="Name"><input name="name" defaultValue={p?.name} className={inputCls} placeholder="e.g. Braiding session" /></Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Category">
                <div className="space-y-2">
                  <select
                    name="category"
                    defaultValue={p?.category ?? ""}
                    onChange={(e) => setAddingCat(e.target.value === "__new__")}
                    className={inputCls}
                  >
                    <option value="">No category</option>
                    {(cats ?? []).map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                    {p?.category && !(cats ?? []).some((c) => c.name === p.category) && <option value={p.category}>{p.category}</option>}
                    <option value="__new__">+ New category…</option>
                  </select>
                  {addingCat && <input name="newCategory" autoFocus maxLength={40} placeholder="New category name" aria-label="New category name" className={inputCls} />}
                </div>
              </Field>
              <Field label={`Price (${currency})`}><input name="price" type="number" step="0.01" min="0" defaultValue={p?.price ?? ""} className={inputCls} /></Field>
              <Field label="Duration (minutes, optional)"><input name="durationMins" type="number" min="1" max="1440" defaultValue={p?.durationMins ?? ""} className={inputCls} placeholder="e.g. 60" /></Field>
            </div>
            {(
              <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                <label className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                  <input type="checkbox" checked={bookable} onChange={(e) => setBookable(e.target.checked)} className="mt-1" />
                  <span>
                    <span className="font-medium">Customers book a time slot</span>
                    <span className="block text-theme-xs text-gray-500">They pick a day and time from your opening hours instead of adding it to a cart. Needs a duration.</span>
                  </span>
                </label>
                {bookable && (
                  <div className="mt-3 max-w-[220px]">
                    <Field label="At the same time">
                      <input name="maxConcurrent" type="number" min="1" max="50" defaultValue={p?.maxConcurrent ?? 1} className={inputCls} />
                    </Field>
                    <p className="mt-1 text-theme-xs text-gray-500">How many customers you can serve at once (staff or chairs).</p>
                  </div>
                )}
              </div>
            )}
            <Field label="Status">
              <select name="status" defaultValue={p?.status ?? "active"} className={inputCls}>
                <option value="active">Active</option>
                <option value="draft">Draft (hidden from store)</option>
              </select>
            </Field>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-400">
                  Photos <span className="font-normal text-gray-400">({images.length}/{MAX_PRODUCT_IMAGES}, the first is the cover)</span>
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {images.map((src, i) => (
                  <div key={i} className="group relative aspect-square overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`Service photo ${i + 1}`} className="h-full w-full object-cover" />
                    {i === 0 && <span className="absolute left-1.5 top-1.5 rounded-md bg-brand-500 px-1.5 py-0.5 text-[10px] font-medium text-white">Cover</span>}
                    <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-gradient-to-t from-black/60 to-transparent p-1.5 text-[11px] font-medium text-white">
                      {i > 0 ? <button type="button" onClick={() => makeCover(i)} className="hover:underline">Make cover</button> : <span />}
                      <button type="button" aria-label={`Remove photo ${i + 1}`} onClick={() => removeImage(i)} className="hover:underline">Remove</button>
                    </div>
                  </div>
                ))}
                {images.length < MAX_PRODUCT_IMAGES && (
                  <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 text-center text-theme-xs text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/[0.03]">
                    <span className="text-xl leading-none">+</span>
                    <span className="mt-1">{images.length === 0 ? "Add photos" : "Add more"}</span>
                    <input type="file" accept="image/*" multiple aria-label="Service photos" className="sr-only" onChange={pickPhotos} />
                  </label>
                )}
              </div>
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-400">Options <span className="font-normal text-gray-400">(basic, premium…)</span></span>
                <button type="button" onClick={() => setDrafts((d) => [...d, toDraft()])} className="text-sm font-medium text-brand-500 hover:text-brand-600">+ Add option</button>
              </div>
              {drafts.length === 0 ? (
                <p className="text-theme-xs text-gray-500">No options. Add some if customers choose between packages, like Basic or Premium.</p>
              ) : (
                <ul className="space-y-2">
                  {drafts.map((v) => (
                    <li key={v.key} className="grid grid-cols-[1fr_88px_auto] items-center gap-2">
                      <input aria-label="Option name" placeholder="e.g. Short hair" value={v.name} onChange={(e) => setDraft(v.key, { name: e.target.value })} className={inputCls} />
                      <input aria-label="Option price" type="number" min="0" step="0.01" placeholder="Price" value={v.price} onChange={(e) => setDraft(v.key, { price: e.target.value })} className={inputCls} />
                      <button type="button" aria-label="Remove option" onClick={() => setDrafts((d) => d.filter((x) => x.key !== v.key))} className="px-1 text-error-600">✕</button>
                    </li>
                  ))}
                  <li className="text-theme-xs text-gray-500">Leave price empty to use the service price.</li>
                </ul>
              )}
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-400">Details <span className="font-normal text-gray-400">(material, size guide…)</span></span>
                <button
                  type="button"
                  disabled={specs.length >= MAX_PRODUCT_SPECS}
                  onClick={() => setSpecs((s) => [...s, { label: "", value: "" }])}
                  className="text-sm font-medium text-brand-500 hover:text-brand-600 disabled:opacity-40"
                >
                  + Add detail
                </button>
              </div>
              {(() => {
                const free = specSuggestions(profile?.category).filter((n) => !specs.some((s) => s.label.trim().toLowerCase() === n.toLowerCase()));
                return specs.length < MAX_PRODUCT_SPECS && free.length > 0 ? (
                  <div className="mb-2 flex flex-wrap items-center gap-1.5" aria-label="Suggested details">
                    <span className="text-theme-xs text-gray-500">Suggested:</span>
                    {free.map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setSpecs((cur) => [...cur.filter((x) => x.label || x.value), { label: n, value: "" }])}
                        className="rounded-full border border-gray-200 px-2.5 py-0.5 text-theme-xs text-gray-600 hover:border-brand-500 hover:text-brand-600 dark:border-gray-700 dark:text-gray-400"
                      >
                        + {n}
                      </button>
                    ))}
                  </div>
                ) : null;
              })()}
              {specs.length === 0 ? (
                <p className="text-theme-xs text-gray-500">Optional facts shown on the service page, like What’s included: Wash and style.</p>
              ) : (
                <ul className="space-y-2">
                  {specs.map((s, i) => (
                    <li key={i} className="grid grid-cols-[1fr_1.6fr_auto] items-center gap-2">
                      <input aria-label="Detail name" placeholder="Name" maxLength={30} value={s.label} onChange={(e) => setSpecs((cur) => cur.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)))} className={inputCls} />
                      <input aria-label="Detail value" placeholder="Value" maxLength={120} value={s.value} onChange={(e) => setSpecs((cur) => cur.map((x, k) => (k === i ? { ...x, value: e.target.value } : x)))} className={inputCls} />
                      <button type="button" aria-label="Remove detail" onClick={() => setSpecs((cur) => cur.filter((_, k) => k !== i))} className="px-1 text-error-600">✕</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <Field label="Description"><textarea name="description" rows={3} defaultValue={p?.description} className={`${inputCls} h-auto py-3`} /></Field>
            {formError && <ErrorNote message={formError} />}
            <div className="flex justify-end gap-3 pt-2">
              <OutlineButton type="button" onClick={() => setEditing(null)}>Cancel</OutlineButton>
              <PrimaryButton busy={saving}>{p ? "Save changes" : "Add service"}</PrimaryButton>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
