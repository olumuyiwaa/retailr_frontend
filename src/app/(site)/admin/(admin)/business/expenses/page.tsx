"use client";

import { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import { useBizMoney } from "@/hooks/useBizMoney";
import { createExpense, deleteExpense, listExpenses } from "@/services/business";
import { Card, CardHeader, ErrorNote, PageHeader, PageLoading, StatCard } from "@/components/saas/Card";
import DataTable, { type Column } from "@/components/saas/DataTable";
import { Field, inputCls, OutlineButton, PrimaryButton } from "@/components/saas/Form";
import { shortDate } from "@/lib/format";
import type { Expense, ExpenseCategory } from "@/types/saas";

const CATEGORIES: { id: ExpenseCategory; label: string }[] = [
  { id: "rent", label: "Rent" },
  { id: "utilities", label: "Utilities" },
  { id: "supplies", label: "Supplies" },
  { id: "marketing", label: "Marketing" },
  { id: "salaries", label: "Salaries" },
  { id: "transport", label: "Transport" },
  { id: "other", label: "Other" },
];

const labelOf = (c: ExpenseCategory) => CATEGORIES.find((x) => x.id === c)?.label ?? c;

export default function ExpensesPage() {
  const { user } = useAuth();
  const fmt = useBizMoney();
  const bid = user!.businessId!;
  const { data, loading, error, reload } = useAsync(() => listExpenses(bid), [bid]);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("supplies");
  const [note, setNote] = useState("");
  const [spentAt, setSpentAt] = useState(() => new Date().toISOString().slice(0, 10));

  if (loading) return <PageLoading />;
  if (error || !data) return <ErrorNote message={error ?? "Could not load expenses."} onRetry={reload} />;

  const total = data.reduce((s, e) => s + e.amount, 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(amount);
    if (!(n > 0)) return setFormError("Enter an amount greater than zero.");
    setBusy(true);
    setFormError(null);
    try {
      await createExpense(bid, { amount: n, category, note: note.trim() || undefined, spentAt: new Date(spentAt).toISOString() });
      setAmount("");
      setNote("");
      reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not save expense.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (row: Expense) => {
    if (!confirm(`Delete ${fmt(row.amount)} (${labelOf(row.category)})?`)) return;
    try {
      await deleteExpense(bid, row.id);
      reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not delete.");
    }
  };

  const columns: Column<Expense>[] = [
    { key: "date", header: "Date", sortValue: (e) => e.spentAt, render: (e) => shortDate(e.spentAt) },
    { key: "cat", header: "Category", sortValue: (e) => e.category, render: (e) => labelOf(e.category) },
    { key: "note", header: "Note", render: (e) => e.note || "—" },
    { key: "amt", header: "Amount", sortValue: (e) => e.amount, render: (e) => fmt(e.amount) },
    {
      key: "act",
      header: "",
      render: (e) => (
        <button type="button" className="text-sm text-error-500 hover:underline" onClick={() => void remove(e)}>
          Delete
        </button>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Expenses" subtitle="Track costs so reports can show real profit." />
      <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-3">
        <StatCard label="Logged expenses" value={String(data.length)} />
        <StatCard label="Total" value={fmt(total)} hint="All time in this list" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader title="Add expense" />
          <form onSubmit={submit} className="space-y-4 px-5 pb-5 sm:px-6 sm:pb-6">
            <Field label="Amount">
              <input className={inputCls} type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </Field>
            <Field label="Category">
              <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Date">
              <input className={inputCls} type="date" value={spentAt} onChange={(e) => setSpentAt(e.target.value)} required />
            </Field>
            <Field label="Note">
              <input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" />
            </Field>
            {formError && <p className="text-sm text-error-500">{formError}</p>}
            <PrimaryButton type="submit" busy={busy}>Save expense</PrimaryButton>
          </form>
        </Card>

        <Card className="lg:col-span-2">
          <DataTable
            rows={data}
            columns={columns}
            rowKey={(e) => e.id}
            searchText={(e) => `${e.category} ${e.note}`}
            searchPlaceholder="Search expenses…"
            emptyTitle="No expenses yet"
            emptyBody="Add rent, supplies or marketing costs to see profit on Reports."
          />
        </Card>
      </div>
    </>
  );
}
