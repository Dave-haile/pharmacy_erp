import React, { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  Download,
  Printer,
  Filter,
  Search,
  AlertTriangle,
  CheckCircle2,
  Package,
  TrendingDown,
  BarChart3,
  Calendar,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import {
  fetchInventoryStatusReport,
  InventoryStatusResponse,
} from "../../services/reports";

const COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444"];

const getStatusBadge = (status: string, statusKey: string) => {
  if (statusKey === "in_stock") {
    return (
      <span className="flex items-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        {status}
      </span>
    );
  }
  if (statusKey === "low_stock") {
    return (
      <span className="flex items-center text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
        <AlertTriangle className="w-3 h-3 mr-1" />
        {status}
      </span>
    );
  }
  if (statusKey === "expired") {
    return (
      <span className="flex items-center text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
        <AlertTriangle className="w-3 h-3 mr-1" />
        {status}
      </span>
    );
  }
  return (
    <span className="flex items-center text-[10px] font-bold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
      {status}
    </span>
  );
};

const InventoryStatusReport: React.FC = () => {
  const [data, setData] = useState<InventoryStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchInventoryStatusReport({
        page: currentPage,
        page_size: 20,
        search: searchTerm || undefined,
        category: selectedCategory || undefined,
        status: selectedStatus || undefined,
      });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load report");
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, selectedCategory, selectedStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const handleStatusFilter = (status: string) => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(num);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <AlertTriangle className="w-12 h-12 text-red-500" />
        <p className="text-red-500 font-medium">{error}</p>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const summary = data?.summary;
  const items = data?.items || [];
  const categoryValuation = data?.category_valuation || [];
  const stockDistribution = data?.stock_distribution || [];
  const pagination = data?.pagination;
  const filters = data?.filters;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Link
            to="/reports"
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Inventory Status Report
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1.5" />
              {data?.generated_at
                ? `Generated on ${formatDate(data.generated_at)}`
                : "Loading..."}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Package className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full">
              {summary?.total_medicines || 0} medicines
            </span>
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Total Items
          </p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
            {(summary?.total_items || 0).toLocaleString()}
          </h3>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <BarChart3 className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full">
              Valuation
            </span>
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Total Valuation
          </p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
            {formatCurrency(summary?.total_valuation || "0")}
          </h3>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-full">
              {(summary?.low_stock_count || 0) + (summary?.expiring_soon_count || 0)} items
            </span>
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Low Stock Alerts
          </p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
            {summary?.low_stock_count || 0}
          </h3>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl">
              <TrendingDown className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full">
              {summary?.expired_count || 0} expired
            </span>
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Out of Stock
          </p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
            {summary?.out_of_stock_count || 0}
          </h3>
        </div>
      </div>

      {/* Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
            Stock Level vs. Minimum Threshold
          </h3>
          <div className="h-80 w-full">
            {items.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={items.slice(0, 7)}
                  layout="vertical"
                  margin={{ left: 40 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="#e2e8f0"
                  />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="medicine_name"
                    type="category"
                    width={120}
                    tick={{ fontSize: 11, fontWeight: 500 }}
                  />
                  <Tooltip
                    cursor={{ fill: "transparent" }}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Bar dataKey="quantity" radius={[0, 4, 4, 0]} barSize={20}>
                    {items.slice(0, 7).map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.is_low_stock || entry.is_expired
                            ? "#ef4444"
                            : "#10b981"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">
                No data available
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
            Valuation by Category
          </h3>
          <div className="h-80 w-full flex items-center justify-center">
            {categoryValuation.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryValuation}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryValuation.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-500">No data available</div>
            )}
            <div className="hidden sm:block space-y-2">
              {categoryValuation.slice(0, 5).map((entry, index) => (
                <div key={entry.name} className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    {entry.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Detailed Inventory Status
          </h3>
          <div className="flex items-center space-x-2 flex-wrap gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search items..."
                className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 transition-all w-full sm:w-48"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <select
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm text-slate-700 dark:text-slate-300"
              value={selectedCategory}
              onChange={(e) => handleCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              {filters?.categories?.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <select
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm text-slate-700 dark:text-slate-300"
              value={selectedStatus}
              onChange={(e) => handleStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="expiring_soon">Expiring Soon</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Item Name
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">
                  Quantity
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">
                  Unit Cost
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Expiry
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No items found
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                          {item.medicine_name}
                        </span>
                        <span className="text-xs text-slate-500">
                          {item.batch_number}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                        {item.category || "Uncategorized"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={`text-sm font-bold ${item.is_low_stock ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-white"}`}
                      >
                        {item.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {formatCurrency(item.unit_cost)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {formatDate(item.expiry_date)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(item.status, item.status_key)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination && pagination.total_pages > 1 && (
          <div className="p-5 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Showing {(pagination.page - 1) * pagination.page_size + 1} -{" "}
              {Math.min(
                pagination.page * pagination.page_size,
                pagination.total_count
              )}{" "}
              of {pagination.total_count} items
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {Array.from(
                { length: Math.min(5, pagination.total_pages) },
                (_, i) => {
                  let pageNum;
                  if (pagination.total_pages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= pagination.total_pages - 2) {
                    pageNum = pagination.total_pages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        currentPage === pageNum
                          ? "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                }
              )}
              <button
                onClick={() =>
                  setCurrentPage(Math.min(pagination.total_pages, currentPage + 1))
                }
                disabled={currentPage === pagination.total_pages}
                className="px-3 py-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryStatusReport;