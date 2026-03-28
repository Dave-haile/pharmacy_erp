import React, { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import DataTable, { Column } from "../../components/DataTable";
import { useToast } from "../../hooks/useToast";
import { fetchStockLedger } from "../../services/stockLedger";
import type { StockLedgerEntry } from "../../types/types";
import {
  DocumentHeader,
  DocumentPage,
  DocumentSummaryCard,
} from "../../components/common/DocumentUI";

const typeLabel: Record<StockLedgerEntry["transaction_type"], string> = {
  purchase: "Purchase",
  sale: "Sale",
  return: "Return",
  adjustment: "Adjustment",
  damage: "Damage",
};

const StockLedgerPage: React.FC = () => {
  const { showError } = useToast();
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    q: "",
    reference: "",
    transaction_type: "",
    start_date: "",
    end_date: "",
  });
  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedFilters(filters), 300);
    return () => clearTimeout(timer);
  }, [filters]);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["stock-ledger", currentPage, pageSize, debouncedFilters],
    queryFn: () =>
      fetchStockLedger({
        page: currentPage,
        page_size: pageSize,
        ...debouncedFilters,
      }),
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (!error) return;
    const errorMessage =
      error &&
      typeof error === "object" &&
      "response" in error &&
      (error as { response?: { data?: { error?: string; message?: string } } })
        .response?.data
        ? (error as { response?: { data?: { error?: string; message?: string } } })
            .response?.data?.error ||
          (error as { response?: { data?: { error?: string; message?: string } } })
            .response?.data?.message
        : "Failed to load stock ledger.";
    showError(errorMessage || "Failed to load stock ledger.");
  }, [error, showError]);

  const rows = useMemo(() => data?.results || [], [data?.results]);
  const totalCount = data?.count || 0;
  const isTableRefreshing = isFetching && rows.length > 0;

  const columns: Column<StockLedgerEntry>[] = [
    {
      header: "Date",
      render: (row) => (
        <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300">
          {new Date(row.created_at).toLocaleString()}
        </span>
      ),
    },
    {
      header: "Type",
      render: (row) => (
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-200">
          {typeLabel[row.transaction_type] || row.transaction_type}
        </span>
      ),
    },
    {
      header: "Medicine / Batch",
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-[11px] font-black text-slate-800 dark:text-slate-200">
            {row.medicine_name || "—"}
          </span>
          <span className="text-[9px] font-mono font-bold text-slate-500">
            {row.batch_number || "No batch"}
          </span>
        </div>
      ),
    },
    {
      header: "Qty",
      render: (row) => (
        <span
          className={`text-[11px] font-black ${
            row.quantity < 0
              ? "text-rose-600 dark:text-rose-400"
              : "text-emerald-700 dark:text-emerald-400"
          }`}
        >
          {row.quantity}
        </span>
      ),
    },
    {
      header: "Unit",
      render: (row) => (
        <span className="text-[11px] font-black text-slate-700 dark:text-slate-300">
          {row.unit_price}
        </span>
      ),
    },
    {
      header: "Reference",
      render: (row) => (
        <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300">
          {row.reference_document}
        </span>
      ),
    },
    {
      header: "Notes",
      render: (row) => (
        <span className="text-[10px] text-slate-600 dark:text-slate-400">
          {row.notes}
        </span>
      ),
      className: "max-w-[420px] truncate",
    },
  ];

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  return (
    <DocumentPage>
      <DocumentHeader
        title="Stock Ledger"
        subtitle="All stock movements (IN/OUT/reversals) in one place."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DocumentSummaryCard
          label="Total Movements"
          value={String(totalCount)}
        />
        <DocumentSummaryCard
          label="Page"
          value={`${data?.current_page || currentPage} / ${data?.total_pages || 1}`}
        />
        <DocumentSummaryCard label="Page Size" value={String(pageSize)} />
      </div>

      <DataTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        isRefreshing={isTableRefreshing}
        onRefresh={() => refetch()}
        emptyMessage="No ledger movements found."
        filters={
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <input
              name="q"
              value={filters.q}
              onChange={handleFilterChange}
              placeholder="Search (medicine/batch/notes/reference)"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900"
            />
            <input
              name="reference"
              value={filters.reference}
              onChange={handleFilterChange}
              placeholder="Reference contains"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900"
            />
            <select
              name="transaction_type"
              value={filters.transaction_type}
              onChange={handleFilterChange}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <option value="">All types</option>
              <option value="purchase">Purchase</option>
              <option value="sale">Sale</option>
              <option value="return">Return</option>
              <option value="adjustment">Adjustment</option>
              <option value="damage">Damage</option>
            </select>
            <input
              name="start_date"
              type="date"
              value={filters.start_date}
              onChange={handleFilterChange}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900"
            />
            <input
              name="end_date"
              type="date"
              value={filters.end_date}
              onChange={handleFilterChange}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900"
            />
          </div>
        }
        footer={
          <div className="flex items-center justify-between px-4 py-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Showing {rows.length} of {totalCount}
            </div>
            <div className="flex items-center gap-2">
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
          </div>
        }
      />
    </DocumentPage>
  );
};

export default StockLedgerPage;

