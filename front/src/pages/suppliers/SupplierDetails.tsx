import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Log, Supplier } from "../../types/types";
import { useToast } from "../../hooks/useToast";
import { useConfirmDialog } from "../../hooks/useConfirmDialog";
import {
  cancelSupplier,
  fetchSupplierByNamingSeries,
  fetchSupplierLogs,
  updateSupplier,
} from "../../services/suppler";
import {
  ChevronLeft,
  Edit2,
  Save,
  X,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  History,
  CheckCircle2,
  AlertCircle,
  Ban,
  Activity,
  Package,
  Clock,
  ExternalLink,
} from "lucide-react";
import { GetErrorMessage } from "@/src/components/ShowErrorToast";
import DocumentActivityLog from "../../components/common/DocumentActivityLog";
import StockEntryActionsMenu from "../stock-entries/StockEntryActionsMenu";

const parseLogDetails = (raw: string): Record<string, unknown> | null => {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
};

const formatLogLines = (log: Log) => {
  const details = parseLogDetails(log.details);
  const actor = log.username || `User #${log.user_id}`;

  if (!details) {
    return [`${actor}: ${log.details}`];
  }

  const changesRaw = details.changes;
  if (
    changesRaw &&
    typeof changesRaw === "object" &&
    !Array.isArray(changesRaw)
  ) {
    return Object.entries(
      changesRaw as Record<string, { from?: unknown; to?: unknown }>,
    ).map(([field, delta]) => {
      const from = delta?.from ?? "—";
      const to = delta?.to ?? "—";
      return `${actor} changed ${field.replace(/_/g, " ")} from '${String(from)}' to '${String(to)}'.`;
    });
  }

  const summary = Object.entries(details)
    .map(([key, value]) => `${key.replace(/_/g, " ")}=${String(value)}`)
    .join(" • ");

  return [summary ? `${actor}: ${summary}` : `${actor}: ${log.action}`];
};

const SupplierDetails: React.FC = () => {
  const { naming_series } = useParams<{ naming_series: string }>();
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const { confirm } = useConfirmDialog();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [editForm, setEditForm] = useState<Supplier | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLogsLoading, setIsLogsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isActionsOpen, setIsActionsOpen] = useState(false);

  useEffect(() => {
    const loadSupplier = async () => {
      if (!naming_series) return;

      try {
        const data = await fetchSupplierByNamingSeries(naming_series);
        setSupplier(data);
      } catch (error) {
        showError(
          (error as Error).message || "Failed to load supplier details.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadSupplier();
  }, [naming_series, showError]);

  useEffect(() => {
    const loadLogs = async () => {
      if (!supplier?.id) return;

      setIsLogsLoading(true);
      try {
        const data = await fetchSupplierLogs(supplier.id);
        setLogs(data);
      } catch (error) {
        console.error("Supplier logs load error", error);
      } finally {
        setIsLogsLoading(false);
      }
    };

    void loadLogs();
  }, [supplier?.id]);

  const validationErrors = useMemo(() => {
    if (!editForm) return [];

    const errors: string[] = [];
    const trimmedName = (editForm.name || "").trim();
    if (!trimmedName) {
      errors.push("Supplier name is required.");
    }
    if (trimmedName.length > 200) {
      errors.push("Supplier name must be 200 characters or less.");
    }
    if ((editForm.contact_person || "").trim().length > 150) {
      errors.push("Contact person must be 150 characters or less.");
    }
    if ((editForm.phone || "").trim().length > 20) {
      errors.push("Phone number must be 20 characters or less.");
    }
    return errors;
  }, [editForm]);

  const handleFieldChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = event.target;
    const nextValue =
      type === "checkbox" ? (event.target as HTMLInputElement).checked : value;

    setEditForm((prev) => (prev ? { ...prev, [name]: nextValue } : prev));
  };

  const handleSave = async () => {
    if (!supplier || !editForm) return;

    if (validationErrors.length > 0) {
      await confirm({
        mode: "alert",
        variant: "danger",
        title: "Cannot Save Supplier",
        message: validationErrors.map((item) => `• ${item}`).join("\n"),
        confirmLabel: "Review",
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await updateSupplier(supplier.id!, {
        name: editForm.name,
        contact_person: editForm.contact_person,
        phone: editForm.phone,
        email: editForm.email,
        address: editForm.address,
        status: "Draft",
        is_active: editForm.is_active,
      });

      const updated = response.supplier ?? response;
      setSupplier(updated);
      setEditForm(updated);
      setIsEditing(false);
      showSuccess(response.message || "Supplier updated successfully.");
    } catch (error: unknown) {
      showError(GetErrorMessage(error, "supplier", "update"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!supplier?.id) return;

    try {
      const response = await updateSupplier(supplier.id, {
        status: "Submitted",
      });
      const updated = response.supplier ?? response;
      setSupplier(updated);
      setEditForm(updated);
      showSuccess(response.message || "Supplier submitted successfully.");
    } catch (error: unknown) {
      showError(GetErrorMessage(error, "supplier", "submit"));
    }
  };

  const handleToggleActive = async (isActive: boolean) => {
    if (!supplier?.id) return;

    try {
      const response = await updateSupplier(supplier.id, {
        is_active: isActive,
      });
      const updated = response.supplier ?? response;
      setSupplier(updated);
      setEditForm(updated);
      showSuccess(
        response.message ||
          `Supplier ${isActive ? "activated" : "inactivated"} successfully.`,
      );
    } catch (error: unknown) {
      showError(GetErrorMessage(error, "supplier", "toggle active"));
    }
  };

  const handleCancelSupplier = async () => {
    if (!supplier?.id) return;

    const result = await confirm({
      title: "Cancel Supplier",
      message:
        "This will mark the supplier as cancelled and inactive. You can still view the record later.",
      confirmLabel: "Cancel Supplier",
      cancelLabel: "Back",
      variant: "danger",
    });

    if (!result.confirmed) return;

    try {
      const response = await cancelSupplier(supplier.id);
      const updated = response.supplier ?? response;
      setSupplier(updated);
      setEditForm(updated);
      showSuccess(response.message || "Supplier cancelled successfully.");
    } catch (error: unknown) {
      showError(GetErrorMessage(error, "supplier", "cancel"));
    }
  };

  const handleDuplicate = () => {
    if (!supplier) return;

    navigate("/inventory/suppliers/new", {
      state: {
        duplicateSupplier: {
          ...supplier,
          status: "Draft",
        },
      },
    });
  };

  const handleCopyToClipboard = async () => {
    if (!supplier || !navigator.clipboard) return;

    const summary = [
      `Supplier: ${supplier.name}`,
      `Contact Person: ${supplier.contact_person || "-"}`,
      `Phone: ${supplier.phone || "-"}`,
      `Email: ${supplier.email || "-"}`,
      `Address: ${supplier.address || "-"}`,
      `Status: ${supplier.status || "Draft"}`,
      `Activity: ${supplier.is_active ? "Active" : "Inactive"}`,
    ].join("\n");

    await navigator.clipboard.writeText(summary);
    showSuccess("Supplier details copied to clipboard.");
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (!supplier) return;

    const shareData = {
      title: supplier.name,
      text: `Supplier ${supplier.name}`,
      url: window.location.href,
    };

    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(window.location.href);
      showSuccess("Supplier link copied to clipboard.");
    }
  };

  const handleExport = () => {
    if (!supplier) return;

    const blob = new Blob([JSON.stringify(supplier, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${supplier.name.replace(/\s+/g, "-").toLowerCase()}-supplier.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
          Loading supplier details...
        </p>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="p-12 text-center">
        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-slate-300" />
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
          Supplier not found.
        </p>
        <button
          onClick={() => navigate("/inventory/suppliers")}
          className="mt-4 text-xs font-black uppercase tracking-[0.2em] text-emerald-600 hover:underline"
        >
          Back to registry
        </button>
      </div>
    );
  }

  const current = isEditing && editForm ? editForm : supplier;

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-500 pb-20 px-4 sm:px-6 lg:px-10">
      <header className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="flex items-start space-x-5">
          <button
            onClick={() => navigate("/inventory/suppliers")}
            className="mt-1 rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 shadow-sm transition-all hover:bg-slate-50 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white md:text-3xl">
                {supplier.name}
              </h1>
              <span
                className={`rounded-md px-2 py-1 text-[8px] font-black uppercase tracking-[0.2em] ${
                  supplier.status === "Submitted"
                    ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : supplier.status === "Cancelled"
                      ? "border border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                      : "border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                }`}
              >
                {supplier.status || "Draft"}
              </span>
            </div>
            <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
              Supplier ID #{supplier.id} • Registered on{" "}
              {supplier.updated_at
                ? new Date(supplier.updated_at).toLocaleDateString()
                : "N/A"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span
                className={`rounded-md border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.2em] ${
                  supplier.is_active
                    ? "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-900/30 dark:bg-emerald-950/30 dark:text-emerald-400"
                    : "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                {supplier.is_active ? "Active" : "Inactive"}
              </span>
              <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {supplier.medicine_count ?? 0} linked medicines
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {!isEditing && supplier.status === "Draft" && (
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-xs font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-emerald-600/20 transition-all hover:bg-emerald-500"
            >
              <CheckCircle2 className="h-4 w-4" />
              Submit
            </button>
          )}
          {!isEditing && (
            <button
              onClick={() => {
                setEditForm(supplier);
                setIsEditing(true);
              }}
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-xs font-black uppercase tracking-[0.2em] text-white shadow-xl transition-all hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            >
              <Edit2 className="h-4 w-4" />
              Edit
            </button>
          )}
          {isEditing && (
            <>
              <button
                onClick={() => {
                  setEditForm(supplier);
                  setIsEditing(false);
                }}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-slate-600 transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
                Discard
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-xs font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-emerald-600/20 transition-all hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </>
          )}
          <StockEntryActionsMenu
            isOpen={isActionsOpen}
            onToggle={() => setIsActionsOpen((prev) => !prev)}
            onClose={() => setIsActionsOpen(false)}
            onDuplicate={() => {
              handleDuplicate();
              setIsActionsOpen(false);
            }}
            onCopyToClipboard={() => {
              void handleCopyToClipboard();
              setIsActionsOpen(false);
            }}
            onPrint={() => {
              handlePrint();
              setIsActionsOpen(false);
            }}
            onShare={() => {
              void handleShare();
              setIsActionsOpen(false);
            }}
            onExport={() => {
              handleExport();
              setIsActionsOpen(false);
            }}
          />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        <div className="group rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
              Activity
            </p>
            <Activity className="h-4 w-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
          </div>
          <p
            className={`text-xl font-black ${supplier.is_active ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`}
          >
            {supplier.is_active ? "Active" : "Inactive"}
          </p>
        </div>
        <div className="group rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
              Status
            </p>
            <Clock className="h-4 w-4 text-slate-300 group-hover:text-amber-500 transition-colors" />
          </div>
          <p className="text-xl font-black text-slate-900 dark:text-white">
            {supplier.status || "Draft"}
          </p>
        </div>
        <div className="group rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
              Linked Medicines
            </p>
            <Package className="h-4 w-4 text-slate-300 group-hover:text-sky-500 transition-colors" />
          </div>
          <p className="text-xl font-black text-slate-900 dark:text-white">
            {supplier.medicine_count ?? 0}
          </p>
        </div>
        <div className="group rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
              Last Updated
            </p>
            <History className="h-4 w-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
          </div>
          <p className="text-sm font-black text-slate-900 dark:text-white">
            {supplier.updated_at
              ? new Date(supplier.updated_at).toLocaleString()
              : "N/A"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-8">
          <section className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-8 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">
                <Building2 className="h-4 w-4 text-emerald-500" />
                Supplier Master Data
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                  <Building2 className="h-3 w-3" />
                  Supplier Name
                </label>
                <input
                  name="name"
                  value={current.name}
                  onChange={handleFieldChange}
                  disabled={!isEditing}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-default disabled:opacity-80 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                  <User className="h-3 w-3" />
                  Contact Person
                </label>
                <input
                  name="contact_person"
                  value={current.contact_person || ""}
                  onChange={handleFieldChange}
                  disabled={!isEditing}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-default disabled:opacity-80 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                  <Phone className="h-3 w-3" />
                  Phone
                </label>
                <input
                  name="phone"
                  value={current.phone || ""}
                  onChange={handleFieldChange}
                  disabled={!isEditing}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-default disabled:opacity-80 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                  <Mail className="h-3 w-3" />
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  value={current.email || ""}
                  onChange={handleFieldChange}
                  disabled={!isEditing}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-default disabled:opacity-80 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                  <Clock className="h-3 w-3" />
                  Status
                </label>
                <select
                  name="status"
                  value={current.status || "Draft"}
                  onChange={handleFieldChange}
                  disabled={!isEditing}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-default disabled:opacity-80 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                >
                  <option value="Draft">Draft</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div className="flex items-end">
                <label
                  className={`flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition-all dark:border-slate-800 dark:bg-slate-800 ${isEditing ? "hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer" : "cursor-default"}`}
                >
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={!!current.is_active}
                    onChange={handleFieldChange}
                    disabled={!isEditing}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300">
                    Active supplier
                  </span>
                </label>
              </div>
            </div>
            <div className="mt-6 space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                <MapPin className="h-3 w-3" />
                Address
              </label>
              <textarea
                name="address"
                value={current.address || ""}
                onChange={handleFieldChange}
                disabled={!isEditing}
                rows={4}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-default disabled:opacity-80 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </section>

          {false && (
            <section className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-8 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">
                  <History className="h-4 w-4 text-emerald-500" />
                  Audit Trail
                </h3>
                <button
                  onClick={() => navigate("/audit-logs")}
                  className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 transition-all hover:underline dark:text-emerald-400"
                >
                  Full History
                  <ExternalLink className="h-3 w-3" />
                </button>
              </div>
              <div className="space-y-4">
                {isLogsLoading ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center dark:border-slate-800 dark:bg-slate-800/30">
                    <div className="mx-auto mb-3 h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-transparent" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      Loading audit entries...
                    </p>
                  </div>
                ) : logs.length > 0 ? (
                  logs.map((log) => (
                    <div
                      key={log.log_id}
                      className="group rounded-2xl border border-slate-100 bg-slate-50/70 p-5 transition-all hover:bg-white hover:shadow-md dark:border-slate-800 dark:bg-slate-800/30 dark:hover:bg-slate-800/50"
                    >
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                        <span className="rounded-md bg-slate-200 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                          {log.action}
                        </span>
                        <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
                          <Clock className="h-3 w-3" />
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="space-y-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
                        {formatLogLines(log).map((line, index) => (
                          <p
                            key={`${log.log_id}-${index}`}
                            className="flex items-start gap-2"
                          >
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-300" />
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center dark:border-slate-800 dark:bg-slate-800/30">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      No audit entries found
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => handleToggleActive(!supplier.is_active)}
                className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                <span>
                  {supplier.is_active ? "Set Inactive" : "Set Active"}
                </span>
                <Ban
                  className={`h-3.5 w-3.5 ${supplier.is_active ? "text-rose-500" : "text-emerald-500"}`}
                />
              </button>
              <button
                onClick={handleCancelSupplier}
                disabled={supplier.status === "Cancelled"}
                className="flex w-full items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-3.5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-rose-700 transition-all hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/60"
              >
                <span>Cancel Supplier</span>
                <AlertCircle className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-emerald-600/5 p-6 dark:border-emerald-900/20 dark:bg-emerald-950/20">
            <h3 className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-emerald-900 dark:text-emerald-300">
              Supplier Insights
            </h3>
            <p className="text-[11px] font-medium leading-relaxed text-emerald-700/70 dark:text-emerald-400/60">
              This supplier is currently linked to{" "}
              {supplier.medicine_count ?? 0} items in your inventory.
              {supplier.is_active
                ? " They are active and eligible for new stock entries."
                : " They are currently inactive."}
            </p>
          </div>
        </aside>
      </div>
      <DocumentActivityLog
        logs={logs}
        isLoading={isLogsLoading}
        onViewAll={() => navigate("/audit-logs")}
        title="Audit Trail"
        description="Recent changes made only to this supplier."
      />
    </div>
  );
};

export default SupplierDetails;
