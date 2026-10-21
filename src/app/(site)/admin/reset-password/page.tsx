"use client";
import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Logo from "@/components/saas/Logo";
import { resetPassword } from "@/services/auth";

const field =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

function ResetPassword() {
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return setError("Use at least 8 characters for your password.");
    if (password !== confirm) return setError("The two passwords don't match.");
    setBusy(true);
    setError(null);
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't reset your password. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center px-6 py-12 sm:px-12">
      <div className="mx-auto w-full max-w-md">
        <Link href="/"><Logo /></Link>
        {!token ? (
          <>
            <h1 className="mt-10 text-2xl font-semibold text-gray-900 dark:text-white">Link not complete</h1>
            <p role="alert" className="mt-3 text-sm text-gray-500 dark:text-gray-400">Open the link from your reset email, or ask for a new one.</p>
            <Link href="/admin/forgot-password" className="mt-6 inline-block text-sm font-medium text-brand-500 hover:text-brand-600">Send me a new link</Link>
          </>
        ) : done ? (
          <>
            <h1 className="mt-10 text-2xl font-semibold text-gray-900 dark:text-white">Password changed</h1>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">You have been signed out everywhere. Sign in with your new password.</p>
            <Link href="/admin/login" className="mt-6 inline-block rounded-lg bg-brand-500 px-5 py-3 text-sm font-medium text-white hover:bg-brand-600">Go to sign in</Link>
          </>
        ) : (
          <>
            <h1 className="mt-10 text-2xl font-semibold text-gray-900 dark:text-white">Choose a new password</h1>
            <form onSubmit={submit} className="mt-8 space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">New password</label>
                <input className={field} type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Confirm password</label>
                <input className={field} type="password" required minLength={8} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              </div>
              {error && (
                <div role="alert" className="rounded-lg bg-error-50 px-4 py-3 text-sm text-error-600 dark:bg-error-500/15 dark:text-error-500">
                  {error} {/expired|isn't valid/.test(error) && <Link href="/admin/forgot-password" className="font-medium underline">Get a new link</Link>}
                </div>
              )}
              <button disabled={busy} className="w-full rounded-lg bg-brand-500 px-5 py-3.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600 disabled:opacity-60">
                {busy ? "Saving…" : "Change password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return <Suspense fallback={null}><ResetPassword /></Suspense>;
}
