import React, { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import DataTable, { Column } from "../../components/DataTable";
import { useToast } from "../../hooks/useToast";
import { fetchSalesSummaryReport } from "../../services/reports";
import {
  DocumentHeader,
  DocumentPage,
  DocumentSummaryCard,
  documentInputClassName,
} from "../../components/common/DocumentUI";

type Row = Awaited<ReturnType<typeof fetchSalesSummaryReport>>["top_items"][number];

const SalesSummaryReport: React.FC = () => {
  const { showError } = useToast();
  const [filters, setFilters] = useState({ start_date: "", end_date: "" });
  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedFilters(filters), 300);
    return () => clearTimeout(timer);
  }, [filters]);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["report-sales-summary", debouncedFilters],
    queryFn: () =>
      fetchSalesSummaryReport({
        start_date: debouncedFilters.start_date || undefined,
        end_date: debouncedFilters.end_date || undefined,
      }),
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (!error) return;
    showError("Failed to load sales summary.");
  }, [error, showError]);

  const rows = useMemo<Row[]>(() => data?.top_items || [], [data?.top_items]);

  const columns: Column<Row>[] = [
    {
      header: "Medicine",
      render: (row) => (
        <span className="text-[11px] font-black text-slate-800 dark:text-slate-200">
          {row.medicine_name}
        </span>
      ),
    },
    {
      header: "Qty",
      render: (row) => (
        <span className="text-[11px] font-black text-slate-700 dark:text-slate-300">
          {row.quantity}
        </span>
      ),
    },
    {
      header: "Revenue",
      render: (row) => (
        <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-400">
          {row.revenue}
        </span>
      ),
    },
  ];

  return (
    <DocumentPage>
      <DocumentHeader
        title="Sales Summary"
        subtitle="Posted sales totals and top items."
        actions={
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters((p) => ({ ...p, start_date: e.target.value }))}
              className={documentInputClassName}
            />
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters((p) => ({ ...p, end_date: e.target.value }))}
              className={documentInputClassName}
            />
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DocumentSummaryCard label="Total Sales" value={data?.total_sales || "0"} />
        <DocumentSummaryCard label="Sale Count" value={String(data?.sale_count || 0)} />
        <DocumentSummaryCard label="Start" value={data?.start_date || "—"} />
        <DocumentSummaryCard label="End" value={data?.end_date || "—"} />
      </section>

      <DataTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        isRefreshing={isFetching && rows.length > 0}
        onRefresh={() => refetch()}
        emptyMessage="No sales data found."
      />
    </DocumentPage>
  );
};

export default SalesSummaryReport;

