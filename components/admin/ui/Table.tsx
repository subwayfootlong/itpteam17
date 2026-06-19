"use client";

import React, { useState, useMemo } from 'react';

// ─── TableWrapper ─────────────────────────────────────────────────────────────
// Handles optional built-in pagination.
// When `data` + `renderRow` are provided it owns pagination state.
// Otherwise children are rendered directly (legacy usage still works).

interface TableWrapperProps<T> {
  children?: React.ReactNode;
  /** Provide a flat data array to enable built-in pagination */
  data?: T[];
  /** Render function for each paginated item */
  renderRow?: (item: T, index: number) => React.ReactNode;
  /** Column count used to render loading skeletons */
  colCount?: number;
  loading?: boolean;
  emptyState?: React.ReactNode;
  defaultPageSize?: number;
}

export function TableWrapper<T>({
  children,
  data,
  renderRow,
  colCount = 6,
  loading = false,
  emptyState,
  defaultPageSize = 10,
}: TableWrapperProps<T>) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const usePagination = data !== undefined && renderRow !== undefined;

  const totalItems = data?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);

  const pagedData = useMemo(() => {
    if (!usePagination) return [] as T[];
    const start = (safePage - 1) * pageSize;
    return data!.slice(start, start + pageSize);
  }, [data, safePage, pageSize, usePagination]);

  // When data changes (e.g. filter), reset to page 1 if we overshoot
  React.useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value));
    setPage(1);
  };

  const paginationBar = usePagination && !loading && totalItems > 0 && (
    <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/40 text-[12px] text-gray-500 font-helvetica">
      {/* Left: range + per-page selector */}
      <div className="flex items-center gap-3">
        <span>
          {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, totalItems)}{' '}
          of {totalItems}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-400">Rows:</span>
          <select
            value={pageSize}
            onChange={handlePageSizeChange}
            className="h-7 px-2 rounded border border-gray-200 bg-white text-[12px] text-gray-700 outline-none focus:border-[#3FAE2A] cursor-pointer"
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Right: page navigation */}
      <div className="flex items-center gap-1">
        {/* First */}
        <button
          onClick={() => setPage(1)}
          disabled={safePage === 1}
          className="w-7 h-7 flex items-center justify-center rounded border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="First page"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 19l-7-7 7-7M18 19l-7-7 7-7" />
          </svg>
        </button>
        {/* Prev */}
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={safePage === 1}
          className="w-7 h-7 flex items-center justify-center rounded border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Previous page"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Page pills */}
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
          .reduce<(number | '...')[]>((acc, p, idx, arr) => {
            if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...');
            acc.push(p);
            return acc;
          }, [])
          .map((p, i) =>
            p === '...' ? (
              <span key={`el-${i}`} className="px-1 text-gray-400">…</span>
            ) : (
              <button
                key={p}
                onClick={() => setPage(p as number)}
                className={`w-7 h-7 flex items-center justify-center rounded border text-[12px] font-medium transition-colors ${
                  safePage === p
                    ? 'border-[#3FAE2A] bg-[#3FAE2A] text-white'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {p}
              </button>
            )
          )}

        {/* Next */}
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={safePage === totalPages}
          className="w-7 h-7 flex items-center justify-center rounded border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Next page"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        {/* Last */}
        <button
          onClick={() => setPage(totalPages)}
          disabled={safePage === totalPages}
          className="w-7 h-7 flex items-center justify-center rounded border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Last page"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 5l7 7-7 7M6 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left font-helvetica">
          {usePagination ? (
            <>
              {/* thead is passed as children when using pagination mode */}
              {children}
              <tbody className="divide-y divide-gray-100 text-[13px]">
                {loading ? (
                  [...Array(5)].map((_, rowIndex) => (
                    <tr key={rowIndex}>
                      {[...Array(colCount)].map((_, cellIndex) => (
                        <td key={cellIndex} className="px-5 py-4">
                          <div className="h-3 bg-gray-100 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : pagedData.length === 0 && emptyState ? (
                  <tr>
                    <td colSpan={colCount} className="py-12 text-center text-gray-500">
                      {emptyState}
                    </td>
                  </tr>
                ) : (
                  pagedData.map((item, i) => renderRow!(item, i))
                )}
              </tbody>
            </>
          ) : (
            children
          )}
        </table>
      </div>
      {paginationBar}
    </div>
  );
}

// ─── TableHead ────────────────────────────────────────────────────────────────

export function TableHead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">
      <tr className="border-b border-gray-100">{children}</tr>
    </thead>
  );
}

// ─── TableHeader (sortable) ───────────────────────────────────────────────────

export interface SortState {
  key: string;
  dir: 'asc' | 'desc';
}

interface TableHeaderProps {
  children?: React.ReactNode;
  className?: string;
  /** Column sort key. When provided the header becomes clickable. */
  sortKey?: string;
  sortState?: SortState | null;
  onSort?: (key: string) => void;
}

export function TableHeader({
  children,
  className = '',
  sortKey,
  sortState,
  onSort,
}: TableHeaderProps) {
  const isSorted = sortKey && sortState?.key === sortKey;
  const isAsc = isSorted && sortState?.dir === 'asc';

  return (
    <th
      className={`px-5 py-3 font-semibold whitespace-nowrap ${
        sortKey ? 'cursor-pointer select-none group hover:text-gray-600 transition-colors' : ''
      } ${className}`}
      onClick={sortKey && onSort ? () => onSort(sortKey) : undefined}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {sortKey && (
          <span className="inline-flex flex-col gap-[1px] ml-0.5">
            <svg
              className={`w-2.5 h-2.5 -mb-[1px] transition-colors ${
                isSorted && isAsc ? 'text-[#3FAE2A]' : 'text-gray-300 group-hover:text-gray-400'
              }`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 15l7-7 7 7" />
            </svg>
            <svg
              className={`w-2.5 h-2.5 transition-colors ${
                isSorted && !isAsc ? 'text-[#3FAE2A]' : 'text-gray-300 group-hover:text-gray-400'
              }`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        )}
      </span>
    </th>
  );
}

// ─── TableBody ────────────────────────────────────────────────────────────────

export function TableBody({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <tbody className={`divide-y divide-gray-100 text-[13px] ${className}`}>
      {children}
    </tbody>
  );
}

// ─── TableRow ─────────────────────────────────────────────────────────────────
// `accentColor`: CSS color string → renders a 3px left-border strip
// (replaces the old standalone status dot column)

export function TableRow({
  children,
  className = '',
  accentColor,
}: {
  children: React.ReactNode;
  className?: string;
  /** Left-border accent colour. Replaces the old separate status-dot cell. */
  accentColor?: string;
}) {
  return (
    <tr
      className={`hover:bg-gray-50/60 transition-colors ${className}`}
      style={{
        borderLeft: accentColor ? `3px solid ${accentColor}` : '3px solid transparent',
      }}
    >
      {children}
    </tr>
  );
}

// ─── TableCell ────────────────────────────────────────────────────────────────

export function TableCell({
  children,
  className = '',
  colSpan,
  style,
}: {
  children?: React.ReactNode;
  className?: string;
  colSpan?: number;
  style?: React.CSSProperties;
}) {
  return (
    <td className={`px-5 py-4 ${className}`} colSpan={colSpan} style={style}>
      {children}
    </td>
  );
}

// ─── useSortState ─────────────────────────────────────────────────────────────
// Convenience hook: manages sort state and provides a sortData helper.

export function useSortState(defaultKey?: string, defaultDir: 'asc' | 'desc' = 'asc') {
  const [sortState, setSortState] = useState<SortState | null>(
    defaultKey ? { key: defaultKey, dir: defaultDir } : null
  );

  const handleSort = (key: string) => {
    setSortState((prev) => {
      if (prev?.key === key) return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' };
      return { key, dir: 'asc' };
    });
  };

  function sortData<T>(
    data: T[],
    getValue: (item: T, key: string) => string | number | null | undefined
  ): T[] {
    if (!sortState) return data;
    const { key, dir } = sortState;
    return [...data].sort((a, b) => {
      const av = getValue(a, key) ?? '';
      const bv = getValue(b, key) ?? '';
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return dir === 'asc' ? cmp : -cmp;
    });
  }

  return { sortState, handleSort, sortData };
}
