import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DataTable, { Column } from "../components/DataTable";
import { Info, ArrowLeft, Shield } from "lucide-react";

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    itemName: "",
    action: "",
    user: "",
  });
  const [pageSize, setPageSize] = useState(10);
  const [visibleCount, setVisibleCount] = useState(10);
  const navigate = useNavigate();

  const fetchLogs = async (mode: "initial" | "refresh" = "initial") => {
    if (mode === "refresh") {
      setIsRefreshing(true);
    }

    try {
      // const res = await api.get('/api/audit-logs');
      const res = [
        {
          id: "log1",
          itemId: "1",
          itemName: "Raw Aspirin Powder",
          action: "STOCK_ADJUST",
          details: "Quantity adjusted from 520kg to 500kg",
          user: "Dr. Aris Thorne",
          role: "QA Manager",
          timestamp: "2026-02-27T14:30:00Z",
        },
        {
          id: "log2",
          itemId: "2",
          itemName: "Gelatin Capsules Size 0",
          action: "STATUS_CHANGE",
          details: "Status changed to Low Stock",
          user: "John Doe",
          role: "Administrator",
          timestamp: "2026-02-27T10:15:00Z",
        },
        {
          id: "log3",
          itemId: "5",
          itemName: "Metformin Hydrochloride",
          action: "UPDATE",
          details: "Updated storage instructions",
          user: "Dr. Aris Thorne",
          role: "QA Manager",
          timestamp: "2026-02-26T16:45:00Z",
        },
        {
          id: "log4",
          itemId: "4",
          itemName: "Ethylene Glycol",
          action: "STATUS_CHANGE",
          details: "Marked as Expired after quality check",
          user: "Sarah Miller",
          role: "Quality Analyst",
          timestamp: "2026-02-25T09:00:00Z",
        },
        {
          id: "log5",
          itemId: "1",
          itemName: "Raw Aspirin Powder",
          action: "CREATE",
          details: "Initial batch registration",
          user: "John Doe",
          role: "Administrator",
          timestamp: "2026-02-20T11:20:00Z",
        },
        {
          id: "log6",
          itemId: "p10",
          itemName: "Atorvastatin Calcium",
          action: "PRICE_UPDATE",
          details: "Valuation updated from $1200 to $1250",
          user: "Finance Dept",
          role: "System",
          timestamp: "2026-02-24T15:30:00Z",
        },
        {
          id: "log7",
          itemId: "p1",
          itemName: "Aspirin Active Pharmaceutical Ingredient",
          action: "UPDATE",
          details: "Updated technical specification and storage requirements",
          user: "Dr. Aris Thorne",
          role: "QA Manager",
          timestamp: "2026-02-25T14:20:00Z",
        },
        {
          id: "log8",
          itemId: "p1",
          itemName: "Aspirin Active Pharmaceutical Ingredient",
          action: "CREATE",
          details: "Initial master record registration",
          user: "John Doe",
          role: "Administrator",
          timestamp: "2026-02-10T09:00:00Z",
        },
      ];
      const sortedLogs = res.sort(
        (a: any, b: any) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
      setLogs(sortedLogs);
    } catch (e) {
      console.error("Audit logs fetch failed", e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter(
      (log) =>
        (filters.itemName === "" ||
          log.itemName
            .toLowerCase()
            .includes(filters.itemName.toLowerCase())) &&
        (filters.action === "" || log.action === filters.action) &&
        (filters.user === "" ||
          log.user.toLowerCase().includes(filters.user.toLowerCase())),
    );
  }, [logs, filters]);

  const paginatedLogs = filteredLogs.slice(0, visibleCount);

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + pageSize);
  };

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setVisibleCount(pageSize);
  };

  const columns: Column<any>[] = [
    {
      header: "Timestamp",
      render: (log) => (
        <div className="flex flex-col">
          <span className="text-[11px] font-black text-slate-800 dark:text-slate-200">
            {new Date(log.timestamp).toLocaleDateString()}
          </span>
          <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-tight">
            {new Date(log.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
        </div>
      ),
    },
    {
      header: "Item / Record",
      render: (log) => (
        <div className="flex flex-col">
          <span className="text-[11px] font-black text-slate-800 dark:text-slate-200">
            {log.itemName}
          </span>
          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            ID: {log.itemId}
          </span>
        </div>
      ),
    },
    {
      header: "Action",
      render: (log) => {
        const actionColors: Record<string, string> = {
          CREATE:
            "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
          UPDATE:
            "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
          DELETE:
            "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
          STATUS_CHANGE:
            "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
          STOCK_ADJUST:
            "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
          PRICE_UPDATE:
            "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
        };
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${actionColors[log.action] || "bg-slate-500/10 text-slate-600 border-slate-500/20"}`}
          >
            {log.action.replace("_", " ")}
          </span>
        );
      },
    },
    {
      header: "Details",
      render: (log) => (
        <div className="flex items-start space-x-2 max-w-xs">
          <Info className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />
          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 leading-relaxed">
            {log.details}
          </span>
        </div>
      ),
    },
    {
      header: "Executed By",
      render: (log) => (
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-800 dark:text-slate-200">
            {log.user}
          </span>
          <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            {log.role}
          </span>
        </div>
      ),
    },
  ];

  const Filters = (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-3xl">
        <div className="space-y-1.5">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
            Item Name
          </label>
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 flex items-center space-x-2 focus-within:border-emerald-500/50 transition-all">
            <input
              type="text"
              name="itemName"
              placeholder="Search item..."
              className="bg-transparent outline-none text-[11px] w-full font-bold text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
              value={filters.itemName}
              onChange={handleFilterChange}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
            Action Type
          </label>
          <select
            name="action"
            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-[11px] font-bold text-slate-800 dark:text-white outline-none focus:border-emerald-500/50 transition-all"
            value={filters.action}
            onChange={handleFilterChange}
          >
            <option value="">All Actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
            <option value="STATUS_CHANGE">Status Change</option>
            <option value="STOCK_ADJUST">Stock Adjust</option>
            <option value="PRICE_UPDATE">Price Update</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
            User
          </label>
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 flex items-center space-x-2 focus-within:border-emerald-500/50 transition-all">
            <input
              type="text"
              name="user"
              placeholder="Search user..."
              className="bg-transparent outline-none text-[11px] w-full font-bold text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
              value={filters.user}
              onChange={handleFilterChange}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const Footer = (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {[10, 50, 100].map((size) => (
          <button
            key={size}
            onClick={() => {
              setPageSize(size);
              setVisibleCount(size);
            }}
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
        {visibleCount < filteredLogs.length && (
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <header className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-slate-500 dark:text-slate-400 shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <div>
            <h1 className="text-lg md:text-xl font-black text-slate-800 dark:text-white tracking-tight">
              System Audit Log
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-[10px] uppercase tracking-widest">
              Traceability & Compliance History
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-[9px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">
              GxP Compliant
            </span>
          </div>
        </div>
      </header>

      <DataTable
        columns={columns}
        data={paginatedLogs}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        onRefresh={() => fetchLogs("refresh")}
        filters={Filters}
        footer={Footer}
        headerRight={
          <div className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">
            {paginatedLogs.length} of {filteredLogs.length} Entries
          </div>
        }
        loadingMessage="Accessing Secure Logs..."
        refreshMessage="Refreshing logs..."
        refreshLabel="Refresh"
        emptyMessage="No audit entries found"
      />
    </div>
  );
};

export default AuditLogs;
