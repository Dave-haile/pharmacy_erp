import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  DocumentCard,
  DocumentHeader,
  DocumentPage,
  DocumentSummaryCard,
  documentPrimaryButtonClassName,
  documentSecondaryButtonClassName,
} from "../components/common/DocumentUI";
import { fetchBatchDetail } from "../services/inventory";
import { BatchDetail } from "../types/types";

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const BatchDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [batch, setBatch] = useState<BatchDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadBatch = async () => {
      if (!id) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetchBatchDetail(id);
        if (active) {
          setBatch(response);
        }
      } catch (error) {
        console.error("Batch detail load error:", error);
        if (active) {
          setBatch(null);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadBatch();
    return () => {
      active = false;
    };
  }, [id]);

  if (isLoading) {
    return (
      <DocumentPage>
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          Loading inventory batch details...
        </div>
      </DocumentPage>
    );
  }

  if (!batch) {
    return (
      <DocumentPage>
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          Inventory batch not found.
        </div>
      </DocumentPage>
    );
  }

  return (
    <DocumentPage>
      <DocumentHeader
        eyebrow="Inventory Control"
        title="Inventory Batch Detail"
        description="Review the live quantity, FIFO priority, expiry risk, and related stock movements for a single inventory batch."
        onBack={() => navigate("/inventory/control")}
        meta={
          <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
            Batch: {batch.inventory_batch_number || batch.batch_number}
          </span>
        }
        actions={
          <>
            <button
              type="button"
              onClick={() => navigate("/inventory/control")}
              className={documentSecondaryButtonClassName}
            >
              Open Registry
            </button>
            <button
              type="button"
              onClick={() => navigate("/inventory/stock-entries/new-stock-entry")}
              className={documentPrimaryButtonClassName}
            >
              New Stock Entry
            </button>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DocumentSummaryCard
          label="On Hand"
          value={batch.quantity}
          hint={`${batch.medicine_total_quantity} total across this medicine`}
          tone="slate"
        />
        <DocumentSummaryCard
          label="FIFO Position"
          value={batch.sell_first ? "1" : batch.fifo_priority ?? "-"}
          hint={batch.sell_first ? "This batch should be sold first" : "Queue order for sales"}
          tone="blue"
        />
        <DocumentSummaryCard
          label="Expiry"
          value={batch.is_expired ? "Expired" : batch.days_to_expiry}
          hint={
            batch.is_expired
              ? `Expired on ${formatDate(batch.expiry_date)}`
              : `${formatDate(batch.expiry_date)}`
          }
          tone="amber"
        />
        <DocumentSummaryCard
          label="Supplier"
          value={batch.supplier || "-"}
          hint={`Received ${formatDate(batch.received_at)}`}
          tone="emerald"
          valueClassName="text-emerald-700 dark:text-emerald-300"
        />
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.4fr,1fr]">
        <DocumentCard
          title="Batch Profile"
          description="Core identifiers and commercial data for this inventory batch."
          accent="blue"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                Medicine
              </p>
              <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
                {batch.medicine_name}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                Inventory Batch
              </p>
              <p className="mt-2 font-mono text-base font-semibold text-slate-900 dark:text-white">
                {batch.inventory_batch_number || batch.batch_number}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                SKU / Barcode
              </p>
              <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
                {batch.naming_series || batch.barcode}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                Category
              </p>
              <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
                {batch.category || "Uncategorized"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                Manufacturing Date
              </p>
              <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
                {formatDate(batch.manufacturing_date)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                Expiry Date
              </p>
              <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
                {formatDate(batch.expiry_date)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                Unit Cost
              </p>
              <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
                {batch.unit_cost}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                Location
              </p>
              <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
                {batch.location}
              </p>
            </div>
          </div>
        </DocumentCard>

        <DocumentCard
          title="Related Batches"
          description="Other active inventory batches for the same medicine."
          accent="amber"
        >
          <div className="space-y-3">
            {batch.related_batches.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No other active inventory batches exist for this medicine.
              </p>
            ) : (
              batch.related_batches.map((item) => (
                <button
                  key={item.batch_id}
                  onClick={() => navigate(`/inventory/${item.batch_id}`)}
                  className="w-full rounded-xl border border-slate-200 p-3 text-left transition hover:border-emerald-400 hover:bg-slate-50 dark:border-slate-800 dark:hover:border-emerald-700 dark:hover:bg-slate-800/50"
                >
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {item.inventory_batch_number || item.batch_number}
                  </div>
                  <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Qty {item.quantity} • {formatDate(item.expiry_date)}
                  </div>
                </button>
              ))
            )}
          </div>
        </DocumentCard>
      </div>

      <DocumentCard
        title="Recent Stock Movements"
        description="Receipts and other document activity linked to this inventory batch."
        accent="slate"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="border-b border-slate-200 text-[9px] uppercase tracking-[0.22em] text-slate-400 dark:border-slate-800">
              <tr>
                <th className="pb-3 font-black">Posting</th>
                <th className="pb-3 font-black">Invoice</th>
                <th className="pb-3 font-black">Quantity</th>
                <th className="pb-3 font-black">Unit Cost</th>
                <th className="pb-3 font-black">Status</th>
                <th className="pb-3 font-black">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {batch.recent_movements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-slate-500">
                    No stock movements were found for this inventory batch.
                  </td>
                </tr>
              ) : (
                batch.recent_movements.map((movement) => (
                  <tr key={`${movement.stock_entry_id}-${movement.created_at}`}>
                    <td className="py-4 pr-4 font-semibold text-slate-900 dark:text-white">
                      {movement.posting_number}
                    </td>
                    <td className="py-4 pr-4 text-slate-600 dark:text-slate-300">
                      {movement.invoice_number}
                    </td>
                    <td className="py-4 pr-4 text-slate-600 dark:text-slate-300">
                      {movement.quantity}
                    </td>
                    <td className="py-4 pr-4 text-slate-600 dark:text-slate-300">
                      {movement.unit_price}
                    </td>
                    <td className="py-4 pr-4 text-slate-600 dark:text-slate-300">
                      {movement.status}
                    </td>
                    <td className="py-4 text-slate-600 dark:text-slate-300">
                      {formatDate(movement.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </DocumentCard>
    </DocumentPage>
  );
};

export default BatchDetails;
