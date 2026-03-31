import React, { useEffect, useMemo, useState } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import SearchableSelect from "../../components/SearchableSelect";
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
import { useSuppliers } from "../../services/common";
import {
  cancelSupplierReturn,
  createSupplierReturn,
  fetchSupplierReturnById,
  fetchSupplierReturnLogs,
  submitSupplierReturn,
  updateSupplierReturn,
} from "../../services/supplierReturns";
import type {
  CreateSupplierReturn,
  InventoryBatchItem,
  Log,
  SupplierReturnItemInput,
} from "../../types/types";
import { GetErrorMessage } from "../../components/ShowErrorToast";

const emptyItem = (): SupplierReturnItemInput => ({
  medicine_id: null,
  batch_id: null,
  quantity: "",
  unit_price: "",
  notes: "",
});

const SupplierReturnDetails: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { id } = useParams<{ id: string }>();
  const routeState =
    (location.state as { returnId?: string | number } | null) || null;
  const routeId = routeState?.returnId ?? searchParams.get("id") ?? id;
  const isNew = id === "new";

  const { showError, showSuccess } = useToast();
  const { confirm } = useConfirmDialog();

  const [inventoryItems, setInventoryItems] = useState<InventoryBatchItem[]>(
    [],
  );
  const [logs, setLogs] = useState<Log[]>([]);
  const [isLogsLoading, setIsLogsLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isEditing, setIsEditing] = useState(isNew);
  const [docId, setDocId] = useState<string | number | null>(null);
  const [statusKey, setStatusKey] = useState<string | null>(null);

  const [supplierInputSearch, setSupplierInputSearch] = useState("");
  const { supplierGroups } = useSuppliers(supplierInputSearch);

  const [formData, setFormData] = useState<CreateSupplierReturn>({
    supplier_id: null,
    reference_document: "",
    notes: "",
    items: [emptyItem()],
  });

  useEffect(() => {
    const loadInventory = async () => {
      try {
        const response = await fetchInventoryOverview({ eligibleOnly: true });
        setInventoryItems(response.items);
      } catch (error: unknown) {
        showError(GetErrorMessage(error, "inventory", "load"));
      }
    };
    void loadInventory();
  }, [showError]);

  useEffect(() => {
    const loadDoc = async () => {
      if (isNew) {
        setIsLoading(false);
        setIsEditing(true);
        return;
      }
      if (!routeId) return;
      setIsLoading(true);
      try {
        const response = await fetchSupplierReturnById(routeId);
        setDocId(response.id);
        setStatusKey(response.status_key);
        setSupplierInputSearch(response.supplier);
        setFormData({
          supplier_id: response.supplier_id,
          reference_document: response.reference_document,
          notes: response.notes,
          items: response.items.map((item) => ({
            medicine_id: item.medicine_id,
            batch_id: item.batch_id,
            quantity: String(item.quantity),
            unit_price: item.unit_price,
            notes: item.notes || "",
          })),
        });
        setIsEditing(false);
      } catch (error: unknown) {
        showError(GetErrorMessage(error, "supplier-return", "load"));
      } finally {
        setIsLoading(false);
      }
    };
    void loadDoc();
  }, [isNew, routeId, showError]);

  useEffect(() => {
    if (!docId || isNew) {
      setLogs([]);
      return;
    }
    const loadLogs = async () => {
      setIsLogsLoading(true);
      try {
        const data = await fetchSupplierReturnLogs(docId);
        setLogs(data);
      } catch (error: unknown) {
        showError(GetErrorMessage(error, "supplier-return", "load"));
      } finally {
        setIsLogsLoading(false);
      }
    };
    void loadLogs();
  }, [docId, isNew, showError]);

  const medicineOptions = useMemo(() => {
    const unique = new Map<number, InventoryBatchItem>();
    for (const item of inventoryItems) {
      if (!unique.has(item.medicine_id)) unique.set(item.medicine_id, item);
    }
    return Array.from(unique.values()).sort((a, b) =>
      a.medicine_name.localeCompare(b.medicine_name),
    );
  }, [inventoryItems]);

  const batchesByMedicine = useMemo(() => {
    return inventoryItems.reduce<Record<number, InventoryBatchItem[]>>(
      (acc, item) => {
        if (!acc[item.medicine_id]) acc[item.medicine_id] = [];
        acc[item.medicine_id].push(item);
        return acc;
      },
      {},
    );
  }, [inventoryItems]);

  const canEditForm = isNew || isEditing;
  const canEditDraft = !isNew && !!docId && statusKey === "draft" && !isEditing;
  const canAmendCancelled =
    !isNew && !!docId && statusKey === "cancelled" && !isEditing;
  const canPostDraft = !isNew && !!docId && statusKey === "draft" && !isEditing;
  const canCancelPosted =
    !isNew && !!docId && statusKey === "posted" && !isEditing;

  const setItemField = (
    index: number,
    field: keyof SupplierReturnItemInput,
    value: string | number | null,
  ) => {
    setFormData((previous) => ({
      ...previous,
      items: previous.items.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        const next = { ...item, [field]: value } as SupplierReturnItemInput;
        if (field === "medicine_id") {
          next.batch_id = null;
        }
        return next;
      }),
    }));
  };

  const validateForm = () => {
    const errors: string[] = [];
    if (!formData.supplier_id) errors.push("Supplier is required.");
    formData.items.forEach((item, index) => {
      const label = `Row ${index + 1}`;
      if (!item.medicine_id) errors.push(`${label}: medicine is required.`);
      if (!item.batch_id) errors.push(`${label}: batch is required.`);
      if (!item.quantity || Number(item.quantity) <= 0) {
        errors.push(`${label}: quantity must be greater than zero.`);
      }
    });
    return errors;
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canEditForm) return;
    const errors = validateForm();
    if (errors.length) {
      await confirm({
        mode: "alert",
        variant: "danger",
        title: "Supplier Return Is Incomplete",
        message: errors.join("\n"),
        confirmLabel: "Review",
      });
      return;
    }

    setIsSaving(true);
    try {
      if (isNew) {
        const response = await createSupplierReturn(formData);
        showSuccess(response.message || "Supplier return draft created.");
        const created = response.supplier_return;
        navigate(`/inventory/supplier-returns/${created.id}`, {
          state: { returnId: created.id },
        });
        return;
      }
      if (docId) {
        const response = await updateSupplierReturn(docId, formData);
        setStatusKey(response.supplier_return.status_key);
        setIsEditing(false);
        showSuccess(response.message || "Supplier return updated.");
      }
    } catch (error: unknown) {
      showError(GetErrorMessage(error, "supplier-return", "save"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitDraft = async () => {
    if (!docId || statusKey !== "draft") return;
    const { confirmed } = await confirm({
      title: "Post Supplier Return",
      message: "This will deduct inventory and record a return-to-supplier.",
      confirmLabel: "Post",
      cancelLabel: "Cancel",
      variant: "info",
    });
    if (!confirmed) return;
    setIsPosting(true);
    try {
      const response = await submitSupplierReturn(docId);
      setStatusKey(response.supplier_return.status_key);
      setIsEditing(false);
      showSuccess(response.message || "Supplier return posted.");
    } catch (error: unknown) {
      showError(GetErrorMessage(error, "supplier-return", "post"));
    } finally {
      setIsPosting(false);
    }
  };

  const handleCancelPosted = async () => {
    if (!docId || statusKey !== "posted") return;
    const { confirmed } = await confirm({
      title: "Cancel Supplier Return",
      message: "This will restore inventory and mark it Cancelled.",
      confirmLabel: "Cancel Document",
      cancelLabel: "Keep Posted",
      variant: "danger",
    });
    if (!confirmed) return;
    setIsCancelling(true);
    try {
      const response = await cancelSupplierReturn(docId);
      setStatusKey(response.supplier_return.status_key);
      setIsEditing(false);
      showSuccess(response.message || "Supplier return cancelled.");
    } catch (error: unknown) {
      showError(GetErrorMessage(error, "supplier-return", "cancel"));
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <DocumentPage>
      <DocumentHeader
        title={isNew ? "Create Supplier Return" : "Supplier Return"}
        description="Return stock back to supplier (decreases inventory)."
        onBack={() => navigate("/inventory/supplier-returns")}
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
                form="supplier-return-form"
                disabled={isSaving || isPosting || isCancelling}
                className={documentPrimaryButtonClassName}
              >
                {isSaving ? "Saving..." : isNew ? "Save Draft" : "Save"}
              </button>
            )}
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DocumentSummaryCard
          label="Status"
          value={isNew ? "New Draft" : statusKey || "draft"}
        />
        <DocumentSummaryCard
          label="Lines"
          value={String(formData.items.length)}
        />
        <DocumentSummaryCard
          label="Supplier"
          value={supplierInputSearch || "—"}
        />
        <DocumentSummaryCard
          label="Reference"
          value={formData.reference_document || "—"}
        />
      </section>

      {isLoading && (
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          Loading supplier return...
        </div>
      )}

      <form
        id="supplier-return-form"
        onSubmit={handleSave}
        className="space-y-6"
      >
        <DocumentCard
          title="Return Details"
          description="Select supplier and add notes."
          accent="blue"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <DocumentField label="Supplier">
              <SearchableSelect
                options={supplierGroups}
                value={
                  formData.supplier_id != null
                    ? String(formData.supplier_id)
                    : ""
                }
                onChange={(value) => {
                  const selected = supplierGroups.find(
                    (s) => s.value === value,
                  );
                  setFormData((p) => ({
                    ...p,
                    supplier_id: value ? Number(value) : null,
                  }));
                  setSupplierInputSearch(selected?.label || "");
                }}
                placeholder="Search supplier..."
                disabled={!canEditForm}
                onSearch={setSupplierInputSearch}
              />
            </DocumentField>
            <DocumentField label="Reference (optional)">
              <input
                value={formData.reference_document}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    reference_document: e.target.value,
                  }))
                }
                className={documentInputClassName}
                disabled={!canEditForm}
              />
            </DocumentField>
            <DocumentField label="Notes">
              <textarea
                rows={4}
                value={formData.notes}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, notes: e.target.value }))
                }
                className={documentTextareaClassName}
                disabled={!canEditForm}
              />
            </DocumentField>
          </div>
        </DocumentCard>

        <DocumentCard
          title="Lines"
          description="Select batches to return back to supplier."
          accent="amber"
          action={
            canEditForm ? (
              <button
                type="button"
                onClick={() =>
                  setFormData((p) => ({
                    ...p,
                    items: [...p.items, emptyItem()],
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
                    <SearchableSelect
                      options={medicineOptions.map((opt) => ({
                        value: String(opt.medicine_id),
                        label: opt.medicine_name,
                      }))}
                      value={
                        item.medicine_id != null ? String(item.medicine_id) : ""
                      }
                      onChange={(value) =>
                        setItemField(
                          index,
                          "medicine_id",
                          value ? Number(value) : null,
                        )
                      }
                      placeholder="Search medicine..."
                      disabled={!canEditForm}
                    />
                  </DocumentField>
                  <DocumentField label="Batch">
                    <select
                      value={item.batch_id ?? ""}
                      onChange={(e) =>
                        setItemField(
                          index,
                          "batch_id",
                          e.target.value ? Number(e.target.value) : null,
                        )
                      }
                      className={documentInputClassName}
                      disabled={!canEditForm}
                    >
                      <option value="">Select batch</option>
                      {availableBatches.map((b) => (
                        <option key={b.batch_id} value={b.batch_id}>
                          {b.batch_number} (qty {b.quantity})
                        </option>
                      ))}
                    </select>
                  </DocumentField>
                  <DocumentField label="Quantity">
                    <input
                      value={item.quantity}
                      onChange={(e) =>
                        setItemField(index, "quantity", e.target.value)
                      }
                      className={documentInputClassName}
                      disabled={!canEditForm}
                    />
                  </DocumentField>
                  <DocumentField label="Unit Price">
                    <input
                      value={item.unit_price}
                      onChange={(e) =>
                        setItemField(index, "unit_price", e.target.value)
                      }
                      className={documentInputClassName}
                      disabled={!canEditForm}
                    />
                  </DocumentField>
                </div>
                {canEditForm && formData.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((p) => ({
                        ...p,
                        items: p.items.filter((_, i) => i !== index),
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

        {!isNew && (
          <DocumentActivityLog
            logs={logs}
            isLoading={isLogsLoading}
            onViewAll={() => navigate("/audit-logs")}
            title="Activity Log"
            description="Recent changes made to this supplier return."
          />
        )}
      </form>
    </DocumentPage>
  );
};

export default SupplierReturnDetails;
