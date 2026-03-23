import React, { useEffect, useMemo, useState } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import DocumentActivityLog from "../../components/common/DocumentActivityLog";
import {
  DocumentCard,
  DocumentField,
  DocumentHeader,
  DocumentPage,
  DocumentSummaryCard,
  documentInputClassName,
  documentPrimaryButtonClassName,
  documentSecondaryButtonClassName,
  documentTextareaClassName,
} from "../../components/common/DocumentUI";
import { useConfirmDialog } from "../../hooks/useConfirmDialog";
import { useToast } from "../../hooks/useToast";
import { fetchInventoryOverview } from "../../services/inventory";
import {
  cancelStockOut,
  createStockOut,
  fetchStockOutById,
  fetchStockOutByPostingNumber,
  fetchStockOutLogs,
  submitStockOut,
  updateStockOut,
} from "../../services/stockOuts";
import {
  CreateStockOut,
  InventoryBatchItem,
  Log,
  StockOutDetail,
  StockOutItemInput,
} from "../../types/types";

const emptyItem = (): StockOutItemInput => ({
  medicine_id: null,
  batch_id: null,
  quantity: "",
  unit_price: "",
});

const formatDate = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "-";

const StockOutDetails: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { postingNumber } = useParams<{ postingNumber: string }>();
  const { showError, showSuccess } = useToast();
  const { confirm } = useConfirmDialog();
  const isNewEntry = postingNumber === "new-stock-out";
  const routeState =
    (location.state as { saleId?: string | number } | null) || null;
  const routeSaleId = routeState?.saleId ?? searchParams.get("id");

  const [inventoryItems, setInventoryItems] = useState<InventoryBatchItem[]>(
    [],
  );
  const [logs, setLogs] = useState<Log[]>([]);
  const [isLogsLoading, setIsLogsLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(!isNewEntry);
  const [isSaving, setIsSaving] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isEditing, setIsEditing] = useState(isNewEntry);
  const [saleId, setSaleId] = useState<string | number | null>(null);
  const [currentStatusKey, setCurrentStatusKey] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateStockOut>({
    customer_name: "",
    invoice_number: "",
    payment_method: "cash",
    notes: "",
    items: [emptyItem()],
  });

  useEffect(() => {
    const loadInventory = async () => {
      try {
        const response = await fetchInventoryOverview();
        setInventoryItems(response.items.filter((item) => !item.is_expired));
      } catch (error) {
        console.error("Failed to load inventory batches for stock-out:", error);
      }
    };

    void loadInventory();
  }, []);

  useEffect(() => {
    const loadSale = async () => {
      if (isNewEntry) {
        setIsLoading(false);
        setIsEditing(true);
        return;
      }

      setIsLoading(true);
      try {
        let response: StockOutDetail;
        if (routeSaleId) {
          response = await fetchStockOutById(routeSaleId);
        } else if (postingNumber) {
          response = await fetchStockOutByPostingNumber(postingNumber);
        } else {
          throw new Error("Stock-out not found.");
        }

        setSaleId(response.id);
        setCurrentStatusKey(response.status_key);
        setFormData({
          customer_name: response.customer_name,
          invoice_number: response.invoice_number,
          payment_method: response.payment_method,
          notes: response.notes,
          items: response.items.map((item) => ({
            medicine_id: item.medicine_id,
            batch_id: item.inventory_batch_id ?? item.batch_id,
            quantity: String(item.quantity),
            unit_price: item.price_at_sale,
          })),
        });
        setIsEditing(false);
      } catch (error) {
        showError("Failed to load stock-out document.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadSale();
  }, [isNewEntry, postingNumber, routeSaleId, showError]);

  useEffect(() => {
    if (!saleId || isNewEntry) {
      setLogs([]);
      return;
    }

    const loadLogs = async () => {
      setIsLogsLoading(true);
      try {
        const data = await fetchStockOutLogs(saleId);
        setLogs(data);
      } catch (error) {
        console.error("Stock-out logs load error:", error);
      } finally {
        setIsLogsLoading(false);
      }
    };

    void loadLogs();
  }, [isNewEntry, saleId]);

  const medicineOptions = useMemo(() => {
    const unique = new Map<number, InventoryBatchItem>();
    for (const item of inventoryItems) {
      if (!unique.has(item.medicine_id)) {
        unique.set(item.medicine_id, item);
      }
    }
    return Array.from(unique.values()).sort((left, right) =>
      left.medicine_name.localeCompare(right.medicine_name),
    );
  }, [inventoryItems]);

  const batchesByMedicine = useMemo(() => {
    return inventoryItems.reduce<Record<number, InventoryBatchItem[]>>(
      (accumulator, item) => {
        if (!accumulator[item.medicine_id]) {
          accumulator[item.medicine_id] = [];
        }
        accumulator[item.medicine_id].push(item);
        return accumulator;
      },
      {},
    );
  }, [inventoryItems]);

  const totals = useMemo(() => {
    const totalAmount = formData.items.reduce((sum, item) => {
      return sum + Number(item.quantity || 0) * Number(item.unit_price || 0);
    }, 0);

    const totalQuantity = formData.items.reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0,
    );

    return { totalAmount, totalQuantity };
  }, [formData.items]);

  const canEditForm = isNewEntry || isEditing;
  const canEditDraft =
    !isNewEntry && !!saleId && currentStatusKey === "draft" && !isEditing;
  const canAmendCancelled =
    !isNewEntry && !!saleId && currentStatusKey === "cancelled" && !isEditing;
  const canPostDraft =
    !isNewEntry && !!saleId && currentStatusKey === "draft" && !isEditing;
  const canCancelPosted =
    !isNewEntry && !!saleId && currentStatusKey === "posted" && !isEditing;

  const setItemField = (
    index: number,
    field: keyof StockOutItemInput,
    value: string | number | null,
  ) => {
    setFormData((previous) => ({
      ...previous,
      items: previous.items.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }

        const nextItem = { ...item, [field]: value };
        if (field === "medicine_id") {
          nextItem.batch_id = null;
          const selectedMedicine = medicineOptions.find(
            (option) => option.medicine_id === Number(value),
          );
          nextItem.unit_price = selectedMedicine?.selling_price ?? "";
        }
        return nextItem;
      }),
    }));
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.invoice_number.trim()) {
      errors.push("Invoice number is required.");
    }

    formData.items.forEach((item, index) => {
      const label = `Row ${index + 1}`;
      if (!item.medicine_id) errors.push(`${label}: medicine is required.`);
      if (!item.quantity || Number(item.quantity) <= 0) {
        errors.push(`${label}: quantity must be greater than zero.`);
      }
      if (!item.unit_price || Number(item.unit_price) <= 0) {
        errors.push(`${label}: unit price must be greater than zero.`);
      }
    });

    return errors;
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!canEditForm) return;

    const errors = validateForm();
    if (errors.length > 0) {
      await confirm({
        mode: "alert",
        variant: "danger",
        title: "Stock Out Is Incomplete",
        message: errors.join("\n"),
        confirmLabel: "Review",
      });
      return;
    }

    setIsSaving(true);
    try {
      if (isNewEntry) {
        const response = await createStockOut(formData);
        showSuccess(response.message || "Stock-out draft created.");
        const createdSale = response?.sale;
        navigate(
          `/sales/stock-outs/${createdSale.posting_number}?id=${createdSale.id}`,
          {
            state: { saleId: createdSale.id },
          },
        );
        return;
      }

      if (saleId) {
        const response = await updateStockOut(saleId, formData);
        setCurrentStatusKey(response?.sale?.status_key || "draft");
        setIsEditing(false);
        showSuccess(response.message || "Stock-out draft updated.");
      }
    } catch (error: any) {
      showError(error?.response?.data?.error || "Failed to save stock-out.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitDraft = async () => {
    if (!saleId || currentStatusKey !== "draft") return;

    const { confirmed } = await confirm({
      title: "Post Stock Out",
      message:
        "This will deduct inventory batches and mark the document as Posted.",
      confirmLabel: "Post Stock Out",
      cancelLabel: "Cancel",
      variant: "info",
    });

    if (!confirmed) return;

    setIsPosting(true);
    try {
      const response = await submitStockOut(saleId);
      setCurrentStatusKey(response?.sale?.status_key || "posted");
      setIsEditing(false);
      showSuccess(response.message || "Stock-out posted successfully.");
    } catch (error: any) {
      showError(error?.response?.data?.error || "Failed to post stock-out.");
    } finally {
      setIsPosting(false);
    }
  };

  const handleCancelPosted = async () => {
    if (!saleId || currentStatusKey !== "posted") return;

    const { confirmed } = await confirm({
      title: "Cancel Stock Out",
      message:
        "This will restore the consumed inventory batches and mark the document as Cancelled.",
      confirmLabel: "Cancel Document",
      cancelLabel: "Keep Posted",
      variant: "danger",
    });

    if (!confirmed) return;

    setIsCancelling(true);
    try {
      const response = await cancelStockOut(saleId);
      setCurrentStatusKey(response?.sale?.status_key || "cancelled");
      setIsEditing(false);
      showSuccess(response.message || "Stock-out cancelled successfully.");
    } catch (error: any) {
      showError(error?.response?.data?.error || "Failed to cancel stock-out.");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <DocumentPage>
      <DocumentHeader
        eyebrow="Sales & Distribution"
        title={isNewEntry ? "Create Stock Out" : "Stock Out"}
        description="Issue medicine from inventory batches. Drafts can auto-allocate FIFO batches before posting."
        onBack={() => navigate("/sales")}
        meta={
          <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
            Ref: {!isNewEntry && postingNumber ? postingNumber : "Auto"}
          </span>
        }
        actions={
          <>
            {canEditDraft && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className={documentSecondaryButtonClassName}
              >
                Edit
              </button>
            )}
            {canAmendCancelled && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className={documentSecondaryButtonClassName}
              >
                Amend
              </button>
            )}
            {isEditing && !isNewEntry && (
              <button
                type="button"
                onClick={() => navigate(0)}
                className={documentSecondaryButtonClassName}
              >
                Cancel
              </button>
            )}
            {canCancelPosted && (
              <button
                type="button"
                onClick={handleCancelPosted}
                disabled={isCancelling || isSaving || isPosting}
                className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-rose-700 shadow-sm transition-all hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300"
              >
                {isCancelling ? "Cancelling..." : "Cancel Document"}
              </button>
            )}
            {canPostDraft && (
              <button
                type="button"
                onClick={handleSubmitDraft}
                disabled={isPosting || isSaving}
                className="inline-flex items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-amber-700 shadow-sm transition-all hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300"
              >
                {isPosting ? "Posting..." : "Post"}
              </button>
            )}
            {canEditForm && (
              <button
                type="submit"
                form="stock-out-form"
                disabled={isSaving || isPosting || isCancelling}
                className={documentPrimaryButtonClassName}
              >
                {isSaving ? "Saving..." : isNewEntry ? "Save Draft" : "Save"}
              </button>
            )}
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DocumentSummaryCard
          label="Document Mode"
          value={
            isNewEntry
              ? "New Draft"
              : isEditing
                ? currentStatusKey === "cancelled"
                  ? "Amending Cancelled"
                  : "Editing Draft"
                : currentStatusKey === "posted"
                  ? "Posted"
                  : currentStatusKey === "cancelled"
                    ? "Cancelled"
                    : "Draft Review"
          }
          hint="Stock entry items create inventory batches; stock-out consumes those same batches."
          tone="blue"
        />
        <DocumentSummaryCard
          label="Line Items"
          value={String(formData.items.length)}
          hint="Sale allocations in this document"
          tone="slate"
        />
        <DocumentSummaryCard
          label="Total Quantity"
          value={String(totals.totalQuantity)}
          hint="Requested sale quantity"
          tone="amber"
        />
        <DocumentSummaryCard
          label="Total Amount"
          value={String(totals.totalAmount)}
          hint="Quantity times sales price"
          tone="emerald"
          valueClassName="text-emerald-700 dark:text-emerald-300"
        />
      </section>

      {isLoading && (
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          Loading stock-out document...
        </div>
      )}

      <form id="stock-out-form" onSubmit={handleSave} className="space-y-6">
        <DocumentCard
          title="Document Details"
          description="Capture the customer reference and payment context before allocating inventory batches."
          accent="blue"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <DocumentField label="Customer Name">
              <input
                value={formData.customer_name}
                onChange={(event) =>
                  setFormData((previous) => ({
                    ...previous,
                    customer_name: event.target.value,
                  }))
                }
                className={documentInputClassName}
                placeholder="Walk-in customer or account name"
                disabled={!canEditForm}
              />
            </DocumentField>
            <DocumentField label="Invoice Number">
              <input
                value={formData.invoice_number}
                onChange={(event) =>
                  setFormData((previous) => ({
                    ...previous,
                    invoice_number: event.target.value,
                  }))
                }
                className={documentInputClassName}
                placeholder="Receipt / invoice reference"
                disabled={!canEditForm}
              />
            </DocumentField>
            <DocumentField label="Payment Method">
              <select
                value={formData.payment_method}
                onChange={(event) =>
                  setFormData((previous) => ({
                    ...previous,
                    payment_method: event.target.value,
                  }))
                }
                className={documentInputClassName}
                disabled={!canEditForm}
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="credit">Credit</option>
              </select>
            </DocumentField>
            <DocumentField label="Notes">
              <textarea
                rows={4}
                value={formData.notes}
                onChange={(event) =>
                  setFormData((previous) => ({
                    ...previous,
                    notes: event.target.value,
                  }))
                }
                className={documentTextareaClassName}
                placeholder="Optional sale notes"
                disabled={!canEditForm}
              />
            </DocumentField>
          </div>
        </DocumentCard>

        <DocumentCard
          title="Issue Lines"
          description="Choose the medicine and optionally force a specific inventory batch. Leaving the batch empty uses FIFO allocation."
          accent="amber"
          action={
            canEditForm ? (
              <button
                type="button"
                onClick={() =>
                  setFormData((previous) => ({
                    ...previous,
                    items: [...previous.items, emptyItem()],
                  }))
                }
                className={documentSecondaryButtonClassName}
              >
                Add Line
              </button>
            ) : undefined
          }
          contentClassName="space-y-4"
        >
          {formData.items.map((item, index) => {
            const availableBatches = item.medicine_id
              ? (batchesByMedicine[item.medicine_id] ?? [])
              : [];

            return (
              <div
                key={`${index}-${item.medicine_id ?? "new"}`}
                className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800"
              >
                <div className="grid gap-4 md:grid-cols-4">
                  <DocumentField label={`Medicine ${index + 1}`}>
                    <select
                      value={item.medicine_id ?? ""}
                      onChange={(event) =>
                        setItemField(
                          index,
                          "medicine_id",
                          event.target.value ? Number(event.target.value) : null,
                        )
                      }
                      className={documentInputClassName}
                      disabled={!canEditForm}
                    >
                      <option value="">Select medicine</option>
                      {medicineOptions.map((option) => (
                        <option key={option.medicine_id} value={option.medicine_id}>
                          {option.medicine_name} ({option.medicine_total_quantity})
                        </option>
                      ))}
                    </select>
                  </DocumentField>
                  <DocumentField label="Inventory Batch">
                    <select
                      value={item.batch_id ?? ""}
                      onChange={(event) =>
                        setItemField(
                          index,
                          "batch_id",
                          event.target.value
                            ? Number(event.target.value)
                            : null,
                        )
                      }
                      className={documentInputClassName}
                      disabled={!canEditForm}
                    >
                      <option value="">Use FIFO inventory batch</option>
                      {availableBatches.map((batch) => (
                        <option key={batch.batch_id} value={batch.batch_id}>
                          {batch.inventory_batch_number || batch.batch_number} (
                          {batch.quantity})
                        </option>
                      ))}
                    </select>
                  </DocumentField>
                  <DocumentField label="Quantity">
                    <input
                      value={item.quantity}
                      onChange={(event) =>
                        setItemField(index, "quantity", event.target.value)
                      }
                      className={documentInputClassName}
                      placeholder="0"
                      disabled={!canEditForm}
                    />
                  </DocumentField>
                  <DocumentField label="Unit Price">
                    <input
                      value={item.unit_price}
                      onChange={(event) =>
                        setItemField(index, "unit_price", event.target.value)
                      }
                      className={documentInputClassName}
                      placeholder="0.00"
                      disabled={!canEditForm}
                    />
                  </DocumentField>
                </div>

                {availableBatches.length > 0 && (
                  <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                    Recommended inventory batch:{" "}
                    <span className="font-semibold text-emerald-600">
                      {availableBatches[0].inventory_batch_number || availableBatches[0].batch_number}
                    </span>{" "}
                    • received {formatDate(availableBatches[0].received_at)} • expires{" "}
                    {formatDate(availableBatches[0].expiry_date)}
                  </div>
                )}

                {canEditForm && formData.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((previous) => ({
                        ...previous,
                        items: previous.items.filter(
                          (_, itemIndex) => itemIndex !== index,
                        ),
                      }))
                    }
                    className="mt-3 text-sm font-semibold text-red-600"
                  >
                    Remove Line
                  </button>
                )}
              </div>
            );
          })}
        </DocumentCard>

        {!isNewEntry && (
          <DocumentActivityLog
            logs={logs}
            isLoading={isLogsLoading}
            onViewAll={() => navigate("/audit-logs")}
            title="Activity Log"
            description="Recent changes made only to this stock-out document."
          />
        )}
      </form>
    </DocumentPage>
  );
};

export default StockOutDetails;
