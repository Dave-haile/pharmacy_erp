import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import DataTable, { Column } from "../../components/DataTable";
import { useToast } from "../../hooks/useToast";
import { fetchPurchases } from "../../services/purchases";
import type { PurchaseSummary } from "../../types/types";
import { DocumentHeader, DocumentPage } from "../../components/common/DocumentUI";

const PurchasesRegistry: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showError } = useToast();
  const [pageSize, setPageSize] = useState(10);

  // Initialize currentPage from URL query params
  const [currentPage, setCurrentPage] = useState(() => {
    const pageParam = searchParams.get("page");
    return pageParam ? parseInt(pageParam, 10) : 1;
  });

  // Update URL when page changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (currentPage > 1) params.set("page", String(currentPage));
    setSearchParams(params, { replace: true });
  }, [currentPage, setSearchParams]);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["purchases", currentPage, pageSize],
    queryFn: () => fetchPurchases(currentPage, pageSize),
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (!error) return;
    showError("Failed to load purchases.");
  }, [error, showError]);

  const rows = useMemo(() => data?.results || [], [data?.results]);

  const columns: Column<PurchaseSummary>[] = [
    {
      header: "Purchase",
      render: (row) => (
        <span className="rounded bg-slate-50 px-2 py-1 text-[10px] font-mono font-bold text-slate-700 dark:bg-slate-900/40 dark:text-slate-200">
          #{row.id}
        </span>
      ),
    },
    {
      header: "Supplier",
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-[11px] font-black text-slate-800 dark:text-slate-200">
            {row.supplier}
          </span>
          <span className="text-[9px] font-mono text-slate-500">{row.status}</span>
        </div>
      ),
    },
    {
      header: "Grand Total",
      render: (row) => (
        <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-400">
          {row.grand_total}
        </span>
      ),
    },
    {
      header: "Created",
      render: (row) => (
        <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300">
          {new Date(row.created_at).toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <DocumentPage>
      <DocumentHeader title="Purchases" subtitle="Purchases created from stock entries." />
      <DataTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        isRefreshing={isFetching && rows.length > 0}
        onRefresh={() => refetch()}
        onRowClick={(row) =>
          navigate(`/inventory/purchases/${row.id}`, { state: { purchaseId: row.id } })
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
              {[10, 20, 50].map((size) => (
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

export default PurchasesRegistry;

