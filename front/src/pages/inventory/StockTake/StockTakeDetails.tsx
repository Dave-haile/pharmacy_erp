import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Play,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
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

const StockTakeDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [stockTake, setStockTake] = useState<StockTakeDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [countedQuantity, setCountedQuantity] = useState("");
  const [itemNotes, setItemNotes] = useState("");

  useEffect(() => {
    loadStockTake();
  }, [id]);

  const loadStockTake = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await fetchStockTake(parseInt(id));
      setStockTake(data);
    } catch (err) {
      console.error("Failed to load stock take", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    if (!id) return;
    try {
      setActionLoading(true);
      await startStockTake(parseInt(id));
      await loadStockTake();
    } catch (err) {
      console.error("Failed to start stock take", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCountItem = async (itemId: number) => {
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
  };

  const handleComplete = async (applyAdjustments: boolean) => {
    if (!id) return;
    try {
      setActionLoading(true);
      await completeStockTake(parseInt(id), { apply_adjustments: applyAdjustments });
      await loadStockTake();
    } catch (err) {
      console.error("Failed to complete stock take", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!id || !window.confirm("Are you sure you want to cancel this stock take?")) return;
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

  if (loading) {
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
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(stockTake.status)}`}>
                {stockTake.status_label || stockTake.status}
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400">{stockTake.title}</p>
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

      {/* Items Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Item</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Batch</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">System Qty</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Counted</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Variance</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                {stockTake.status === "In Progress" && (
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {stockTake.items?.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{item.medicine_name}</p>
                      <p className="text-xs text-slate-500">{item.medicine_barcode}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                    {item.batch_number || "-"}
                  </td>
                  <td className="px-6 py-4 text-right text-slate-900 dark:text-white">
                    {item.system_quantity}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {editingItem === item.id ? (
                      <input
                        type="number"
                        value={countedQuantity}
                        onChange={(e) => setCountedQuantity(e.target.value)}
                        className="w-24 px-2 py-1 border rounded text-right"
                        autoFocus
                      />
                    ) : (
                      <span className={getVarianceColor(item.variance)}>
                        {item.counted_quantity || "-"}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`font-medium ${getVarianceColor(item.variance)}`}>
                      {item.variance !== "0" && item.variance !== "0.00" ? (parseFloat(item.variance) > 0 ? "+" : "") + item.variance : "0"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      item.variance_status === "matched" ? "bg-emerald-100 text-emerald-700" :
                      item.variance_status === "surplus" ? "bg-blue-100 text-blue-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {item.variance_status}
                    </span>
                  </td>
                  {stockTake.status === "In Progress" && (
                    <td className="px-6 py-4">
                      {editingItem === item.id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCountItem(item.id)}
                            disabled={actionLoading}
                            className="px-3 py-1 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingItem(null)}
                            className="px-3 py-1 bg-slate-200 text-slate-700 text-xs rounded hover:bg-slate-300"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingItem(item.id);
                            setCountedQuantity(item.counted_quantity || "");
                          }}
                          className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                        >
                          Count
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StockTakeDetails;