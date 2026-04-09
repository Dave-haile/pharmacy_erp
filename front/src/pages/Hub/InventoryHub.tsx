import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import {
  fetchInventoryHubSummary,
  InventoryHubSummaryResponse,
} from "@/src/services/inventoryHub";

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
  actionButton?: React.ReactNode;
}

const currencyCompact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

const integerFormatter = new Intl.NumberFormat("en-US");

const CategorySection: React.FC<SectionProps> = ({
  title,
  subtitle,
  accentColor,
  icon,
  links,
  actionButton,
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col self-start w-full bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div
              className={`p-1.5 rounded-lg ${accentColor} text-white shadow-sm shrink-0`}
            >
              {React.cloneElement(icon as React.ReactElement, {
                className: "w-4 h-4",
              })}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none mb-0.5">
                {title}
              </h2>
              <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
                {subtitle}
              </p>
            </div>
          </div>
          {actionButton && <div className="shrink-0">{actionButton}</div>}
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
  const navigate = useNavigate();
  const [hubSummary, setHubSummary] =
    useState<InventoryHubSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadHubSummary = async () => {
      try {
        const data = await fetchInventoryHubSummary();
        setHubSummary(data);
      } catch (error) {
        console.error("Failed to fetch inventory hub summary", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadHubSummary();
  }, []);

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
          label: "Categories",
          path: "/inventory/categories",
          highlighted: true,
        },
        { label: "Supplier", path: "/inventory/suppliers", highlighted: true },
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
        {
          label: "Warehouse Stock Entry",
          path: "/inventory/stock-entries",
          highlighted: true,
          active: true,
        },
        { label: "Purchases", path: "/inventory/purchases", highlighted: true },
        {
          label: "Stock Out",
          path: "/inventory/stock-outs",
          highlighted: true,
          active: true,
        },
        {
          label: "Stock Adjustments",
          path: "/inventory/stock-adjustments",
          highlighted: true,
        },
        {
          label: "Customer Returns",
          path: "/inventory/sales-returns",
          highlighted: true,
        },
        {
          label: "Supplier Returns",
          path: "/inventory/supplier-returns",
          highlighted: true,
        },
      ],
      actionButton: (
        <button
          onClick={() => navigate("/inventory/stock-outs/new-stock-out")}
          className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-white shadow-sm transition-all hover:bg-emerald-600 active:scale-95"
        >
          <svg
            className="w-2.5 h-2.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Sale
        </button>
      ),
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
        {
          label: "Stock Ledger",
          path: "/inventory/stock-ledger",
          highlighted: true,
        },
        {
          label: "Inventory Control Summary",
          path: "/inventory/inventory-control-report",
          highlighted: true,
        },
        {
          label: "Sales Summary",
          path: "/inventory/sales-summary",
          highlighted: true,
        },
        {
          label: "Near-Expiry Report",
          path: "/inventory/near-expiry",
          highlighted: true,
        },
        {
          label: "Stock Valuation",
          path: "/inventory/valuation",
          highlighted: true,
        },
      ],
    },
  ];

  const stockLevelData =
    hubSummary?.category_stock_levels.map((item) => ({
      ...item,
      stock: Number(item.stock || 0),
    })) ?? [];

  const inventoryValueTrend =
    hubSummary?.inventory_value_trend.map((item) => ({
      ...item,
      value: Number(item.value || 0),
    })) ?? [];

  const stockDistribution = hubSummary?.stock_distribution ?? [];

  const topLevelBadge =
    hubSummary && stockLevelData.length > 0
      ? `${integerFormatter.format(hubSummary.summary.total_quantity)} units`
      : "Live";
  const valueTrendBadge =
    hubSummary && inventoryValueTrend.length > 1
      ? `${currencyCompact.format(Number(hubSummary.summary.total_value || 0))}`
      : "Live";
  const stockDistributionBadge =
    hubSummary && stockDistribution.length > 0
      ? `${integerFormatter.format(
          stockDistribution.reduce((sum, item) => sum + item.value, 0),
        )} batches`
      : "Live";

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      <header className="relative py-6 md:py-10 flex flex-col items-center text-center overflow-hidden border-b border-slate-200 dark:border-slate-800 -mx-2.5 md:-mx-5 px-2.5 md:px-5 mb-6">
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

        {isLoading ? (
          <div className="py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-3"></div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">
              Building inventory intelligence...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-5xl animate-in slide-in-from-top duration-1000">
            <div className="bg-white dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-sm min-w-0 min-h-0">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  Category Stock Levels
                </h3>
                <span className="text-[8px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded-full">
                  {topLevelBadge}
                </span>
              </div>
              <div className="h-24 min-w-0 min-h-0">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                  minWidth={1}
                  minHeight={1}
                >
                  <BarChart data={stockLevelData}>
                    <Bar dataKey="stock" fill="#10b981" radius={[2, 2, 0, 0]} />
                    <XAxis dataKey="category" hide />
                    <Tooltip
                      formatter={(value: number) =>
                        `${integerFormatter.format(value)} units`
                      }
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

            <div className="bg-white dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-sm min-w-0">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  On-Hand Value by Intake Month
                </h3>
                <span className="text-[8px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded-full">
                  {valueTrendBadge}
                </span>
              </div>
              <div className="h-24 min-w-0 min-h-0">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                  minWidth={1}
                  minHeight={1}
                >
                  <AreaChart data={inventoryValueTrend}>
                    <defs>
                      <linearGradient
                        id="valueGrad"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#6366f1"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#6366f1"
                          stopOpacity={0}
                        />
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
                      formatter={(value: number) =>
                        currencyCompact.format(value)
                      }
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

            <div className="bg-white dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-sm flex items-center min-w-0 min-h-0">
              <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Stock Distribution
                  </h3>
                  <span className="text-[8px] font-bold text-violet-500 bg-violet-50 dark:bg-violet-900/20 px-1.5 py-0.5 rounded-full">
                    {stockDistributionBadge}
                  </span>
                </div>
                <div className="h-24 min-w-0 min-h-0">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                    minWidth={1}
                    minHeight={1}
                  >
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
                        formatter={(value: number, _name, item) =>
                          `${integerFormatter.format(value)} ${
                            (item?.payload as { name?: string })?.name || ""
                          }`
                        }
                        contentStyle={{
                          borderRadius: "8px",
                          border: "none",
                          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                          fontSize: "8px",
                          color: "#fff",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="space-y-1.5 ml-2 pr-2">
                {stockDistribution.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center space-x-1.5"
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-[7px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-tighter truncate w-16 leading-none">
                      {item.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 px-1.5 items-start">
        {sections.map((section, idx) => (
          <CategorySection key={idx} {...section} />
        ))}
      </div>
    </div>
  );
};

export default InventoryHub;
