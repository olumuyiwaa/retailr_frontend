"use client";
import React, { lazy, Suspense, useMemo } from "react";
import { useStore } from "@/app/context/StoreContext";
import { getTheme } from "./registry";
import classic from "./classic";
import type { StoreTheme, ThemePage, ThemePageProps } from "./types";

type AnyLoader = () => Promise<{ default: React.ComponentType<any> }>;
const cache = new Map<string, React.LazyExoticComponent<React.ComponentType<any>>>();

function load(key: string, loader: AnyLoader) {
  let c = cache.get(key);
  if (!c) {
    c = lazy(loader);
    cache.set(key, c);
  }
  return c;
}

/** The theme's own loader for a slot, or the default theme's when it doesn't provide one. */
export function resolveSlot(theme: StoreTheme, slot: "header" | "footer" | ThemePage) {
  const own = slot === "header" || slot === "footer" ? theme[slot] : theme.pages[slot];
  if (own) return load(`${theme.id}:${slot}`, own as AnyLoader);
  const base = slot === "header" || slot === "footer" ? classic[slot] : classic.pages[slot];
  return load(`${classic.id}:${slot}`, base as AnyLoader);
}

export function useActiveTheme(): StoreTheme {
  const ctx = useStore();
  return getTheme(ctx?.store?.theme);
}

const Fallback = () => <div className="min-h-[50vh]" aria-busy="true" />;

/** Renders one storefront page in whichever theme the store has chosen. */
export function ThemedPage<K extends ThemePage>({ page, ...props }: { page: K } & ThemePageProps[K]) {
  const theme = useActiveTheme();
  const Page = useMemo(() => resolveSlot(theme, page), [theme, page]);
  return (
    <Suspense fallback={<Fallback />}>
      <Page {...props} />
    </Suspense>
  );
}

/** Header / footer slots. */
export function ThemedChrome({ slot, fallback = null }: { slot: "header" | "footer"; fallback?: React.ReactNode }) {
  const ctx = useStore();
  const theme = useActiveTheme();
  const C = useMemo(() => resolveSlot(theme, slot), [theme, slot]);
  // Until the store (and so its theme) is known, don't download the default theme's chrome only to swap it out.
  if (!ctx?.store) return <>{fallback}</>;
  return (
    <Suspense fallback={fallback}>
      <C />
    </Suspense>
  );
}
