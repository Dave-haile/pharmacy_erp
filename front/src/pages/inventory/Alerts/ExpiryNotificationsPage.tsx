import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Calendar,
  Package,
} from "lucide-react";
import {
  fetchExpiryNotifications,
  acknowledgeExpiryNotification,
  actionExpiryNotification,
  ExpiryNotification as ExpiryNotificationType,
} from "@/src/services/expiryNotifications";

const priorityColors: Record<string, string> = {
  Low: "bg-slate-100 text-slate-700",
  Medium: "bg-amber-100 text-amber-700",
  High: "bg-orange-100 text-orange-700",
  Critical: "bg-red-100 text-red-700",
};

const statusColors: Record<string, string> = {
  Pending: "bg-red-100 text-red-700",
  Acknowledged: "bg-amber-100 text-amber-700",
  Actioned: "bg-emerald-100 text-emerald-700",
  Dismissed: "bg-slate-100 text-slate-500",
};

const ExpiryNotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<ExpiryNotificationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [showActionModal, setShowActionModal] = useState<number | null>(null);
  const [actionText, setActionText] = useState("");

  useEffect(() => {
    loadNotifications();
  }, [statusFilter, priorityFilter]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await fetchExpiryNotifications(
        statusFilter ? { status: statusFilter } : undefined,
        priorityFilter ? { priority: priorityFilter } : undefined
      );
      setNotifications(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (id: number) => {
    try {
      setActionLoading(id);
      await acknowledgeExpiryNotification(id);
      await loadNotifications();
    } catch (err) {
      console.error("Failed to acknowledge notification", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAction = async (id: number) => {
    if (!actionText.trim()) return;
    try {
      setActionLoading(id);
      await actionExpiryNotification(id, actionText);
      setShowActionModal(null);
      setActionText("");
      await loadNotifications();
    } catch (err) {
      console.error("Failed to action notification", err);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  const criticalCount = notifications.filter(
    (n) => n.priority === "Critical" && n.status === "Pending"
  ).length;
  const expiredCount = notifications.filter((n) => n.is_expired).length;

  if (loading && notifications.length === 0) {
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
          <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
            <Clock className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Expiry Notifications
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              {expiredCount > 0
                ? `${expiredCount} items expired`
                : criticalCount > 0
                ? `${criticalCount} items critical`
                : "All items within expiry limits"}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500">Total Notifications</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {notifications.length}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500">Critical</p>
          <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500">Expired</p>
          <p className="text-2xl font-bold text-slate-600">{expiredCount}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500">Actioned</p>
          <p className="text-2xl font-bold text-emerald-600">
            {notifications.filter((n) => n.status === "Actioned").length}
          </p>
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
          <option value="Pending">Pending</option>
          <option value="Acknowledged">Acknowledged</option>
          <option value="Actioned">Actioned</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm"
        >
          <option value="">All Priorities</option>
          <option value="Critical">Critical (≤30 days)</option>
          <option value="High">High (31-60 days)</option>
          <option value="Medium">Medium (61-90 days)</option>
          <option value="Low">Low (&gt;90 days)</option>
        </select>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          {error}
          <button onClick={loadNotifications} className="ml-2 underline">
            Retry
          </button>
        </div>
      )}

      {/* Notifications Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Medicine</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Batch</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Expiry</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Days Left</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Qty at Risk</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Priority</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {notifications.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                    No expiry notifications
                  </td>
                </tr>
              ) : (
                notifications.map((notif) => (
                  <tr
                    key={notif.id}
                    className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 ${
                      notif.is_expired ? "bg-red-50/50 dark:bg-red-900/10" : ""
                    }`}
                  >
                    <td className="px-6 py-4">
                      <Link
                        to={`/inventory/medicines/${notif.medicine}`}
                        className="font-medium text-slate-900 dark:text-white hover:text-emerald-600"
                      >
                        {notif.medicine_name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {notif.batch_number}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`flex items-center gap-1 text-sm ${
                          notif.is_expired ? "text-red-600 font-medium" : "text-slate-600"
                        }`}
                      >
                        <Calendar className="w-3 h-3" />
                        {formatDate(notif.expiry_date)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={`font-medium ${
                          notif.is_expired
                            ? "text-red-600"
                            : notif.days_to_expiry <= 30
                            ? "text-orange-600"
                            : "text-slate-600"
                        }`}
                      >
                        {notif.is_expired ? "Expired" : `${notif.days_to_expiry} days`}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-slate-900 dark:text-white">
                      {notif.quantity_at_risk}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          priorityColors[notif.priority] || priorityColors.Medium
                        }`}
                      >
                        {notif.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          statusColors[notif.status] || statusColors.Pending
                        }`}
                      >
                        {notif.status_label || notif.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {notif.status === "Pending" && (
                          <button
                            onClick={() => handleAcknowledge(notif.id)}
                            disabled={actionLoading === notif.id}
                            className="text-xs text-amber-600 hover:text-amber-700 font-medium disabled:opacity-50"
                          >
                            Acknowledge
                          </button>
                        )}
                        {(notif.status === "Pending" || notif.status === "Acknowledged") && (
                          <button
                            onClick={() => setShowActionModal(notif.id)}
                            disabled={actionLoading === notif.id}
                            className="text-xs text-emerald-600 hover:text-emerald-700 font-medium disabled:opacity-50"
                          >
                            Take Action
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Modal */}
      {showActionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Take Action
            </h3>
            <textarea
              value={actionText}
              onChange={(e) => setActionText(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-slate-800"
              placeholder="e.g., Discounted 20%, Moved to front shelf, Disposed..."
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowActionModal(null);
                  setActionText("");
                }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction(showActionModal)}
                disabled={actionLoading === showActionModal || !actionText.trim()}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                {actionLoading === showActionModal ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Submit"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpiryNotificationsPage;