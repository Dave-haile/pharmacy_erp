import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import SearchableSelect from "../components/SearchableSelect";

const CreateItem: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    group: "",
    unit: "",
    valuation: "",
    description: "",
  });

  const itemGroups = [
    {
      value: "",
      label: "",
    },
    {
      value: "Raw Materials",
      label: "Raw Materials",
      subtitle: "Chemical APIs and base substances",
    },
    {
      value: "Packaging & Excipients",
      label: "Packaging & Excipients",
      subtitle: "Bottles, labels, and fillers",
    },
    {
      value: "Finished Goods",
      label: "Finished Goods",
      subtitle: "Ready-to-ship pharmaceutical products",
    },
    {
      value: "Solvents",
      label: "Solvents",
      subtitle: "Liquid processing agents",
    },
  ];

  const units = [
    { value: "", label: "" },
    { value: "kg", label: "Kilograms (kg)" },
    { value: "g", label: "Grams (g)" },
    { value: "mg", label: "Milligrams (mg)" },
    { value: "mcg", label: "Micrograms (mcg)" },
    { value: "liters", label: "Liters (L)" },
    { value: "ml", label: "Milliliters (ml)" },
    { value: "units", label: "Units (pcs)" },
    { value: "k-units", label: "Kilo-Units (1000pcs)" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // In a real app, we'd POST to /api/item-master
      // Since we are in mock mode, we'll just simulate a delay and navigate back
      await new Promise((resolve) => setTimeout(resolve, 800));
      console.log("New Item Data:", formData);
      navigate("/items");
    } catch (error) {
      console.error("Failed to create item:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      <header className="flex items-center space-x-3">
        <button
          onClick={() => navigate("/items")}
          className="p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-slate-500 dark:text-slate-400 shadow-sm"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
        </button>
        <div>
          <h1 className="text-lg md:text-xl font-black text-slate-800 dark:text-white tracking-tight">
            Create New Item
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-[10px]">
            Define a new product specification in the master registry
          </p>
        </div>
      </header>

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden"
      >
        <div className="p-5 md:p-8 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Product Name
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Paracetamol BP Grade"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-slate-800 dark:text-slate-100"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                SKU / Item Code
              </label>
              <input
                type="text"
                name="sku"
                required
                value={formData.sku}
                onChange={handleChange}
                placeholder="e.g. RAW-PAR-001"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Item Group
              </label>
              <SearchableSelect
                options={itemGroups}
                value={formData.group}
                onChange={(val) =>
                  setFormData((prev) => ({ ...prev, group: val }))
                }
                placeholder="Select Group..."
                createNewText="Create New Group"
                onCreateNew={() => navigate("/groups/new")}
                triggerClassName="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Base Unit (UOM)
              </label>
              <SearchableSelect
                options={units}
                value={formData.unit}
                onChange={(val) =>
                  setFormData((prev) => ({ ...prev, unit: val }))
                }
                placeholder="Select Unit..."
                createNewText="Create New Unit"
                onCreateNew={() => navigate("/units/new")}
                triggerClassName="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Standard Valuation
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-xs">
                  $
                </span>
                <input
                  type="text"
                  name="valuation"
                  required
                  value={formData.valuation}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-6 pr-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Technical Description
            </label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter technical specifications, storage requirements, or chemical properties..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none text-slate-800 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 px-5 md:px-8 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate("/items")}
            className="px-4 py-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold text-[10px] shadow-xl hover:bg-slate-800 transition-all flex items-center space-x-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <svg
                className="animate-spin h-3 w-3 text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : null}
            <span>
              {isSubmitting ? "Saving Specification..." : "Register Item"}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateItem;
