"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { homeFor, useAuth } from "@/app/context/AuthContext";
import Logo from "@/components/saas/Logo";
import { DEMO_ENABLED, DEMO_LOGINS, DEMO_STORE_HREF } from "@/lib/demo";

export default function LoginPage() {
  const { user, ready, signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && user) router.replace(homeFor(user.role));
  }, [ready, user, router]);

  const submit = async (e: React.FormEvent, em = email, pw = password) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const u = await signIn(em, pw);
      router.replace(homeFor(u.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
      setBusy(false);
    }
  };

  const field =
    "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-md">
          <Link href="/"><Logo /></Link>
          <h1 className="mt-10 text-2xl font-semibold text-gray-900 dark:text-white">Sign in to your dashboard</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Manage your store, or run the whole platform.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Email</label>
              <input className={field} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@business.com" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Password</label>
              <input className={field} type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            {error && (
              <p role="alert" className="rounded-lg bg-error-50 px-4 py-3 text-sm text-error-600 dark:bg-error-500/15 dark:text-error-500">
                {error}
              </p>
            )}
            <button disabled={busy} className="w-full rounded-lg bg-brand-500 px-5 py-3.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600 disabled:opacity-60">
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>

          {DEMO_ENABLED && (
            <div className="mt-8 rounded-xl border border-dashed border-gray-300 p-4 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">Just looking? Try the Scentora demo shop</p>
              <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">A perfume store with sample products, customers and orders. Pick a role to see what each team member can do.</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {DEMO_LOGINS.map((d) => (
                  <button key={d.role} type="button" disabled={busy} title={d.note} onClick={(e) => submit(e, d.email, d.password)}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-left text-sm font-medium text-gray-700 hover:border-brand-300 hover:bg-brand-50 disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5">
                    {d.role}
                    <span className="block text-theme-xs font-normal text-gray-500">{d.note}</span>
                  </button>
                ))}
              </div>
              <Link href={DEMO_STORE_HREF} className="mt-3 inline-block text-theme-xs font-medium text-brand-500 hover:text-brand-600">Browse the demo storefront</Link>
            </div>
          )}

          <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
            New to Retailr?{" "}
            <Link href="/get-started" className="font-medium text-brand-500 hover:text-brand-600">Start your free trial</Link>
          </p>

        </div>
      </div>
      <div className="hidden bg-brand-950 p-12 lg:flex lg:flex-col lg:justify-center">
        <div className="mx-auto max-w-md text-white">
          <h2 className="text-3xl font-semibold leading-tight">The home for African small businesses online.</h2>
          <p className="mt-4 text-brand-100/80">
            Launch a storefront, take orders and grow with tools built for the businesses that power local economies.
          </p>
        </div>
      </div>
    </div>
  );
}
