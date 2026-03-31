import React, { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useNavigate } from "react-router-dom";
import StatCard from "@/src/components/StatCard";
import { useTheme } from "@/src/components/context/ThemeContext";
import PageMeta from "@/src/components/common/PageMeta";
import { DashboardResponse, fetchDashboard } from "@/src/services/dashboard";

const currencyCompact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "ETB",
  notation: "compact",
  maximumFractionDigits: 1,
});

const currencyFull = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "ETB",
  maximumFractionDigits: 2,
});

const integerFormatter = new Intl.NumberFormat("en-US");

const formatCompactCurrency = (value: string | number | null | undefined) =>
  currencyCompact.format(Number(value || 0));

const formatCurrency = (value: string | number | null | undefined) =>
  currencyFull.format(Number(value || 0));

const Dashboard: React.FC = () => {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [salesView, setSalesView] = useState<"weekly" | "daily">("weekly");
  const navigate = useNavigate();
  const { theme } = useTheme();

  const loadDashboard = async (options?: {
    refresh?: boolean;
    showLoader?: boolean;
  }) => {
    const { refresh = false, showLoader = !dashboard } = options || {};

    if (showLoader) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const data = await fetchDashboard({ refresh });
      setDashboard(data);
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      if (showLoader) {
        setIsLoading(false);
      } else {
        setIsRefreshing(false);
      }
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-3"></div>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">
          Aggregating Enterprise Data...
        </p>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          Dashboard data could not be loaded.
        </p>
      </div>
    );
  }

  const salesData =
    salesView === "weekly"
      ? dashboard.charts.weekly_sales.map((item) => ({
          ...item,
          sales: Number(item.sales || 0),
        }))
      : dashboard.charts.daily_sales.map((item) => ({
          ...item,
          sales: Number(item.sales || 0),
        }));

  const monthlyRevenueData = dashboard.charts.monthly_revenue.map((item) => ({
    ...item,
    income: Number(item.income || 0),
  }));

  const productRevenueData = dashboard.top_products.map((item) => ({
    ...item,
    value: Number(item.value || 0),
  }));

  const inventoryStatusData = [
    {
      name: "In Stock",
      value: dashboard.inventory_status.in_stock,
      color: "#10b981",
    },
    {
      name: "Low Stock",
      value: dashboard.inventory_status.low_stock,
      color: "#ef4444",
    },
    {
      name: "Expiring",
      value: dashboard.inventory_status.expiring_soon,
      color: "#f59e0b",
    },
    {
      name: "Expired",
      value: dashboard.inventory_status.expired,
      color: "#64748b",
    },
  ];

  const lowStockItems = dashboard.alerts;

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500 pb-16">
      <PageMeta
        title="Dashboard"
        description="Comprehensive dashboard for pharmaceutical operations management"
      />

      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2">
        <div>
          <h1 className="text-lg md:text-xl font-black text-slate-800 dark:text-white tracking-tight uppercase">
            Executive Intelligence
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-[10px] md:text-xs">
            Live pharmacy sales, inventory risk, and activity reporting
          </p>
        </div>
        <div className="flex space-x-1.5 w-full sm:w-auto">
          <button
            onClick={() =>
              void loadDashboard({ refresh: true, showLoader: false })
            }
            disabled={isRefreshing}
            className="flex-1 sm:flex-none bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-1.5"
          >
            <svg
              className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582M20 20v-5h-.581M5.8 9A7 7 0 0119 11m-.8 4A7 7 0 015 13"
              />
            </svg>
            {isRefreshing ? "Refreshing" : "Refresh"}
          </button>
          <button
            onClick={() => navigate("/inventory")}
            className="flex-1 sm:flex-none bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
          >
            View Inventory
          </button>
          <button
            onClick={() => navigate("/inventory/stock-outs")}
            className="flex-1 sm:flex-none bg-slate-900 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-white hover:bg-slate-800 shadow-xl transition-all"
          >
            Sales Desk
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          title="Today's Sales"
          value={formatCompactCurrency(dashboard.kpis.today_sales)}
          icon={
            <svg
              className="w-5 h-5 text-emerald-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
          trend={`${dashboard.kpis.today_sales_trend} | ${dashboard.kpis.today_sales_count} posted`}
          trendColor="text-emerald-600"
          colorClass="bg-emerald-50"
        />
        <StatCard
          title="Total Products"
          value={integerFormatter.format(dashboard.kpis.total_products)}
          icon={
            <svg
              className="w-5 h-5 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          }
          trend={dashboard.kpis.total_products_trend}
          trendColor="text-slate-400"
          colorClass="bg-blue-50"
        />
        <StatCard
          title="Low Stock Items"
          value={integerFormatter.format(dashboard.kpis.low_stock_count)}
          icon={
            <svg
              className="w-5 h-5 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          }
          trend={dashboard.kpis.low_stock_trend}
          trendColor="text-red-500"
          colorClass="bg-red-50"
        />
        <StatCard
          title="Total Suppliers"
          value={integerFormatter.format(dashboard.kpis.total_suppliers)}
          icon={
            <svg
              className="w-5 h-5 text-amber-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          }
          trend={dashboard.kpis.total_suppliers_trend}
          trendColor="text-amber-600"
          colorClass="bg-amber-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="lg:col-span-3 space-y-4 md:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="bg-white dark:bg-slate-900 p-3 md:p-4 rounded-xl md:rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors min-w-0">
              <div className="flex justify-between items-center mb-3 md:mb-4">
                <div>
                  <h3 className="text-sm md:text-base font-black text-slate-800 dark:text-white tracking-tight">
                    Sales Performance
                  </h3>
                  <p className="text-[9px] md:text-[10px] text-slate-400 font-medium">
                    {salesView === "weekly"
                      ? "Posted sales over the last 7 days"
                      : "Today grouped into 3-hour windows"}
                  </p>
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                  <button
                    onClick={() => setSalesView("weekly")}
                    className={`px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-md transition-all ${
                      salesView === "weekly"
                        ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm"
                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    }`}
                  >
                    Weekly
                  </button>
                  <button
                    onClick={() => setSalesView("daily")}
                    className={`px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-md transition-all ${
                      salesView === "daily"
                        ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm"
                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    }`}
                  >
                    Daily
                  </button>
                </div>
              </div>
              <div className="h-[130px] md:h-[150px] min-w-0 min-h-0">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                  minWidth={1}
                  minHeight={1}
                >
                  <BarChart data={salesData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 9, fontWeight: 700, fill: "#94a3b8" }}
                      interval="preserveStartEnd"
                    />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      cursor={{
                        fill: theme === "dark" ? "#334155" : "#f8fafc",
                        radius: 6,
                        opacity: theme === "dark" ? 0.5 : 1,
                      }}
                      contentStyle={{
                        borderRadius: "8px",
                        backgroundColor:
                          theme === "dark" ? "#1e293b" : "#f8fafc",
                        border: "none",
                        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                        fontSize: "10px",
                        color: theme === "dark" ? "#e2e8f0" : "#0f172a",
                      }}
                    />
                    <Bar
                      dataKey="sales"
                      radius={[4, 4, 0, 0]}
                      fill="#10b981"
                      barSize={salesView === "weekly" ? 24 : 12}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-3 md:p-4 rounded-xl md:rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col overflow-hidden transition-colors">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h3 className="text-sm md:text-base font-black text-slate-800 dark:text-white tracking-tight">
                    System Pulse
                  </h3>
                  <p className="text-[9px] md:text-[10px] text-slate-400 font-medium">
                    Recent audit activity
                  </p>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">
                    Live
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[130px] md:max-h-[150px] pr-1.5 custom-scrollbar">
                {dashboard.recent_activity.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start space-x-2.5 group"
                  >
                    <div
                      className={`w-1 h-1 rounded-full mt-1.5 shrink-0 ${
                        log.type === "success"
                          ? "bg-emerald-500"
                          : log.type === "warning"
                            ? "bg-amber-500"
                            : "bg-blue-500"
                      }`}
                    ></div>
                    <div className="flex-1">
                      <div className="flex justify-between items-baseline gap-2">
                        <p className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight truncate">
                          {log.action}
                        </p>
                        <span className="text-[8px] font-bold text-slate-400 shrink-0">
                          {log.time}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium truncate group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors">
                        {log.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div className="md:col-span-2 bg-white dark:bg-slate-900 p-3 md:p-4 rounded-xl md:rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors min-w-0">
              <h3 className="text-sm md:text-base font-black text-slate-800 dark:text-white mb-1">
                Monthly Revenue
              </h3>
              <p className="text-[9px] md:text-[10px] text-slate-400 font-medium mb-3 md:mb-4">
                Posted sales for the last 6 months
              </p>
              <div className="h-[180px] md:h-[220px] min-w-0 min-h-0">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                  minWidth={1}
                  minHeight={1}
                >
                  <AreaChart data={monthlyRevenueData}>
                    <defs>
                      <linearGradient
                        id="colorIncome"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#6366f1"
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="95%"
                          stopColor="#6366f1"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f8fafc"
                      opacity={0.1}
                    />
                    <XAxis
                      dataKey="month"
                      stroke="#cbd5e1"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#cbd5e1"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => formatCompactCurrency(value)}
                    />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        borderRadius: "16px",
                        border: "none",
                        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15)",
                        backgroundColor: "#1e293b",
                        color: "#f8fafc",
                        fontSize: "10px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="income"
                      stroke="#6366f1"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorIncome)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-3 md:p-4 rounded-xl md:rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col transition-colors min-w-0 min-h-0">
              <h3 className="text-sm md:text-base font-black text-slate-800 dark:text-white mb-1">
                Contribution
              </h3>
              <p className="text-[9px] md:text-[10px] text-slate-400 font-medium mb-3">
                Top products by revenue
              </p>
              <div className="flex-1 min-h-[130px] md:min-h-[150px] min-w-0">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                  minWidth={1}
                  minHeight={1}
                >
                  <PieChart>
                    <Pie
                      data={productRevenueData}
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {productRevenueData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 space-y-1.5">
                {productRevenueData.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-1.5 overflow-hidden">
                      <div
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight truncate">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-[9px] font-black text-slate-800 dark:text-slate-200">
                      {formatCompactCurrency(item.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-3">
          <div className="bg-slate-900 p-3 md:p-4 rounded-xl md:rounded-2xl shadow-xl text-white min-w-0">
            <h3 className="text-[10px] md:text-xs font-black mb-3 uppercase tracking-wider text-slate-400 text-center lg:text-left">
              Inventory Health
            </h3>
            <div className="h-[80px] md:h-[100px] min-w-0 min-h-0">
              <ResponsiveContainer
                width="100%"
                height="100%"
                minWidth={1}
                minHeight={1}
              >
                <BarChart data={inventoryStatusData}>
                  <XAxis dataKey="name" hide />
                  <Bar dataKey="value" radius={[3, 3, 3, 3]} barSize={18}>
                    {inventoryStatusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-[10px]">
                <span className="font-bold text-slate-500">
                  Inventory Value
                </span>
                <span className="font-black text-emerald-400">
                  {formatCompactCurrency(dashboard.kpis.inventory_value)}
                </span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="font-bold text-slate-500">Units on Hand</span>
                <span className="font-black text-slate-100">
                  {integerFormatter.format(dashboard.kpis.inventory_units)}
                </span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="font-bold text-slate-500">Expiring Soon</span>
                <span className="font-black text-amber-300">
                  {integerFormatter.format(dashboard.kpis.expiring_soon_count)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-3 md:p-4 rounded-xl md:rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col min-h-[250px] transition-colors">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-[10px] md:text-xs font-black text-slate-800 dark:text-white uppercase tracking-tighter">
                System Alerts
              </h3>
              <span
                className={`px-1 md:px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase ${
                  lowStockItems.length > 0
                    ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                {lowStockItems.length}
              </span>
            </div>

            {lowStockItems.length > 0 ? (
              <div className="space-y-3 overflow-y-auto max-h-[250px] pr-1.5 custom-scrollbar">
                {lowStockItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl border border-red-50/50 dark:border-red-900/20 bg-red-50/10 dark:bg-red-900/5 hover:bg-red-50/30 dark:hover:bg-red-900/10 transition-all cursor-pointer group"
                    onClick={() => navigate("/inventory")}
                  >
                    <div className="flex justify-between items-start mb-0.5">
                      <h4 className="font-black text-slate-800 dark:text-slate-200 text-[10px] uppercase tracking-tight truncate pr-1.5">
                        {item.medicine_name}
                      </h4>
                      <div className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0"></div>
                    </div>
                    <div className="flex items-end justify-between">
                      <div className="space-y-0">
                        <p className="text-[8px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest truncate">
                          {item.naming_series || item.batch_number}
                        </p>
                        <div className="flex items-baseline space-x-1">
                          <span className="text-base font-black text-red-600 dark:text-red-400">
                            {item.quantity}
                          </span>
                          <span className="text-[8px] text-red-400 dark:text-red-500 font-black uppercase">
                            units
                          </span>
                        </div>
                      </div>
                      <span className="text-[8px] text-slate-400 dark:text-slate-500 font-bold">
                        {item.days_to_expiry > 0
                          ? `${item.days_to_expiry}d`
                          : "Review"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-emerald-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="text-slate-800 dark:text-slate-200 text-[10px] font-black uppercase tracking-tight">
                  Nominal State
                </p>
              </div>
            )}

            <button
              onClick={() => navigate("/inventory")}
              className="mt-4 w-full py-2 text-[8px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border border-slate-100 dark:border-slate-800 rounded-lg transition-all"
            >
              Full Repository
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
