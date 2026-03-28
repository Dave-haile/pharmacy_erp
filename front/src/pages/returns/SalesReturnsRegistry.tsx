import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import DataTable, { Column } from "../../components/DataTable";
import { useToast } from "../../hooks/useToast";
import { fetchSalesReturns } from "../../services/salesReturns";
import type { SalesReturnSummary } from "../../types/types";
import {
  DocumentHeader,
  DocumentPage,
  documentPrimaryButtonClassName,
} from "../../components/common/DocumentUI";

const SalesReturnsRegistry: React.FC = () => {
  const navigate = useNavigate();
  const { showError } = useToast();
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["sales-returns", currentPage, pageSize],
    queryFn: () => fetchSalesReturns(currentPage, pageSize),
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (!error) return;
    showError("Failed to load sales returns.");
  }, [error, showError]);

  const rows = useMemo(() => data?.results || [], [data?.results]);

  const columns: Column<SalesReturnSummary>[] = [
    {
      header: "Posting No",
      render: (row) => (
        <span className="rounded bg-slate-50 px-2 py-1 text-[10px] font-mono font-bold text-slate-700 dark:bg-slate-900/40 dark:text-slate-200">
          {row.posting_number}
        </span>
      ),
    },
    {
      header: "Customer / Ref",
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-[11px] font-black text-slate-800 dark:text-slate-200">
            {row.customer_name || "Walk-in"}
          </span>
          <span className="text-[9px] font-mono text-slate-500">
            {row.reference_invoice || "No reference"}
          </span>
        </div>
      ),
    },
    {
      header: "Status",
      render: (row) => (
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">
          {row.status}
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
      <DocumentHeader
        title="Customer Returns"
        subtitle="Restock sellable batches from customer returns."
        actions={
          <button
            type="button"
            onClick={() => navigate("/inventory/sales-returns/new")}
            className={documentPrimaryButtonClassName}
          >
            New Return
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        isRefreshing={isFetching && rows.length > 0}
        onRefresh={() => refetch()}
        onRowClick={(row) =>
          navigate(`/inventory/sales-returns/${row.id}`, { state: { returnId: row.id } })
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

export default SalesReturnsRegistry;

