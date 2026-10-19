"use client";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { AuthUser, Role } from "@/types/saas";
import * as authService from "@/services/auth";
import type { RegisterPayload } from "@/services/auth";
import { getTokens, SIGNED_OUT_EVENT } from "@/lib/api";

const STORAGE_KEY = "retailr:user";

interface AuthContextValue {
  user: AuthUser | null;
  ready: boolean; // false until localStorage has been read
  signIn: (email: string, password: string) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<AuthUser>;
  signOut: () => void;
  adopt: (u: AuthUser) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const homeFor = (role: Role) =>
  role === "super_admin" ? "/admin/super" : "/admin/business";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    try {
      // a session needs tokens; the saved user only lets the page render straight away
      const raw = getTokens() ? localStorage.getItem(STORAGE_KEY) : null;
      if (raw) setUser(JSON.parse(raw));
    } catch {
      /* storage unavailable — stay signed out */
    }
    setReady(true);
    // check with the server in the background: a suspended business or an ended session signs out here
    if (getTokens()) {
      authService.currentUser().then((u) => {
        if (cancelled) return;
        if (u) persist(u);
        else if (!getTokens()) persist(null);
      });
    }
    const out = () => persist(null);
    window.addEventListener(SIGNED_OUT_EVENT, out);
    return () => { cancelled = true; window.removeEventListener(SIGNED_OUT_EVENT, out); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = (u: AuthUser | null) => {
    setUser(u);
    try {
      if (u) localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  const signIn = useCallback(async (email: string, password: string) => {
    const u = await authService.login(email, password);
    persist(u);
    return u;
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const u = await authService.registerBusiness(payload);
    persist(u);
    return u;
  }, []);

  const signOut = useCallback(() => {
    persist(null);
    void authService.logout();
  }, []);

  /** For flows that create their own session (accepting an invite). */
  const adopt = useCallback((u: AuthUser) => persist(u), []);

  return (
    <AuthContext.Provider value={{ user, ready, signIn, register, signOut, adopt }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
