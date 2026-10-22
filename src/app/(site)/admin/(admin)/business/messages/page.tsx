"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import { countRecipients, getBusinessProfile, getSmsCredits, listGroups, listMessages, sendMessage } from "@/services/business";
import { Card, CardHeader, EmptyState, ErrorNote, PageHeader, PageLoading } from "@/components/saas/Card";
import { Field, inputCls, PrimaryButton } from "@/components/saas/Form";
import { relativeTime } from "@/lib/format";
import type { MessageChannel } from "@/types/saas";

const CHANNELS: { id: MessageChannel; label: string; hint: string }[] = [
  { id: "email", label: "Email", hint: "Subject and message" },
  { id: "sms", label: "SMS", hint: "Short text, up to 480 characters" },
];
const CHANNEL_LABEL: Record<MessageChannel, string> = { email: "Email", sms: "SMS" };

export default function MessagesPage() {
  const { user } = useAuth();
  const bid = user!.businessId!;
  const params = useSearchParams();
  const credits = useAsync(() => getSmsCredits(bid), [bid]);
  const { data, loading, error, reload } = useAsync(async () => {
    const [groups, messages] = await Promise.all([listGroups(bid), listMessages(bid)]);
    return { groups, messages };
  }, [bid]);

  const [channel, setChannel] = useState<MessageChannel>("email");
  const [audience, setAudience] = useState<string>(params.get("group") ?? "all");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("Hi {{first_name}}, ");
  const [reach, setReach] = useState<{ count: number; skipped: number; label: string; sampleName?: string } | null>(null);
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);
  const [storeName, setStoreName] = useState("your store");

  useEffect(() => {
    let cancelled = false;
    countRecipients(bid, audience === "all" ? { type: "all" } : { type: "group", groupId: audience }, channel)
      .then((r) => { if (!cancelled) setReach(r); })
      .catch(() => { if (!cancelled) setReach(null); });
    return () => { cancelled = true; };
  }, [bid, audience, channel, data?.groups.length]);

  useEffect(() => {
    getBusinessProfile(bid).then((b) => setStoreName(b.name)).catch(() => {});
  }, [bid]);

  if (loading) return <PageLoading />;
  if (error || !data) return <ErrorNote message={error ?? "Could not load messages."} onRetry={reload} />;

  const preview = body
    .replace(/\{\{\s*first_name\s*\}\}/gi, reach?.sampleName ?? "Ada")
    .replace(/\{\{\s*store\s*\}\}/gi, storeName);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSent(null);
    setSending(true);
    try {
      const m = await sendMessage(bid, { channel, subject, body, audience: audience === "all" ? { type: "all" } : { type: "group", groupId: audience } });
      setSent(`Sending to ${m.recipientCount} ${m.recipientCount === 1 ? "customer" : "customers"}. Check the history below for the result.`);
      setBody("Hi {{first_name}}, ");
      setSubject("");
      reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not send message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <PageHeader title="Messages" subtitle="Send updates and offers to your customers." />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader title="New message" subtitle="Emails and texts go out to each customer, with their name filled in." />
          <form onSubmit={submit} className="space-y-4 p-5 sm:p-6">
            <div role="radiogroup" aria-label="Channel" className="grid grid-cols-3 gap-2">
              {CHANNELS.map((c) => (
                <button key={c.id} type="button" role="radio" aria-checked={channel === c.id} onClick={() => setChannel(c.id)} className={`rounded-xl border p-3 text-left ${channel === c.id ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10" : "border-gray-200 dark:border-gray-700"}`}>
                  <span className="block text-theme-sm font-medium text-gray-800 dark:text-white/90">{c.label}</span>
                  <span className="hidden text-theme-xs text-gray-500 sm:block">{c.hint}</span>
                </button>
              ))}
            </div>
            <Field label="Send to">
              <select value={audience} onChange={(e) => setAudience(e.target.value)} className={inputCls}>
                <option value="all">All customers</option>
                {data.groups.map((g) => <option key={g.id} value={g.id}>{g.name} ({g.memberCount})</option>)}
              </select>
            </Field>
            {reach && (
              <p className="-mt-2 text-theme-xs text-gray-500" aria-live="polite">
                Will reach <strong className="text-gray-700 dark:text-gray-300">{reach.count}</strong> {reach.count === 1 ? "customer" : "customers"}
                {reach.skipped > 0 && ` (${reach.skipped} skipped: no ${channel === "email" ? "email address" : "phone number"})`}.
              </p>
            )}
            {channel === "sms" && credits.data && (
              <p className="-mt-2 text-theme-xs text-gray-500">
                SMS credits this month:{" "}
                <strong className="text-gray-700 dark:text-gray-300">
                  {credits.data.limit === -1 ? `${credits.data.used} used (unlimited)` : `${credits.data.used} / ${credits.data.limit} (${credits.data.remaining} left)`}
                </strong>
              </p>
            )}
            {channel === "email" && (
              <Field label="Subject"><input value={subject} onChange={(e) => setSubject(e.target.value)} className={inputCls} placeholder="What's this about?" /></Field>
            )}
            <Field label="Message">
              <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} className={`${inputCls} h-auto py-3`} />
            </Field>
            <p className="-mt-2 text-theme-xs text-gray-500">
              Personalise with <code>{"{{first_name}}"}</code> and <code>{"{{store}}"}</code>.
              {channel === "sms" && ` ${body.length}/480`}
            </p>
            <div className="rounded-xl bg-gray-50 p-4 dark:bg-white/5">
              <p className="mb-1 text-theme-xs font-medium uppercase tracking-wide text-gray-400">Preview</p>
              {channel === "email" && subject && <p className="text-theme-sm font-semibold text-gray-800 dark:text-white/90">{subject}</p>}
              <p className="whitespace-pre-wrap break-words text-theme-sm text-gray-700 dark:text-gray-300">{preview}</p>
            </div>
            {formError && <ErrorNote message={formError} />}
            {sent && <p role="status" className="text-theme-sm font-medium text-success-600">{sent}</p>}
            <PrimaryButton busy={sending}>Send message</PrimaryButton>
          </form>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader title="Sent messages" />
          {data.messages.length === 0 ? (
            <EmptyState title="Nothing sent yet" body="Messages you send appear here." />
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {data.messages.map((m) => (
                <li key={m.id} className="px-5 py-4 sm:px-6">
                  <div className="flex items-center justify-between gap-3 text-theme-xs text-gray-500">
                    <span className="font-medium text-gray-700 dark:text-gray-300">{CHANNEL_LABEL[m.channel]} · {m.audienceLabel}</span>
                    <span>{relativeTime(m.sentAt)}</span>
                  </div>
                  {m.subject && <p className="mt-1 text-theme-sm font-semibold text-gray-800 dark:text-white/90">{m.subject}</p>}
                  <p className="mt-0.5 line-clamp-2 break-words text-theme-sm text-gray-600 dark:text-gray-400">{m.body}</p>
                  <p className="mt-1 text-theme-xs text-gray-400">{m.recipientCount} recipients{m.delivered + m.failed > 0 ? ` · ${m.delivered} sent${m.failed ? `, ${m.failed} failed` : ""}` : " · sending…"}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
