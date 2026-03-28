import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import DataTable, { Column } from "../../components/DataTable";
import { useToast } from "../../hooks/useToast";
import { fetchPurchaseById } from "../../services/purchases";
import type { PurchaseDetail, PurchaseItem } from "../../types/types";
import { DocumentHeader, DocumentPage, DocumentSummaryCard } from "../../components/common/DocumentUI";
import { GetErrorMessage } from "../../components/ShowErrorToast";

const PurchaseDetails: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { id } = useParams<{ id: string }>();
  const routeState = (location.state as { purchaseId?: string | number } | null) || null;
  const purchaseId = routeState?.purchaseId ?? searchParams.get("id") ?? id;
  const { showError } = useToast();

  const [data, setData] = useState<PurchaseDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!purchaseId) return;
      setIsLoading(true);
      try {
        const response = await fetchPurchaseById(purchaseId);
        setData(response);
      } catch (error: unknown) {
        showError(GetErrorMessage(error, "purchase", "load"));
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [purchaseId, showError]);

  const columns: Column<PurchaseItem>[] = useMemo(
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
        header: "Cost",
        render: (row) => (
          <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">
            {row.cost_price}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <DocumentPage>
      <DocumentHeader
        title="Purchase"
        subtitle="Purchase details and received items."
        onBack={() => navigate("/inventory/purchases")}
      />

      {data && (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DocumentSummaryCard label="Supplier" value={data.supplier} />
          <DocumentSummaryCard label="Status" value={data.status} />
          <DocumentSummaryCard label="Grand Total" value={data.grand_total} />
          <DocumentSummaryCard label="Tax" value={data.tax} />
        </section>
      )}

      <DataTable
        columns={columns}
        data={data?.items || []}
        isLoading={isLoading}
        emptyMessage="No purchase items found."
      />
    </DocumentPage>
  );
};

export default PurchaseDetails;

