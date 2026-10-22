"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useBizMoney } from "@/hooks/useBizMoney";
import { searchAll, type SearchResults } from "@/services/business";
import { navFor } from "./navConfig";

type Hit = { key: string; group: string; label: string; hint?: string; path: string; icon?: React.ComponentType<{ className?: string }> };

const MIN_CHARS = 2;
const ADMIN = "/admin/business";

/** The admin header's search box: jump to any page, or find an order, customer, product or service. */
export default function PageSearch({ inputRef }: { inputRef: React.RefObject<HTMLInputElement | null> }) {
  const { user } = useAuth();
  const router = useRouter();
  const fmt = useBizMoney();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [found, setFound] = useState<SearchResults | null>(null);
  const [searching, setSearching] = useState(false);

  const pages = useMemo(() => (user ? navFor(user.role, user.teamRole).flatMap((s) => s.items) : []), [user]);
  const term = q.trim();
  const lower = term.toLowerCase();
  const canSearchData = !!user?.businessId;

  // look up records once the person pauses typing; late answers for an older term are ignored
  useEffect(() => {
    if (!canSearchData || term.length < MIN_CHARS) { setFound(null); setSearching(false); return; }
    let stale = false;
    setSearching(true);
    const t = setTimeout(() => {
      searchAll(term)
        .then((r) => { if (!stale) setFound(r); })
        .catch(() => { if (!stale) setFound(null); })
        .finally(() => { if (!stale) setSearching(false); });
    }, 250);
    return () => { stale = true; clearTimeout(t); };
  }, [term, canSearchData]);

  const hits: Hit[] = useMemo(() => {
    const pageHits: Hit[] = (lower ? pages.filter((p) => p.name.toLowerCase().includes(lower)) : pages).map((p) => ({ key: `page:${p.path}`, group: "Pages", label: p.name, path: p.path, icon: p.icon }));
    if (!found || found.q !== term.slice(0, 80)) return pageHits;
    const to = (page: string) => `${ADMIN}/${page}?q=${encodeURIComponent(term)}`;
    return [
      ...found.orders.map((o) => ({ key: `o:${o.id}`, group: "Orders", label: `${o.number} · ${o.customerName}`, hint: `${fmt(o.total)} · ${o.status}`, path: to("orders") })),
      ...found.customers.map((c) => ({ key: `c:${c.id}`, group: "Customers", label: c.name, hint: c.email || c.phone || c.city || undefined, path: to("customers") })),
      ...found.products.map((p) => ({ key: `p:${p.id}`, group: "Products", label: p.name, hint: fmt(p.price), path: to("products") })),
      ...found.services.map((p) => ({ key: `s:${p.id}`, group: "Services", label: p.name, hint: `${p.durationMins ? `${p.durationMins} min · ` : ""}${fmt(p.price)}`, path: to("services") })),
      ...pageHits,
    ];
  }, [found, pages, lower, term, fmt]);

  const go = (path: string) => {
    setQ("");
    setFound(null);
    setOpen(false);
    inputRef.current?.blur();
    router.push(path);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, hits.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); if (hits[active]) go(hits[active].path); }
    else if (e.key === "Escape") { setOpen(false); inputRef.current?.blur(); }
  };

  return (
    <div className="relative" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}>
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
        <svg className="fill-gray-500 dark:fill-gray-400" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z"
          />
        </svg>
      </span>
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls="page-search-results"
        aria-label="Search orders, customers, products or jump to a page"
        autoComplete="off"
        value={q}
        onChange={(e) => { setQ(e.target.value); setActive(0); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={canSearchData ? "Search orders, customers, products…" : "Jump to a page..."}
        className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-12 pr-14 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[430px]"
      />
      <kbd className="pointer-events-none absolute right-2.5 top-1/2 inline-flex -translate-y-1/2 items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50 px-[7px] py-[4.5px] text-xs text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
        <span>⌘</span><span>K</span>
      </kbd>
      {open && (
        <ul id="page-search-results" role="listbox" className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-auto rounded-xl border border-gray-200 bg-white p-1.5 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900">
          {hits.length === 0 ? (
            <li className="px-3 py-3 text-sm text-gray-500">{searching ? "Searching…" : `Nothing matches “${term}”.`}</li>
          ) : (
            hits.map((h, i) => (
              <li key={h.key} role="option" aria-selected={i === active}>
                {(i === 0 || hits[i - 1].group !== h.group) && (
                  <p className="px-3 pb-1 pt-2 text-theme-xs font-medium uppercase tracking-wide text-gray-400">{h.group}</p>
                )}
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => go(h.path)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm ${i === active ? "bg-brand-50 text-brand-600 dark:bg-white/5 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}
                >
                  {h.icon && <h.icon className="h-5 w-5 shrink-0" />}
                  <span className="min-w-0 flex-1 truncate">{h.label}</span>
                  {h.hint && <span className="shrink-0 text-theme-xs text-gray-400">{h.hint}</span>}
                </button>
              </li>
            ))
          )}
          {searching && hits.length > 0 && <li className="px-3 py-2 text-theme-xs text-gray-400">Searching records…</li>}
        </ul>
      )}
    </div>
  );
}
