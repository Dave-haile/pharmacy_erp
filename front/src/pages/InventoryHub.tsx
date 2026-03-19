import React from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const stockLevelData = [
  { category: "Tablets", stock: 4500 },
  { category: "Syrups", stock: 2800 },
  { category: "Injections", stock: 1200 },
  { category: "Creams", stock: 3400 },
  { category: "Others", stock: 1800 },
];

const inventoryValueTrend = [
  { month: "Jan", value: 450000 },
  { month: "Feb", value: 480000 },
  { month: "Mar", value: 420000 },
  { month: "Apr", value: 510000 },
  { month: "May", value: 540000 },
  { month: "Jun", value: 590000 },
];

const stockDistribution = [
  { name: "Raw Materials", value: 40, color: "#10b981" },
  { name: "WIP", value: 25, color: "#3b82f6" },
  { name: "Finished Goods", value: 35, color: "#6366f1" },
];

interface LinkItem {
  label: string;
  path: string;
  highlighted?: boolean;
  active?: boolean;
  icon?: React.ReactNode;
}

interface SectionProps {
  title: string;
  subtitle: string;
  accentColor: string;
  icon: React.ReactNode;
  links: LinkItem[];
}

const CategorySection: React.FC<SectionProps> = ({
  title,
  subtitle,
  accentColor,
  icon,
  links,
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
        <div className="flex items-center space-x-2.5">
          <div
            className={`p-1.5 rounded-lg ${accentColor} text-white shadow-sm`}
          >
            {React.cloneElement(icon as React.ReactElement, {
              className: "w-4 h-4",
            })}
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none mb-0.5">
              {title}
            </h2>
            <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
              {subtitle}
            </p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
        {links.map((link, idx) => (
          <button
            key={idx}
            onClick={() => link.path !== "#" && navigate(link.path)}
            className="w-full group flex items-center justify-between p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-200 text-left"
          >
            <div className="flex items-center space-x-3 overflow-hidden">
              <div
                className={`w-1 h-1 rounded-full shrink-0 transition-all duration-300 ${
                  link.highlighted
                    ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                    : "bg-slate-300 dark:bg-slate-700 group-hover:bg-slate-400"
                }`}
              />
              <div className="flex flex-col">
                <span
                  className={`text-[11px] font-bold tracking-tight transition-colors ${
                    link.active
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100"
                  }`}
                >
                  {link.label}
                </span>
                {link.highlighted && (
                  <span className="text-[7px] font-mono text-slate-400 dark:text-slate-600 uppercase tracking-tighter -mt-0.5">
                    Verified Module
                  </span>
                )}
              </div>
            </div>

            <div className="text-slate-300 dark:text-slate-700 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-transform duration-200 group-hover:translate-x-0.5">
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

const InventoryHub: React.FC = () => {
  const sections: SectionProps[] = [
    {
      title: "Items & Pricing",
      subtitle: "Catalog & Tariffs",
      accentColor: "bg-amber-500",
      icon: (
        <svg
          className="w-5 h-5"
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
      ),
      links: [
        {
          label: "Inventory Control",
          path: "/inventory/control",
          highlighted: true,
        },
        { label: "Medicine", path: "/inventory/medicines", highlighted: true },
        {
          label: "Medicine Grouping",
          path: "/inventory/medicine-grouping",
          highlighted: true,
        },
        { label: "Product Bundles", path: "#", highlighted: true },
        { label: "Global Price List", path: "#" },
        { label: "SKU Pricing", path: "#" },
        { label: "Shipping Rules", path: "#" },
        { label: "Item Alternatives", path: "#" },
        { label: "Manufacturer Registry", path: "#" },
        { label: "Customs Tariff Database", path: "#" },
      ],
    },
    {
      title: "Stock Transactions",
      subtitle: "Logistics & Movement",
      accentColor: "bg-emerald-500",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
          />
        </svg>
      ),
      links: [
        { label: "Material Requests", path: "#", highlighted: true },
        {
          label: "Warehouse Stock Entry",
          path: "/inventory/stock-entries",
          highlighted: true,
          active: true,
        },
        { label: "Delivery Notes", path: "#", highlighted: true },
        { label: "Goods Receiving Voucher", path: "#", active: true },
        { label: "Pick & Pack List", path: "#", highlighted: true },
        { label: "Delivery Trip Planner", path: "#" },
        { label: "Internal Requisitions", path: "#" },
        { label: "Purchase Request", path: "#" },
        { label: "Temporary Movement", path: "#" },
      ],
    },
    {
      title: "Stock Reports",
      subtitle: "Analytics & Audits",
      accentColor: "bg-blue-600",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-6-9a3 3 0 116 0 3 3 0 01-6 0zm-1 12a5 5 0 1110 0H4z"
          />
        </svg>
      ),
      links: [
        { label: "Stock Ledger", path: "#", highlighted: true },
        { label: "Balance Summary", path: "#", highlighted: true },
        { label: "Projected Quantities", path: "#", highlighted: true },
        { label: "Inventory Ageing", path: "#" },
        { label: "Price vs Stock Audit", path: "#" },
        { label: "Master Compliance Report", path: "#" },
        { label: "Purchase Journey Map", path: "#" },
      ],
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      <header className="relative py-6 md:py-10 flex flex-col items-center text-center overflow-hidden border-b border-slate-200 dark:border-slate-800 -mx-2.5 md:-mx-5 px-2.5 md:px-5 mb-6">
        {/* Subtle Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-slate-50 dark:bg-slate-900/20 -z-20" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/5 dark:bg-emerald-500/10 blur-[100px] rounded-full -z-10" />

        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 mb-4 shadow-sm">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
          </span>
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Tactical Inventory Directory
          </span>
        </div>

        <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-6">
          Stock Management{" "}
          <span className="text-emerald-600 dark:text-emerald-400">Hub</span>
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-5xl animate-in slide-in-from-top duration-1000">
          {/* Graph 1: Stock Levels */}
          <div className="bg-white dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-sm">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Category Stock Levels
              </h3>
              <span className="text-[8px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded-full">
                +4.2%
              </span>
            </div>
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stockLevelData}>
                  <Bar dataKey="stock" fill="#10b981" radius={[2, 2, 0, 0]} />
                  <XAxis dataKey="category" hide />
                  <Tooltip
                    cursor={{ fill: "transparent" }}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                      fontSize: "8px",
                      backgroundColor: "#0f172a",
                      color: "#fff",
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Graph 2: Inventory Value */}
          <div className="bg-white dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-sm">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Inventory Value Trend
              </h3>
              <span className="text-[8px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded-full">
                Stable
              </span>
            </div>
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={inventoryValueTrend}>
                  <defs>
                    <linearGradient id="valueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="url(#valueGrad)"
                  />
                  <XAxis dataKey="month" hide />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                      fontSize: "8px",
                      backgroundColor: "#0f172a",
                      color: "#fff",
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Graph 3: Stock Distribution */}
          <div className="bg-white dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-sm flex items-center">
            <div className="flex-1">
              <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Stock Distribution
              </h3>
              <div className="h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stockDistribution}
                      innerRadius={22}
                      outerRadius={38}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {stockDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                        fontSize: "8px",
                        // backgroundColor: "#0f172a",
                        color: "#fff",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="space-y-1.5 ml-2 pr-2">
              {stockDistribution.map((item) => (
                <div key={item.name} className="flex items-center space-x-1.5">
                  <div
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-[7px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-tighter truncate w-14 leading-none">
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 px-1.5">
        {sections.map((section, idx) => (
          <CategorySection key={idx} {...section} />
        ))}
      </div>

      {/* Quick Action Footer */}
      <footer className="mt-10 pt-8 border-t border-slate-200 dark:border-slate-800">
        <div className="bg-slate-900 dark:bg-slate-900/80 rounded-2xl p-6 md:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden border border-slate-800">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[60px] rounded-full translate-x-1/2 -translate-y-1/2" />

          <div className="space-y-1.5 relative z-10 text-center md:text-left">
            <div className="inline-block px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[8px] font-black uppercase tracking-widest mb-2">
              AI-Powered Insights
            </div>
            <h3 className="text-xl font-black tracking-tight">
              Need a Custom Predictive Report?
            </h3>
            <p className="text-slate-400 text-xs max-w-md leading-relaxed">
              Leverage our neural risk assessment engine to identify potential
              supply chain bottlenecks before they impact production.
            </p>
          </div>

          <button className="relative z-10 bg-white text-slate-900 hover:bg-slate-100 font-black px-8 py-3 rounded-xl shadow-xl transition-all hover:scale-105 active:scale-95 whitespace-nowrap text-xs uppercase tracking-wider">
            Launch AI Intelligence
          </button>
        </div>
      </footer>
    </div>
  );
};

export default InventoryHub;
