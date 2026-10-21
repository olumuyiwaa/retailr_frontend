"use client";
import React, { useState } from "react";
import Link from "next/link";
import Logo from "@/components/saas/Logo";
import { forgotPassword } from "@/services/auth";

const field =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center px-6 py-12 sm:px-12">
      <div className="mx-auto w-full max-w-md">
        <Link href="/"><Logo /></Link>
        {sent ? (
          <>
            <h1 className="mt-10 text-2xl font-semibold text-gray-900 dark:text-white">Check your email</h1>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              If there is an account for <b>{email.trim()}</b>, we have sent a link to choose a new password. It works once and expires in an hour.
            </p>
            <button type="button" onClick={() => setSent(false)} className="mt-6 text-sm font-medium text-brand-500 hover:text-brand-600">Use a different email</button>
          </>
        ) : (
          <>
            <h1 className="mt-10 text-2xl font-semibold text-gray-900 dark:text-white">Reset your password</h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Enter the email you sign in with and we will send you a reset link.</p>
            <form onSubmit={submit} className="mt-8 space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Email</label>
                <input className={field} type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@business.com" />
              </div>
              {error && <p role="alert" className="rounded-lg bg-error-50 px-4 py-3 text-sm text-error-600 dark:bg-error-500/15 dark:text-error-500">{error}</p>}
              <button disabled={busy} className="w-full rounded-lg bg-brand-500 px-5 py-3.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600 disabled:opacity-60">
                {busy ? "Sending…" : "Send reset link"}
              </button>
            </form>
          </>
        )}
        <Link href="/admin/login" className="mt-8 inline-block text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">← Back to sign in</Link>
      </div>
    </div>
  );
}
