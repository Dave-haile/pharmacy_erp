import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Log, MedicineItem } from "../types/types";
import {
  Save,
  X,
  Edit3,
  Trash2,
  Copy,
  Clock,
  Tag,
  Package,
  DollarSign,
  Barcode,
  Factory,
  Info,
  ChevronRight,
  LayoutGrid,
  FileText,
  BarChart3,
  Activity,
  ShieldCheck,
  MoreVertical,
  Printer,
  Clipboard,
  Share2,
  Download,
} from "lucide-react";
import SearchableSelect from "./SearchableSelect";
import { useCategories, useSuppliers } from "../services/common";
import { useToast } from "../hooks/useToast";
import { useConfirmDialog } from "../hooks/useConfirmDialog";
import {
  deleteMedicine,
  fetchMedicineById,
  fetchMedicineLogs,
  updateMedicine,
} from "../services/medicines";
import DocumentActivityLog from "./common/DocumentActivityLog";

const MedicineDetails: React.FC = () => {
  const { naming_series } = useParams<{ naming_series: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<MedicineItem | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLogsLoading, setIsLogsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState<MedicineItem | null>(null);
  const [categoryInputSearch, setCategoryInputSearch] = useState("");
  const [supplierInputSearch, setSupplierInputSearch] = useState("");
  const { showError, showSuccess } = useToast();
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const { confirm } = useConfirmDialog();

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const data = await fetchMedicineById(naming_series);
        setItem(data);
      } catch (err) {
        console.error("Item Detail Load Error:", err);
        showError((err as Error).message || "Failed to load item details");
      } finally {
        setIsLoading(false);
      }
    };
    fetchItem();
  }, [naming_series, showError]);

  useEffect(() => {
    const run = async () => {
      if (!item?.id) return;
      setIsLogsLoading(true);
      try {
        const data = await fetchMedicineLogs(item.id);
        setLogs(data);
      } catch (err) {
        console.error("Medicine Logs Load Error:", err);
      } finally {
        setIsLogsLoading(false);
      }
    };
    run();
  }, [item?.id]);

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

  const parseLogTimestamp = (value: string): Date | null => {
    const d1 = new Date(value);
    if (!Number.isNaN(d1.getTime())) return d1;
    // sometimes backend returns "YYYY-MM-DD HH:mm:ss.ffffff-09"
    const normalized = value.replace(" ", "T");
    const d2 = new Date(normalized);
    if (!Number.isNaN(d2.getTime())) return d2;
    return null;
  };

  const fieldLabel = (key: string) => {
    const map: Record<string, string> = {
      name: "name",
      generic_name: "generic name",
      barcode: "barcode",
      category_id: "category",
      supplier_id: "supplier",
      cost_price: "cost price",
      selling_price: "selling price",
      status: "status",
      description: "description",
      is_active: "active status",
    };
    return map[key] ?? key.replace(/_/g, " ");
  };

  const prettyValue = (v: unknown) => {
    if (v === null || v === undefined) return "—";
    if (typeof v === "boolean") return v ? "Yes" : "No";
    if (typeof v === "number") return String(v);
    if (typeof v === "string") return v.length ? v : "—";
    return JSON.stringify(v);
  };

  const formatLogDetailsText = (
    log: Log,
    detailsObj: Record<string, unknown> | null,
  ): string[] => {
    const actor = log.username || "Administrator";
    if (!detailsObj) return [`${actor}: ${log.details}`];

    const changesRaw = detailsObj["changes"];
    if (
      changesRaw &&
      typeof changesRaw === "object" &&
      !Array.isArray(changesRaw)
    ) {
      const changes = changesRaw as Record<
        string,
        { from?: unknown; to?: unknown }
      >;

      const lines = Object.entries(changes).map(([field, delta]) => {
        const from = prettyValue(delta?.from);
        const to = prettyValue(delta?.to);
        return `${actor} changed value of '${fieldLabel(field)}' from '${from}' to '${to}'.`;
      });

      return lines.length ? lines : [`${actor} updated this item.`];
    }

    // For create logs, show key fields but as a sentence (no JSON blob)
    const medicineId = detailsObj["medicine_id"];
    const naming = detailsObj["naming_series"];
    const name = detailsObj["name"];
    const generic = detailsObj["generic_name"];

    const parts = [
      medicineId != null ? `ID ${prettyValue(medicineId)}` : null,
      naming != null ? `Series ${prettyValue(naming)}` : null,
      name != null ? `Name ${prettyValue(name)}` : null,
      generic != null ? `Generic ${prettyValue(generic)}` : null,
    ].filter(Boolean) as string[];

    if (parts.length) return [`${actor}: ${parts.join(" • ")}`];

    // Fallback: show remaining keys as "key=value" pairs
    const pairs = Object.entries(detailsObj).map(
      ([k, v]) => `${fieldLabel(k)}=${prettyValue(v)}`,
    );
    return pairs.length
      ? [`${actor}: ${pairs.join(" • ")}`]
      : [`${actor}: ${log.action}`];
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    const val =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setEditForm((prev: MedicineItem | null) =>
      prev ? { ...prev, [name]: val } : prev,
    );
  };

  const { itemGroups } = useCategories(categoryInputSearch);

  const validateEditForm = (data: MedicineItem): string[] => {
    const errors: string[] = [];

    const name = (data.name || "").trim();
    if (!name) {
      errors.push("Commercial name is required.");
    } else if (name.length > 200) {
      errors.push("Commercial name must be at most 200 characters.");
    }

    const generic = (data.generic_name || "").trim();
    if (generic.length > 200) {
      errors.push("Generic name must be at most 200 characters.");
    }

    if (data.category_id == null) {
      errors.push("Material category is required.");
    }

    const barcode = (data.barcode || "").trim();
    if (!barcode) {
      errors.push("Barcode is required.");
    } else if (barcode.length > 100) {
      errors.push("Barcode must be at most 100 characters.");
    }

    const cost = Number(data.cost_price);
    if (
      data.cost_price === undefined ||
      data.cost_price === null ||
      data.cost_price === ""
    ) {
      errors.push("Unit cost is required.");
    } else if (!Number.isFinite(cost) || cost <= 0) {
      errors.push("Unit cost must be a positive number.");
    }

    const selling = Number(data.selling_price);
    if (
      data.selling_price === undefined ||
      data.selling_price === null ||
      data.selling_price === ""
    ) {
      errors.push("Market price is required.");
    } else if (!Number.isFinite(selling) || selling <= 0) {
      errors.push("Market price must be a positive number.");
    }

    return errors;
  };

  const handleSave = async () => {
    if (!editForm || !item) return;

    const errors = validateEditForm(editForm);
    if (errors.length > 0) {
      await confirm({
        mode: "alert",
        variant: "danger",
        title: "Cannot Save Changes",
        message:
          "Please resolve the following issues before saving:\n\n" +
          errors.map((e) => `• ${e}`).join("\n"),
        confirmLabel: "Review Fields",
      });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: editForm.name,
        generic_name: editForm.generic_name,
        barcode: editForm.barcode,
        category_id: editForm.category_id,
        supplier_id: editForm.supplier_id ?? null,
        cost_price: editForm.cost_price,
        selling_price: editForm.selling_price,
        description: editForm.description,
        is_active: editForm.is_active,
        status: "Draft",
      };

      const response = await updateMedicine(item.id, payload);

      const updated = response.medicine ?? response;
      setItem((prev) => (prev ? { ...prev, ...updated } : updated));
      setIsEditing(false);
      showSuccess(response.message || "Item updated successfully");
    } catch (err) {
      console.error("Save Error:", err);
      showError("Failed to update item");
    } finally {
      setIsSaving(false);
    }
  };

  const { supplierGroups } = useSuppliers(supplierInputSearch);

  const handleUpdate = async (newStatus: string) => {
    if (!item) return;

    try {
      const response = await updateMedicine(item.id, { status: newStatus });
      const updated = response.medicine ?? response;
      setItem((prev) => (prev ? { ...prev, ...updated } : updated));
      showSuccess(response.message || "Item status updated successfully");
    } catch (err) {
      console.error("Status Update Error:", err);
      showError("Failed to update status");
    }
  };

  const handleDuplicate = () => {
    if (!item) return;

    navigate("/inventory/medicines/new-medicine", {
      state: { duplicateItem: item },
    });
  };

  const handleCopyToClipboard = async () => {
    if (!item) return;
  };

  const handlePrint = async () => {
    if (!item) return;
    // const response = await printMedicine(item.id);
    // setItem((prev) => (prev ? { ...prev, ...response } : response));
    // showSuccess(response.message || "Item printed successfully");
  };

  const handleShare = async () => {
    if (!item) return;
    // const response = await shareMedicine(item.id);
    // setItem((prev) => (prev ? { ...prev, ...response } : response));
    // showSuccess(response.message || "Item shared successfully");
  };

  const handleExport = async () => {
    if (!item) return;
    // const response = await exportMedicine(item.id);
    // setItem((prev) => (prev ? { ...prev, ...response } : response));
    // showSuccess(response.message || "Item exported successfully");
  };

  const handleDelete = async () => {
    if (!item) return;

    const { confirmed } = await confirm({
      title: "Delete Specification",
      message:
        "Are you sure you want to delete this medicine from the registry? This action cannot be undone.",
      confirmLabel: "Delete Permanently",
      cancelLabel: "Cancel",
      variant: "danger",
      payload: { id: item.id, naming_series: item.naming_series },
    });

    if (!confirmed) return;

    const response = await deleteMedicine(String(item.id));
    showSuccess(response.message || "Item deleted successfully");
    navigate("/inventory/medicines");
  };

  if (isLoading)
    return (
      <div className="p-12 text-center">
        <div className="animate-spin h-6 w-6 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-3"></div>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[8px]">
          Accessing Registry...
        </p>
      </div>
    );

  if (!item)
    return (
      <div className="p-12 text-center">
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[8px]">
          Item not found.
        </p>
        <button
          onClick={() => navigate("/inventory/medicines")}
          className="mt-4 text-emerald-600 font-bold text-xs uppercase tracking-wider"
        >
          Back to Registry
        </button>
      </div>
    );

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-500 pb-20 px-4 sm:px-6 lg:px-10">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex items-start space-x-4">
          <button
            onClick={() => navigate("/inventory/medicines")}
            className="mt-1 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-slate-500 dark:text-slate-400 shadow-sm group"
          >
            <ChevronRight className="w-4 h-4 rotate-180 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none flex items-center gap-3">
              {item?.name}
              {isEditing ? (
                <span className="px-2 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[8px] font-black uppercase tracking-[0.2em] rounded-md border border-amber-500/20">
                  Drafting
                </span>
              ) : (
                <span
                  className={`px-2 py-1 text-[8px] font-black uppercase tracking-[0.2em] rounded-md border ${
                    (item.status || "Draft") === "Submitted"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                  }`}
                >
                  {item.status || "Draft"}
                </span>
              )}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-xs mt-1">
              {" "}
              <span className="font-sans text-emerald-600 dark:text-emerald-400 font-bold">
                {item?.category}
              </span>
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[9px] font-black uppercase tracking-widest rounded-md border border-slate-200 dark:border-slate-700">
                {item.naming_series}
              </span>
              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[9px] font-black uppercase tracking-widest rounded-md border border-slate-200 dark:border-slate-700">
                Barcode: {item.barcode || "---"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {!isEditing ? (
            item.status === "Draft" ? (
              <button
                onClick={() => handleUpdate("Submitted")}
                className="px-5 py-2.5 bg-accent cursor-pointer text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl"
              >
                Submit
              </button>
            ) : null
          ) : null}
          {!isEditing ? (
            <div className="flex items-center space-x-3 relative">
              <button
                key="edit-btn"
                onClick={() => {
                  setEditForm(item);
                  setIsEditing(true);
                }}
                className="flex items-center space-x-2 px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-slate-900/20 dark:shadow-white/10"
              >
                <span>Edit</span>
              </button>
              <div className="relative">
                <button
                  key="actions-btn"
                  onClick={() => setIsActionsOpen(!isActionsOpen)}
                  className={`p-2.5 rounded-xl border transition-all ${
                    isActionsOpen
                      ? "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm"
                  }`}
                >
                  <MoreVertical className="w-5 h-5" />
                </button>

                {isActionsOpen && (
                  <>
                    <div
                      onClick={() => setIsActionsOpen(false)}
                      className="fixed inset-0 z-40"
                    />
                    <div className="absolute right-0 mt-3 w-64 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden">
                      <div className="p-2 space-y-1">
                        <button
                          onClick={() => handleDuplicate()}
                          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group"
                        >
                          <Copy className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                          <span>Duplicate</span>
                        </button>
                        <button
                          onClick={() => handleCopyToClipboard()}
                          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group"
                        >
                          <Clipboard className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                          <span>Copy to Clipboard</span>
                        </button>
                        <button
                          onClick={() => handlePrint()}
                          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group"
                        >
                          <Printer className="w-4 h-4 text-slate-400 group-hover:text-purple-500 transition-colors" />
                          <span>Print</span>
                        </button>
                        <div className="h-px bg-slate-100 dark:bg-slate-800 my-1 mx-2" />
                        <button
                          onClick={() => handleShare()}
                          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group"
                        >
                          <Share2 className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
                          <span>Share Record</span>
                        </button>
                        <button
                          onClick={() => handleExport()}
                          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group"
                        >
                          <Download className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition-colors" />
                          <span>Export</span>
                        </button>
                        <div className="h-px bg-slate-100 dark:bg-slate-800 my-1 mx-2" />
                        <button
                          onClick={() => handleDelete()}
                          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all group"
                        >
                          <Trash2 className="w-4 h-4 text-red-400 group-hover:text-red-600 transition-colors" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div key="edit-actions" className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditForm(item);
                }}
                className="flex items-center space-x-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black text-slate-500 uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                <X className="w-4 h-4" />
                <span>Discard</span>
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center space-x-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-500 hover:shadow-emerald-500/40 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
              >
                {isSaving ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{isSaving ? "Synchronizing..." : "Commit Changes"}</span>
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8">
        {/* Main Content Area */}
        <div className="w-full space-y-8">
          {isEditing ? (
            <div
              key="edit-mode"
              className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-emerald-500/20 shadow-2xl shadow-emerald-500/5 overflow-hidden"
            >
              <div className="bg-emerald-500/5 px-6 py-4 border-b border-emerald-500/10 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <h3 className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">
                    Editing Master Record
                  </h3>
                </div>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-600 transition-colors">
                      Active Status
                    </span>
                    <div className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={!!editForm.is_active}
                        onChange={handleInputChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-600"></div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="p-8 space-y-10">
                {/* Section: Identity */}
                <section>
                  <div className="flex items-center space-x-2 mb-6">
                    <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                    <h4 className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-[0.2em]">
                      Product Identity
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="group space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center space-x-2 group-focus-within:text-emerald-500 transition-colors">
                        <Tag className="w-3 h-3" />
                        <span>Commercial Name</span>
                      </label>
                      <div className="relative">
                        <input
                          name="name"
                          value={editForm.name || ""}
                          onChange={handleInputChange}
                          placeholder="e.g. Paracetamol 500mg"
                          className="w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-focus-within:opacity-100 transition-opacity">
                          <Edit3 className="w-3.5 h-3.5 text-emerald-500" />
                        </div>
                      </div>
                    </div>
                    <div className="group space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center space-x-2 group-focus-within:text-emerald-500 transition-colors">
                        <Barcode className="w-3 h-3" />
                        <span>Inventory SKU / Barcode</span>
                      </label>
                      <input
                        name="barcode"
                        value={editForm.barcode || editForm.sku || ""}
                        onChange={handleInputChange}
                        placeholder="Scan or enter ID"
                        className="w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 text-sm font-mono font-bold outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                      />
                    </div>
                  </div>
                </section>

                {/* Section: Classification */}
                <section>
                  <div className="flex items-center space-x-2 mb-6">
                    <div className="w-1 h-4 bg-blue-500 rounded-full" />
                    <h4 className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-[0.2em]">
                      Classification & Logistics
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center space-x-2">
                        <Package className="w-3 h-3" />
                        <span>Material Category</span>
                      </label>
                      <div className="relative">
                        <SearchableSelect
                          options={itemGroups}
                          value={
                            editForm.category_id != null
                              ? String(editForm.category_id)
                              : ""
                          }
                          onChange={(val) =>
                            setEditForm((prev: MedicineItem | null) => {
                              if (!prev) return prev;
                              return {
                                ...prev,
                                category_id: val === "" ? null : Number(val),
                              };
                            })
                          }
                          onSearch={setCategoryInputSearch}
                          placeholder="Select Category"
                          className="w-full"
                          triggerClassName="bg-slate-50 dark:bg-[#1a1d21] border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white font-bold py-2"
                          onCreateNew={() => navigate("/items/new")}
                          createNewText="Add New Category"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center space-x-2">
                        <Factory className="w-3 h-3" />
                        <span>Supplier</span>
                      </label>
                      <SearchableSelect
                        options={supplierGroups}
                        value={
                          editForm.supplier_id != null
                            ? String(editForm.supplier_id)
                            : ""
                        }
                        onChange={(val) =>
                          setEditForm((prev: MedicineItem | null) => {
                            if (!prev) return prev;
                            return {
                              ...prev,
                              supplier_id: val === "" ? null : Number(val),
                            };
                          })
                        }
                        onSearch={setSupplierInputSearch}
                        placeholder="Select Supplier"
                        className="w-full"
                        triggerClassName="bg-slate-50 dark:bg-[#1a1d21] border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white font-bold py-2"
                        onCreateNew={() => navigate("/inventory/suppliers/new")}
                        createNewText="Add New Supplier"
                      />
                    </div>
                  </div>
                </section>

                {/* Section: Financials */}
                <section className="p-6 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center space-x-2 mb-6">
                    <div className="w-1 h-4 bg-amber-500 rounded-full" />
                    <h4 className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-[0.2em]">
                      Financial Parameters
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center space-x-2">
                        <DollarSign className="w-3 h-3" />
                        <span>Unit Cost (USD)</span>
                      </label>
                      <div className="relative group">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black group-focus-within:text-emerald-500 transition-colors">
                          $
                        </span>
                        <input
                          name="cost_price"
                          type="number"
                          step="0.01"
                          value={editForm.cost_price || ""}
                          onChange={handleInputChange}
                          className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-4 py-3.5 text-sm font-black outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center space-x-2">
                        <DollarSign className="w-3 h-3" />
                        <span>Market Price (USD)</span>
                      </label>
                      <div className="relative group">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black group-focus-within:text-blue-500 transition-colors">
                          $
                        </span>
                        <input
                          name="selling_price"
                          type="number"
                          step="0.01"
                          value={
                            editForm.selling_price ||
                            editForm.valuation?.replace("$", "") ||
                            ""
                          }
                          onChange={handleInputChange}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-4 py-3.5 text-sm font-black outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Section: Documentation */}
                <section>
                  <div className="flex items-center space-x-2 mb-6">
                    <div className="w-1 h-4 bg-purple-500 rounded-full" />
                    <h4 className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-[0.2em]">
                      Technical Documentation
                    </h4>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center space-x-2">
                      <Info className="w-3 h-3" />
                      <span>Detailed Description & Handling</span>
                    </label>
                    <textarea
                      name="description"
                      value={editForm.description || ""}
                      onChange={handleInputChange}
                      rows={5}
                      placeholder="Enter detailed specifications, storage requirements, or handling instructions..."
                      className="w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-medium leading-relaxed outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all resize-none"
                    />
                  </div>
                </section>
              </div>
            </div>
          ) : (
            <div
              key="view-mode"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              {/* Visual Stats Bar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm group hover:border-emerald-500/30 transition-colors">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <DollarSign className="w-3 h-3" />
                    Valuation
                  </p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    ${item.selling_price || "0.00"}
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm group hover:border-blue-500/30 transition-colors">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <BarChart3 className="w-3 h-3" />
                    Margin
                  </p>
                  <p className="text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tight">
                    {item.cost_price && item.selling_price
                      ? `${Math.round(((item.selling_price - item.cost_price) / item.selling_price) * 100)}%`
                      : "--"}
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm group hover:border-emerald-500/30 transition-colors">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Activity className="w-3 h-3" />
                    Status
                  </p>
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-2 h-2 rounded-full ${item.is_active ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`}
                    />
                    <p className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">
                      {item.is_active ? "Active" : "Restricted"}
                    </p>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm group hover:border-purple-500/30 transition-colors">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <ShieldCheck className="w-3 h-3" />
                    Registry
                  </p>
                  <p className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">
                    Verified Spec
                  </p>
                </div>
              </div>

              {/* Main Details Card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                      <LayoutGrid className="w-5 h-5 text-emerald-600" />
                    </div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                      Core Specifications
                    </h3>
                  </div>
                </div>
                <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-12">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center space-x-2">
                      <Tag className="w-3 h-3" />
                      <span>Generic Name</span>
                    </label>
                    <p className="text-base font-bold text-slate-800 dark:text-slate-200">
                      {item.generic_name || item.name}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center space-x-2">
                      <Barcode className="w-3 h-3" />
                      <span>Barcode / SKU</span>
                    </label>
                    <p className="text-base font-mono font-bold text-slate-800 dark:text-slate-200">
                      {item.barcode || item.sku || "---"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center space-x-2">
                      <Package className="w-3 h-3" />
                      <span>Category</span>
                    </label>
                    <p className="text-base font-bold text-slate-800 dark:text-slate-200">
                      {item.category || item.group}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center space-x-2">
                      <Factory className="w-3 h-3" />
                      <span>Supplier</span>
                    </label>
                    <p className="text-base font-bold text-slate-800 dark:text-slate-200">
                      {item.supplier || item.manufacturer || "Not Specified"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center space-x-2">
                      <DollarSign className="w-3 h-3" />
                      <span>Cost Price</span>
                    </label>
                    <p className="text-base font-bold text-slate-800 dark:text-slate-200">
                      ${item.cost_price || "0.00"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center space-x-2">
                      <DollarSign className="w-3 h-3" />
                      <span>Selling Price</span>
                    </label>
                    <p className="text-base font-bold text-slate-800 dark:text-slate-200">
                      ${item.selling_price || "0.00"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center space-x-2">
                      <Info className="w-3 h-3" />
                      <span>Internal ID</span>
                    </label>
                    <p className="text-base font-mono font-bold text-slate-800 dark:text-slate-200">
                      #{item.id}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center space-x-2">
                      <Clock className="w-3 h-3" />
                      <span>Created At</span>
                    </label>
                    <p className="text-base font-bold text-slate-800 dark:text-slate-200">
                      {item.created_at
                        ? new Date(item.created_at).toLocaleString()
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Documentation Card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-8">
                <h3 className="text-sm font-black text-slate-900 dark:text-white mb-6 flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-emerald-500" />
                  <span>Technical Documentation</span>
                </h3>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed italic">
                    {item.description ||
                      "No technical description provided for this specification in the master registry."}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DocumentActivityLog
            logs={logs}
            isLoading={isLogsLoading}
            onViewAll={() => navigate("/audit-logs")}
            title="Registry Audit Trail"
            description="Recent changes made only to this medicine."
          />
          {false && (
            <>
              {/* Audit Logs */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-8">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-emerald-500" />
                    <span>Registry Audit Trail</span>
                  </h3>
                  <button
                    onClick={() => navigate("/audit-logs")}
                    className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest hover:underline"
                  >
                    Full History
                  </button>
                </div>
                <div className="space-y-6">
                  {isLogsLoading ? (
                    <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                      <p className="text-xs font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">
                        Loading audit entries...
                      </p>
                    </div>
                  ) : logs.length > 0 ? (
                    logs.map((log, idx) => {
                      const when = parseLogTimestamp(log.timestamp);
                      const detailsObj = parseLogDetails(log.details);
                      const detailLines = formatLogDetailsText(log, detailsObj);
                      const isCreate = /created/i.test(log.action);
                      const isUpdate = /update/i.test(log.action);
                      const dotColor = isCreate
                        ? "bg-emerald-500"
                        : isUpdate
                          ? "bg-blue-500"
                          : "bg-slate-400";

                      return (
                        <div key={log.log_id} className="relative pl-8 group">
                          {/* Timeline Line */}
                          {idx < logs.length - 1 && (
                            <div className="absolute left-[11px] top-6 bottom-0 w-px bg-slate-100 dark:bg-slate-800 group-hover:bg-emerald-500/20 transition-colors" />
                          )}

                          {/* Timeline Dot */}
                          <div
                            className={`absolute left-0 top-1.5 w-6 h-6 rounded-full border-4 border-white dark:border-slate-900 shadow-sm flex items-center justify-center z-10 ${dotColor}`}
                          >
                            {isCreate ? (
                              <Package className="w-2 h-2 text-white" />
                            ) : isUpdate ? (
                              <Edit3 className="w-2 h-2 text-white" />
                            ) : (
                              <Info className="w-2 h-2 text-white" />
                            )}
                          </div>

                          <div className="bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl p-4 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-3">
                                <span className="text-[10px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">
                                  {log.action}
                                </span>
                                <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
                                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                  {when
                                    ? when.toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })
                                    : "—"}
                                </span>
                              </div>
                              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                {when
                                  ? when.toLocaleDateString(undefined, {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })
                                  : log.timestamp}
                              </span>
                            </div>
                            <div className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed mb-3 space-y-1">
                              {detailLines.map((line, i) => (
                                <p key={i} className="wrap-break-word">
                                  {line}
                                </p>
                              ))}
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div className="w-5 h-5 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center text-[8px] font-black text-emerald-600">
                                  {(log.username || String(log.user_id)).charAt(
                                    0,
                                  )}
                                </div>
                                <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                  {log.username || `User #${log.user_id}`}
                                </p>
                              </div>
                              <div className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                                Log #{log.log_id}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                      <p className="text-xs font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">
                        No audit entries found
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MedicineDetails;
