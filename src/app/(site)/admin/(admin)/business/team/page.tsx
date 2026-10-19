"use client";
import { useConfirm } from "@/components/ui/confirm";
import { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import { inviteTeamMember, listTeam, removeTeamMember } from "@/services/business";
import { ErrorNote, PageHeader, PageLoading } from "@/components/saas/Card";
import DataTable, { type Column } from "@/components/saas/DataTable";
import StatusBadge from "@/components/saas/StatusBadge";
import { Field, inputCls, OutlineButton, PrimaryButton } from "@/components/saas/Form";
import RowActions from "@/components/saas/RowActions";
import { Modal } from "@/components/ui/modal";
import { shortDate } from "@/lib/format";
import type { TeamMember } from "@/types/saas";

export default function TeamPage() {
  const { user } = useAuth();
  const confirm = useConfirm();
  const bid = user!.businessId!;
  const { data, loading, error, reload } = useAsync(() => listTeam(bid), [bid]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  if (loading) return <PageLoading />;
  if (error || !data) return <ErrorNote message={error ?? "Could not load team."} onRetry={reload} />;

  const remove = async (m: TeamMember) => {
    if (!(await confirm({ title: `Remove ${m.name}?`, message: "They will lose access to your store admin straight away.", confirmLabel: "Remove", tone: "danger" }))) return;
    setRowError(null);
    try {
      await removeTeamMember(bid, m.id);
      reload();
    } catch (e) {
      setRowError(e instanceof Error ? e.message : "Could not remove member.");
    }
  };

  const columns: Column<TeamMember>[] = [
    {
      key: "name", header: "Member", sortValue: (m) => m.name,
      render: (m) => (
        <div>
          <p className="font-medium text-gray-800 dark:text-white/90">{m.name}</p>
          <p className="text-theme-xs text-gray-500">{m.email}</p>
        </div>
      ),
    },
    { key: "role", header: "Role", render: (m) => <span className="capitalize">{m.role}</span> },
    { key: "status", header: "Status", render: (m) => <StatusBadge status={m.status} /> },
    { key: "joined", header: "Added", sortValue: (m) => m.joinedAt, render: (m) => shortDate(m.joinedAt) },
    {
      key: "actions", header: "", className: "text-right",
      render: (m) => m.role === "owner" ? null : (
        <RowActions label={`Actions for ${m.name}`} actions={[{ label: "Remove from team", tone: "danger", onClick: () => remove(m) }]} />
      ),
    },
  ];

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name")).trim();
    const email = String(f.get("email")).trim();
    if (!name || !/^\S+@\S+\.\S+$/.test(email)) return setFormError("Enter a name and a valid email address.");
    setSaving(true);
    setFormError(null);
    try {
      await inviteTeamMember(bid, { name, email, role: f.get("role") as "manager" | "staff" });
      setOpen(false);
      reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not send invite.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="Team" subtitle="People who can manage your store." action={<PrimaryButton onClick={() => { setFormError(null); setOpen(true); }}>+ Invite member</PrimaryButton>} />
      {rowError && <div className="mb-4"><ErrorNote message={rowError} /></div>}
      <DataTable rows={data} columns={columns} rowKey={(m) => m.id} />

      <Modal isOpen={open} onClose={() => setOpen(false)} className="max-w-[480px] p-6 sm:p-8 m-4">
        <form onSubmit={submit} className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">Invite a team member</h3>
          <Field label="Full name"><input name="name" className={inputCls} /></Field>
          <Field label="Email"><input name="email" type="email" className={inputCls} /></Field>
          <Field label="Role">
            <select name="role" className={inputCls} defaultValue="staff">
              <option value="manager">Manager — products, orders, customers, marketing, reports</option>
              <option value="staff">Staff — orders, sales, customers (no catalogue changes)</option>
            </select>
          </Field>
          {formError && <ErrorNote message={formError} />}
          <div className="flex justify-end gap-3 pt-2">
            <OutlineButton type="button" onClick={() => setOpen(false)}>Cancel</OutlineButton>
            <PrimaryButton busy={saving}>Send invite</PrimaryButton>
          </div>
        </form>
      </Modal>
    </>
  );
}
