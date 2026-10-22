"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { Card, CardHeader, PageHeader } from "@/components/saas/Card";
import { DangerButton, Field, inputCls, OutlineButton, PrimaryButton } from "@/components/saas/Form";
import { changePassword, deleteAccount, updateMe } from "@/services/auth";

export default function AccountPage() {
  const { user, adopt, signOut } = useAuth();
  const router = useRouter();

  const [name, setName] = useState(user?.name ?? "");
  const [nameBusy, setNameBusy] = useState(false);
  const [nameMsg, setNameMsg] = useState<string | null>(null);
  const [nameErr, setNameErr] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwErr, setPwErr] = useState<string | null>(null);

  const [deletePassword, setDeletePassword] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [delBusy, setDelBusy] = useState(false);
  const [delErr, setDelErr] = useState<string | null>(null);

  if (!user) return null;

  const isOwner = user.role === "business_admin" && user.teamRole === "owner";

  const saveName = async (e: React.FormEvent) => {
    e.preventDefault();
    const next = name.trim();
    if (!next) return setNameErr("Please enter your name.");
    setNameBusy(true);
    setNameErr(null);
    setNameMsg(null);
    try {
      const u = await updateMe(next);
      adopt(u);
      setNameMsg("Name updated.");
    } catch (err) {
      setNameErr(err instanceof Error ? err.message : "Could not update your name.");
    } finally {
      setNameBusy(false);
    }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwErr(null);
    setPwMsg(null);
    if (newPassword.length < 8) return setPwErr("Password must be at least 8 characters.");
    if (newPassword !== confirmPassword) return setPwErr("New passwords do not match.");
    setPwBusy(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPwMsg("Password changed. Other devices have been signed out.");
    } catch (err) {
      setPwErr(err instanceof Error ? err.message : "Could not change password.");
    } finally {
      setPwBusy(false);
    }
  };

  const removeAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmDelete) return setDelErr("Tick the confirmation box first.");
    setDelBusy(true);
    setDelErr(null);
    try {
      await deleteAccount(deletePassword);
      signOut();
      router.replace("/admin/login");
    } catch (err) {
      setDelErr(err instanceof Error ? err.message : "Could not delete your account.");
      setDelBusy(false);
    }
  };

  return (
    <div>
      <PageHeader title="My account" subtitle="Your personal login for Retailr." />

      <div className="space-y-6">
        <Card>
          <CardHeader title="Profile" subtitle="How you appear to your team." />
          <form onSubmit={saveName} className="space-y-4 px-5 pb-5 sm:px-6 sm:pb-6">
            <Field label="Name">
              <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            </Field>
            <Field label="Email" hint="Email can’t be changed here. Contact support if you need to move this login.">
              <input className={inputCls} value={user.email} disabled readOnly />
            </Field>
            {nameErr && <p className="text-sm text-error-500">{nameErr}</p>}
            {nameMsg && <p className="text-sm text-success-600">{nameMsg}</p>}
            <PrimaryButton type="submit" busy={nameBusy}>Save name</PrimaryButton>
          </form>
        </Card>

        <Card>
          <CardHeader title="Password" subtitle="Use a strong password you don’t reuse elsewhere." />
          <form onSubmit={savePassword} className="space-y-4 px-5 pb-5 sm:px-6 sm:pb-6">
            <Field label="Current password">
              <input
                type="password"
                className={inputCls}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </Field>
            <Field label="New password" hint="At least 8 characters.">
              <input
                type="password"
                className={inputCls}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                required
                minLength={8}
              />
            </Field>
            <Field label="Confirm new password">
              <input
                type="password"
                className={inputCls}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
                minLength={8}
              />
            </Field>
            {pwErr && <p className="text-sm text-error-500">{pwErr}</p>}
            {pwMsg && <p className="text-sm text-success-600">{pwMsg}</p>}
            <PrimaryButton type="submit" busy={pwBusy}>Change password</PrimaryButton>
          </form>
        </Card>

        <Card className="border-error-200 dark:border-error-500/30">
          <CardHeader
            title="Delete account"
            subtitle={
              isOwner
                ? "This permanently deletes your store, products, orders, customers and team logins. This cannot be undone."
                : "This removes your login. Your team can invite you again later if needed."
            }
          />
          <form onSubmit={removeAccount} className="space-y-4 px-5 pb-5 sm:px-6 sm:pb-6">
            <Field label="Password">
              <input
                type="password"
                className={inputCls}
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </Field>
            <label className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
              <input
                type="checkbox"
                className="mt-1"
                checked={confirmDelete}
                onChange={(e) => setConfirmDelete(e.target.checked)}
              />
              <span>
                {isOwner
                  ? "I understand this will permanently delete my business and all of its data."
                  : "I understand this will permanently delete my account."}
              </span>
            </label>
            {delErr && <p className="text-sm text-error-500">{delErr}</p>}
            <div className="flex flex-wrap gap-3">
              <DangerButton type="submit" disabled={delBusy || !confirmDelete}>
                {delBusy ? "Deleting…" : isOwner ? "Delete business and account" : "Delete my account"}
              </DangerButton>
              <OutlineButton type="button" onClick={() => { setConfirmDelete(false); setDeletePassword(""); setDelErr(null); }}>
                Cancel
              </OutlineButton>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
