import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, ArrowLeft, Calendar, Search } from "lucide-react";
import DataTable, { Column } from "../../../components/DataTable";
import { TextInput } from "../../../components/ui/FormField";
import { fetchLeaveTypes } from "../../../services/hr";
import { LeaveType } from "../../../types/hr";

const LeaveTypeRegistry: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["leave-types-registry"],
    queryFn: () => fetchLeaveTypes(true),
    staleTime: 30 * 1000,
  });

  const filteredRows = useMemo(() => {
    const rows: LeaveType[] = data?.results || [];
    if (!search.trim()) return rows;
    const s = search.toLowerCase();
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(s) || r.code.toLowerCase().includes(s),
    );
  }, [data?.results, search]);

  const columns: Column<LeaveType>[] = [
    {
      header: "Leave Type",
      sortKey: "name",
      render: (t) => (
        <div className="flex flex-col">
          <span className="font-black text-slate-800 dark:text-slate-200 text-[11px] group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{t.name}</span>
          <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-tight">{t.code}</span>
        </div>
      ),
    },
    {
      header: "Default Allowance",
      render: (t) => (
        <div className="flex items-center space-x-1.5">
          <Calendar className="w-3 h-3 text-slate-400" />
          <span className="text-[10px] font-black text-slate-600 dark:text-slate-400">{t.default_days} Days</span>
        </div>
      ),
    },
    {
      header: "Status",
      headerClassName: "text-right",
      className: "text-right",
      render: (t) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${t.is_active
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
            : "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20"
            }`}
        >
          • {t.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      header: "Last Updated",
      headerClassName: "text-right",
      className: "text-right",
      render: (t) => (
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
            {new Date(t.updated_at).toLocaleDateString()}
          </span>
          <span className="text-[8px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
            {new Date(t.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <header className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/hr')}
            className="p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-slate-500 dark:text-slate-400 shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <div>
            <h1 className="text-lg md:text-xl font-black text-slate-800 dark:text-white tracking-tight">Leave Type Registry</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-[10px] uppercase tracking-widest">Master Leave Configuration</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate("/hr/leave-types/new")}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-600/20 transition-all flex items-center space-x-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Leave Type</span>
          </button>
        </div>
      </header>

      <DataTable
        columns={columns}
        data={filteredRows}
        isLoading={isLoading}
        onRefresh={refetch}
        isRefreshing={isFetching}
        onRowClick={(row) => navigate(`/hr/leave-types/${row.code}`)}
        emptyMessage="No leave types found in master database"
        filters={
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <TextInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or code..."
              className="pl-10"
            />
          </div>
        }
        headerRight={
          <div className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">
            {filteredRows.length} Configured Types
          </div>
        }
        loadingMessage="Accessing Leave Registry..."
      />
    </div>
  );
};

export default LeaveTypeRegistry;
