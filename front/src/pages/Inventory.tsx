import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import SearchableSelect from "../components/SearchableSelect";

// Simple in-memory cache for manufacturer data
const manufacturerCache: Record<string, any> = {};

const UnitConverterModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  initialQty: number;
  initialUnit: string;
}> = ({ isOpen, onClose, initialQty, initialUnit }) => {
  const [value, setValue] = useState(initialQty);
  const [fromUnit, setFromUnit] = useState(initialUnit);
  const [toUnit, setToUnit] = useState("");

  const units = [
    "kg",
    "g",
    "mg",
    "mcg",
    "liters",
    "ml",
    "meters",
    "cm",
    "units",
    "k-units",
  ];

  useEffect(() => {
    setValue(initialQty);
    setFromUnit(initialUnit);
    if (initialUnit === "kg") setToUnit("g");
    else if (initialUnit === "liters") setToUnit("ml");
    else if (initialUnit === "k-units") setToUnit("units");
    else if (initialUnit === "g") setToUnit("mg");
    else setToUnit(units.find((u) => u !== initialUnit) || "");
  }, [initialQty, initialUnit, units]);

  const convertedValue = useMemo(() => {
    let base = value;
    if (fromUnit === "kg") base = value * 1000;
    else if (fromUnit === "k-units") base = value * 1000;
    else if (fromUnit === "liters") base = value * 1000;
    else if (fromUnit === "mg") base = value / 1000;
    else if (fromUnit === "mcg") base = value / 1000000;

    if (toUnit === "kg" || toUnit === "k-units" || toUnit === "liters")
      return base / 1000;
    if (toUnit === "g" || toUnit === "units" || toUnit === "ml") return base;
    if (toUnit === "mg") return base * 1000;
    if (toUnit === "mcg") return base * 1000000;
    return base;
  }, [value, fromUnit, toUnit]);

  const swapUnits = () => {
    const temp = fromUnit;
    setFromUnit(toUnit);
    setToUnit(temp);
    setValue(convertedValue);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`${convertedValue.toFixed(4)} ${toUnit}`);
    alert("Copied to clipboard");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-sm w-full p-3 md:p-5 animate-in zoom-in duration-200 border border-slate-100 dark:border-slate-800">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-1 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <svg
                className="w-4 h-4 text-emerald-600 dark:text-emerald-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              Unit Converter
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="space-y-3">
          <div className="space-y-2.5">
            <div className="p-2.5 md:p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl">
              <label className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 block">
                Source Value
              </label>
              <div className="flex items-center space-x-2.5">
                <input
                  type="number"
                  value={value}
                  onChange={(e) => setValue(Number(e.target.value))}
                  className="flex-1 bg-transparent text-base md:text-lg font-bold text-slate-800 dark:text-white outline-none w-full"
                />
                <select
                  value={fromUnit}
                  onChange={(e) => setFromUnit(e.target.value)}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-1 py-0.5 text-[9px] font-bold text-slate-600 dark:text-slate-300 shadow-sm outline-none"
                >
                  {units.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-center relative z-10">
              <button
                onClick={swapUnits}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1.5 rounded-full shadow-lg hover:shadow-xl hover:-rotate-180 transition-all duration-500 text-emerald-600 dark:text-emerald-400"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                  />
                </svg>
              </button>
            </div>
            <div className="p-2.5 md:p-3.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl relative -mt-4 pt-7">
              <label className="text-[8px] font-black text-emerald-600/60 dark:text-emerald-400/60 uppercase tracking-widest mb-1 block">
                Resulting Quantity
              </label>
              <div className="flex items-center justify-between">
                <div className="text-lg md:text-xl font-black text-emerald-800 dark:text-emerald-300 break-all pr-2.5">
                  {convertedValue.toLocaleString(undefined, {
                    maximumFractionDigits: 6,
                  })}
                </div>
                <select
                  value={toUnit}
                  onChange={(e) => setToUnit(e.target.value)}
                  className="bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-900/50 rounded-lg px-1 py-0.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-400 shadow-sm outline-none"
                >
                  {units.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <button
            onClick={copyToClipboard}
            className="w-full py-2.5 bg-slate-900 dark:bg-emerald-600 text-white rounded-lg font-bold hover:bg-slate-800 dark:hover:bg-emerald-500 transition-all flex items-center justify-center space-x-1.5 shadow-lg"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <span className="text-[11px]">Copy Result</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const ManufacturerCell: React.FC<{ manufacturerId: string }> = ({
  manufacturerId,
}) => {
  const [data, setData] = useState<any>(
    manufacturerCache[manufacturerId] || null,
  );
  const [loading, setLoading] = useState(!manufacturerCache[manufacturerId]);

  useEffect(() => {
    const fetchMan = async () => {
      try {
        // const res = await api.get(`/api/manufacturer/${manufacturerId}`);
        manufacturerCache[manufacturerId] = {
          id: "m1",
          name: "Global Pharma Chem",
          contact: "+1-555-0102",
          email: "supply@globalpharma.com",
        };
        setData(manufacturerCache[manufacturerId]);
      } catch (e) {
        console.error("Failed to fetch manufacturer", e);
      } finally {
        setLoading(false);
      }
    };
    if (manufacturerId && !data) fetchMan();
  }, [manufacturerId, data]);

  if (loading)
    return (
      <div className="animate-pulse space-y-1">
        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-24"></div>
        <div className="h-3 bg-slate-50 dark:bg-slate-800/50 rounded w-16"></div>
      </div>
    );
  if (!data)
    return (
      <span className="text-slate-300 dark:text-slate-600">Unspecified</span>
    );

  return (
    <div className="max-w-[120px] md:max-w-[160px]">
      <div className="text-[11px] md:text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
        {data.name}
      </div>
      <div className="hidden md:flex items-center space-x-1.5 text-[9px] text-slate-500 dark:text-slate-400">
        <svg
          className="w-2.5 h-2.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
        <span className="truncate">{data.email}</span>
      </div>
    </div>
  );
};

const Inventory: React.FC = () => {
  const [inventory, setInventory] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    batch: "",
    name: "",
    sku: "",
    status: "",
  });
  const [pageSize, setPageSize] = useState(10);
  const [visibleCount, setVisibleCount] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);
  const [converterModal, setConverterModal] = useState({
    isOpen: false,
    qty: 0,
    unit: "",
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportScope, setExportScope] = useState<"all" | "filtered">(
    "filtered",
  );
  const navigate = useNavigate();

  const quickLinks = [
    "Item",
    "Item Group",
    "Product Bundle",
    "Price List",
    "Item Price",
  ];

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const response = await api.get("/api/inventory");
        setInventory([
          {
            id: "1",
            name: "Raw Aspirin Powder",
            sku: "RAW-ASP-001",
            batch: "BT-9921",
            qty: 500,
            unit: "kg",
            expiry: "2026-12-31",
            mfgDate: "2023-12-01",
            storage: "Store in cool, dry place (15-25°C)",
            status: "In Stock",
            manufacturerId: "m1",
          },
          {
            id: "2",
            name: "Gelatin Capsules Size 0",
            sku: "CAP-000-0",
            batch: "BT-4420",
            qty: 5,
            unit: "k-units",
            expiry: "2025-06-15",
            mfgDate: "2024-01-10",
            storage: "Controlled humidity < 40%",
            status: "Low Stock",
            manufacturerId: "m2",
          },
          {
            id: "3",
            name: "Packaging Foil (ALU)",
            sku: "PCK-ALU-20",
            batch: "BT-1022",
            qty: 2500,
            unit: "meters",
            expiry: "2027-01-10",
            mfgDate: "2023-11-20",
            storage: "Standard warehouse",
            status: "In Stock",
            manufacturerId: "m3",
          },
          {
            id: "4",
            name: "Ethylene Glycol",
            sku: "SOL-ETH-99",
            batch: "BT-8877",
            qty: 120,
            unit: "liters",
            expiry: "2024-03-20",
            mfgDate: "2022-03-20",
            storage: "Flammable storage cabinet",
            status: "Expired",
            manufacturerId: "m1",
          },
          {
            id: "5",
            name: "Metformin Hydrochloride",
            sku: "RAW-MET-500",
            batch: "BT-1122",
            qty: 8,
            unit: "kg",
            expiry: "2026-08-14",
            mfgDate: "2024-02-14",
            storage: "Protected from light",
            status: "Low Stock",
            manufacturerId: "m2",
          },
          {
            id: "6",
            name: "Sodium Chloride (USP)",
            sku: "RAW-SAL-100",
            batch: "BT-3321",
            qty: 2,
            unit: "kg",
            expiry: "2025-11-20",
            mfgDate: "2023-11-20",
            storage: "Room temperature",
            status: "Low Stock",
            manufacturerId: "m3",
          },
        ]);
      } catch (err) {
        console.error("Inventory Load Error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInventory();
  }, []);

  const getDaysRemaining = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const filteredItems = useMemo(() => {
    let items = [...inventory].filter(
      (item) =>
        (filters.batch === "" ||
          item.batch.toLowerCase().includes(filters.batch.toLowerCase())) &&
        (filters.name === "" ||
          item.name.toLowerCase().includes(filters.name.toLowerCase())) &&
        (filters.sku === "" ||
          item.sku.toLowerCase().includes(filters.sku.toLowerCase())) &&
        (filters.status === "" ||
          item.status.toLowerCase().includes(filters.status.toLowerCase())),
    );

    if (sortConfig !== null) {
      items.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key])
          return sortConfig.direction === "asc" ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key])
          return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return items;
  }, [inventory, filters, sortConfig]);

  const paginatedItems = useMemo(() => {
    return filteredItems.slice(0, visibleCount);
  }, [filteredItems, visibleCount]);

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + pageSize);
  };

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setVisibleCount(pageSize);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setVisibleCount(size);
  };

  const requestSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const handleAIAnalyze = (item: any, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate("/ai-insights", { state: { item } });
  };

  const handleViewDetails = (id: string) => {
    navigate(`/inventory/${id}`);
  };

  const handleSelectItem = (
    id: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    e.stopPropagation();
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked)
      setSelectedIds(new Set(filteredItems.map((i) => i.id)));
    else setSelectedIds(new Set());
  };

  const openConverter = (qty: number, unit: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConverterModal({ isOpen: true, qty, unit });
  };

  const exportToFormat = (format: "csv" | "excel", itemsToExport: any[]) => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      alert(
        `${format.toUpperCase()} export initiated for ${itemsToExport.length} items.`,
      );
    }, 600);
  };

  return (
    <div className="space-y-4 pb-16 animate-in fade-in duration-500">
      <UnitConverterModal
        isOpen={converterModal.isOpen}
        onClose={() => setConverterModal({ ...converterModal, isOpen: false })}
        initialQty={converterModal.qty}
        initialUnit={converterModal.unit}
      />

      {/* Quick Navigation Toolbar */}
      <div className="flex overflow-x-auto no-scrollbar space-x-1.5 pb-1.5 -mx-0.5 px-0.5">
        {quickLinks.map((link) => (
          <button
            key={link}
            className="whitespace-nowrap px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[9px] font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm flex items-center space-x-1"
          >
            <div className="w-1 h-1 rounded-full bg-amber-400"></div>
            <span>{link}</span>
          </button>
        ))}
        <button
          onClick={() => navigate("/inventory/stock-entries")}
          className="whitespace-nowrap px-2.5 py-1 bg-slate-900 dark:bg-emerald-600 rounded-lg text-[9px] font-bold text-white shadow-lg shadow-slate-900/10 dark:shadow-emerald-900/20"
        >
          + New Entry
        </button>
      </div>

      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => navigate("/inventory")}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-all text-slate-500 dark:text-slate-400"
            title="Back to Stock Management"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </button>
          <div>
            <h1 className="text-lg md:text-xl font-black text-slate-800 dark:text-white tracking-tight">
              Inventory Control
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-[10px]">
              Batch lifecycle & shelf-life monitoring
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full xl:max-w-4xl">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 flex-1">
            <div className="flex items-center space-x-1.5 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
              <input
                type="text"
                name="batch"
                placeholder="Batch ID..."
                className="flex-1 outline-none text-[10px] text-slate-700 dark:text-slate-200 bg-transparent font-medium min-w-0"
                value={filters.batch}
                onChange={handleFilterChange}
              />
            </div>
            <div className="flex items-center space-x-1.5 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
              <input
                type="text"
                name="name"
                placeholder="Item Name..."
                className="flex-1 outline-none text-[10px] text-slate-700 dark:text-slate-200 bg-transparent font-medium min-w-0"
                value={filters.name}
                onChange={handleFilterChange}
              />
            </div>
            <div className="flex items-center space-x-1.5 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
              <input
                type="text"
                name="sku"
                placeholder="SKU..."
                className="flex-1 outline-none text-[10px] text-slate-700 dark:text-slate-200 bg-transparent font-medium min-w-0"
                value={filters.sku}
                onChange={handleFilterChange}
              />
            </div>
            <div className="flex items-center space-x-1.5 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
              <SearchableSelect
                options={[
                  { value: "", label: "All Status" },
                  {
                    value: "In Stock",
                    label: "In Stock",
                    subtitle: "Available for distribution",
                  },
                  {
                    value: "Quarantine",
                    label: "Quarantine",
                    subtitle: "Pending quality release",
                  },
                  {
                    value: "Released",
                    label: "Released",
                    subtitle: "Quality approved",
                  },
                  {
                    value: "Expired",
                    label: "Expired",
                    subtitle: "Past shelf life",
                  },
                ]}
                value={filters.status}
                onChange={(val) =>
                  setFilters((prev) => ({ ...prev, status: val }))
                }
                placeholder="All Status"
                className="w-full"
                triggerClassName="border-none bg-transparent p-0 text-slate-700 dark:text-slate-300 font-medium"
                onCreateNew={() => navigate("/items/new")}
                createNewText="Register New Item"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-inner">
              <button
                onClick={() => setExportScope("all")}
                title="Export entire repository"
                className={`px-2 py-1 text-[8px] font-black uppercase tracking-widest rounded-md transition-all ${
                  exportScope === "all"
                    ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setExportScope("filtered")}
                title="Export currently visible items"
                className={`px-2 py-1 text-[8px] font-black uppercase tracking-widest rounded-md transition-all ${
                  exportScope === "filtered"
                    ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                }`}
              >
                Filtered
              </button>
            </div>

            <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm shrink-0">
              <button
                onClick={() =>
                  exportToFormat(
                    "csv",
                    exportScope === "all" ? inventory : filteredItems,
                  )
                }
                disabled={isExporting}
                className="px-2.5 py-1.5 text-[9px] font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border-r border-slate-100 dark:border-slate-800 transition-colors flex items-center justify-center space-x-1"
              >
                <span>CSV</span>
              </button>
              <button
                onClick={() =>
                  exportToFormat(
                    "excel",
                    exportScope === "all" ? inventory : filteredItems,
                  )
                }
                disabled={isExporting}
                className="px-2.5 py-1.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors flex items-center justify-center space-x-1"
              >
                <span>Excel</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Operations Bar */}
      <div
        className={`transition-all duration-300 overflow-hidden ${selectedIds.size > 0 ? "max-h-24 opacity-100 mb-3" : "max-h-0 opacity-0"}`}
      >
        <div className="bg-slate-900 dark:bg-emerald-900 border border-slate-800 dark:border-emerald-800 rounded-xl p-2.5 md:p-3 flex flex-col md:flex-row items-center justify-between gap-2.5 shadow-2xl">
          <div className="flex items-center space-x-2.5 text-white">
            <div className="bg-emerald-500 text-white w-7 h-7 rounded-lg flex items-center justify-center font-black shadow-lg text-xs">
              {selectedIds.size}
            </div>
            <div>
              <span className="font-bold text-[11px] block">
                Items Selected
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-1.5 w-full md:w-auto">
            <button className="flex-1 md:flex-none px-3 py-1.5 bg-red-600 text-white rounded-lg text-[9px] font-bold hover:bg-red-500 transition-all">
              Archive
            </button>
            <button className="flex-1 md:flex-none px-3 py-1.5 bg-slate-800 dark:bg-emerald-800 text-slate-300 dark:text-emerald-100 rounded-lg text-[9px] font-bold hover:bg-slate-700 dark:hover:bg-emerald-700 transition-all">
              Bulk Released
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600 mx-auto mb-3"></div>
            <p className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest text-[8px]">
              Syncing Repository...
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-hidden custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-3 py-2.5 w-8">
                    <input
                      type="checkbox"
                      className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      onChange={handleSelectAll}
                      checked={
                        selectedIds.size > 0 &&
                        selectedIds.size === filteredItems.length
                      }
                    />
                  </th>
                  <th
                    className="px-3 py-2.5 text-[8px] md:text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest cursor-pointer group"
                    onClick={() => requestSort("name")}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Item Name</span>
                      <svg
                        className="w-3 h-3 text-slate-300 dark:text-slate-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                        />
                      </svg>
                    </div>
                  </th>
                  <th className="px-3 py-2.5 text-[8px] md:text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Manufacturer
                  </th>
                  <th
                    className="px-3 py-2.5 text-[8px] md:text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest cursor-pointer group"
                    onClick={() => requestSort("qty")}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Stock Level</span>
                      <svg
                        className="w-3 h-3 text-slate-300 dark:text-slate-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                        />
                      </svg>
                    </div>
                  </th>
                  <th
                    className="px-3 py-2.5 text-[8px] md:text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest cursor-pointer group"
                    onClick={() => requestSort("expiry")}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Expiry Date</span>
                      <svg
                        className="w-3 h-3 text-slate-300 dark:text-slate-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  </th>
                  <th className="px-3 py-2.5 text-[8px] md:text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Status
                  </th>
                  <th className="px-3 py-2.5 text-[8px] md:text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {paginatedItems.map((item) => {
                  const isLowStock = item.qty < 10;
                  const isSelected = selectedIds.has(item.id);
                  const daysLeft = getDaysRemaining(item.expiry);
                  const isNearExpiry = daysLeft <= 90 && daysLeft > 0;
                  const isCriticalExpiry = daysLeft <= 30 && daysLeft > 0;
                  const isExpired = daysLeft <= 0;

                  return (
                    <tr
                      key={item.id}
                      onClick={() => handleViewDetails(item.id)}
                      className={`transition-all cursor-pointer group ${
                        isSelected
                          ? "bg-emerald-50/50 dark:bg-emerald-900/20"
                          : isExpired || isCriticalExpiry
                            ? "bg-red-50/20 dark:bg-red-900/10 hover:bg-red-50/40 dark:hover:bg-red-900/20"
                            : isNearExpiry
                              ? "bg-amber-50/20 dark:bg-amber-900/10 hover:bg-amber-50/40 dark:hover:bg-amber-900/20"
                              : isLowStock
                                ? "bg-amber-50/10 dark:bg-amber-900/5 hover:bg-amber-50/30 dark:hover:bg-amber-900/15"
                                : "hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
                      }`}
                    >
                      <td
                        className="px-3 py-2.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          checked={isSelected}
                          onChange={(e) => handleSelectItem(item.id, e)}
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center space-x-1.5">
                          <div
                            className={`font-bold text-[11px] md:text-xs ${
                              isExpired || isCriticalExpiry
                                ? "text-red-900 dark:text-red-400"
                                : "text-slate-800 dark:text-slate-200"
                            }`}
                          >
                            {item.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <ManufacturerCell
                          manufacturerId={item.manufacturerId}
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center space-x-1.5">
                          <div className="flex flex-col">
                            <span
                              className={`text-xs md:text-sm font-black ${isLowStock ? "text-amber-600 dark:text-amber-400" : "text-slate-900 dark:text-slate-100"}`}
                            >
                              {item.qty}
                            </span>
                            <span className="text-[7px] md:text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase -mt-1">
                              {item.unit}
                            </span>
                          </div>
                          <button
                            onClick={(e) =>
                              openConverter(item.qty, item.unit, e)
                            }
                            className="p-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 rounded-md transition-all shadow-sm"
                          >
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-col">
                          <span
                            className={`text-[11px] font-bold ${isExpired || isCriticalExpiry ? "text-red-600 dark:text-red-400" : "text-slate-600 dark:text-slate-400"}`}
                          >
                            {new Date(item.expiry).toLocaleDateString()}
                          </span>
                          {!isExpired && (isNearExpiry || isCriticalExpiry) && (
                            <span
                              className={`text-[8px] font-black uppercase ${isCriticalExpiry ? "text-red-400" : "text-amber-400"}`}
                            >
                              {daysLeft} days left
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider border-2 ${
                            isExpired
                              ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 border-red-200 dark:border-red-900/50"
                              : isCriticalExpiry
                                ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-100 dark:border-red-900/30"
                                : item.status === "In Stock"
                                  ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30"
                                  : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-100 dark:border-slate-700"
                          }`}
                        >
                          {isExpired ? "Expired" : item.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <div className="flex justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => handleAIAnalyze(item, e)}
                            className="p-1 bg-emerald-600 text-white rounded-md hover:scale-110 transition-all"
                          >
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M13 10V3L4 14h7v7l9-11h-7z"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!isLoading && filteredItems.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Rows per page:
            </span>
            {[10, 100, 500].map((size) => (
              <button
                key={size}
                onClick={() => handlePageSizeChange(size)}
                className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                  pageSize === size
                    ? "bg-slate-900 dark:bg-emerald-600 text-white shadow-lg"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                {size}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
              Showing {paginatedItems.length} of {filteredItems.length} items
            </span>
            {visibleCount < filteredItems.length && (
              <button
                onClick={handleLoadMore}
                className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg font-bold text-[10px] shadow-lg hover:bg-emerald-500 transition-all uppercase tracking-widest"
              >
                Load More
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
