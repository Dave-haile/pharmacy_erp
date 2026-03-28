import React, { useEffect, useMemo } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import DataTable, { Column } from "../../components/DataTable";
import { useToast } from "../../hooks/useToast";
import { fetchValuationReport } from "../../services/reports";
import { DocumentHeader, DocumentPage, DocumentSummaryCard } from "../../components/common/DocumentUI";

type Row = Awaited<ReturnType<typeof fetchValuationReport>>["results"][number];

const ValuationReport: React.FC = () => {
  const { showError } = useToast();

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["report-valuation"],
    queryFn: () => fetchValuationReport(),
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (!error) return;
    showError("Failed to load valuation report.");
  }, [error, showError]);

  const rows = useMemo(() => data?.results || [], [data?.results]);

  const columns: Column<Row>[] = [
    {
      header: "Medicine",
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-[11px] font-black text-slate-800 dark:text-slate-200">
            {row.medicine_name}
          </span>
          <span className="text-[9px] font-mono text-slate-500">{row.category || "—"}</span>
        </div>
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
      header: "Value",
      render: (row) => (
        <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-400">
          {row.value}
        </span>
      ),
    },
  ];

  return (
    <DocumentPage>
      <DocumentHeader
        title="Stock Valuation"
        subtitle="Approximate valuation using batch purchase price × quantity."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DocumentSummaryCard label="Items" value={String(data?.count || 0)} />
        <DocumentSummaryCard label="Total Value" value={data?.total_value || "0"} />
      </section>

      <DataTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        isRefreshing={isFetching && rows.length > 0}
        onRefresh={() => refetch()}
        emptyMessage="No valuation data found."
      />
    </DocumentPage>
  );
};

export default ValuationReport;

