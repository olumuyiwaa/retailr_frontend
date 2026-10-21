"use client";
import React, { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { currentUser, resendVerification } from "@/services/auth";

/** Shown until the signed-in person confirms their email. Doesn't block anything. */
export default function VerifyEmailBanner() {
  const { user, adopt } = useAuth();
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (!user || user.emailVerified !== false) return null;

  const resend = async () => {
    setBusy(true);
    try { await resendVerification(); setNote("Sent. Check your inbox (and spam)."); }
    catch (e) { setNote(e instanceof Error ? e.message : "Could not send it. Try again in a minute."); }
    finally { setBusy(false); }
  };
  const recheck = async () => {
    setBusy(true);
    const fresh = await currentUser();
    if (fresh?.emailVerified) adopt({ ...user, emailVerified: true });
    else setNote("Not confirmed yet. Open the link in the email first.");
    setBusy(false);
  };

  return (
    <div role="status" className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-700 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-orange-300">
      <span className="min-w-0 flex-1">Confirm <b>{user.email}</b> so we can reach you about orders, billing and sign-in.{note && <span className="ml-2 font-medium">{note}</span>}</span>
      <span className="flex gap-3 font-medium">
        <button type="button" disabled={busy} onClick={resend} className="underline disabled:opacity-60">Resend email</button>
        <button type="button" disabled={busy} onClick={recheck} className="underline disabled:opacity-60">I&apos;ve confirmed</button>
      </span>
    </div>
  );
}
