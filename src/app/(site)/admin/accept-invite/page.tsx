"use client";
import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { homeFor, useAuth } from "@/app/context/AuthContext";
import Logo from "@/components/saas/Logo";
import { acceptInvite, getInvite, type InvitePreview } from "@/services/auth";

const field =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

function AcceptInvite() {
  const token = useSearchParams().get("token") ?? "";
  const router = useRouter();
  const { adopt } = useAuth();
  const [invite, setInvite] = useState<InvitePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [problem, setProblem] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) { setProblem("This invite link is incomplete. Open the link from your invite email."); setLoading(false); return; }
    getInvite(token)
      .then(setInvite)
      .catch(() => setProblem("This invite link has expired or was already used. Ask the business owner to send a new one."))
      .finally(() => setLoading(false));
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setError("Use at least 8 characters for your password."); return; }
    setBusy(true);
    setError(null);
    try {
      const u = await acceptInvite(token, password);
      adopt(u);
      router.replace(homeFor(u.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't set up your account. Please try again.");
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center px-6 py-12 sm:px-12">
      <div className="mx-auto w-full max-w-md">
        <Link href="/"><Logo /></Link>
        {loading ? (
          <p className="mt-10 text-sm text-gray-500">Checking your invite…</p>
        ) : problem || !invite ? (
          <>
            <h1 className="mt-10 text-2xl font-semibold text-gray-900 dark:text-white">Invite not available</h1>
            <p role="alert" className="mt-3 text-sm text-gray-500 dark:text-gray-400">{problem}</p>
            <Link href="/admin/login" className="mt-6 inline-block text-sm font-medium text-brand-500 hover:text-brand-600">Go to sign in</Link>
          </>
        ) : (
          <>
            <h1 className="mt-10 text-2xl font-semibold text-gray-900 dark:text-white">Join {invite.businessName}</h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Hi {invite.name}, choose a password to finish setting up your {invite.role} account for {invite.email}.
            </p>
            <form onSubmit={submit} className="mt-8 space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Password</label>
                <input className={field} type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
              </div>
              {error && (
                <p role="alert" className="rounded-lg bg-error-50 px-4 py-3 text-sm text-error-600 dark:bg-error-500/15 dark:text-error-500">{error}</p>
              )}
              <button disabled={busy} className="w-full rounded-lg bg-brand-500 px-5 py-3.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600 disabled:opacity-60">
                {busy ? "Setting up…" : "Join the team"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return <Suspense fallback={null}><AcceptInvite /></Suspense>;
}
