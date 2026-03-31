import React, { useEffect, useMemo, useState } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useQueries, useQuery } from "@tanstack/react-query";
import SearchableSelect from "../../components/SearchableSelect";
import { useSuppliers } from "../../services/common";
import {
  fetchMedicineByNumericId,
  fetchMedicines,
} from "../../services/medicines";
import {
  cancelStockEntry,
  createStockEntry,
  deleteStockEntry,
  fetchStockEntries,
  fetchStockEntryById,
  fetchStockEntryLogs,
  submitStockEntry,
  updateStockEntry,
} from "../../services/stockEntries";
import {
  CreateStockEntry,
  Log,
  MedicineItem,
  StockEntryItemInput,
} from "../../types/types";
import { useToast } from "../../hooks/useToast";
import { useConfirmDialog } from "../../hooks/useConfirmDialog";
import {
  DocumentCard,
  DocumentField,
  DocumentHeader,
  DocumentPage,
  DocumentSummaryCard,
  documentInputClassName,
  documentPrimaryButtonClassName,
  documentSecondaryButtonClassName,
  documentSelectTriggerClassName,
  documentTextareaClassName,
} from "../../components/common/DocumentUI";
import DocumentActivityLog from "../../components/common/DocumentActivityLog";
import StockEntryActionsMenu from "./StockEntryActionsMenu";
import StockEntryLineItemCard from "./StockEntryLineItemCard";
import {
  currencyFormatter,
  emptyItem,
  numberFormatter,
} from "./stockEntryUtils";

const StockEntryPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { postingNumber } = useParams<{ postingNumber: string }>();
  const { showError, showSuccess } = useToast();
  const { confirm } = useConfirmDialog();
  const duplicateStockEntry = (
    location.state as { duplicateStockEntry?: CreateStockEntry } | null
  )?.duplicateStockEntry;
  const isNewEntry = postingNumber === "new-stock-entry";
  const [supplierInputSearch, setSupplierInputSearch] = useState("");
  const [medicineSearchTerms, setMedicineSearchTerms] = useState<
    Record<number, string>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [logs, setLogs] = useState<Log[]>([]);
  const [isLogsLoading, setIsLogsLoading] = useState(false);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(isNewEntry);
  const [stockEntryId, setStockEntryId] = useState<string | number | null>(
    null,
  );
  const [currentStatusKey, setCurrentStatusKey] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateStockEntry>({
    supplier_id: null,
    invoice_number: "",
    tax: "0",
    notes: "",
    items: [emptyItem()],
  });

  const { supplierGroups } = useSuppliers(supplierInputSearch, {
    status: "Submitted",
    is_active: "true",
  });
  const routeState =
    (location.state as { stockEntryId?: string | number } | null) || null;
  const routeStockEntryId = routeState?.stockEntryId ?? searchParams.get("id");

  const stockEntryQuery = useQuery({
    queryKey: ["stock-entries", routeStockEntryId, postingNumber],
    queryFn: async () => {
      if (isNewEntry) {
        return null;
      }

      if (routeStockEntryId) {
        return await fetchStockEntryById(routeStockEntryId);
      }

      const listing = await fetchStockEntries(1, 1, {
        posting_number: postingNumber || "",
        invoice_number: "",
        supplier: "",
        status: "",
      });
      const matched = listing?.results?.find(
        (entry: { id: number; posting_number: string }) =>
          entry.posting_number === postingNumber,
      );

      if (!matched?.id) {
        throw new Error("Stock entry not found.");
      }

      return await fetchStockEntryById(matched.id);
    },
    enabled: !!postingNumber && !isNewEntry,
  });

  useEffect(() => {
    setIsEditing(isNewEntry);
  }, [isNewEntry]);

  useEffect(() => {
    if (!stockEntryQuery.data) return;

    setStockEntryId(stockEntryQuery.data.id);
    setCurrentStatusKey(stockEntryQuery.data.status_key || null);
    setFormData({
      supplier_id: stockEntryQuery.data.supplier_id,
      invoice_number: stockEntryQuery.data.invoice_number,
      tax: stockEntryQuery.data.tax.toString(),
      notes: stockEntryQuery.data.notes,
      items: stockEntryQuery.data.items.map(
        (item: {
          medicine_id: number;
          batch_number: string;
          manufacturing_date: string;
          expiry_date: string;
          quantity: number;
          unit_price: string;
          reference: string;
          notes: string;
        }) => ({
          medicine_id: item.medicine_id,
          batch_number: item.batch_number,
          manufacturing_date: item.manufacturing_date,
          expiry_date: item.expiry_date,
          quantity: item.quantity.toString(),
          unit_price: item.unit_price.toString(),
          reference: item.reference,
          notes: item.notes,
        }),
      ),
    });
    setIsEditing(false);
  }, [stockEntryQuery.data]);

  useEffect(() => {
    if (!stockEntryId || isNewEntry) {
      setLogs([]);
      return;
    }

    const loadLogs = async () => {
      setIsLogsLoading(true);
      try {
        const data = await fetchStockEntryLogs(stockEntryId);
        setLogs(data);
      } catch (error) {
        console.error("Stock entry logs load error", error);
      } finally {
        setIsLogsLoading(false);
      }
    };

    void loadLogs();
  }, [isNewEntry, stockEntryId]);

  useEffect(() => {
    if (!duplicateStockEntry || !isNewEntry) return;

    setFormData({
      supplier_id: duplicateStockEntry.supplier_id,
      invoice_number: duplicateStockEntry.invoice_number,
      tax: duplicateStockEntry.tax,
      notes: duplicateStockEntry.notes,
      items: duplicateStockEntry.items.map((item) => ({
        ...item,
        batch_number: "",
        reference: "",
      })),
    });
    setIsEditing(true);
  }, [duplicateStockEntry, isNewEntry]);

  const medicineQuery = useQuery({
    queryKey: [
      "stock-entry-medicines",
      formData.items.length,
      medicineSearchTerms,
    ],
    queryFn: async () => {
      const entries = await Promise.all(
        formData.items.map((_, index) =>
          fetchMedicines(1, 10, {
            name: medicineSearchTerms[index] || "",
            generic_name: "",
            category: "",
            supplier: "",
            status: "",
          }),
        ),
      );

      return entries;
    },
    staleTime: 60 * 1000,
  });

  const medicineOptionsByRow = useMemo(() => {
    return formData.items.map((_, index) => {
      const result = medicineQuery.data?.[index]?.results || [];
      return result.map((medicine) => ({
        value: String(medicine.id),
        label: medicine.name,
        subtitle: `${medicine.naming_series} · ${medicine.generic_name || "No generic name"}`,
      }));
    });
  }, [formData.items, medicineQuery.data]);

  const medicineDetailQueries = useQueries({
    queries: formData.items.map((item) => ({
      queryKey: ["medicine-detail", item.medicine_id],
      queryFn: () => fetchMedicineByNumericId(item.medicine_id!),
      enabled: item.medicine_id != null,
      staleTime: 60 * 1000,
    })),
  });

  const totals = useMemo(() => {
    const subtotal = formData.items.reduce((sum, item) => {
      const quantity = Number(item.quantity || 0);
      const unitPrice = Number(item.unit_price || 0);
      return sum + quantity * unitPrice;
    }, 0);
    const tax = Number(formData.tax || 0);
    return {
      subtotal,
      tax,
      grandTotal: subtotal + tax,
    };
  }, [formData.items, formData.tax]);

  const totalQuantity = useMemo(
    () =>
      formData.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [formData.items],
  );

  const setItemField = (
    index: number,
    field: keyof StockEntryItemInput,
    value: string | number | null,
  ) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const addRow = () => {
    setFormData((prev) => ({ ...prev, items: [...prev.items, emptyItem()] }));
  };

  const removeRow = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items:
        prev.items.length === 1
          ? prev.items
          : prev.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.supplier_id) {
      errors.push("Supplier is required.");
    }

    if (!formData.invoice_number.trim()) {
      errors.push("Invoice number is required.");
    }

    formData.items.forEach((item, index) => {
      const label = `Row ${index + 1}`;
      if (!item.medicine_id) errors.push(`${label}: medicine is required.`);
      if (!item.batch_number.trim())
        errors.push(`${label}: batch number is required.`);
      if (!item.manufacturing_date)
        errors.push(`${label}: manufacturing date is required.`);
      if (!item.expiry_date) errors.push(`${label}: expiry date is required.`);
      if (!item.quantity || Number(item.quantity) <= 0)
        errors.push(`${label}: quantity must be greater than zero.`);
      if (!item.unit_price || Number(item.unit_price) <= 0)
        errors.push(`${label}: unit price must be greater than zero.`);
      if (
        item.manufacturing_date &&
        item.expiry_date &&
        item.expiry_date <= item.manufacturing_date
      ) {
        errors.push(`${label}: expiry date must be after manufacturing date.`);
      }
    });

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canEditForm) return;

    const errors = validateForm();
    if (errors.length > 0) {
      await confirm({
        mode: "alert",
        variant: "danger",
        title: "Stock Entry Is Incomplete",
        message: errors.join("\n"),
        confirmLabel: "Review",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateStockEntry = {
        ...formData,
        items: formData.items.map((item) => ({
          ...item,
          quantity: String(Number(item.quantity)),
          unit_price: String(Number(item.unit_price)),
        })),
      };

      if (!isNewEntry && stockEntryId) {
        const response = await updateStockEntry(stockEntryId, payload);
        showSuccess(response.message || "Stock entry updated successfully.");
        const updatedEntry = response?.stock_entry;
        if (updatedEntry?.status_key) {
          setCurrentStatusKey(updatedEntry.status_key);
        }
        setIsEditing(false);
      } else {
        const response = await createStockEntry(payload);
        showSuccess(response.message || "Stock entry saved as draft.");
        const createdEntry = response?.stock_entry;
        const nextPostingNumber =
          createdEntry?.posting_number || response?.posting_number;
        const nextStockEntryId = createdEntry?.id || response?.id;

        navigate(
          `/inventory/stock-entries/${nextPostingNumber}?id=${nextStockEntryId}`,
          {
            state: { stockEntryId: nextStockEntryId },
          },
        );
      }
    } catch (error: unknown) {
      const message =
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response
          ? (error.response as { data?: { error?: string; message?: string } })
              ?.data?.error ||
            (error.response as { data?: { error?: string; message?: string } })
              ?.data?.message
          : "Failed to save stock entry.";
      showError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitDraft = async () => {
    if (!stockEntryId || currentStatusKey !== "draft") return;

    const { confirmed } = await confirm({
      title: "Post Stock Entry",
      message:
        "This will change the document status from Draft to Posted. Continue?",
      confirmLabel: "Post Entry",
      cancelLabel: "Cancel",
      variant: "info",
    });

    if (!confirmed) return;

    setIsPosting(true);
    try {
      const response = await submitStockEntry(stockEntryId);
      const updatedEntry = response?.stock_entry;

      if (updatedEntry) {
        setCurrentStatusKey(updatedEntry.status_key || "posted");
      }

      setIsEditing(false);
      showSuccess(response.message || "Stock entry posted successfully.");
    } catch (error: unknown) {
      const message =
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response
          ? (error.response as { data?: { error?: string; message?: string } })
              ?.data?.error ||
            (error.response as { data?: { error?: string; message?: string } })
              ?.data?.message
          : "Failed to post stock entry.";
      showError(message);
    } finally {
      setIsPosting(false);
    }
  };

  const handleCancelPosted = async () => {
    if (!stockEntryId || currentStatusKey !== "posted") return;

    const { confirmed } = await confirm({
      title: "Cancel Stock Entry",
      message:
        "This will change the document status from Posted to Cancelled. Continue?",
      confirmLabel: "Cancel Document",
      cancelLabel: "Keep Posted",
      variant: "danger",
    });

    if (!confirmed) return;

    setIsCancelling(true);
    try {
      const response = await cancelStockEntry(stockEntryId);
      const updatedEntry = response?.stock_entry;

      if (updatedEntry?.status_key) {
        setCurrentStatusKey(updatedEntry.status_key);
      }

      setIsEditing(false);
      showSuccess(response.message || "Stock entry cancelled successfully.");
    } catch (error: unknown) {
      const message =
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response
          ? (error.response as { data?: { error?: string; message?: string } })
              ?.data?.error ||
            (error.response as { data?: { error?: string; message?: string } })
              ?.data?.message
          : "Failed to cancel stock entry.";
      showError(message);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleDuplicate = () => {
    navigate("/inventory/stock-entries/new-stock-entry", {
      state: { duplicateStockEntry: formData },
    });
    setIsActionsOpen(false);
  };

  const handleCopyToClipboard = async () => {
    const summary = {
      postingNumber: postingNumber || "Draft",
      stockEntryId,
      supplierId: formData.supplier_id,
      invoiceNumber: formData.invoice_number,
      tax: formData.tax,
      notes: formData.notes,
      items: formData.items,
    };

    await navigator.clipboard.writeText(JSON.stringify(summary, null, 2));
    showSuccess("Stock entry copied to clipboard.");
    setIsActionsOpen(false);
  };

  const handlePrint = () => {
    window.print();
    setIsActionsOpen(false);
  };

  const handleShare = async () => {
    const shareText = `${postingNumber || "Draft stock entry"} | Invoice ${formData.invoice_number || "-"}`;

    if (navigator.share) {
      await navigator.share({
        title: postingNumber || "Stock Entry",
        text: shareText,
      });
    } else {
      await navigator.clipboard.writeText(shareText);
      showSuccess("Share summary copied to clipboard.");
    }

    setIsActionsOpen(false);
  };

  const handleExport = () => {
    const payload = {
      postingNumber,
      stockEntryId,
      status: currentStatusKey,
      ...formData,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${postingNumber || "stock-entry"}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setIsActionsOpen(false);
  };

  const handleDelete = async () => {
    if (!stockEntryId || isNewEntry) return;

    if (currentStatusKey === "posted") {
      await confirm({
        mode: "alert",
        variant: "danger",
        title: "Cannot Delete Stock Entry",
        message:
          "This stock entry is posted. Cancel the document before deleting it.",
        confirmLabel: "OK",
      });
      return;
    }

    const { confirmed } = await confirm({
      title: "Delete Stock Entry",
      message:
        "This will permanently delete this stock entry. You cannot undo this action.",
      confirmLabel: "Delete Entry",
      cancelLabel: "Back",
      variant: "danger",
    });

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const response = await deleteStockEntry(stockEntryId);
      showSuccess(response.message || "Stock entry deleted successfully.");
      navigate("/inventory/stock-entries");
    } catch (error: unknown) {
      const message =
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response
          ? (error.response as { data?: { error?: string; message?: string } })
              ?.data?.error ||
            (error.response as { data?: { error?: string; message?: string } })
              ?.data?.message
          : "Failed to delete stock entry.";

      await confirm({
        mode: "alert",
        variant: "danger",
        title: "Cannot Delete Stock Entry",
        message,
        confirmLabel: "OK",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const isExistingEntryLoading = stockEntryQuery.isLoading && !isNewEntry;
  const canEditForm = isNewEntry || isEditing;
  const canEditDraft =
    !isNewEntry && !!stockEntryId && currentStatusKey === "draft" && !isEditing;
  const canCancelPosted =
    !isNewEntry &&
    !!stockEntryId &&
    currentStatusKey === "posted" &&
    !isEditing;
  const canAmendCancelled =
    !isNewEntry &&
    !!stockEntryId &&
    currentStatusKey === "cancelled" &&
    !isEditing;
  const canPostDraft =
    !isNewEntry && !!stockEntryId && currentStatusKey === "draft" && !isEditing;
  const canSave = canEditForm;
  const submitLabel = isSubmitting
    ? isNewEntry
      ? "Saving Draft..."
      : "Saving..."
    : isNewEntry
      ? "Save Draft"
      : "Save";
  const modeLabel = isNewEntry
    ? "New Draft"
    : isEditing
      ? currentStatusKey === "cancelled"
        ? "Amending Cancelled Entry"
        : "Editing Draft"
      : currentStatusKey === "posted"
        ? "Posted"
        : currentStatusKey === "cancelled"
          ? "Cancelled"
          : "Draft Review";
  const documentReference =
    !isNewEntry && postingNumber ? postingNumber : "Auto";

  return (
    <DocumentPage>
      <DocumentHeader
        eyebrow="Stock Transactions"
        title={isNewEntry ? "Create Stock Entry" : "Stock Entry"}
        description="Use the same receipt layout for supplier stock intake, batch capture, and posting review."
        onBack={() => navigate("/inventory/stock-entries")}
        meta={
          <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
            Ref: {documentReference}
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
                onClick={() => {
                  if (stockEntryQuery.data) {
                    setIsEditing(false);
                    setFormData({
                      supplier_id: stockEntryQuery.data.supplier_id,
                      invoice_number: stockEntryQuery.data.invoice_number,
                      tax: stockEntryQuery.data.tax.toString(),
                      notes: stockEntryQuery.data.notes,
                      items: stockEntryQuery.data.items.map(
                        (item: {
                          medicine_id: number;
                          batch_number: string;
                          manufacturing_date: string;
                          expiry_date: string;
                          quantity: number;
                          unit_price: string;
                          reference: string;
                          notes: string;
                        }) => ({
                          medicine_id: item.medicine_id,
                          batch_number: item.batch_number,
                          manufacturing_date: item.manufacturing_date,
                          expiry_date: item.expiry_date,
                          quantity: item.quantity.toString(),
                          unit_price: item.unit_price.toString(),
                          reference: item.reference,
                          notes: item.notes,
                        }),
                      ),
                    });
                  }
                }}
                className={documentSecondaryButtonClassName}
              >
                Cancel
              </button>
            )}
            {canCancelPosted && (
              <button
                type="button"
                onClick={handleCancelPosted}
                disabled={isCancelling || isSubmitting || isPosting}
                className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-rose-700 shadow-sm transition-all hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300 dark:hover:bg-rose-950/30"
              >
                {isCancelling ? "Cancelling..." : "Cancel Document"}
              </button>
            )}
            {canPostDraft && (
              <button
                type="button"
                onClick={handleSubmitDraft}
                disabled={isPosting || isSubmitting}
                className="inline-flex items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-amber-700 shadow-sm transition-all hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300 dark:hover:bg-amber-950/30"
              >
                {isPosting ? "Posting..." : "Post"}
              </button>
            )}
            {canSave && (
              <button
                type="submit"
                form="stock-entry-form"
                disabled={
                  isSubmitting ||
                  isExistingEntryLoading ||
                  isPosting ||
                  isCancelling
                }
                className={documentPrimaryButtonClassName}
              >
                {submitLabel}
              </button>
            )}
            <StockEntryActionsMenu
              isOpen={isActionsOpen}
              onToggle={() => setIsActionsOpen((prev) => !prev)}
              onClose={() => setIsActionsOpen(false)}
              onDuplicate={handleDuplicate}
              onCopyToClipboard={handleCopyToClipboard}
              onPrint={handlePrint}
              onShare={handleShare}
              onExport={handleExport}
              onDelete={() => {
                void handleDelete();
                setIsActionsOpen(false);
              }}
              deleteLabel={
                isDeleting ? "Deleting Stock Entry..." : "Delete Stock Entry"
              }
            />
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DocumentSummaryCard
          label="Document Mode"
          value={modeLabel}
          hint={
            isNewEntry
              ? "Posting number generated on save"
              : isEditing
                ? currentStatusKey === "cancelled"
                  ? "Amend mode enabled; saving returns this document to draft"
                  : "Editing enabled for this draft"
                : currentStatusKey === "posted"
                  ? "Posted documents can be cancelled before amendment"
                  : currentStatusKey === "cancelled"
                    ? "Use Amend to unlock editing and move back to draft on save"
                    : "Open in review mode until edit is enabled"
          }
          tone="blue"
        />
        <DocumentSummaryCard
          label="Receipt Lines"
          value={numberFormatter.format(formData.items.length)}
          hint="Line items currently in this document"
          tone="slate"
        />
        <DocumentSummaryCard
          label="Total Quantity"
          value={numberFormatter.format(totalQuantity)}
          hint="Sum of all line quantities"
          tone="amber"
        />
        <DocumentSummaryCard
          label="Grand Total"
          value={currencyFormatter.format(totals.grandTotal)}
          hint="Subtotal plus tax"
          tone="emerald"
          valueClassName="text-emerald-700 dark:text-emerald-300"
        />
      </section>

      {isExistingEntryLoading && (
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          Loading existing stock entry...
        </div>
      )}

      <form id="stock-entry-form" onSubmit={handleSubmit} className="space-y-6">
        <DocumentCard
          title="Receipt Details"
          description="Capture the supplier reference and posting context before entering receipt lines."
          accent="blue"
        >
          <div className="grid gap-5 md:grid-cols-3">
            <DocumentField label="Supplier">
              <SearchableSelect
                options={supplierGroups}
                value={
                  formData.supplier_id != null
                    ? String(formData.supplier_id)
                    : ""
                }
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    supplier_id: value ? Number(value) : null,
                  }))
                }
                onSearch={setSupplierInputSearch}
                placeholder="Search supplier"
                triggerClassName={documentSelectTriggerClassName}
                disabled={!canEditForm}
                onCreateNew={() => navigate("/inventory/suppliers/new")}
                createNewText="Add New Supplier"
              />
            </DocumentField>
            <DocumentField label="Invoice Number">
              <input
                value={formData.invoice_number}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    invoice_number: e.target.value,
                  }))
                }
                className={documentInputClassName}
                placeholder="Supplier invoice / GRN reference"
                disabled={!canEditForm}
              />
            </DocumentField>
            <DocumentField label="Tax">
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.tax}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, tax: e.target.value }))
                }
                className={`${documentInputClassName} appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
                placeholder="0.00"
                disabled={!canEditForm}
              />
            </DocumentField>
            <div className="md:col-span-3">
              <DocumentField
                label="Notes"
                hint="Optional internal receiving notes"
              >
                <textarea
                  rows={4}
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  className={documentTextareaClassName}
                  placeholder="Document any special handling, discrepancies, or receiving notes"
                  disabled={!canEditForm}
                />
              </DocumentField>
            </div>
          </div>
        </DocumentCard>

        <DocumentCard
          title="Receipt Lines"
          description="Each line increases stock for the selected item and batch details."
          accent="amber"
          action={
            canEditForm ? (
              <button
                type="button"
                onClick={addRow}
                className={documentSecondaryButtonClassName}
              >
                Add Line
              </button>
            ) : undefined
          }
          contentClassName="space-y-4"
        >
          {formData.items.map((item, index) => (
            <StockEntryLineItemCard
              key={index}
              index={index}
              item={item}
              isEditable={canEditForm}
              canRemove={canEditForm && formData.items.length > 1}
              medicineOptions={medicineOptionsByRow[index] || []}
              selectedMedicine={
                (medicineDetailQueries[index]?.data as
                  | MedicineItem
                  | undefined) || undefined
              }
              isMedicineLoading={Boolean(
                item.medicine_id && medicineDetailQueries[index]?.isLoading,
              )}
              hasMedicineError={Boolean(
                item.medicine_id && medicineDetailQueries[index]?.isError,
              )}
              onSearchMedicine={(value) =>
                setMedicineSearchTerms((prev) => ({
                  ...prev,
                  [index]: value,
                }))
              }
              onChangeField={setItemField}
              onRemove={removeRow}
            />
          ))}
        </DocumentCard>

        <section className="grid gap-4 md:grid-cols-3">
          <DocumentSummaryCard
            label="Subtotal"
            value={currencyFormatter.format(totals.subtotal)}
            hint={`${numberFormatter.format(totalQuantity)} units before tax`}
            tone="slate"
          />
          <DocumentSummaryCard
            label="Tax"
            value={currencyFormatter.format(totals.tax)}
            hint="Document-level tax adjustment"
            tone="amber"
          />
          <DocumentSummaryCard
            label="Grand Total"
            value={currencyFormatter.format(totals.grandTotal)}
            hint="Amount that will be posted"
            tone="emerald"
            valueClassName="text-emerald-700 dark:text-emerald-300"
          />
        </section>

        {!isNewEntry && (
          <DocumentActivityLog
            logs={logs}
            isLoading={isLogsLoading}
            onViewAll={() => navigate("/audit-logs")}
            title="Activity Log"
            description="Recent changes made only to this stock entry."
          />
        )}
      </form>
    </DocumentPage>
  );
};

export default StockEntryPage;
