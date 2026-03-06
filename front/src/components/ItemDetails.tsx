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
  MoreVertical, Printer, Clipboard, Share2, Download
} from "lucide-react";
import SearchableSelect from "./SearchableSelect";
import { useCategories, useSuppliers } from "../services/common";
import { useToast } from "../hooks/useToast";
import { fetchMedicineById, updateMedicine } from "../services/medicines";


const ItemDetails: React.FC = () => {
  const { naming_series } = useParams<{ naming_series: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<MedicineItem | null>(null);
  const [logs] = useState<Log[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState<MedicineItem | null>(null);
  const [categoryInputSearch, setCategoryInputSearch] = useState("");
  const [supplierInputSearch, setSupplierInputSearch] = useState("");
  const { showError, showSuccess } = useToast();
  const [isActionsOpen, setIsActionsOpen] = useState(false);


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

  const handleSave = async () => {
    if (!editForm || !item) return;

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
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
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
                  className={`px-2 py-1 text-[8px] font-black uppercase tracking-[0.2em] rounded-md border ${(item.status || "Draft") === "Submitted"
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
                  className={`p-2.5 rounded-xl border transition-all ${isActionsOpen
                    ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm'
                    }`}
                >
                  <MoreVertical className="w-5 h-5" />
                </button>

                {isActionsOpen && (
                  <>
                    <div onClick={() => setIsActionsOpen(false)} className="fixed inset-0 z-40" />
                    <div className="absolute right-0 mt-3 w-64 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden">
                      <div className="p-2 space-y-1">
                        <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group">
                          <Copy className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                          <span>Duplicate Specification</span>
                        </button>
                        <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group">
                          <Clipboard className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                          <span>Copy to Clipboard</span>
                        </button>
                        <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group">
                          <Printer className="w-4 h-4 text-slate-400 group-hover:text-purple-500 transition-colors" />
                          <span>Print Specification</span>
                        </button>
                        <div className="h-px bg-slate-100 dark:bg-slate-800 my-1 mx-2" />
                        <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group">
                          <Share2 className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
                          <span>Share Record</span>
                        </button>
                        <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group">
                          <Download className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition-colors" />
                          <span>Export as PDF</span>
                        </button>
                        <div className="h-px bg-slate-100 dark:bg-slate-800 my-1 mx-2" />
                        <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all group">
                          <Trash2 className="w-4 h-4 text-red-400 group-hover:text-red-600 transition-colors" />
                          <span>Deactivate Specification</span>
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-8">
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
                        onCreateNew={() => navigate("/suppliers/new")}
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
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-4 py-3.5 text-sm font-black outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
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
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-4 py-3.5 text-sm font-black outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
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
              {logs.length > 0 ? (
                logs.map((log, idx) => (
                  <div key={log.id} className="relative pl-8 group">
                    {/* Timeline Line */}
                    {idx < logs.length - 1 && (
                      <div className="absolute left-[11px] top-6 bottom-0 w-px bg-slate-100 dark:bg-slate-800 group-hover:bg-emerald-500/20 transition-colors" />
                    )}

                    {/* Timeline Dot */}
                    <div
                      className={`absolute left-0 top-1.5 w-6 h-6 rounded-full border-4 border-white dark:border-slate-900 shadow-sm flex items-center justify-center z-10 ${log.action === "CREATE"
                        ? "bg-emerald-500"
                        : log.action === "UPDATE"
                          ? "bg-blue-500"
                          : log.action === "PRICE_UPDATE"
                            ? "bg-amber-500"
                            : "bg-slate-400"
                        }`}
                    >
                      {log.action === "CREATE" && (
                        <Package className="w-2 h-2 text-white" />
                      )}
                      {log.action === "UPDATE" && (
                        <Edit3 className="w-2 h-2 text-white" />
                      )}
                      {log.action === "PRICE_UPDATE" && (
                        <DollarSign className="w-2 h-2 text-white" />
                      )}
                    </div>

                    <div className="bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl p-4 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <span className="text-[10px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">
                            {log.action.replace("_", " ")}
                          </span>
                          <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
                          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                            {new Date(log.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                          {new Date(log.timestamp).toLocaleDateString(
                            undefined,
                            { month: "short", day: "numeric" },
                          )}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                        {log.details}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-5 h-5 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center text-[8px] font-black text-emerald-600">
                            {log.user.charAt(0)}
                          </div>
                          <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                            {log.user}
                          </p>
                        </div>
                        <div className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                          {log.role || "Operator"}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  <p className="text-xs font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">
                    No audit entries found
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Actions */}
        {/* <div className="lg:col-span-4 space-y-8">
          <div className="bg-slate-900 dark:bg-white rounded-2xl shadow-2xl p-8 text-white dark:text-slate-900 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 dark:bg-emerald-500/5 blur-[60px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-700" />
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-6 relative z-10">
              Registry Actions
            </h3>
            <div className="space-y-4 relative z-10">
              {!isEditing ? (
                <>
                  <button
                    onClick={() => {
                      setEditForm(item);
                      setIsEditing(true);
                    }}
                    className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white py-3.5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl flex items-center justify-center space-x-3 border border-slate-200 dark:border-slate-800"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Modify Record</span>
                  </button>
                  <button className="w-full bg-slate-800 dark:bg-slate-100 text-slate-300 dark:text-slate-600 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-700 dark:hover:bg-slate-200 transition-all border border-slate-700 dark:border-slate-200 flex items-center justify-center space-x-3">
                    <Copy className="w-3.5 h-3.5" />
                    <span>Clone Specification</span>
                  </button>
                  <button className="w-full bg-red-900/10 dark:bg-red-50 text-red-500 dark:text-red-500 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-red-900/20 dark:hover:bg-red-100 transition-all border border-red-900/20 dark:border-red-200 flex items-center justify-center space-x-3">
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Deactivate Spec</span>
                  </button>
                </>
              ) : (
                <div className="p-6 bg-white/5 dark:bg-slate-900/5 rounded-2xl border border-white/10 dark:border-slate-900/10 backdrop-blur-sm">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">
                      Live Session
                    </p>
                  </div>
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 leading-relaxed italic">
                    You are currently modifying the master registry. Ensure all
                    technical specifications are accurate before committing
                    changes.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-8">
            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6">
              Compliance & Status
            </h3>
            <div
              className={`flex items-center space-x-4 p-4 rounded-2xl border ${item.is_active ? "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/20" : "bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20"}`}
            >
              <div
                className={`${item.is_active ? "bg-emerald-500" : "bg-red-500"} p-2 rounded-xl text-white shadow-lg ${item.is_active ? "shadow-emerald-500/20" : "shadow-red-500/20"}`}
              >
                {item.is_active ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
              </div>
              <div>
                <p
                  className={`text-xs font-black uppercase tracking-tight ${item.is_active ? "text-emerald-800 dark:text-emerald-400" : "text-red-800 dark:text-red-400"}`}
                >
                  {item.is_active ? "Verified Spec" : "Restricted"}
                </p>
                <p
                  className={`text-[10px] font-bold ${item.is_active ? "text-emerald-600 dark:text-emerald-500" : "text-red-600 dark:text-red-500"}`}
                >
                  {item.is_active ? "GMP Compliant" : "Awaiting Review"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-8">
            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">
              Registry Metadata
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-50 dark:border-slate-800">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Created
                </span>
                <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
                  {item.created_at
                    ? new Date(item.created_at).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Internal ID
                </span>
                <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
                  #{item.id}
                </span>
              </div>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default ItemDetails;
