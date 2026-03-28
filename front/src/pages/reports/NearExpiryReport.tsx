import React, { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import DataTable, { Column } from "../../components/DataTable";
import { useToast } from "../../hooks/useToast";
import { fetchNearExpiryReport } from "../../services/reports";
import { DocumentHeader, DocumentPage, DocumentSummaryCard } from "../../components/common/DocumentUI";

type Row = Awaited<ReturnType<typeof fetchNearExpiryReport>>["results"][number];

const NearExpiryReport: React.FC = () => {
  const { showError } = useToast();
  const [days, setDays] = useState(30);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["report-near-expiry", days],
    queryFn: () => fetchNearExpiryReport(days),
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (!error) return;
    showError("Failed to load near-expiry report.");
  }, [error, showError]);

  const rows = useMemo(() => data?.results || [], [data?.results]);

  const columns: Column<Row>[] = [
    {
      header: "Batch",
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-[11px] font-black text-slate-800 dark:text-slate-200">
            {row.medicine_name}
          </span>
          <span className="text-[9px] font-mono text-slate-500">
            {row.batch_number}
          </span>
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
      header: "Expiry",
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-[11px] font-black text-slate-800 dark:text-slate-200">
            {row.expiry_date}
          </span>
          <span className="text-[9px] font-mono text-amber-600 dark:text-amber-400">
            {row.days_to_expiry} days
          </span>
        </div>
      ),
    },
    {
      header: "Supplier",
      render: (row) => (
        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
          {row.supplier || "—"}
        </span>
      ),
    },
  ];

  return (
    <DocumentPage>
      <DocumentHeader
        title="Near-Expiry Report"
        subtitle="Batches expiring soon (sell first / quarantine planning)."
        actions={
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold dark:border-slate-800 dark:bg-slate-900"
          >
            {[30, 60, 90, 180].map((d) => (
              <option key={d} value={d}>
                Next {d} days
              </option>
            ))}
          </select>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DocumentSummaryCard label="Window" value={`${days} days`} />
        <DocumentSummaryCard label="Batches" value={String(data?.count || 0)} />
      </section>

      <DataTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        isRefreshing={isFetching && rows.length > 0}
        onRefresh={() => refetch()}
        emptyMessage="No near-expiry batches found."
      />
    </DocumentPage>
  );
};

export default NearExpiryReport;

