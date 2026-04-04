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
import { ShoppingCart, TrendingUp, Users } from "lucide-react";

const salesByRegion = [
  { region: "North", sales: 45000 },
  { region: "South", sales: 38000 },
  { region: "East", sales: 52000 },
  { region: "West", sales: 41000 },
  { region: "Central", sales: 29000 },
];

const revenueTrend = [
  { month: "Jan", revenue: 120000 },
  { month: "Feb", revenue: 145000 },
  { month: "Mar", revenue: 132000 },
  { month: "Apr", revenue: 168000 },
  { month: "May", revenue: 185000 },
  { month: "Jun", revenue: 210000 },
];

const paymentDistribution = [
  { name: "Cash", value: 30, color: "#10b981" },
  { name: "Credit Card", value: 45, color: "#3b82f6" },
  { name: "Bank Transfer", value: 25, color: "#f59e0b" },
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
            {React.cloneElement(icon as React.ReactElement, { size: 16 })}
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
                    ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]"
                    : "bg-slate-300 dark:bg-slate-700 group-hover:bg-slate-400"
                }`}
              />
              <div className="flex flex-col">
                <span
                  className={`text-[11px] font-bold tracking-tight transition-colors ${
                    link.active
                      ? "text-blue-600 dark:text-blue-400"
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

const SalesHub: React.FC = () => {
  const sections: SectionProps[] = [
    {
      title: "Sales & Orders",
      subtitle: "Transactions & Revenue",
      accentColor: "bg-blue-600",
      icon: <ShoppingCart />,
      links: [
        { label: "Sales History", path: "/sales/history", highlighted: true },
        { label: "New Sales Entry", path: "/sales/new", highlighted: true },
        { label: "Sales Orders", path: "#" },
        { label: "Quotations", path: "#" },
        { label: "Sales Invoices", path: "#" },
        { label: "Delivery Notes", path: "#" },
        { label: "Sales Returns", path: "#" },
        { label: "POS Transactions", path: "#" },
      ],
    },
    {
      title: "Customers & CRM",
      subtitle: "Relationships & Loyalty",
      accentColor: "bg-emerald-500",
      icon: <Users />,
      links: [
        { label: "Customer Registry", path: "#", highlighted: true },
        { label: "Customer Groups", path: "#", highlighted: true },
        { label: "Loyalty Programs", path: "#" },
        { label: "Credit Limits", path: "#" },
        { label: "Sales Partners", path: "#" },
        { label: "Territory Management", path: "#" },
        { label: "Customer Feedback", path: "#" },
      ],
    },
    {
      title: "Sales Reports",
      subtitle: "Analytics & Forecasts",
      accentColor: "bg-amber-500",
      icon: <TrendingUp />,
      links: [
        { label: "Sales Analytics", path: "#", highlighted: true },
        { label: "Revenue Summary", path: "#", highlighted: true },
        { label: "Sales Person Target", path: "#", highlighted: true },
        { label: "Item-wise Sales", path: "#" },
        { label: "Customer-wise Sales", path: "#" },
        { label: "Sales Funnel", path: "#" },
        { label: "Commission Report", path: "#" },
      ],
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      <header className="relative py-6 md:py-10 flex flex-col items-center text-center overflow-hidden border-b border-slate-200 dark:border-slate-800 -mx-2.5 md:-mx-5 px-2.5 md:px-5 mb-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-slate-50 dark:bg-slate-900/20 -z-20" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/5 dark:bg-blue-600/10 blur-[100px] rounded-full -z-10" />

        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 mb-4 shadow-sm">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
          </span>
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Revenue & Growth Center
          </span>
        </div>

        <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-6">
          Sales & Commerce{" "}
          <span className="text-blue-600 dark:text-blue-400">Hub</span>
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-5xl animate-in slide-in-from-top duration-1000">
          <div className="bg-white dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-sm">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Regional Sales
              </h3>
              <span className="text-[8px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded-full">
                +12.5%
              </span>
            </div>
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesByRegion}>
                  <Bar dataKey="sales" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                  <XAxis dataKey="region" hide />
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

          <div className="bg-white dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-sm">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Revenue Trend
              </h3>
              <span className="text-[8px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded-full">
                Upward
              </span>
            </div>
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrend}>
                  <defs>
                    <linearGradient
                      id="revenueGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#revenueGrad)"
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

          <div className="bg-white dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-sm flex items-center">
            <div className="flex-1">
              <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Payment Methods
              </h3>
              <div className="h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentDistribution}
                      innerRadius={22}
                      outerRadius={38}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {paymentDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
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
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="space-y-1.5 ml-2 pr-2">
              {paymentDistribution.map((item) => (
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

      <footer className="mt-10 pt-8 border-t border-slate-200 dark:border-slate-800">
        <div className="bg-slate-900 dark:bg-slate-900/80 rounded-2xl p-6 md:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden border border-slate-800">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[60px] rounded-full translate-x-1/2 -translate-y-1/2" />

          <div className="space-y-1.5 relative z-10 text-center md:text-left">
            <div className="inline-block px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-[8px] font-black uppercase tracking-widest mb-2">
              Sales Intelligence
            </div>
            <h3 className="text-xl font-black tracking-tight">
              Predictive Revenue Analysis
            </h3>
            <p className="text-slate-400 text-xs max-w-md leading-relaxed">
              Leverage AI to forecast sales trends, identify high-value
              customers, and optimize pricing strategies for maximum
              profitability.
            </p>
          </div>

          <button className="relative z-10 bg-white text-slate-900 hover:bg-slate-100 font-black px-8 py-3 rounded-xl shadow-xl transition-all hover:scale-105 active:scale-95 whitespace-nowrap text-xs uppercase tracking-wider">
            Launch Sales AI
          </button>
        </div>
      </footer>
    </div>
  );
};

export default SalesHub;
