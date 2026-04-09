import React, { useEffect, useState, useRef } from "react";
import {
  Upload,
  Search,
  ChevronDown,
  FileSpreadsheet,
  Database,
  ArrowRight,
  Info,
  CheckCircle,
  AlertCircle,
  Package,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  fetchImportableTables,
  type TableRegistryItem,
} from "../../services/tableRegistry";

type ImportMode = "insert" | "update";

interface ImportConfig {
  table: TableRegistryItem | null;
  mode: ImportMode;
}

const DataImport: React.FC = () => {
  const navigate = useNavigate();
  const [tables, setTables] = useState<TableRegistryItem[]>([]);
  const [filteredTables, setFilteredTables] = useState<TableRegistryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [config, setConfig] = useState<ImportConfig>({
    table: null,
    mode: "insert",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch importable tables on mount
  useEffect(() => {
    loadTables();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter tables when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTables(tables);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = tables.filter(
      (table) =>
        table.table_name.toLowerCase().includes(query) ||
        table.table_code.toLowerCase().includes(query) ||
        (table.keywords || []).some((k) => k.toLowerCase().includes(query)) ||
        (table.module || "").toLowerCase().includes(query),
    );
    setFilteredTables(filtered);
  }, [searchQuery, tables]);

  const loadTables = async () => {
    try {
      setIsLoading(true);
      setError("");
      const data = await fetchImportableTables();
      setTables(data);
      setFilteredTables(data);
    } catch (err) {
      setError("Failed to load importable tables");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTableSelect = (table: TableRegistryItem) => {
    setConfig((prev) => ({ ...prev, table }));
    setIsDropdownOpen(false);
    setSearchQuery("");
  };

  const handleContinue = () => {
    if (!config.table) return;

    navigate(`/system/data-import/wizard`, {
      state: {
        tableCode: config.table.table_code,
        tableName: config.table.table_name,
        mode: config.mode,
        backendEndpoint: config.table.backend_endpoint,
      },
    });
  };

  const getModeDescription = (mode: ImportMode) => {
    if (mode === "insert") {
      return "Create new records. Existing data will not be modified.";
    }
    return "Update existing records using a unique identifier (e.g., ID, naming series).";
  };

  const getModeIcon = (mode: ImportMode) => {
    return mode === "insert" ? (
      <Database className="w-5 h-5" />
    ) : (
      <CheckCircle className="w-5 h-5" />
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Loading import options...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500 rounded-2xl mb-4 shadow-lg shadow-emerald-500/20">
            <Upload className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">
            Data Import
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Import data into your system tables quickly and efficiently
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          {error && (
            <div className="px-6 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-800">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            </div>
          )}

          <div className="p-6 space-y-6">
            {/* Step 1: Select Table */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">
                <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-black flex items-center justify-center">
                  1
                </span>
                Select Document Type
              </label>

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => {
                    setIsDropdownOpen(!isDropdownOpen);
                    setTimeout(() => searchInputRef.current?.focus(), 0);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                    config.table
                      ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
                      : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {config.table ? (
                      <>
                        <Package className="w-5 h-5 text-emerald-500" />
                        <div className="text-left">
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                            {config.table.table_name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {config.table.module} • {config.table.submodule}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <FileSpreadsheet className="w-5 h-5 text-slate-400" />
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          Choose a document type to import into...
                        </span>
                      </>
                    )}
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 transition-transform ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                    {/* Search in dropdown */}
                    <div className="p-3 border-b border-slate-100 dark:border-slate-700">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          ref={searchInputRef}
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search tables..."
                          className="w-full pl-9 pr-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                        />
                      </div>
                    </div>

                    {/* Tables list */}
                    <div className="max-h-64 overflow-y-auto p-2">
                      {filteredTables.length === 0 ? (
                        <div className="px-4 py-8 text-center">
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            No importable tables found
                          </p>
                        </div>
                      ) : (
                        filteredTables.map((table) => (
                          <button
                            key={table.table_code}
                            onClick={() => handleTableSelect(table)}
                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors ${
                              config.table?.table_code === table.table_code
                                ? "bg-emerald-50 dark:bg-emerald-900/20"
                                : "hover:bg-slate-50 dark:hover:bg-slate-700"
                            }`}
                          >
                            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                              <Package className="w-5 h-5 text-slate-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                                {table.table_name}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {table.module} / {table.submodule}
                              </p>
                            </div>
                            {config.table?.table_code === table.table_code && (
                              <CheckCircle className="w-5 h-5 text-emerald-500" />
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Select Mode */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">
                <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-black flex items-center justify-center">
                  2
                </span>
                Import Mode
              </label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() =>
                    setConfig((prev) => ({ ...prev, mode: "insert" }))
                  }
                  className={`flex flex-col items-start gap-2 p-4 rounded-xl border-2 transition-all text-left ${
                    config.mode === "insert"
                      ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10"
                      : "border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700"
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg ${
                      config.mode === "insert"
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-500"
                    }`}
                  >
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <p
                      className={`text-sm font-bold ${
                        config.mode === "insert"
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-slate-700 dark:text-slate-200"
                      }`}
                    >
                      Insert New
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Create new records
                    </p>
                  </div>
                </button>

                <button
                  onClick={() =>
                    setConfig((prev) => ({ ...prev, mode: "update" }))
                  }
                  className={`flex flex-col items-start gap-2 p-4 rounded-xl border-2 transition-all text-left ${
                    config.mode === "update"
                      ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10"
                      : "border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700"
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg ${
                      config.mode === "update"
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-500"
                    }`}
                  >
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p
                      className={`text-sm font-bold ${
                        config.mode === "update"
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-slate-700 dark:text-slate-200"
                      }`}
                    >
                      Update Existing
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Modify existing records
                    </p>
                  </div>
                </button>
              </div>

              {/* Mode description */}
              <div className="mt-3 flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  {getModeDescription(config.mode)}
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex justify-end">
            <button
              onClick={handleContinue}
              disabled={!config.table}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-colors"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              Supported Formats
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Import data from Excel (.xlsx) or CSV (.csv) files. Templates are
              available for each document type.
            </p>
          </div>
          <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-500" />
              Data Validation
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              All imported data is validated before processing. You'll get a
              preview before finalizing the import.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataImport;
