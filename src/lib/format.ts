export const money = (n: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: n % 1 === 0 ? 0 : 2,
  }).format(n);

export const compact = (n: number) =>
  new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);

/** Short axis labels for charts: 999 → 999, 1000 → 1k, 1500 → 1.5k, 1e6 → 1m. */
export function compactAxis(n: number): string {
  const v = Math.abs(n);
  const sign = n < 0 ? "−" : "";
  if (v < 1000) return sign + String(Math.round(v));
  if (v < 1_000_000) {
    const k = v / 1000;
    const s = k >= 100 || Number.isInteger(k) ? String(Math.round(k)) : k.toFixed(1).replace(/\.0$/, "");
    return sign + s + "k";
  }
  if (v < 1_000_000_000) {
    const m = v / 1_000_000;
    const s = m >= 100 || Number.isInteger(m) ? String(Math.round(m)) : m.toFixed(1).replace(/\.0$/, "");
    return sign + s + "m";
  }
  const b = v / 1_000_000_000;
  const s = b >= 100 || Number.isInteger(b) ? String(Math.round(b)) : b.toFixed(1).replace(/\.0$/, "");
  return sign + s + "b";
}

export const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export const monthLabel = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "short" });

export const relativeTime = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.round(months / 12)}y ago`;
};

export const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

export const pct = (n: number) => `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;
