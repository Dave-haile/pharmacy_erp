import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Play,
  CheckCircle,
  XCircle,
  Loader2,
  Save,
} from "lucide-react";
import {
  fetchStockTake,
  startStockTake,
  countStockTakeItem,
  completeStockTake,
  cancelStockTake,
  StockTakeDetailResponse,
  StockTakeItem as StockTakeItemType,
} from "@/src/services/stockTake";
import DataTable, { Column } from "@/src/components/DataTable";

type StockTakeItemFilters = {
  item: string;
  generic_name: string;
  status: string;
};

const StockTakeDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [stockTake, setStockTake] = useState<StockTakeDetailResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [countedQuantity, setCountedQuantity] = useState("");
  const [itemNotes, setItemNotes] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [itemFilters, setItemFilters] = useState<StockTakeItemFilters>({
    item: "",
    generic_name: "",
    status: "",
  });

  const statusOptions = useMemo(
    () => [
      { label: "Matched", value: "matched" },
      { label: "Surplus", value: "surplus" },
      { label: "Shortage", value: "shortage" },
    ],
    [],
  );

  const loadStockTake = useCallback(
    async (page = currentPage, size = pageSize) => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await fetchStockTake(parseInt(id), {
          page,
          page_size: size,
          item: itemFilters.item.trim(),
          generic_name: itemFilters.generic_name.trim(),
          status: itemFilters.status,
        });
        setStockTake(data);
      } catch (err) {
        console.error("Failed to load stock take", err);
      } finally {
        setLoading(false);
      }
    },
    [currentPage, id, itemFilters.generic_name, itemFilters.item, itemFilters.status, pageSize],
  );

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    setCurrentPage(1);
    setItemFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleStart = async () => {
    if (!id) return;
    try {
      setActionLoading(true);
      await startStockTake(parseInt(id));
      setCurrentPage(1);
      await loadStockTake(1, pageSize);
    } catch (err) {
      console.error("Failed to start stock take", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCountItem = useCallback(
    async (itemId: number) => {
      if (!id) return;
      try {
        setActionLoading(true);
        await countStockTakeItem(parseInt(id), itemId, {
          counted_quantity: countedQuantity,
          notes: itemNotes,
        });
        setEditingItem(null);
        setCountedQuantity("");
        setItemNotes("");
        await loadStockTake();
      } catch (err) {
        console.error("Failed to count item", err);
      } finally {
        setActionLoading(false);
      }
    },
    [countedQuantity, id, itemNotes, loadStockTake],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [id]);

  useEffect(() => {
    void loadStockTake(currentPage, pageSize);
  }, [currentPage, loadStockTake, pageSize]);

  const handleComplete = async (applyAdjustments: boolean) => {
    if (!id) return;
    try {
      setActionLoading(true);
      await completeStockTake(parseInt(id), {
        apply_adjustments: applyAdjustments,
      });
      await loadStockTake();
    } catch (err) {
      console.error("Failed to complete stock take", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (
      !id ||
      !window.confirm("Are you sure you want to cancel this stock take?")
    )
      return;
    try {
      setActionLoading(true);
      await cancelStockTake(parseInt(id));
      navigate("/inventory/stock-takes");
    } catch (err) {
      console.error("Failed to cancel stock take", err);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Draft":
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
      case "In Progress":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
      case "Completed":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300";
      case "Cancelled":
        return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const getVarianceColor = (variance: string) => {
    const v = parseFloat(variance);
    if (v === 0) return "text-slate-600";
    if (v > 0) return "text-emerald-600";
    return "text-red-600";
  };

  const columns: Column<StockTakeItemType>[] = useMemo(
    () => [
      {
        header: "Item",
        render: (item) => (
          <div>
            <p className="font-medium text-slate-900 dark:text-white">
              {item.medicine_name}
            </p>
            {item.medicine_generic_name ? (
              <p className="text-xs text-slate-500">
                {item.medicine_generic_name}
              </p>
            ) : null}
            <p className="text-xs text-slate-500">{item.medicine_barcode}</p>
          </div>
        ),
      },
      {
        header: "Batch",
        render: (item) => (
          <span className="text-slate-600 dark:text-slate-400">
            {item.batch_number || "-"}
          </span>
        ),
      },
      {
        header: "System Qty",
        className: "text-right",
        headerClassName: "text-right",
        render: (item) => (
          <span className="text-slate-900 dark:text-white">
            {item.system_quantity}
          </span>
        ),
      },
      {
        header: "Counted",
        className: "text-right",
        headerClassName: "text-right",
        render: (item) =>
          editingItem === item.id ? (
            <input
              type="number"
              value={countedQuantity}
              onChange={(e) => setCountedQuantity(e.target.value)}
              className="w-24 rounded border border-slate-300 px-2 py-1 text-right dark:border-slate-700 dark:bg-slate-900"
              autoFocus
            />
          ) : (
            <span className={getVarianceColor(item.variance)}>
              {item.counted_quantity || "-"}
            </span>
          ),
      },
      {
        header: "Variance",
        className: "text-right",
        headerClassName: "text-right",
        render: (item) => (
          <span className={`font-medium ${getVarianceColor(item.variance)}`}>
            {item.variance !== "0" && item.variance !== "0.00"
              ? `${parseFloat(item.variance) > 0 ? "+" : ""}${item.variance}`
              : "0"}
          </span>
        ),
      },
      {
        header: "Status",
        render: (item) => (
          <span
            className={`text-xs font-medium px-2 py-1 rounded-full ${
              item.variance_status === "matched"
                ? "bg-emerald-100 text-emerald-700"
                : item.variance_status === "surplus"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-red-100 text-red-700"
            }`}
          >
            {item.variance_status}
          </span>
        ),
      },
      ...(stockTake?.status === "In Progress"
        ? [
            {
              header: "Actions",
              render: (item: StockTakeItemType) =>
                editingItem === item.id ? (
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleCountItem(item.id);
                      }}
                      disabled={actionLoading}
                      className="rounded bg-emerald-600 px-3 py-1 text-xs text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingItem(null);
                        setCountedQuantity("");
                        setItemNotes("");
                      }}
                      className="rounded bg-slate-200 px-3 py-1 text-xs text-slate-700 hover:bg-slate-300"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingItem(item.id);
                      setCountedQuantity(item.counted_quantity || "");
                      setItemNotes(item.notes || "");
                    }}
                    className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                  >
                    Count
                  </button>
                ),
            } as Column<StockTakeItemType>,
          ]
        : []),
    ],
    [
      actionLoading,
      countedQuantity,
      editingItem,
      handleCountItem,
      stockTake?.status,
    ],
  );

  const filterControls = (
    <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="space-y-1.5">
        <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 transition-all focus-within:border-emerald-500/50 dark:border-slate-800 dark:bg-slate-800">
          <input
            type="text"
            name="item"
            placeholder="Search item, barcode, or batch..."
            className="w-full bg-transparent text-[11px] font-bold text-slate-800 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-600"
            value={itemFilters.item}
            onChange={handleFilterChange}
            autoComplete="off"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 transition-all focus-within:border-emerald-500/50 dark:border-slate-800 dark:bg-slate-800">
          <input
            type="text"
            name="generic_name"
            placeholder="Search generic name..."
            className="w-full bg-transparent text-[11px] font-mono font-bold text-slate-800 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-600"
            value={itemFilters.generic_name}
            onChange={handleFilterChange}
            autoComplete="off"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="relative">
          {!itemFilters.status && (
            <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-[11px] font-mono font-bold text-slate-400 dark:text-slate-500">
              Status
            </span>
          )}
          <select
            autoComplete="off"
            name="status"
            value={itemFilters.status}
            onChange={handleFilterChange}
            className={`w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 pr-9 text-[11px] font-mono font-bold transition-all focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-slate-800 dark:bg-slate-800 ${
              itemFilters.status
                ? "text-slate-800 dark:text-white"
                : "text-transparent"
            }`}
          >
            <option value=""></option>
            {statusOptions.map((option) => (
              <option
                key={option.value}
                value={option.value}
                className="text-slate-800 dark:text-white"
              >
                {option.label}
              </option>
            ))}
          </select>
          <svg
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
    </div>
  );

  if (loading && !stockTake) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!stockTake) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-slate-500">Stock take not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Link
            to="/inventory/stock-takes"
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {stockTake.posting_number}
              </h1>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(stockTake.status)}`}
              >
                {stockTake.status_label || stockTake.status}
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400">
              {stockTake.title}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {stockTake.status === "Draft" && (
            <button
              onClick={handleStart}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              Start Counting
            </button>
          )}
          {stockTake.status === "In Progress" && (
            <>
              <button
                onClick={() => handleComplete(false)}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                Complete
              </button>
              <button
                onClick={() => handleComplete(true)}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                Complete & Apply Adjustments
              </button>
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
              >
                <XCircle className="w-4 h-4" />
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {/* Summary */}
      {stockTake.totals && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <p className="text-xs text-slate-500">Total Items</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">
              {stockTake.totals.total_items}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <p className="text-xs text-slate-500">Matched</p>
            <p className="text-xl font-bold text-emerald-600">
              {stockTake.totals.matched_items}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <p className="text-xs text-slate-500">Surplus</p>
            <p className="text-xl font-bold text-blue-600">
              {stockTake.totals.positive_variance_items}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <p className="text-xs text-slate-500">Shortage</p>
            <p className="text-xl font-bold text-red-600">
              {stockTake.totals.negative_variance_items}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <p className="text-xs text-slate-500">Accuracy</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">
              {stockTake.totals.accuracy_rate?.toFixed(1)}%
            </p>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={stockTake.items || []}
        isLoading={loading}
        isRefreshing={loading && (stockTake.items?.length || 0) > 0}
        onRefresh={() => loadStockTake()}
        filters={filterControls}
        pagination={{
          currentPage,
          pageSize,
          total: stockTake.count,
          onPageChange: setCurrentPage,
          onPageSizeChange: setPageSize,
          pageSizeOptions: [10, 25, 50],
        }}
        emptyMessage="No stock take items found"
        loadingMessage="Loading stock take items..."
        rowClassName={() => "hover:bg-slate-50/50 dark:hover:bg-slate-800/30"}
      />
    </div>
  );
};

export default StockTakeDetails;
