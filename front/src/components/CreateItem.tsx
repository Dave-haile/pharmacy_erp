import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Save,
  X,
  Tag,
  Package,
  DollarSign,
  Barcode,
  Info,
  Activity,
  ChevronRight,
  Beaker,
  Boxes,
} from "lucide-react";
import SearchableSelect from "../components/SearchableSelect";
import { useCategories, useSuppliers } from "../services/common";
import { useToast } from "../hooks/useToast";
import { CreateMedicine } from "../types/types";
import { createMedicine } from "../services/medicines";

const CreateItem: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoryInputSearch, setCategoryInputSearch] = useState("");
  const [supplierInputSearch, setSupplierInputSearch] = useState("");
  const [formData, setFormData] = useState<CreateMedicine>({
    name: "",
    generic_name: "",
    barcode: "",
    category_id: null,
    supplier_id: null,
    cost_price: "",
    selling_price: "",
    description: "",
    is_active: true,
  });

  const { itemGroups } = useCategories(categoryInputSearch);
  const { supplierGroups } = useSuppliers(supplierInputSearch);
  const { showError, showSuccess } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Frontend validation to match backend constraints
    if (formData.category_id == null) {
      showError("Please select a material category before saving.");
      setIsSubmitting(false);
      return;
    }

    try {
      console.log(formData);
      const response = await createMedicine(formData);
      showSuccess(response.message || "Item created successfully");
      const namingSeries =
        response?.medicine?.naming_series ?? response?.naming_series;
      navigate(`/inventory/medicines/${namingSeries}`);
      console.log(response);
    } catch (error) {
      console.error("Failed to create item:", error);
      showError("Failed to create item");
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  type HandleChangeArg =
    | React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
    | { name: keyof CreateMedicine; value: unknown };

  const handleChange = (arg: HandleChangeArg) => {
    try {
      const normalize = (): { name: keyof CreateMedicine; value: unknown } => {
        if (typeof arg === "object" && arg != null && "target" in arg) {
          const target = arg.target;
          const name = target.name as keyof CreateMedicine;
          if (!name) {
            throw new Error("Missing input name attribute");
          }

          if (
            target instanceof HTMLInputElement &&
            target.type === "checkbox"
          ) {
            return { name, value: target.checked };
          }

          return { name, value: target.value };
        }

        if (typeof arg === "object" && arg != null && "name" in arg) {
          return { name: arg.name, value: arg.value };
        }

        throw new Error("Unsupported change argument");
      };

      const { name, value } = normalize();

      const coerce = (
        field: keyof CreateMedicine,
        raw: unknown,
      ): CreateMedicine[keyof CreateMedicine] => {
        if (field === "category_id" || field === "supplier_id") {
          if (raw === "" || raw == null) return null;
          const n = Number(raw);
          if (!Number.isFinite(n)) {
            throw new Error(`Invalid number for ${String(field)}`);
          }
          return n;
        }

        if (field === "is_active") {
          return Boolean(raw);
        }

        // Default: keep string fields as strings (even for <input type="number" />)
        if (typeof raw === "string") return raw;
        if (raw == null) return "" as CreateMedicine[keyof CreateMedicine];
        return String(raw) as CreateMedicine[keyof CreateMedicine];
      };

      setFormData((prev) => ({
        ...prev,
        [name]: coerce(name, value),
      }));
    } catch (error) {
      console.error("CreateItem.handleChange failed", { arg, error });
    }
  };

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
            <div className="flex items-center space-x-2 mb-1">
              <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-blue-500/20">
                Master Registry
              </span>
              <span className="text-slate-300 dark:text-slate-700">/</span>
              <span className="text-slate-400 dark:text-slate-500 text-[9px] font-bold uppercase tracking-widest">
                New Specification
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              Register New Item
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-xs mt-1">
              Create a new master record in the pharmaceutical specification
              database.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate("/inventory/medicines")}
            className="flex items-center space-x-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black text-slate-500 uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            <X className="w-4 h-4" />
            <span>Discard</span>
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center space-x-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-500 hover:shadow-emerald-500/40 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>
              {isSubmitting ? "Synchronizing..." : "Complete Registration"}
            </span>
          </button>
        </div>
      </header>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-12 gap-10"
      >
        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-10">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-blue-500/20 shadow-2xl shadow-blue-500/5 overflow-hidden">
            <div className="bg-blue-500/5 px-6 py-5 border-b border-blue-500/10 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" />
                  <div className="absolute inset-0 w-2.5 h-2.5 bg-blue-500 rounded-full animate-ping opacity-40" />
                </div>
                <h3 className="text-[10px] font-black text-blue-700 dark:text-blue-400 uppercase tracking-[0.2em]">
                  Drafting Master Record
                </h3>
              </div>
              <div className="flex items-center">
                <label className="flex items-center space-x-4 cursor-pointer group">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                    Initial Status
                  </span>
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleChange}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500 shadow-inner"></div>
                  </div>
                </label>
              </div>
            </div>

            <div className="p-10 space-y-12">
              {/* Section: Identity */}
              <section>
                <div className="flex items-center space-x-3 mb-8">
                  <div className="w-1.5 h-5 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
                  <h4 className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-[0.25em]">
                    Product Identity
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="group space-y-2.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-2 group-focus-within:text-emerald-500 transition-colors">
                      <Tag className="w-3.5 h-3.5" />
                      <span>Commercial Name</span>
                    </label>
                    <input
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Paracetamol 500mg"
                      autoComplete="off"
                      className="w-full bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 rounded-xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700 shadow-sm"
                    />
                  </div>
                  <div className="group space-y-2.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-2 group-focus-within:text-emerald-500 transition-colors">
                      <Beaker className="w-3.5 h-3.5" />
                      <span>Generic / Chemical Name</span>
                    </label>
                    <input
                      name="generic_name"
                      value={formData.generic_name}
                      onChange={handleChange}
                      placeholder="e.g. Acetaminophen"
                      autoComplete="off"
                      className="w-full bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 rounded-xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700 shadow-sm"
                    />
                  </div>
                  <div className="group space-y-2.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-2 group-focus-within:text-emerald-500 transition-colors">
                      <Barcode className="w-3.5 h-3.5" />
                      <span>Global Barcode (GTIN)</span>
                    </label>
                    <input
                      name="barcode"
                      value={formData.barcode}
                      onChange={handleChange}
                      placeholder="Scan or enter barcode"
                      autoComplete="off"
                      className="w-full bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 rounded-xl px-5 py-4 text-sm font-mono font-bold outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-sm"
                    />
                  </div>
                </div>
              </section>

              {/* Section: Classification */}
              <section>
                <div className="flex items-center space-x-3 mb-8">
                  <div className="w-1.5 h-5 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.3)]" />
                  <h4 className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-[0.25em]">
                    Classification & Logistics
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="group space-y-2.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-2 group-focus-within:text-blue-500 transition-colors">
                      <Package className="w-3.5 h-3.5" />
                      <span>Material Category</span>
                    </label>
                    <SearchableSelect
                      options={itemGroups}
                      value={
                        formData.category_id != null
                          ? String(formData.category_id)
                          : ""
                      }
                      onChange={(value) =>
                        handleChange({ name: "category_id", value })
                      }
                      onSearch={setCategoryInputSearch}
                      placeholder="Select Category"
                      className="w-full"
                      triggerClassName="bg-slate-50 dark:bg-[#1a1d21] border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white font-bold py-2"
                      onCreateNew={() => navigate("/items/new")}
                      createNewText="Add New Category"
                    />
                  </div>
                  <div className="group space-y-2.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-2 group-focus-within:text-blue-500 transition-colors">
                      <Boxes className="w-3.5 h-3.5" />
                      <span>Supplier</span>
                    </label>
                    <SearchableSelect
                      options={supplierGroups}
                      value={
                        formData.supplier_id != null
                          ? String(formData.supplier_id)
                          : ""
                      }
                      onChange={(value) =>
                        handleChange({ name: "supplier_id", value })
                      }
                      onSearch={setSupplierInputSearch}
                      placeholder="Select Supplier"
                      className="w-full"
                      triggerClassName="bg-slate-50 dark:bg-[#1a1d21] border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white font-bold py-2"
                    />
                  </div>
                </div>
              </section>

              {/* Section: Financials */}
              <section className="p-8 bg-slate-50/50 dark:bg-slate-800/20 rounded-3xl border border-slate-100 dark:border-slate-800/50 shadow-inner">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="w-1.5 h-5 bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.3)]" />
                  <h4 className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-[0.25em]">
                    Financial Parameters
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="group space-y-2.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-2 group-focus-within:text-amber-500 transition-colors">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>Unit Cost (USD)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-black group-focus-within:text-amber-500 transition-colors">
                        $
                      </span>
                      <input
                        name="cost_price"
                        type="number"
                        step="0.01"
                        required
                        value={formData.cost_price}
                        onChange={handleChange}
                        placeholder="0.00"
                        autoComplete="off"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-5 py-4 text-sm font-black outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all shadow-sm"
                      />
                    </div>
                  </div>
                  <div className="group space-y-2.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-2 group-focus-within:text-blue-500 transition-colors">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>Market Price (USD)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-black group-focus-within:text-blue-500 transition-colors">
                        $
                      </span>
                      <input
                        name="selling_price"
                        type="number"
                        step="0.01"
                        required
                        value={formData.selling_price}
                        onChange={handleChange}
                        placeholder="0.00"
                        autoComplete="off"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-5 py-4 text-sm font-black outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Section: Documentation */}
              <section>
                <div className="flex items-center space-x-3 mb-8">
                  <div className="w-1.5 h-5 bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.3)]" />
                  <h4 className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-[0.25em]">
                    Technical Documentation
                  </h4>
                </div>
                <div className="group space-y-2.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-2 group-focus-within:text-purple-500 transition-colors">
                    <Info className="w-3.5 h-3.5" />
                    <span>Detailed Description & Handling</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={6}
                    placeholder="Enter detailed specifications, storage requirements, or chemical properties..."
                    className="w-full bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-5 text-sm font-medium leading-relaxed outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all resize-none shadow-sm"
                  />
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* Sidebar Actions */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-slate-900 dark:bg-white rounded-2xl shadow-2xl p-8 text-white dark:text-slate-900 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 dark:bg-blue-500/5 blur-[60px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-700" />
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-6 relative z-10">
              Registry Actions
            </h3>
            <div className="space-y-4 relative z-10">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl flex items-center justify-center space-x-3 shadow-emerald-600/20 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>
                  {isSubmitting ? "Synchronizing..." : "Complete Registration"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => navigate("/inventory/medicines")}
                className="w-full bg-slate-800 dark:bg-slate-100 text-slate-300 dark:text-slate-600 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-700 dark:hover:bg-slate-200 transition-all border border-slate-700 dark:border-slate-200 flex items-center justify-center space-x-3"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel & Return</span>
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-8">
            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6">
              Compliance & Status
            </h3>
            <div className="flex items-center space-x-4 p-4 rounded-2xl border bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800">
              <div className="bg-slate-200 dark:bg-slate-700 p-2 rounded-xl text-slate-400 shadow-lg">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-tight text-slate-600 dark:text-slate-400">
                  Pending Review
                </p>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                  Awaiting GMP Validation
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
                  Entry Date
                </span>
                <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  System ID
                </span>
                <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
                  #AUTO-GEN
                </span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateItem;
