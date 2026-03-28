import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DataTable, { Column } from "../../components/DataTable";
import { useToast } from "../../hooks/useToast";
import { fetchGrnById } from "../../services/grn";
import type { GrnDetail, GrnItem } from "../../types/types";
import {
  DocumentHeader,
  DocumentPage,
  DocumentSummaryCard,
} from "../../components/common/DocumentUI";
import { GetErrorMessage } from "../../components/ShowErrorToast";

const GrnDetails: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { showError } = useToast();

  const [data, setData] = useState<GrnDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const response = await fetchGrnById(id);
        setData(response);
      } catch (error: unknown) {
        showError(GetErrorMessage(error, "grn", "load"));
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [id, showError]);

  const columns: Column<GrnItem>[] = useMemo(
    () => [
      {
        header: "Medicine",
        render: (row) => (
          <div className="flex flex-col">
            <span className="text-[11px] font-black text-slate-800 dark:text-slate-200">
              {row.medicine_name}
            </span>
            <span className="text-[9px] font-mono text-slate-500">
              Batch {row.batch_number || "—"} · Exp {row.expiry_date}
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
        header: "Unit",
        render: (row) => (
          <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">
            {row.unit_price}
          </span>
        ),
      },
      {
        header: "Total",
        render: (row) => (
          <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">
            {row.total_price}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <DocumentPage>
      <DocumentHeader
        title="GRN"
        subtitle="Goods receiving note details."
        onBack={() => navigate("/inventory/grn")}
      />

      {data && (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DocumentSummaryCard label="Supplier" value={data.supplier || "—"} />
          <DocumentSummaryCard label="Invoice" value={data.invoice_number} />
          <DocumentSummaryCard label="Total" value={data.total_amount} />
          <DocumentSummaryCard
            label="Received"
            value={new Date(data.received_at).toLocaleString()}
          />
        </section>
      )}

      <DataTable
        columns={columns}
        data={data?.items || []}
        isLoading={isLoading}
        emptyMessage="No GRN items found."
      />
    </DocumentPage>
  );
};

export default GrnDetails;

