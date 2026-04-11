import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Database,
  Table2,
  CheckCircle2,
  XCircle,
  Hash,
  Globe,
  Link as LinkIcon,
  Tag,
  FileText,
  Code,
  Layers,
  Info,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  fetchTableDetail,
  type TableRegistryItem,
} from "../../services/tableRegistry";

const TableRegistryDetail: React.FC = () => {
  const { tableCode } = useParams<{ tableCode: string }>();
  const navigate = useNavigate();
  const [table, setTable] = useState<TableRegistryItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"details" | "columns">("details");

  useEffect(() => {
    if (tableCode) {
      loadTable();
    }
  }, [tableCode]);

  const loadTable = async () => {
    try {
      setIsLoading(true);
      setError("");
      const data = await fetchTableDetail(tableCode!);
      setTable(data);
    } catch (err) {
      setError(
        "Failed to load table details. The requested registry might not exist.",
      );
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      string: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",
      integer: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20",
      decimal: "text-amber-600 bg-amber-50 dark:bg-amber-900/20",
      date: "text-purple-600 bg-purple-50 dark:bg-purple-900/20",
      boolean: "text-rose-600 bg-rose-50 dark:bg-rose-900/20",
      choice: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20",
    };
    return colors[type] || "text-slate-600 bg-slate-50 dark:bg-slate-800";
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            Retrieving Schema Definition...
          </p>
        </div>
      </div>
    );
  }

  if (error || !table) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 border border-slate-200 dark:border-slate-800 max-w-md w-full text-center shadow-2xl">
          <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-rose-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
            Registry Error
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
            {error ||
              "The table registry you are looking for could not be found in the system database."}
          </p>
          <button
            onClick={() => navigate("/system/table-registry")}
            className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all shadow-xl"
          >
            Return to Registrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center space-x-6">
          <button
            onClick={() => navigate("/system/table-registry")}
            className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all text-slate-500 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Table2 className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {table.table_name}
                </h1>
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded text-[10px] font-mono uppercase tracking-tighter border border-slate-200 dark:border-slate-700">
                  {table.table_code}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center">
                <Database className="w-3 h-3 mr-1.5" />
                {table.module} / {table.submodule || "General"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate(`/system/table-registry/${tableCode}/edit`)}
            className="flex items-center space-x-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
          >
            <Edit className="w-4 h-4" />
            <span>Edit Configuration</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-md">
        <button
          onClick={() => setActiveTab("details")}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === "details"
              ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Info className="w-3.5 h-3.5" />
          <span>General Info</span>
        </button>
        <button
          onClick={() => setActiveTab("columns")}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === "columns"
              ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Field Schema</span>
          <span
            className={`ml-1.5 px-1.5 py-0.5 rounded-md text-[8px] ${
              activeTab === "columns"
                ? "bg-emerald-500 text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500"
            }`}
          >
            {table.columns?.length || 0}
          </span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "details" ? (
          <motion.div
            key="details"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-6 flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-emerald-500" />
                  Functional Description
                </h2>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {table.description ||
                    "No detailed description provided for this table registry."}
                </p>
              </div>

              {/* Technical Paths */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-6 flex items-center">
                  <Globe className="w-4 h-4 mr-2 text-emerald-500" />
                  Technical Endpoints
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-white dark:bg-slate-900 rounded-lg shadow-sm">
                        <LinkIcon className="w-4 h-4 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Frontend Route
                        </p>
                        <p className="text-sm font-mono text-slate-700 dark:text-slate-300 mt-0.5">
                          {table.frontend_path || "Not defined"}
                        </p>
                      </div>
                    </div>
                    {table.frontend_path && (
                      <button
                        onClick={() => navigate(table.frontend_path!)}
                        className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors text-emerald-500"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-white dark:bg-slate-900 rounded-lg shadow-sm">
                        <Code className="w-4 h-4 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Backend API Endpoint
                        </p>
                        <p className="text-sm font-mono text-slate-700 dark:text-slate-300 mt-0.5">
                          {table.backend_endpoint || "Not defined"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              {/* Status & Capabilities */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-6 flex items-center">
                  <ShieldCheck className="w-4 h-4 mr-2 text-emerald-500" />
                  System Capabilities
                </h2>
                <div className="space-y-3">
                  <div
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                      table.importable
                        ? "bg-emerald-50/50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30"
                        : "bg-slate-50 border-slate-100 dark:bg-slate-800/50 dark:border-slate-800"
                    }`}
                  >
                    <span
                      className={`text-xs font-bold uppercase tracking-widest ${
                        table.importable
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-slate-400"
                      }`}
                    >
                      Data Import
                    </span>
                    {table.importable ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-slate-300" />
                    )}
                  </div>
                  <div
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                      table.exportable
                        ? "bg-blue-50/50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/30"
                        : "bg-slate-50 border-slate-100 dark:bg-slate-800/50 dark:border-slate-800"
                    }`}
                  >
                    <span
                      className={`text-xs font-bold uppercase tracking-widest ${
                        table.exportable
                          ? "text-blue-700 dark:text-blue-400"
                          : "text-slate-400"
                      }`}
                    >
                      Data Export
                    </span>
                    {table.exportable ? (
                      <CheckCircle2 className="w-5 h-5 text-blue-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-slate-300" />
                    )}
                  </div>
                </div>
              </div>

              {/* Keywords */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-6 flex items-center">
                  <Hash className="w-4 h-4 mr-2 text-emerald-500" />
                  Search Keywords
                </h2>
                <div className="flex flex-wrap gap-2">
                  {table.keywords && table.keywords.length > 0 ? (
                    table.keywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-slate-200 dark:border-slate-700"
                      >
                        {keyword}
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">
                      No keywords defined.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          /* Columns Tab */
          <motion.div
            key="columns"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
          >
            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center">
                <Layers className="w-4 h-4 mr-2 text-emerald-500" />
                Schema Definition
              </h2>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                {table.columns?.length || 0} Fields Registered
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/30 dark:bg-slate-800/20">
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Field Name
                    </th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Type
                    </th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Attributes
                    </th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Example Value
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {table.columns && table.columns.length > 0 ? (
                    table.columns.map((col) => (
                      <tr
                        key={col.name}
                        className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="px-8 py-6">
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
                              {col.name}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 mt-1">
                              {col.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span
                            className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-current opacity-80 ${getTypeColor(
                              col.type,
                            )}`}
                          >
                            {col.type}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-wrap gap-2">
                            {col.required && (
                              <span className="px-2 py-0.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-[8px] font-black uppercase tracking-wider rounded-md border border-rose-100 dark:border-rose-900/30">
                                Required
                              </span>
                            )}
                            {col.is_identifier && (
                              <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[8px] font-black uppercase tracking-wider rounded-md border border-blue-100 dark:border-blue-900/30">
                                Identifier
                              </span>
                            )}
                            {!col.include_in_import && (
                              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-400 text-[8px] font-black uppercase tracking-wider rounded-md border border-slate-200 dark:border-slate-700">
                                No Import
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <code className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                            {col.example || "—"}
                          </code>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center">
                        <Layers className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-400 text-sm italic">
                          No columns defined for this table schema.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TableRegistryDetail;
