import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  Database,
  Layers,
  Globe,
  Hash,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  fetchTableDetail,
  createTableRegistry,
  updateTableRegistry,
  type TableRegistryItem,
  type TableColumn,
} from "../../services/tableRegistry";

const TYPE_OPTIONS = [
  { value: "string", label: "String (Text)" },
  { value: "integer", label: "Integer" },
  { value: "decimal", label: "Decimal" },
  { value: "boolean", label: "Boolean" },
  { value: "date", label: "Date" },
  { value: "datetime", label: "DateTime" },
  { value: "email", label: "Email" },
  { value: "choice", label: "Choice (Dropdown)" },
  { value: "reference", label: "Reference (Foreign Key)" },
];

const TableRegistryForm: React.FC = () => {
  const { tableCode } = useParams<{ tableCode: string }>();
  const navigate = useNavigate();
  const isEditing = !!tableCode && tableCode !== "new";

  const [formData, setFormData] = useState<Partial<TableRegistryItem>>({
    table_code: "",
    table_name: "",
    module: "inventory",
    submodule: "",
    frontend_path: "",
    backend_endpoint: "",
    description: "",
    icon: "",
    importable: false,
    exportable: false,
    is_active: true,
    keywords: [],
  });

  const [columns, setColumns] = useState<TableColumn[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [expandedColumn, setExpandedColumn] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isEditing) {
      loadTable();
    }
  }, [tableCode]);

  const loadTable = async () => {
    try {
      setIsLoading(true);
      const data = await fetchTableDetail(tableCode!);
      setFormData({
        table_code: data.table_code,
        table_name: data.table_name,
        module: data.module,
        submodule: data.submodule || "",
        frontend_path: data.frontend_path || "",
        backend_endpoint: data.backend_endpoint || "",
        description: data.description || "",
        icon: data.icon || "",
        importable: data.importable,
        exportable: data.exportable,
        is_active: data.is_active !== false,
        keywords: data.keywords || [],
      });
      setColumns(data.columns || []);
    } catch (err) {
      setError("Failed to load table configuration for editing.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");

    try {
      const data = {
        ...formData,
        columns,
      } as TableRegistryItem;

      if (isEditing) {
        await updateTableRegistry(tableCode!, data);
      } else {
        await createTableRegistry(data);
      }
      navigate("/system/table-registry");
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error ||
        err.message ||
        "Failed to save table configuration.";
      setError(errorMsg);
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const addColumn = () => {
    const newColumn: TableColumn = {
      name: `column_${columns.length + 1}`,
      label: "",
      type: "string",
      required: false,
      include_in_import: true,
      include_in_export: true,
      is_identifier: false,
    };
    setColumns([...columns, newColumn]);
    setExpandedColumn(columns.length);
  };

  const updateColumn = (
    index: number,
    field: keyof TableColumn,
    value: any,
  ) => {
    const updated = [...columns];
    updated[index] = { ...updated[index], [field]: value };
    setColumns(updated);
  };

  const removeColumn = (index: number) => {
    setColumns(columns.filter((_, i) => i !== index));
  };

  const moveColumn = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === columns.length - 1)
    ) {
      return;
    }
    const newIndex = direction === "up" ? index - 1 : index + 1;
    const updated = [...columns];
    const [moved] = updated.splice(index, 1);
    updated.splice(newIndex, 0, moved);
    setColumns(updated);
  };

  const addKeyword = () => {
    if (keywordInput.trim()) {
      setFormData({
        ...formData,
        keywords: [...(formData.keywords || []), keywordInput.trim()],
      });
      setKeywordInput("");
    }
  };

  const removeKeyword = (index: number) => {
    setFormData({
      ...formData,
      keywords: formData.keywords?.filter((_, i) => i !== index) || [],
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            Loading Configuration...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate("/system/table-registry")}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {isEditing ? "Edit Table Registry" : "Register New Table"}
            </h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              {isEditing
                ? `Modifying ${tableCode}`
                : "Define system schema metadata"}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => navigate("/system/table-registry")}
            className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex items-center space-x-2 px-8 py-3 bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-95 disabled:opacity-50"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSaving ? "Saving..." : "Save Registry"}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center space-x-3"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Basic Information */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
          <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-6 flex items-center">
            <Database className="w-4 h-4 mr-2 text-emerald-500" />
            Basic Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Table Code *
              </label>
              <input
                type="text"
                value={formData.table_code}
                onChange={(e) =>
                  setFormData({ ...formData, table_code: e.target.value })
                }
                disabled={isEditing}
                placeholder="e.g., medicine_master"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 transition-all disabled:opacity-50"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Display Name *
              </label>
              <input
                type="text"
                value={formData.table_name}
                onChange={(e) =>
                  setFormData({ ...formData, table_name: e.target.value })
                }
                placeholder="e.g., Medicine Registry"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 transition-all"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Module *
              </label>
              <select
                value={formData.module}
                onChange={(e) =>
                  setFormData({ ...formData, module: e.target.value })
                }
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 transition-all appearance-none cursor-pointer"
                required
              >
                <option value="system">System</option>
                <option value="inventory">Inventory</option>
                <option value="hr">HR</option>
                <option value="manufacturing">Manufacturing</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Submodule
              </label>
              <input
                type="text"
                value={formData.submodule}
                onChange={(e) =>
                  setFormData({ ...formData, submodule: e.target.value })
                }
                placeholder="e.g., procurement"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>
          </div>

          <div className="mt-6 space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Functional Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              placeholder="Explain the purpose of this table in the system..."
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 transition-all resize-none"
            />
          </div>
        </div>

        {/* Technical Configuration */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
          <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-6 flex items-center">
            <Globe className="w-4 h-4 mr-2 text-emerald-500" />
            Technical Configuration
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Frontend Route
              </label>
              <input
                type="text"
                value={formData.frontend_path}
                onChange={(e) =>
                  setFormData({ ...formData, frontend_path: e.target.value })
                }
                placeholder="e.g., /inventory/items"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Backend API Endpoint
              </label>
              <input
                type="text"
                value={formData.backend_endpoint}
                onChange={(e) =>
                  setFormData({ ...formData, backend_endpoint: e.target.value })
                }
                placeholder="e.g., /api/medicines/"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-8">
            <label className="flex items-center space-x-3 cursor-pointer group">
              <div
                className={`w-10 h-6 rounded-full transition-all relative ${
                  formData.importable
                    ? "bg-emerald-500"
                    : "bg-slate-200 dark:bg-slate-800"
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                    formData.importable ? "left-5" : "left-1"
                  }`}
                />
              </div>
              <input
                type="checkbox"
                checked={formData.importable}
                onChange={(e) =>
                  setFormData({ ...formData, importable: e.target.checked })
                }
                className="hidden"
              />
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                Allow Bulk Import
              </span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer group">
              <div
                className={`w-10 h-6 rounded-full transition-all relative ${
                  formData.exportable
                    ? "bg-blue-500"
                    : "bg-slate-200 dark:bg-slate-800"
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                    formData.exportable ? "left-5" : "left-1"
                  }`}
                />
              </div>
              <input
                type="checkbox"
                checked={formData.exportable}
                onChange={(e) =>
                  setFormData({ ...formData, exportable: e.target.checked })
                }
                className="hidden"
              />
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                Allow Bulk Export
              </span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer group">
              <div
                className={`w-10 h-6 rounded-full transition-all relative ${
                  formData.is_active
                    ? "bg-emerald-500"
                    : "bg-slate-200 dark:bg-slate-800"
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                    formData.is_active ? "left-5" : "left-1"
                  }`}
                />
              </div>
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
                className="hidden"
              />
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                Registry Active
              </span>
            </label>
          </div>
        </div>

        {/* Search Keywords */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
          <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-6 flex items-center">
            <Hash className="w-4 h-4 mr-2 text-emerald-500" />
            Search Metadata
          </h2>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addKeyword();
                }
              }}
              placeholder="Add searchable keyword..."
              className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 transition-all"
            />
            <button
              type="button"
              onClick={addKeyword}
              className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all"
            >
              Add
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {formData.keywords?.map((keyword, index) => (
              <span
                key={index}
                className="inline-flex items-center space-x-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-slate-200 dark:border-slate-700"
              >
                <span>{keyword}</span>
                <button
                  type="button"
                  onClick={() => removeKeyword(index)}
                  className="text-slate-400 hover:text-rose-500 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Column Definitions */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center">
              <Layers className="w-4 h-4 mr-2 text-emerald-500" />
              Field Schema Definition
            </h2>
            <button
              type="button"
              onClick={addColumn}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Add Field</span>
            </button>
          </div>

          <div className="space-y-4">
            {columns.map((column, index) => (
              <div
                key={index}
                className="bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden group"
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpandedColumn(expandedColumn === index ? null : index)
                  }
                  className="w-full flex items-center space-x-4 p-4 text-left hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all"
                >
                  <div className="w-8 h-8 bg-white dark:bg-slate-900 rounded-lg flex items-center justify-center text-[10px] font-black text-slate-400 shadow-sm border border-slate-100 dark:border-slate-800">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
                        {column.name || "Unnamed Field"}
                      </span>
                      {column.required && (
                        <span className="px-1.5 py-0.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-[8px] font-black uppercase tracking-wider rounded border border-rose-100 dark:border-rose-900/30">
                          Required
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                      {column.label || "No Label"} • {column.type}
                    </p>
                  </div>
                  {expandedColumn === index ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                <AnimatePresence>
                  {expandedColumn === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                              Database Field Name *
                            </label>
                            <input
                              type="text"
                              value={column.name}
                              onChange={(e) =>
                                updateColumn(index, "name", e.target.value)
                              }
                              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 transition-all"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                              UI Label *
                            </label>
                            <input
                              type="text"
                              value={column.label}
                              onChange={(e) =>
                                updateColumn(index, "label", e.target.value)
                              }
                              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 transition-all"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                              Data Type *
                            </label>
                            <select
                              value={column.type}
                              onChange={(e) =>
                                updateColumn(index, "type", e.target.value)
                              }
                              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 transition-all appearance-none cursor-pointer"
                            >
                              {TYPE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                              Example Value
                            </label>
                            <input
                              type="text"
                              value={column.example || ""}
                              onChange={(e) =>
                                updateColumn(index, "example", e.target.value)
                              }
                              placeholder="e.g., Sample Data"
                              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 transition-all"
                            />
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-6 pt-2">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={column.required}
                              onChange={(e) =>
                                updateColumn(index, "required", e.target.checked)
                              }
                              className="w-4 h-4 text-emerald-500 rounded-lg focus:ring-emerald-500"
                            />
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                              Mandatory
                            </span>
                          </label>

                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={column.is_identifier}
                              onChange={(e) =>
                                updateColumn(
                                  index,
                                  "is_identifier",
                                  e.target.checked,
                                )
                              }
                              className="w-4 h-4 text-blue-500 rounded-lg focus:ring-blue-500"
                            />
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                              Unique Identifier
                            </span>
                          </label>

                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={column.include_in_import}
                              onChange={(e) =>
                                updateColumn(
                                  index,
                                  "include_in_import",
                                  e.target.checked,
                                )
                              }
                              className="w-4 h-4 text-emerald-500 rounded-lg focus:ring-emerald-500"
                            />
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                              Importable
                            </span>
                          </label>
                        </div>

                        <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={() => moveColumn(index, "up")}
                            disabled={index === 0}
                            className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            Move Up
                          </button>
                          <button
                            type="button"
                            onClick={() => moveColumn(index, "down")}
                            disabled={index === columns.length - 1}
                            className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            Move Down
                          </button>
                          <button
                            type="button"
                            onClick={() => removeColumn(index)}
                            className="flex items-center space-x-2 px-4 py-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove Field</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {columns.length === 0 && (
            <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/20 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
              <Layers className="w-10 h-10 text-slate-300 mx-auto mb-4" />
              <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">
                No fields defined yet.
              </p>
              <button
                type="button"
                onClick={addColumn}
                className="mt-4 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-widest hover:underline"
              >
                + Add First Field
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default TableRegistryForm;
