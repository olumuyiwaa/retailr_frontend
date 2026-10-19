// HTTP client for the Retailr API. One place for the base URL, the session tokens, refresh-and-retry and error messages.

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1").replace(/\/$/, "");

/** An error from the API (or from reaching it). `message` is written for the user. */
export class ApiError extends Error {
  constructor(message: string, readonly status = 0, readonly code = "") {
    super(message);
    this.name = "ApiError";
  }
}

const TOKENS_KEY = "retailr:tokens";
type Tokens = { access: string; refresh: string };

let memory: Tokens | null = null;

export function getTokens(): Tokens | null {
  if (memory) return memory;
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(TOKENS_KEY);
    if (raw) memory = JSON.parse(raw) as Tokens;
  } catch { /* storage blocked: stay signed out */ }
  return memory;
}

export function setTokens(t: Tokens | null) {
  memory = t;
  if (typeof window === "undefined") return;
  try {
    if (t) window.localStorage.setItem(TOKENS_KEY, JSON.stringify(t));
    else window.localStorage.removeItem(TOKENS_KEY);
  } catch { /* ignore */ }
}

/** Fired when the session can't be renewed, so the app can send the person to the login page. */
export const SIGNED_OUT_EVENT = "retailr:signed-out";

type Query = Record<string, string | number | boolean | undefined | null>;
export interface RequestOptions {
  body?: unknown;
  query?: Query;
  /** Send the access token (default true). Public endpoints can still pass it, e.g. for business-restricted codes. */
  auth?: boolean;
}

const url = (path: string, query?: Query) => {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(query ?? {})) if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
  const s = q.toString();
  return `${API_URL}${path}${s ? `?${s}` : ""}`;
};

let refreshing: Promise<boolean> | null = null;
/** One refresh at a time, however many requests hit a 401 together (the refresh token rotates, so a second call would fail). */
function refresh(): Promise<boolean> {
  refreshing ??= (async () => {
    const t = getTokens();
    if (!t) return false;
    try {
      const res = await fetch(url("/auth/refresh"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refreshToken: t.refresh }) });
      if (!res.ok) return false;
      const j = await res.json();
      setTokens({ access: j.accessToken, refresh: j.refreshToken });
      return true;
    } catch {
      return false;
    }
  })().finally(() => { refreshing = null; });
  return refreshing;
}

async function send(method: string, path: string, o: RequestOptions, retry: boolean): Promise<{ data: unknown; headers: Headers }> {
  const headers: Record<string, string> = {};
  const t = o.auth === false ? null : getTokens();
  if (t) headers.Authorization = `Bearer ${t.access}`;
  if (o.body !== undefined) headers["Content-Type"] = "application/json";
  let res: Response;
  try {
    res = await fetch(url(path, o.query), { method, headers, body: o.body === undefined ? undefined : JSON.stringify(o.body) });
  } catch {
    throw new ApiError("We couldn't reach the server. Check your connection and try again.");
  }
  if (res.status === 401 && t && retry && !path.startsWith("/auth/")) {
    if (await refresh()) return send(method, path, o, false);
    setTokens(null);
    if (typeof window !== "undefined") window.dispatchEvent(new Event(SIGNED_OUT_EVENT));
  }
  if (res.status === 204) return { data: undefined, headers: res.headers };
  const text = await res.text();
  let data: unknown = undefined;
  try { data = text ? JSON.parse(text) : undefined; } catch { /* not JSON */ }
  if (!res.ok) {
    const e = (data ?? {}) as { message?: string | string[]; code?: string };
    const message = Array.isArray(e.message) ? e.message[0] : e.message;
    throw new ApiError(message || "Something went wrong. Please try again.", res.status, e.code ?? "");
  }
  return { data, headers: res.headers };
}

export const api = {
  get: async <T,>(path: string, query?: Query, o: Omit<RequestOptions, "query" | "body"> = {}) => (await send("GET", path, { ...o, query }, true)).data as T,
  post: async <T,>(path: string, body?: unknown, o: Omit<RequestOptions, "body"> = {}) => (await send("POST", path, { ...o, body: body ?? {} }, true)).data as T,
  put: async <T,>(path: string, body?: unknown) => (await send("PUT", path, { body: body ?? {} }, true)).data as T,
  patch: async <T,>(path: string, body?: unknown) => (await send("PATCH", path, { body: body ?? {} }, true)).data as T,
  del: async <T = void,>(path: string) => (await send("DELETE", path, {}, true)).data as T,
  /** A list endpoint: the page of items plus the total across all pages (X-Total-Count). */
  list: async <T,>(path: string, query?: Query) => {
    const r = await send("GET", path, { query }, true);
    const items = (r.data ?? []) as T[];
    return { items, total: Number(r.headers.get("X-Total-Count") ?? items.length) };
  },
};

/** Fetches every page of a list endpoint (for screens that show everything at once). */
export async function listAll<T>(path: string, query: Query = {}, pageSize = 200, maxPages = 25): Promise<T[]> {
  const out: T[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const { items, total } = await api.list<T>(path, { ...query, page, limit: pageSize });
    out.push(...items);
    if (out.length >= total || items.length < pageSize) break;
  }
  return out;
}
