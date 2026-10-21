"use client";
import React, { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Logo from "@/components/saas/Logo";
import { verifyEmail } from "@/services/auth";

function VerifyEmail() {
  const token = useSearchParams().get("token") ?? "";
  const [state, setState] = useState<"working" | "ok" | "failed">(token ? "working" : "failed");
  const [message, setMessage] = useState("Open the link from your confirmation email.");
  const ran = useRef(false); // the link works once, so never fire it twice (React strict mode)

  useEffect(() => {
    if (!token || ran.current) return;
    ran.current = true;
    verifyEmail(token)
      .then(() => setState("ok"))
      .catch((err) => { setMessage(err instanceof Error ? err.message : "We couldn't confirm your email."); setState("failed"); });
  }, [token]);

  return (
    <div className="flex min-h-screen flex-col justify-center px-6 py-12 sm:px-12">
      <div className="mx-auto w-full max-w-md">
        <Link href="/"><Logo /></Link>
        <h1 className="mt-10 text-2xl font-semibold text-gray-900 dark:text-white">
          {state === "working" ? "Confirming your email…" : state === "ok" ? "Email confirmed" : "We couldn't confirm your email"}
        </h1>
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          {state === "ok" ? "Thanks. You're all set." : state === "failed" ? message : "One moment."}
        </p>
        {state !== "working" && (
          <Link href="/admin/login" className="mt-6 inline-block rounded-lg bg-brand-500 px-5 py-3 text-sm font-medium text-white hover:bg-brand-600">
            {state === "ok" ? "Continue to your dashboard" : "Go to sign in"}
          </Link>
        )}
        {state === "failed" && <p className="mt-4 text-theme-xs text-gray-500">Signed in? A banner at the top of your dashboard can send a fresh link.</p>}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return <Suspense fallback={null}><VerifyEmail /></Suspense>;
}
