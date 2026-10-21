"use client";
import React, { useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import Pagination from "@/components/tables/Pagination";
import { Card, EmptyState } from "./Card";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number;
  className?: string;
}

export interface FilterOption {
  label: string;
  value: string;
}

interface Props<T> {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  searchText?: (row: T) => string;
  searchPlaceholder?: string;
  filter?: { label: string; options: FilterOption[]; match: (row: T, value: string) => boolean };
  pageSize?: number;
  onRowClick?: (row: T) => void;
  toolbar?: React.ReactNode;
  emptyTitle?: string;
  emptyBody?: string;
}

export default function DataTable<T>({
  rows,
  columns,
  rowKey,
  searchText,
  searchPlaceholder = "Search…",
  filter,
  pageSize = 10,
  onRowClick,
  toolbar,
  emptyTitle = "Nothing here yet",
  emptyBody,
}: Props<T>) {
  // a link like /orders?q=ada opens the table already filtered (the admin search sends people here)
  const [query, setQuery] = useState(() => (typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("q") ?? ""));
  const [filterValue, setFilterValue] = useState("all");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);

  const processed = useMemo(() => {
    let out = rows;
    if (query && searchText) {
      const q = query.toLowerCase();
      out = out.filter((r) => searchText(r).toLowerCase().includes(q));
    }
    if (filter && filterValue !== "all") out = out.filter((r) => filter.match(r, filterValue));
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col?.sortValue) {
        out = [...out].sort((a, b) => {
          const av = col.sortValue!(a);
          const bv = col.sortValue!(b);
          return (av > bv ? 1 : av < bv ? -1 : 0) * sort.dir;
        });
      }
    }
    return out;
  }, [rows, query, filterValue, sort, searchText, filter, columns]);

  const totalPages = Math.max(1, Math.ceil(processed.length / pageSize));
  const current = Math.min(page, totalPages);
  const visible = processed.slice((current - 1) * pageSize, current * pageSize);

  const inputCls =
    "h-10 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

  return (
    <Card className="overflow-hidden">
      {(searchText || filter || toolbar) && (
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 p-4 dark:border-gray-800">
          {searchText && (
            <input
              aria-label="Search"
              className={`${inputCls} w-full sm:w-64`}
              placeholder={searchPlaceholder}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
          )}
          {filter && (
            <select
              aria-label={filter.label}
              className={inputCls}
              value={filterValue}
              onChange={(e) => {
                setFilterValue(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">{filter.label}: All</option>
              {filter.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          )}
          <div className="ml-auto flex items-center gap-2">{toolbar}</div>
        </div>
      )}

      {visible.length === 0 ? (
        <EmptyState title={emptyTitle} body={processed.length === 0 && rows.length > 0 ? "No results match your filters." : emptyBody} />
      ) : (
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
              <TableRow>
                {columns.map((c) => (
                  <TableCell
                    key={c.key}
                    isHeader
                    className={`px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap ${c.className ?? ""}`}
                  >
                    {c.sortValue ? (
                      <button
                        className="inline-flex items-center gap-1 hover:text-gray-800 dark:hover:text-gray-200"
                        onClick={() =>
                          setSort((s) => (s?.key === c.key ? (s.dir === 1 ? { key: c.key, dir: -1 } : null) : { key: c.key, dir: 1 }))
                        }
                      >
                        {c.header}
                        <span className="text-[10px]">{sort?.key === c.key ? (sort.dir === 1 ? "▲" : "▼") : "↕"}</span>
                      </button>
                    ) : (
                      c.header
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {visible.map((row) => (
                <TableRow
                  key={rowKey(row)}
                  className={onRowClick ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.02]" : ""}
                >
                  {columns.map((c) => (
                    <TableCell
                      key={c.key}
                      className={`px-5 py-3.5 text-theme-sm text-gray-600 dark:text-gray-400 ${c.className ?? ""}`}
                    >
                      {onRowClick ? (
                        <div onClick={() => onRowClick(row)}>{c.render(row)}</div>
                      ) : (
                        c.render(row)
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-5 py-3 dark:border-gray-800">
        <p className="text-theme-sm text-gray-500 dark:text-gray-400">
          {processed.length} {processed.length === 1 ? "result" : "results"}
        </p>
        {totalPages > 1 && <Pagination currentPage={current} totalPages={totalPages} onPageChange={setPage} />}
      </div>
    </Card>
  );
}
