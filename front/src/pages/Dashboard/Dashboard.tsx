import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { useNavigate } from "react-router-dom";
import StatCard from "@/src/components/StatCard";
import api from "@/src/services/api";
import { useTheme } from "@/src/components/context/ThemeContext";
import PageMeta from "@/src/components/common/PageMeta";

// Existing Monthly Production/Sales Data
const monthlyData = [
  { name: "Jan", sales: 4000, production: 2400, income: 125000 },
  { name: "Feb", sales: 3000, production: 1398, income: 98000 },
  { name: "Mar", sales: 2000, production: 9800, income: 142000 },
  { name: "Apr", sales: 2780, production: 3908, income: 110000 },
  { name: "May", sales: 1890, production: 4800, income: 135000 },
  { name: "Jun", sales: 2390, production: 3800, income: 158000 },
];

// New Weekly Sales Data
const weeklySalesData = [
  { day: "Mon", sales: 12400 },
  { day: "Tue", sales: 15200 },
  { day: "Wed", sales: 9800 },
  { day: "Thu", sales: 18600 },
  { day: "Fri", sales: 21000 },
  { day: "Sat", sales: 4500 },
  { day: "Sun", sales: 3200 },
];

// New Daily Sales Data (Hourly)
const dailySalesData = [
  { time: "08:00", sales: 1200 },
  { time: "10:00", sales: 2500 },
  { time: "12:00", sales: 4800 },
  { time: "14:00", sales: 3200 },
  { time: "16:00", sales: 5100 },
  { time: "18:00", sales: 2800 },
  { time: "20:00", sales: 1500 },
];

// New Revenue by Product Data
const productRevenueData = [
  { name: "Aspirin Pro", value: 45000, color: "#10b981" },
  { name: "Metformin XL", value: 32000, color: "#6366f1" },
  { name: "Amoxicillin", value: 28000, color: "#3b82f6" },
  { name: "Lisinopril", value: 18000, color: "#f59e0b" },
  { name: "Others", value: 12000, color: "#94a3b8" },
];

// Mock System Activity Logs
const systemLogs = [
  {
    id: 1,
    time: "14:22",
    type: "success",
    action: "Batch BT-9921",
    message: "QA Verification Passed",
    user: "System",
  },
  {
    id: 2,
    time: "13:45",
    type: "info",
    action: "Inventory",
    message: "Stock Re-order: Amoxicillin (200kg)",
    user: "L. Miller",
  },
  {
    id: 3,
    time: "12:10",
    type: "warning",
    action: "Compliance",
    message: "Storage Temp Deviation: Area-C (+1.2C)",
    user: "Sensor-8",
  },
  {
    id: 4,
    time: "10:30",
    type: "success",
    action: "Production",
    message: "New Run Initiated: Aspirin Pro",
    user: "A. Thorne",
  },
  {
    id: 5,
    time: "09:15",
    type: "info",
    action: "System",
    message: "User Dr. Aris Thorne Logged In",
    user: "AuthSvc",
  },
  {
    id: 6,
    time: "08:45",
    type: "success",
    action: "Logistics",
    message: "Order #SH-2201 Dispatched",
    user: "Warehouse-1",
  },
  {
    id: 7,
    time: "07:20",
    type: "info",
    action: "Audit",
    message: "Weekly Security Scan Completed",
    user: "SecBot",
  },
];

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [salesView, setSalesView] = useState<"weekly" | "daily">("weekly");
  const navigate = useNavigate();
  const { theme } = useTheme();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, invRes] = await Promise.all([
          api.get("/api/dashboard/stats"),
          api.get("/api/inventory"),
        ]);
        setStats(statsRes.data);
        setInventory(invRes.data.items ?? []);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const lowStockItems = inventory.filter((item) => item.quantity < 10);

  if (isLoading)
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-3"></div>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">
          Aggregating Enterprise Data...
        </p>
      </div>
    );

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
            Global pharmaceutical operations & financial health
          </p>
        </div>
        <div className="flex space-x-1.5 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm">
            Generate Audit
          </button>
          <button className="flex-1 sm:flex-none bg-slate-900 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-white hover:bg-slate-800 shadow-xl transition-all">
            + Production
          </button>
        </div>
      </header>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          title="Today's Sales"
          value={stats?.todaySales || "$42.5k"}
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
          trend="+12% from yesterday"
          trendColor="text-emerald-600"
          colorClass="bg-emerald-50"
        />
        <StatCard
          title="Total Products"
          value={stats?.totalProducts || "458 SKU"}
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
          trend="Active in catalog"
          trendColor="text-slate-400"
          colorClass="bg-blue-50"
        />
        <StatCard
          title="Low Stock Items"
          value={stats?.lowStockCount || lowStockItems.length}
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
          trend="Requires attention"
          trendColor="text-red-500"
          colorClass="bg-red-50"
        />
        <StatCard
          title="Total Suppliers"
          value={stats?.totalSuppliers || "24"}
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
          trend="Verified partners"
          trendColor="text-amber-600"
          colorClass="bg-amber-50"
        />
      </div>

      {/* Main Insights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="lg:col-span-3 space-y-4 md:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Sales Performance Chart (Daily/Weekly) */}
            <div className="bg-white dark:bg-slate-900 p-3 md:p-4 rounded-xl md:rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
              <div className="flex justify-between items-center mb-3 md:mb-4">
                <div>
                  <h3 className="text-sm md:text-base font-black text-slate-800 dark:text-white tracking-tight">
                    Sales Performance
                  </h3>
                  <p className="text-[9px] md:text-[10px] text-slate-400 font-medium">
                    {salesView === "weekly"
                      ? "Weekly trend analysis"
                      : "Daily hourly breakdown"}
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
              <div className="h-[130px] md:h-[150px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={
                      salesView === "weekly" ? weeklySalesData : dailySalesData
                    }
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey={salesView === "weekly" ? "day" : "time"}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 9, fontWeight: 700, fill: "#94a3b8" }}
                    />
                    <Tooltip
                      cursor={{
                        fill: theme === "dark" ? "#334155" : "#f8fafc", // Dark: slate-700, Light: white
                        radius: 6,
                        opacity: theme === "dark" ? 0.5 : 1, // Optional: adjust opacity for dark mode
                      }}
                      contentStyle={{
                        borderRadius: "8px",
                        backgroundColor:
                          theme === "dark" ? "#1e293b" : "#f8fafc",
                        border: "none",
                        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                        fontSize: "10px",
                        color: theme === "dark" ? "#e2e8f0" : "#0f172a", // Text color for tooltip
                      }}
                    />
                    <Bar
                      dataKey="sales"
                      radius={[4, 4, 0, 0]}
                      fill="#10b981"
                      barSize={salesView === "weekly" ? 24 : 16}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* System Pulse */}
            <div className="bg-white dark:bg-slate-900 p-3 md:p-4 rounded-xl md:rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col overflow-hidden transition-colors">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h3 className="text-sm md:text-base font-black text-slate-800 dark:text-white tracking-tight">
                    System Pulse
                  </h3>
                  <p className="text-[9px] md:text-[10px] text-slate-400 font-medium">
                    Live activity log
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
                {systemLogs.map((log) => (
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
                      <div className="flex justify-between items-baseline">
                        <p className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">
                          {log.action}
                        </p>
                        <span className="text-[8px] font-bold text-slate-400">
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
            {/* Monthly Financial Growth */}
            <div className="md:col-span-2 bg-white dark:bg-slate-900 p-3 md:p-4 rounded-xl md:rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
              <h3 className="text-sm md:text-base font-black text-slate-800 dark:text-white mb-1">
                Monthly Revenue
              </h3>
              <p className="text-[9px] md:text-[10px] text-slate-400 font-medium mb-3 md:mb-4">
                Fiscal performance (6 mo)
              </p>
              <div className="h-[180px] md:h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData}>
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
                      dataKey="name"
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
                      tickFormatter={(val) => `$${val / 1000}k`}
                    />
                    <Tooltip
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

            {/* Revenue by Product */}
            <div className="bg-white dark:bg-slate-900 p-3 md:p-4 rounded-xl md:rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col transition-colors">
              <h3 className="text-sm md:text-base font-black text-slate-800 dark:text-white mb-1">
                Contribution
              </h3>
              <p className="text-[9px] md:text-[10px] text-slate-400 font-medium mb-3">
                Revenue by SKU
              </p>
              <div className="flex-1 min-h-[130px] md:min-h-[150px]">
                <ResponsiveContainer width="100%" height="100%">
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
                    <Tooltip />
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
                      ${(item.value / 1000).toFixed(1)}k
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tactical Sidebar */}
        <div className="lg:col-span-1 space-y-3">
          <div className="bg-slate-900 p-3 md:p-4 rounded-xl md:rounded-2xl shadow-xl text-white">
            <h3 className="text-[10px] md:text-xs font-black mb-3 uppercase tracking-wider text-slate-400 text-center lg:text-left">
              Efficiency
            </h3>
            <div className="h-[80px] md:h-[100px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData.slice(-4)}>
                  <Bar
                    dataKey="production"
                    fill="#3b82f6"
                    radius={[3, 3, 3, 3]}
                    barSize={10}
                  />
                  <Bar
                    dataKey="sales"
                    fill="#10b981"
                    radius={[3, 3, 3, 3]}
                    barSize={10}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-[10px]">
                <span className="font-bold text-slate-500">Output Ratio</span>
                <span className="font-black text-emerald-400">0.92</span>
              </div>
              <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-[92%]"></div>
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
