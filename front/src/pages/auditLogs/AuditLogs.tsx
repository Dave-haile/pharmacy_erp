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
        <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300">
          {new Date(log.timestamp).toLocaleString()}
        </span>
      ),
    },
    {
      header: "Action",
      render: (log) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border bg-slate-500/10 text-slate-700 border-slate-500/20 dark:text-slate-200 dark:border-slate-700">
          {log.action}
        </span>
      ),
    },
    {
      header: "User",
      render: (log) => (
        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
          {log.username || `User #${log.user_id}`}
        </span>
      ),
    },
    {
      header: "Details",
      render: (log) => (
        <span className="text-[10px] text-slate-600 dark:text-slate-400">
          {log.details}
        </span>
      ),
      className: "max-w-[520px] truncate",
    },
  ];

  return (
    <DocumentPage>
      <DocumentHeader
        title="Audit Logs"
        subtitle="System activity logs across inventory documents and masters."
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

