"use client";
import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { createCalendarFeed, listCalendarFeeds, revokeCalendarFeed, type CalendarFeed, type CreatedCalendarFeed } from "@/services/business";
import { OutlineButton, PrimaryButton } from "@/components/saas/Form";

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : null);

/**
 * "Sync to your calendar": makes a private link that Google, Apple or Outlook calendar can subscribe to, and lists or
 * revokes existing links. The link is the credential, so it is shown once, right after it is made.
 */
export default function CalendarSync() {
  const [open, setOpen] = useState(false);
  const [feeds, setFeeds] = useState<CalendarFeed[]>([]);
  const [created, setCreated] = useState<CreatedCalendarFeed | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const load = async () => {
    try { setFeeds(await listCalendarFeeds()); } catch (e) { setError(e instanceof Error ? e.message : "Could not load your links."); }
  };
  const show = () => { setError(""); setCreated(null); setCopied(false); setOpen(true); void load(); };

  const create = async () => {
    setBusy(true);
    setError("");
    try { setCreated(await createCalendarFeed()); setCopied(false); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not create the link."); }
    finally { setBusy(false); }
  };
  const revoke = async (id: string) => {
    setBusy(true);
    setError("");
    try { await revokeCalendarFeed(id); if (created?.id === id) setCreated(null); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not revoke the link."); }
    finally { setBusy(false); }
  };
  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(true); } catch { setError("Couldn't copy. Select the link and copy it by hand."); }
  };

  return (
    <>
      <OutlineButton type="button" onClick={show}>Sync to my calendar</OutlineButton>
      <Modal isOpen={open} onClose={() => setOpen(false)} className="max-w-[560px] p-6 lg:p-8 m-4 max-h-[92vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Sync bookings to your calendar</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Make a private link, then subscribe to it in Google Calendar, Apple Calendar or Outlook. New and changed bookings appear there within about an hour.
        </p>
        {error && <p role="alert" className="mt-4 rounded-lg bg-error-50 px-4 py-3 text-sm text-error-600 dark:bg-error-500/15 dark:text-error-500">{error}</p>}

        {created && (
          <div className="mt-5 rounded-xl border border-brand-200 bg-brand-25 p-4 dark:border-brand-500/30 dark:bg-brand-500/10">
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">Copy this link now. For your security it is shown only once.</p>
            <input readOnly value={created.url} onFocus={(e) => e.currentTarget.select()} aria-label="Calendar link" className="mt-3 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300" />
            <div className="mt-3 flex flex-wrap gap-2">
              <PrimaryButton type="button" onClick={() => copy(created.url)}>{copied ? "Copied" : "Copy link"}</PrimaryButton>
              <a href={created.webcalUrl} className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300">Open in my calendar app</a>
            </div>
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">Anyone with this link can see your bookings, including customer names and phone numbers. Don&apos;t share it. If it leaks, revoke it below.</p>
          </div>
        )}

        <div className="mt-5"><PrimaryButton type="button" onClick={create} disabled={busy}>Create a new link</PrimaryButton></div>

        <div className="mt-6">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">Your links</p>
          {feeds.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">You don&apos;t have any yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {feeds.map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="min-w-0 text-gray-700 dark:text-gray-300">
                    <span className="block truncate">{f.label || `Link from ${fmt(f.createdAt)}`}</span>
                    <span className="block text-xs text-gray-400">{f.lastAccessedAt ? `Last used ${fmt(f.lastAccessedAt)}` : "Never used yet"}</span>
                  </span>
                  <button type="button" onClick={() => revoke(f.id)} disabled={busy} className="shrink-0 text-sm font-medium text-error-600 hover:text-error-700 disabled:opacity-60">Revoke</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Modal>
    </>
  );
}
