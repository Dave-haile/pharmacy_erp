import React, { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import DataTable, { Column } from "../../components/DataTable";
import type { Log } from "../../types/types";
import { useToast } from "../../hooks/useToast";
import { fetchAuditLogs } from "../../services/auditLogs";
import {
  DocumentHeader,
  DocumentPage,
  documentInputClassName,
} from "../../components/common/DocumentUI";

const prettifyKey = (key: string) =>
  key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatDetailValue = (value: unknown): string => {
  if (value === null || value === undefined) return "N/A";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return value.toLocaleString();
  if (typeof value === "string") return value || "N/A";
  if (Array.isArray(value)) return `${value.length} item${value.length === 1 ? "" : "s"}`;
  return "View details";
};

const parseDetailPairs = (details: string): Array<{ label: string; value: string }> => {
  try {
    const parsed = JSON.parse(details) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return [];

    return Object.entries(parsed)
      .slice(0, 5)
      .map(([key, value]) => ({
        label: prettifyKey(key),
        value: formatDetailValue(value),
      }));
  } catch {
    return [];
  }
};

const AuditLogs: React.FC = () => {
  const { showError } = useToast();
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({ q: "", action: "", user: "" });
  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedFilters(filters), 300);
    return () => clearTimeout(timer);
  }, [filters]);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["audit-logs", currentPage, pageSize, debouncedFilters],
    queryFn: () =>
      fetchAuditLogs({
        page: currentPage,
        page_size: pageSize,
        ...debouncedFilters,
      }),
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (!error) return;
    showError("Failed to load audit logs.");
  }, [error, showError]);

  const rows = useMemo(() => data?.results || [], [data?.results]);

  const columns: Column<Log>[] = [
    {
      header: "Timestamp",
      render: (log) => (
        <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
          {new Date(log.timestamp).toLocaleString()}
        </span>
      ),
      className: "whitespace-nowrap",
    },
    {
      header: "Action",
      render: (log) => (
        <span className="inline-flex items-center rounded-full border border-slate-300/70 bg-slate-100/80 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-slate-700 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200">
          {log.action}
        </span>
      ),
      className: "whitespace-nowrap",
    },
    {
      header: "User",
      render: (log) => (
        <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
          {log.username || `User #${log.user_id}`}
        </span>
      ),
      className: "whitespace-nowrap",
    },
    {
      header: "Details",
      render: (log) => {
        const detailPairs = parseDetailPairs(log.details);
        if (detailPairs.length > 0) {
          const totalDetails = (() => {
            try {
              const parsed = JSON.parse(log.details) as unknown;
              if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return detailPairs.length;
              return Object.keys(parsed).length;
            } catch {
              return detailPairs.length;
            }
          })();

          return (
            <div className="flex flex-wrap items-center gap-1.5">
              {detailPairs.map((pair) => (
                <span
                  key={`${log.log_id}-${pair.label}`}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] dark:border-slate-700 dark:bg-slate-800/50"
                >
                  <span className="font-semibold text-slate-500 dark:text-slate-400">
                    {pair.label}:
                  </span>
                  <span className="font-medium text-slate-700 dark:text-slate-200">
                    {pair.value}
                  </span>
                </span>
              ))}
              {totalDetails > detailPairs.length && (
                <span className="inline-flex items-center rounded-md border border-dashed border-slate-300 px-2 py-1 text-[10px] font-medium text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  +{totalDetails - detailPairs.length} more
                </span>
              )}
            </div>
          );
        }

        return (
          <span className="text-[11px] text-slate-600 dark:text-slate-400">
            {log.details || "No details"}
          </span>
        );
      },
      className: "max-w-[640px]",
    },
  ];

  return (
    <DocumentPage>
      <DocumentHeader
        title="Audit Logs"
        description="System activity logs across inventory documents and masters."
      />

      <DataTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        isRefreshing={isFetching && rows.length > 0}
        onRefresh={() => refetch()}
        emptyMessage="No audit log records found"
        loadingMessage="Loading audit logs..."
        filters={
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              value={filters.q}
              onChange={(e) => {
                setFilters((p) => ({ ...p, q: e.target.value }));
                setCurrentPage(1);
              }}
              placeholder="Search action/details..."
              className={documentInputClassName}
            />
            <input
              value={filters.action}
              onChange={(e) => {
                setFilters((p) => ({ ...p, action: e.target.value }));
                setCurrentPage(1);
              }}
              placeholder="Action contains..."
              className={documentInputClassName}
            />
            <input
              value={filters.user}
              onChange={(e) => {
                setFilters((p) => ({ ...p, user: e.target.value }));
                setCurrentPage(1);
              }}
              placeholder="User contains..."
              className={documentInputClassName}
            />
          </div>
        }
        footer={
          <div className="flex items-center justify-end gap-2 px-4 py-3">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-800 dark:bg-slate-900"
            >
              {[10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}/page
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!data?.has_previous}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-bold dark:border-slate-800 dark:bg-slate-900 disabled:opacity-50"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={!data?.has_next}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-bold dark:border-slate-800 dark:bg-slate-900 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        }
      />
    </DocumentPage>
  );
};

export default AuditLogs;

