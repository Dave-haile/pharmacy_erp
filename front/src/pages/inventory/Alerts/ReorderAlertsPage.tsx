import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle,
  Package,
  Loader2,
  Filter,
  Bell,
} from "lucide-react";
import {
  fetchReorderAlerts,
  acknowledgeReorderAlert,
  resolveReorderAlert,
  ReorderAlert as ReorderAlertType,
} from "@/src/services/reorderAlerts";

const priorityColors: Record<string, string> = {
  Low: "bg-slate-100 text-slate-700",
  Medium: "bg-amber-100 text-amber-700",
  High: "bg-orange-100 text-orange-700",
  Critical: "bg-red-100 text-red-700",
};

const statusColors: Record<string, string> = {
  Active: "bg-red-100 text-red-700",
  Acknowledged: "bg-amber-100 text-amber-700",
  Resolved: "bg-emerald-100 text-emerald-700",
  Dismissed: "bg-slate-100 text-slate-500",
};

const ReorderAlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<ReorderAlertType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    loadAlerts();
  }, [statusFilter, priorityFilter]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const data = await fetchReorderAlerts(
        statusFilter ? { status: statusFilter } : undefined,
        priorityFilter ? { priority: priorityFilter } : undefined
      );
      setAlerts(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (id: number) => {
    try {
      setActionLoading(id);
      await acknowledgeReorderAlert(id);
      await loadAlerts();
    } catch (err) {
      console.error("Failed to acknowledge alert", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResolve = async (id: number) => {
    try {
      setActionLoading(id);
      await resolveReorderAlert(id);
      await loadAlerts();
    } catch (err) {
      console.error("Failed to resolve alert", err);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const activeCount = alerts.filter((a) => a.status === "Active").length;

  if (loading && alerts.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl">
            <Bell className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Reorder Alerts
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              {activeCount > 0
                ? `${activeCount} items need attention`
                : "All stock levels healthy"}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Acknowledged">Acknowledged</option>
          <option value="Resolved">Resolved</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm"
        >
          <option value="">All Priorities</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          {error}
          <button onClick={loadAlerts} className="ml-2 underline">
            Retry
          </button>
        </div>
      )}

      {/* Alerts List */}
      <div className="space-y-4">
        {alerts.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <p className="text-slate-500 dark:text-slate-400">No reorder alerts</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`p-2 rounded-lg ${
                    alert.priority === "Critical"
                      ? "bg-red-100 dark:bg-red-900/30"
                      : alert.priority === "High"
                      ? "bg-orange-100 dark:bg-orange-900/30"
                      : "bg-amber-100 dark:bg-amber-900/30"
                  }`}
                >
                  <AlertTriangle
                    className={`w-5 h-5 ${
                      alert.priority === "Critical"
                        ? "text-red-600"
                        : alert.priority === "High"
                        ? "text-orange-600"
                        : "text-amber-600"
                    }`}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Link
                      to={`/inventory/medicines/${alert.medicine_barcode}`}
                      className="font-semibold text-slate-900 dark:text-white hover:text-emerald-600"
                    >
                      {alert.medicine_name}
                    </Link>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        priorityColors[alert.priority] || priorityColors.Medium
                      }`}
                    >
                      {alert.priority}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      Stock: {alert.current_stock}
                    </span>
                    <span>Reorder Level: {alert.reorder_level}</span>
                    <span className="text-red-600">
                      Shortage: {alert.shortage_quantity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Triggered: {formatDate(alert.triggered_at)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    statusColors[alert.status] || statusColors.Active
                  }`}
                >
                  {alert.status_label || alert.status}
                </span>
                {alert.status === "Active" && (
                  <button
                    onClick={() => handleAcknowledge(alert.id)}
                    disabled={actionLoading === alert.id}
                    className="px-3 py-1.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 disabled:opacity-50"
                  >
                    Acknowledge
                  </button>
                )}
                {(alert.status === "Active" || alert.status === "Acknowledged") && (
                  <button
                    onClick={() => handleResolve(alert.id)}
                    disabled={actionLoading === alert.id}
                    className="px-3 py-1.5 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 disabled:opacity-50"
                  >
                    Resolve
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReorderAlertsPage;