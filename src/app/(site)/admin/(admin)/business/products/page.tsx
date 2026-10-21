"use client";
import { useConfirm } from "@/components/ui/confirm";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useBizCurrency, useBizMoney } from "@/hooks/useBizMoney";
import { useAuth } from "@/app/context/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import { createCategory, deleteProduct, getBusinessProfile, listCategories, listProducts, MAX_PRODUCT_IMAGES, MAX_PRODUCT_SPECS, saveProduct, type ProductInput } from "@/services/business";
import { ErrorNote, PageHeader, PageLoading, StatCard } from "@/components/saas/Card";
import DataTable, { type Column } from "@/components/saas/DataTable";
import StatusBadge from "@/components/saas/StatusBadge";
import { Field, inputCls, OutlineButton, PrimaryButton } from "@/components/saas/Form";
import { Modal } from "@/components/ui/modal";
import { fileToDataUrl } from "@/lib/image";
import RowActions from "@/components/saas/RowActions";
import { specSuggestions } from "@/lib/specPresets";
import type { Product, ProductKind, ProductStatus, ProductVariant } from "@/types/saas";

type DraftVariant = { key: string; name: string; price: string; stock: string };
let draftKey = 0;
const toDraft = (v?: ProductVariant): DraftVariant => ({
  key: v?.id ?? `new${++draftKey}`,
  name: v?.name ?? "",
  price: v?.price !== undefined ? String(v.price) : "",
  stock: v ? String(v.stock) : "0",
});

export default function ProductsPage() {
  const { user } = useAuth();
  const confirm = useConfirm();
  const fmt = useBizMoney();
  const currency = useBizCurrency();
  const bid = user!.businessId!;
  const { data, loading, error, reload } = useAsync(() => listProducts(bid), [bid]);
  const searchParams = useSearchParams();
  const router = useRouter();
  /** Catalogue tab: products (default) or services — driven by ?kind=service */
  const viewKind: ProductKind = searchParams.get("kind") === "service" ? "service" : "product";
  const setViewKind = (k: ProductKind) => {
    const qs = new URLSearchParams(searchParams.toString());
    if (k === "service") qs.set("kind", "service");
    else qs.delete("kind");
    const s = qs.toString();
    router.replace(s ? `?${s}` : "?", { scroll: false });
  };
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<DraftVariant[]>([]);
  const [addingCat, setAddingCat] = useState(false);
  const [kind, setKind] = useState<ProductKind>("product");
  const [bookable, setBookable] = useState(false);
  const [specs, setSpecs] = useState<{ label: string; value: string }[]>([]);
  const { data: profile } = useAsync(() => getBusinessProfile(bid), [bid]);
  const { data: cats, reload: reloadCats } = useAsync(() => listCategories(bid), [bid]);

  if (loading) return <PageLoading />;
  if (error || !data) return <ErrorNote message={error ?? "Could not load products."} onRetry={reload} />;

  const open = (p: Product | "new", startAs: ProductKind = "product") => {
    setFormError(null);
    setAddingCat(false);
    setKind(p !== "new" ? p.kind : startAs);
    setBookable(p !== "new" ? !!p.bookable : false);
    setSpecs(p !== "new" ? (p.specs ?? []).map((s) => ({ ...s })) : []);
    setImages(p !== "new" ? (p.images?.length ? p.images : p.image ? [p.image] : []) : []);
    setDrafts(p !== "new" ? (p.variants ?? []).map(toDraft) : []);
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

  const setDraft = (key: string, patch: Partial<DraftVariant>) =>
    setDrafts((d) => d.map((v) => (v.key === key ? { ...v, ...patch } : v)));

  const remove = async (p: Product) => {
    if (!(await confirm({ title: `Delete "${p.name}"?`, message: "This can't be undone.", confirmLabel: p.kind === "service" ? "Delete service" : "Delete product", tone: "danger" }))) return;
    setRowError(null);
    try {
      await deleteProduct(bid, p.id);
      reload();
    } catch (e) {
      setRowError(e instanceof Error ? e.message : `Could not delete ${p.kind === "service" ? "service" : "product"}.`);
    }
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const category = addingCat ? String(f.get("newCategory") ?? "").trim() : String(f.get("category") ?? "");
    if (addingCat && !category) return setFormError("Enter a name for the new category, or pick an existing one.");
    const input: ProductInput = {
      name: String(f.get("name")).trim(),
      sku: String(f.get("sku")).trim(),
      category: category,
      description: String(f.get("description")).trim(),
      price: Number(f.get("price")),
      stock: kind === "service" ? 0 : Number(f.get("stock")),
      kind,
      ...(kind === "service" ? { durationMins: f.get("durationMins") ? Number(f.get("durationMins")) : null, bookable, ...(bookable ? { maxConcurrent: Number(f.get("maxConcurrent")) || 1 } : {}) } : { bookable: false }),
      status: f.get("status") as ProductStatus,
      images,
      specs,
    };
    if (drafts.length) {
      input.variants = drafts.map((d) => ({
        id: d.key.startsWith("new") ? "" : d.key,
        name: d.name,
        stock: kind === "service" ? 0 : Number(d.stock),
        ...(d.price.trim() !== "" ? { price: Number(d.price) } : {}),
      }));
      input.stock = kind === "service" ? 0 : input.variants.reduce((sum, v) => sum + (Number.isFinite(v.stock) ? v.stock : 0), 0);
    }
    if (!input.name) return setFormError(kind === "service" ? "Service name is required." : "Product name is required.");
    if (kind === "service" && bookable && !input.durationMins) return setFormError("Add how long the service takes so customers can pick a time.");
    if (!(input.price >= 0)) return setFormError("Enter a valid price.");
    if (kind === "product" && !drafts.length && (!Number.isInteger(input.stock) || input.stock < 0)) return setFormError("Stock must be a whole number, 0 or more.");
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
      await saveProduct(bid, input, editing !== "new" && editing ? editing.id : undefined);
      setEditing(null);
      reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not save product.");
    } finally {
      setSaving(false);
    }
  };

  const p = editing && editing !== "new" ? editing : null;
  const stocked = data.filter((x) => x.kind !== "service");
  const services = data.filter((x) => x.kind === "service");
  const rows = viewKind === "service" ? services : stocked;
  const noun = viewKind === "service" ? "service" : "product";
  const Noun = viewKind === "service" ? "Service" : "Product";

  const cols: Column<Product>[] = [
      {
        key: "name", header: Noun, sortValue: (row) => row.name,
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
                {row.kind === "service"
                  ? (row.durationMins ? `${row.durationMins} min` : "Service")
                  : row.sku}
                {row.variants?.length ? ` · ${row.variants.length} variants` : ""}
                {(row.images?.length ?? 0) > 1 ? ` · ${row.images!.length} photos` : ""}
              </p>
            </div>
          </div>
        ),
      },
      { key: "price", header: "Price", sortValue: (row) => row.price, render: (row) => fmt(row.price) },
    ];
    if (viewKind === "product") {
      cols.push({ key: "stock", header: "Stock", sortValue: (row) => row.stock, render: (row) => row.stock });
    } else {
      cols.push({
        key: "duration",
        header: "Duration",
        sortValue: (row) => row.durationMins ?? 0,
        render: (row) => (row.durationMins ? `${row.durationMins} min` : <span className="text-gray-400">—</span>),
      });
    }
    cols.push(
      { key: "sold", header: viewKind === "service" ? "Booked" : "Sold", sortValue: (row) => row.sold, render: (row) => row.sold },
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
    );
  const columns = cols;

  return (
    <>
      <PageHeader
        title={viewKind === "service" ? "Services" : "Products"}
        subtitle={
          viewKind === "service"
            ? `${services.length} service${services.length === 1 ? "" : "s"} in your catalogue — no stock to track`
            : `${stocked.length} product${stocked.length === 1 ? "" : "s"} in your catalogue`
        }
        action={<PrimaryButton onClick={() => open("new", viewKind)}>+ Add {noun}</PrimaryButton>}
      />

      <div className="mb-6 inline-flex rounded-xl border border-gray-200 bg-white p-1 dark:border-gray-800 dark:bg-gray-900" role="tablist" aria-label="Catalogue type">
        {([
          ["product", "Products", stocked.length],
          ["service", "Services", services.length],
        ] as const).map(([k, label, count]) => {
          const active = viewKind === k;
          return (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setViewKind(k)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                active
                  ? "bg-brand-500 text-white shadow-theme-xs"
                  : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5"
              }`}
            >
              {label}
              <span className={`ml-2 text-theme-xs ${active ? "text-white/80" : "text-gray-400"}`}>{count}</span>
            </button>
          );
        })}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        {viewKind === "product" ? (
          <>
            <StatCard label="Products" value={String(stocked.length)} hint={`${stocked.filter((x) => x.status === "draft").length} in draft`} />
            <StatCard label="Active" value={String(stocked.filter((x) => x.status === "active").length)} hint="visible on your store" />
            <StatCard
              label="Low or out of stock"
              value={String(stocked.filter((x) => x.status !== "draft" && x.stock <= 6).length)}
              hint={`${stocked.filter((x) => x.status !== "draft" && x.stock === 0).length} out of stock`}
            />
            <StatCard label="Stock value" value={fmt(stocked.reduce((n, x) => n + x.price * x.stock, 0))} hint={`${stocked.reduce((n, x) => n + x.stock, 0)} units on hand`} />
          </>
        ) : (
          <>
            <StatCard label="Services" value={String(services.length)} hint={`${services.filter((x) => x.status === "draft").length} in draft`} />
            <StatCard label="Active" value={String(services.filter((x) => x.status === "active").length)} hint="visible on your store" />
            <StatCard label="With duration" value={String(services.filter((x) => x.durationMins).length)} hint="shown to shoppers" />
            <StatCard label="Times sold" value={String(services.reduce((n, x) => n + x.sold, 0))} hint="across all services" />
          </>
        )}
      </div>
      {rowError && <div className="mb-4"><ErrorNote message={rowError} /></div>}
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(x) => x.id}
        searchText={(x) => `${x.name} ${x.sku} ${x.category}`}
        searchPlaceholder={viewKind === "service" ? "Search services…" : "Search products or SKU…"}
        filter={{
          label: "Show",
          options: [
            { label: "Active", value: "active" },
            { label: "Draft", value: "draft" },
            ...(viewKind === "product" ? [{ label: "Out of stock", value: "out_of_stock" }] : []),
          ],
          match: (x, v) => x.status === v,
        }}
        emptyTitle={viewKind === "service" ? "No services yet" : "No products yet"}
        emptyBody={
          viewKind === "service"
            ? "Add a service you offer — haircuts, repairs, classes, consultations, and more."
            : "Add your first product to start selling."
        }
      />

      <Modal isOpen={!!editing} onClose={() => setEditing(null)} className="max-w-[600px] p-6 sm:p-8 m-4 max-h-[92vh] overflow-y-auto">
        {editing && (
          <form onSubmit={submit} className="space-y-4" key={p?.id ?? "new"}>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">{p ? `Edit ${kind}` : `Add ${kind}`}</h3>
            <div className="inline-flex rounded-lg bg-gray-100 p-1 dark:bg-gray-800" role="tablist" aria-label="What are you selling?">
              {(["product", "service"] as const).map((k) => (
                <button key={k} type="button" role="tab" aria-selected={kind === k} onClick={() => setKind(k)}
                  className={`rounded-md px-3 py-1.5 text-theme-sm font-medium transition ${kind === k ? "bg-white text-gray-800 shadow-theme-xs dark:bg-gray-900 dark:text-white/90" : "text-gray-500 hover:text-gray-700 dark:text-gray-400"}`}>
                  {k === "product" ? "Product" : "Service"}
                </button>
              ))}
            </div>
            <Field label="Name"><input name="name" defaultValue={p?.name} className={inputCls} placeholder={kind === "service" ? "e.g. Braiding session" : "e.g. Adire Wrap Dress"} /></Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {kind === "product" && <Field label="SKU"><input name="sku" defaultValue={p?.sku} className={inputCls} /></Field>}
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
              {kind === "service" ? (
                <Field label="Duration (minutes, optional)"><input name="durationMins" type="number" min="1" max="1440" defaultValue={p?.durationMins ?? ""} className={inputCls} placeholder="e.g. 60" /></Field>
              ) : (
                <Field label={drafts.length ? "Stock (total of variants)" : "Stock"}>
                  {drafts.length ? (
                    <input aria-label="Total stock" readOnly value={drafts.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)} className={inputCls} />
                  ) : (
                    <input name="stock" type="number" min="0" defaultValue={p?.stock ?? 0} className={inputCls} />
                  )}
                </Field>
              )}
            </div>
            {kind === "service" && (
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
              <select name="status" defaultValue={p?.status === "out_of_stock" ? "active" : p?.status ?? "active"} className={inputCls}>
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
                    <img src={src} alt={`Product photo ${i + 1}`} className="h-full w-full object-cover" />
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
                    <input type="file" accept="image/*" multiple aria-label="Product photos" className="sr-only" onChange={pickPhotos} />
                  </label>
                )}
              </div>
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-400">{kind === "service" ? "Options" : "Variants"} <span className="font-normal text-gray-400">({kind === "service" ? "basic, premium…" : "size, colour…"})</span></span>
                <button type="button" onClick={() => setDrafts((d) => [...d, toDraft()])} className="text-sm font-medium text-brand-500 hover:text-brand-600">{kind === "service" ? "+ Add option" : "+ Add variant"}</button>
              </div>
              {drafts.length === 0 ? (
                <p className="text-theme-xs text-gray-500">{kind === "service" ? "No options. Add some if customers choose between packages, like Basic or Premium." : "No variants. Add some if shoppers need to pick an option, like a size."}</p>
              ) : (
                <ul className="space-y-2">
                  {drafts.map((v) => (
                    <li key={v.key} className={`grid ${kind === "service" ? "grid-cols-[1fr_88px_auto]" : "grid-cols-[1fr_88px_72px_auto]"} items-center gap-2`}>
                      <input aria-label="Variant name" placeholder="e.g. Large / Red" value={v.name} onChange={(e) => setDraft(v.key, { name: e.target.value })} className={inputCls} />
                      <input aria-label="Variant price" type="number" min="0" step="0.01" placeholder="Price" value={v.price} onChange={(e) => setDraft(v.key, { price: e.target.value })} className={inputCls} />
                      {kind === "product" && <input aria-label="Variant stock" type="number" min="0" value={v.stock} onChange={(e) => setDraft(v.key, { stock: e.target.value })} className={inputCls} />}
                      <button type="button" aria-label="Remove variant" onClick={() => setDrafts((d) => d.filter((x) => x.key !== v.key))} className="px-1 text-error-600">✕</button>
                    </li>
                  ))}
                  <li className="text-theme-xs text-gray-500">Leave price empty to use the {kind === "service" ? "service" : "product"} price.</li>
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
                <p className="text-theme-xs text-gray-500">Optional facts shown on the product page, like Material: Cotton or Density: 150%.</p>
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
              <PrimaryButton busy={saving}>{p ? "Save changes" : `Add ${kind}`}</PrimaryButton>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
