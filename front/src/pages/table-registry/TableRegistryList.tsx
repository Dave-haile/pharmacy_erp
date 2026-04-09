import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Trash2,
  Table2,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Layers,
  Activity,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  fetchTableRegistry,
  deleteTableRegistry,
  type TableRegistryItem,
} from "../../services/tableRegistry";
import DataTable, { Column } from "../../components/DataTable";
import SearchableSelect from "../../components/SearchableSelect";

const TableRegistryList: React.FC = () => {
  const navigate = useNavigate();
  const [tables, setTables] = useState<TableRegistryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    module: "",
  });
  const [pageSize, setPageSize] = useState(10);
  const [visibleCount, setVisibleCount] = useState(10);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadTables(); 
  }, []);

  const filteredTables = useMemo(() => {
    let result = [...tables];

    if (filters.search) {
      const query = filters.search.toLowerCase();
      result = result.filter(
        (t) =>
          t.table_name.toLowerCase().includes(query) ||
          t.table_code.toLowerCase().includes(query) ||
          (t.module && t.module.toLowerCase().includes(query)),
      );
    }

    if (filters.module) {
      result = result.filter((t) => t.module === filters.module);
    }

    if (sortConfig !== null) {
      result.sort((a: any, b: any) => {
        if (a[sortConfig.key] < b[sortConfig.key])
          return sortConfig.direction === "asc" ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key])
          return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [tables, filters, sortConfig]);

  const paginatedTables = filteredTables.slice(0, visibleCount);

  const loadTables = async () => {
    try {
      setIsLoading(true);
      const data = await fetchTableRegistry();
      setTables(data);
    } catch (err) {
      setError("Failed to load table registry");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setVisibleCount(pageSize);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setVisibleCount(size);
  };

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + pageSize);
  };

  const requestSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const handleDelete = async (tableCode: string) => {
    try {
      await deleteTableRegistry(tableCode);
      setDeleteConfirm(null);
      loadTables();
    } catch (err) {
      setError("Failed to delete table");
      console.error(err);
    }
  };

  const modules = Array.from(new Set(tables.map((t) => t.module))) as string[];

  const getModuleColor = (module: string) => {
    const colors: Record<string, string> = {
      system:
        "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
      inventory:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
      hr: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      manufacturing:
        "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    };
    return (
      colors[module] ||
      "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
    );
  };

  const columns: Column<TableRegistryItem>[] = [
    {
      header: "Table Details",
      sortKey: "table_name" as any,
      render: (table) => (
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300 shadow-sm">
            <Table2 className="w-5 h-5 text-slate-400 group-hover:text-white" />
          </div>
          <div>
            <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              {table.table_name}
            </p>
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter mt-0.5">
              {table.table_code}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "Module",
      sortKey: "module" as any,
      render: (table) => (
        <div className="flex flex-col">
          <span
            className={`inline-flex w-fit px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${getModuleColor(
              table.module,
            )}`}
          >
            {table.module}
          </span>
          {table.submodule && (
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 ml-0.5">
              {table.submodule}
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Capabilities",
      headerClassName: "text-center",
      render: (table) => (
        <div className="flex items-center justify-center space-x-3">
          <div className="flex flex-col items-center">
            <CheckCircle2
              className={`w-3.5 h-3.5 mb-0.5 ${
                table.importable
                  ? "text-emerald-500"
                  : "text-slate-200 dark:text-slate-800"
              }`}
            />
            <span
              className={`text-[7px] font-black uppercase tracking-tighter ${
                table.importable ? "text-emerald-600" : "text-slate-400"
              }`}
            >
              Import
            </span>
          </div>
          <div className="flex flex-col items-center">
            <Activity
              className={`w-3.5 h-3.5 mb-0.5 ${
                table.exportable
                  ? "text-blue-500"
                  : "text-slate-200 dark:text-slate-800"
              }`}
            />
            <span
              className={`text-[7px] font-black uppercase tracking-tighter ${
                table.exportable ? "text-blue-600" : "text-slate-400"
              }`}
            >
              Export
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Fields",
      headerClassName: "text-center",
      render: (table) => (
        <div className="flex justify-center">
          <div className="inline-flex items-center space-x-1.5 px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
            <Layers className="w-3 h-3 text-slate-400" />
            <span className="text-[10px] font-black text-slate-700 dark:text-slate-200">
              {table.columns?.length || 0}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Status",
      headerClassName: "text-right",
      className: "text-right",
      render: (table) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${
            table.is_active !== false
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
              : "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20"
          }`}
        >
          • {table.is_active !== false ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];

  const Filters = (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-4xl">
        <div className="space-y-1.5">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
            Search Table
          </label>
          <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 flex items-center space-x-2 focus-within:border-emerald-500/50 transition-all">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              name="search"
              placeholder="Name or Code..."
              className="bg-transparent outline-none text-[11px] w-full font-bold text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
              value={filters.search}
              onChange={handleFilterChange}
            />
          </div>
        </div>
        <div className="space-y-1.5 lg:col-span-2">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
            System Module
          </label>
          <SearchableSelect
            options={[
              ...modules.map((m) => ({
                value: m,
                label: m.charAt(0).toUpperCase() + m.slice(1),
                subtitle: `Tables belonging to ${m} module`,
              })),
            ]}
            value={filters.module}
            onChange={(val) => setFilters((prev) => ({ ...prev, module: val }))}
            placeholder="Select Module"
            className="w-full"
            triggerClassName="bg-slate-50 dark:bg-[#1a1d21] border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white font-bold py-2"
          />
        </div>
      </div>
    </div>
  );

  const Footer = (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex bg-white dark:bg-[#1a1d21] p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {[10, 50, 100].map((size) => (
          <button
            key={size}
            onClick={() => handlePageSizeChange(size)}
            className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${
              pageSize === size
                ? "bg-slate-900 dark:bg-slate-700 text-white shadow-lg"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            {size}
          </button>
        ))}
      </div>

      <div className="flex items-center space-x-4">
        {visibleCount < filteredTables.length && (
          <button
            onClick={handleLoadMore}
            className="px-6 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl font-black text-[10px] shadow-sm transition-all uppercase tracking-widest border border-slate-200 dark:border-slate-700"
          >
            Load More Records
          </button>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            Synchronizing Registry...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <header className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate("/system")}
            className="p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-slate-500 dark:text-slate-400 shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <div>
            <h1 className="text-lg md:text-xl font-black text-slate-800 dark:text-white tracking-tight">
              Table Registrar
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-[10px] uppercase tracking-widest">
              Metadata Repository & Schema Manager
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate("/system/table-registry/new")}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-600/20 transition-all flex items-center space-x-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register Table</span>
          </button>
        </div>
      </header>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center space-x-3"
          >
            <XCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <DataTable
        columns={columns}
        data={paginatedTables}
        isLoading={isLoading}
        filters={Filters}
        footer={Footer}
        onRowClick={(table) =>
          navigate(`/system/table-registry/${table.table_code}`)
        }
        selectable
        sortConfig={sortConfig as any}
        onSort={requestSort as any}
        idField="table_code"
        headerRight={
          <div className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">
            {paginatedTables.length} of {filteredTables.length} Tables
          </div>
        }
        loadingMessage="Accessing Schema Registry..."
        emptyMessage="No tables found in system registry"
      />

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 flex items-center justify-center z-100 p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
              onClick={() => setDeleteConfirm(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full relative z-10 shadow-2xl border border-slate-200 dark:border-slate-800"
            >
              <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center mb-6">
                <Trash2 className="w-8 h-8 text-rose-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                Delete Registry?
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                You are about to remove{" "}
                <span className="font-bold text-slate-900 dark:text-white">
                  {deleteConfirm}
                </span>{" "}
                from the system registrar. This action will not delete the
                physical database table but will remove its metadata
                configuration.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleDelete(deleteConfirm);
                    setDeleteConfirm(null);
                  }}
                  className="flex-1 px-6 py-3 bg-rose-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TableRegistryList;
