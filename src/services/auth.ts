import type { AuthUser } from "@/types/saas";
import { api, setTokens } from "@/lib/api";

interface Session { user: AuthUser; accessToken: string; refreshToken: string }
const start = (s: Session): AuthUser => { setTokens({ access: s.accessToken, refresh: s.refreshToken }); return s.user; };

export async function login(email: string, password: string): Promise<AuthUser> {
  return start(await api.post<Session>("/auth/login", { email: email.trim(), password }, { auth: false }));
}

export interface RegisterPayload {
  ownerName: string;
  email: string;
  password: string;
  businessName: string;
  category: string;
  country: string;
  city: string;
  phone: string;
  planId: string;
  cycle: "monthly" | "yearly";
  /** Optional platform discount code. */
  couponCode?: string;
}

export async function registerBusiness(p: RegisterPayload): Promise<AuthUser> {
  const body = { ...p, email: p.email.trim(), couponCode: p.couponCode?.trim() || undefined };
  return start(await api.post<Session>("/auth/register", body, { auth: false }));
}

export interface InvitePreview { name: string; email: string; role: string; businessName: string }
export const getInvite = (token: string) => api.get<InvitePreview>(`/auth/invite/${encodeURIComponent(token)}`, undefined, { auth: false });
export async function acceptInvite(token: string, password: string): Promise<AuthUser> {
  return start(await api.post<Session>("/auth/accept-invite", { token, password }, { auth: false }));
}

/** The signed-in user according to the server (null when the session has ended). */
export async function currentUser(): Promise<AuthUser | null> {
  try { return await api.get<AuthUser>("/auth/me"); } catch { return null; }
}

export async function logout(): Promise<void> {
  const { getTokens } = await import("@/lib/api");
  const t = getTokens();
  try { if (t) await api.post("/auth/logout", { refreshToken: t.refresh }); } catch { /* signing out locally anyway */ }
  setTokens(null);
}

/** Always succeeds from the caller's view, so the form never reveals which emails have accounts. */
export const forgotPassword = (email: string) => api.post("/auth/forgot-password", { email: email.trim() }, { auth: false });
export const resetPassword = (token: string, password: string) => api.post("/auth/reset-password", { token, password }, { auth: false });
export const verifyEmail = (token: string) => api.post("/auth/verify-email", { token }, { auth: false });
export const resendVerification = () => api.post("/auth/resend-verification");

/** Update the signed-in person's display name. */
export const updateMe = (name: string) => api.patch<import("@/types/saas").AuthUser>("/auth/me", { name: name.trim() });

/** Change password while signed in. All other sessions are signed out on the server. */
export const changePassword = (currentPassword: string, newPassword: string) =>
  api.post<void>("/auth/change-password", { currentPassword, newPassword });

/** Permanently delete the signed-in account (and the business if they are the owner). */
export const deleteAccount = (password: string) => api.post<void>("/auth/delete-account", { password });

