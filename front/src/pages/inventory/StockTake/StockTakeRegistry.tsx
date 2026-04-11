import React, { useMemo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import DataTable, { Column } from "@/src/components/DataTable";
import { fetchStockTakes, StockTake } from "@/src/services/stockTake";

const statusColors: Record<string, string> = {
  Draft: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  "In Progress":
    "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  Completed:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  Cancelled: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

const StockTakeRegistry: React.FC = () => {
  const [stockTakes, setStockTakes] = useState<StockTake[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    loadStockTakes();
  }, [statusFilter]);

  const loadStockTakes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchStockTakes(
        statusFilter ? { status: statusFilter } : undefined,
      );
      setStockTakes(data.results);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load stock takes",
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString();
  };

  const columns: Column<StockTake>[] = useMemo(
    () => [
      {
        header: "ID",
        render: (st) => (
          <Link
            to={`/inventory/stock-takes/${st.id}`}
            className="text-emerald-600 hover:text-emerald-700 font-medium"
          >
            {st.posting_number}
          </Link>
        ),
      },
      {
        header: "Title",
        render: (st) => (
          <span className="text-slate-900 dark:text-white">{st.title}</span>
        ),
      },
      {
        header: "Status",
        render: (st) => (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              statusColors[st.status] || statusColors.Draft
            }`}
          >
            {st.status_label || st.status}
          </span>
        ),
      },
      {
        header: "Items",
        render: (st) => (
          <span className="text-slate-600 dark:text-slate-400">
            {st.item_count} items
          </span>
        ),
      },
      {
        header: "Accuracy",
        render: (st) => (
          <span className="text-slate-600 dark:text-slate-400">
            {st.totals?.accuracy_rate?.toFixed(1) || 0}%
          </span>
        ),
      },
      {
        header: "Created",
        render: (st) => (
          <span className="text-slate-500 dark:text-slate-400 text-sm">
            {formatDate(st.created_at)}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Stock Takes
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Physical inventory counting and reconciliation
          </p>
        </div>
        <Link
          to="/inventory/stock-takes/new"
          className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Stock Take</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setStatusFilter("")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            statusFilter === ""
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
          }`}
        >
          All
        </button>
        {["Draft", "In Progress", "Completed", "Cancelled"].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === status
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium">{error}</p>
            <button
              type="button"
              onClick={() => void loadStockTakes()}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={stockTakes}
        isLoading={loading}
        onRefresh={loadStockTakes}
        onRowClick={(st) => navigate(`/inventory/stock-takes/${st.id}`)}
        emptyMessage="No stock takes found"
        loadingMessage="Loading stock takes..."
      />
    </div>
  );
};

export default StockTakeRegistry;
