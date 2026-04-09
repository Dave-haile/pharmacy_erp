import React, { useEffect, useRef, useState } from "react";
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Monitor,
  Moon,
  RefreshCw,
  Search,
  Settings,
  Sun,
  User,
  Upload,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  fetchGlobalSearch,
  type GlobalSearchGroup,
  type GlobalSearchItem,
} from "../services/globalSearch";
import { clearApplicationCache, clearFrontendCaches } from "../services/cache";
import { useTheme } from "./context/ThemeContext";
import {
  fetchTableRegistry,
  filterTablesByQuery,
  type TableRegistryItem,
} from "../services/tableRegistry";

interface HeaderProps {
  onMenuClick?: () => void;
}

const RECENT_SEARCHES_KEY = "pharmacy-erp:global-search-recent";
const MAX_RECENT_SEARCHES = 5;

interface DocumentSearchItem {
  id: string;
  title: string;
  subtitle: string;
  meta: string;
  path: string;
  keywords: string[];
}

const quickLinks = [
  {
    name: "System Hub",
    path: "/system",
    icon: <Settings className="w-3 h-3" />,
  },
  {
    name: "Medicine Register",
    path: "/inventory/medicines",
    icon: <Search className="w-3 h-3" />,
  },
  {
    name: "Inventory Control",
    path: "/inventory/control",
    icon: <Settings className="w-3 h-3" />,
  },
  {
    name: "Stock Entries",
    path: "/inventory/stock-entries",
    icon: <Search className="w-3 h-3" />,
  },
  {
    name: "Suppliers",
    path: "/inventory/suppliers",
    icon: <Settings className="w-3 h-3" />,
  },
  {
    name: "Stock Out Register",
    path: "/inventory/stock-outs",
    icon: <Bell className="w-3 h-3" />,
  },
  {
    name: "Audit Logs",
    path: "/audit-logs",
    icon: <Bell className="w-3 h-3" />,
  },
  {
    name: "Data Import",
    path: "/data-import",
    icon: <Upload className="w-3 h-3" />,
  },
];

const searchableDocuments: DocumentSearchItem[] = [
  {
    id: "system",
    title: "System Hub",
    path: "/system",
    keywords: [
      "system",
      "system hub",
      "system management",
      "administration",
      "admin",
      "settings",
    ],
  },
  {
    id: "dashboard",
    title: "Dashboard",
    path: "/dashboard",
    keywords: ["dashboard", "home", "overview", "summary"],
  },
  {
    id: "inventory-hub",
    title: "Inventory Hub",
    path: "/inventory",
    keywords: ["inventory", "hub", "stock"],
  },
  {
    id: "inventory-control",
    title: "Inventory Control",
    path: "/inventory/control",
    keywords: ["inventory", "control", "batches", "batch", "stock"],
  },
  {
    id: "stock-ledger",
    title: "Stock Ledger",
    path: "/inventory/stock-ledger",
    keywords: ["ledger", "movement", "history", "stock ledger"],
  },
  {
    id: "near-expiry",
    title: "Near Expiry Report",
    path: "/inventory/near-expiry",
    keywords: ["expiry", "expiring", "near expiry", "report"],
  },
  {
    id: "inventory-status",
    title: "Inventory Status Report",
    path: "/inventory/inventory-control-report",
    keywords: ["inventory status", "control report", "stock report", "report"],
  },
  {
    id: "valuation",
    title: "Valuation Report",
    path: "/inventory/valuation",
    keywords: ["valuation", "value", "report"],
  },
  {
    id: "sales-summary",
    title: "Sales Summary",
    path: "/inventory/sales-summary",
    keywords: ["sales summary", "sales", "report"],
  },
  {
    id: "stock-adjustments",
    title: "Stock Adjustments",
    path: "/inventory/stock-adjustments",
    keywords: ["adjustments", "adjustment", "stock"],
  },
  {
    id: "sales-returns",
    title: "Customer Returns",
    path: "/inventory/sales-returns",
    keywords: ["sales return", "returns", "customer returns"],
  },
  {
    id: "supplier-returns",
    title: "Supplier Returns",
    path: "/inventory/supplier-returns",
    keywords: ["supplier return", "returns", "vendor returns"],
  },
  {
    id: "purchases",
    title: "Purchases",
    path: "/inventory/purchases",
    keywords: ["purchase", "purchases", "buying", "procurement"],
  },
  {
    id: "grn",
    title: "GRN",
    path: "/inventory/grn",
    keywords: ["grn", "goods received note", "goods receipt"],
  },
  {
    id: "stock-entries",
    title: "Stock Entries",
    path: "/inventory/stock-entries",
    keywords: ["stock entry", "stock entries", "stock in", "goods receipt"],
  },
  {
    id: "medicines",
    title: "Medicine Register",
    path: "/inventory/medicines",
    keywords: [
      "medicine",
      "medicines",
      "drug",
      "drugs",
      "item",
      "items",
      "item master",
      "medicine register",
      "medicine registrar",
    ],
  },
  {
    id: "suppliers",
    title: "Suppliers",
    path: "/inventory/suppliers",
    keywords: ["supplier", "suppliers", "vendor", "vendors"],
  },
  {
    id: "categories",
    title: "Categories",
    path: "/inventory/categories",
    keywords: ["category", "categories", "group", "classification"],
  },
  {
    id: "manufacturing",
    title: "Manufacturing",
    path: "/manufacturing",
    keywords: ["production", "manufacturing", "factory"],
  },
  {
    id: "stock-outs",
    title: "Stock Out Register",
    path: "/inventory/stock-outs",
    keywords: [
      "sales",
      "stock out",
      "stock-outs",
      "issue",
      "dispense",
      "sales register",
    ],
  },
  {
    id: "audit-logs",
    title: "Audit Logs",
    path: "/audit-logs",
    keywords: ["audit", "audit logs", "logs", "activity"],
  },
  {
    id: "users",
    title: "User Registry",
    path: "/users",
    keywords: ["users", "user", "accounts", "staff users"],
  },
  {
    id: "hr",
    title: "HR",
    path: "/hr",
    keywords: ["hr", "human resource", "human resources"],
  },
  {
    id: "hr-departments",
    title: "Departments",
    path: "/hr/departments",
    keywords: ["department", "departments"],
  },
  {
    id: "hr-employees",
    title: "Employees",
    path: "/hr/employees",
    keywords: ["employee", "employees", "staff"],
  },
  {
    id: "hr-leave",
    title: "Leave",
    path: "/hr/leave",
    keywords: ["leave", "time off"],
  },
  {
    id: "hr-attendance",
    title: "Attendance",
    path: "/hr/attendance",
    keywords: ["attendance", "clock in"],
  },
  {
    id: "hr-performance",
    title: "Performance",
    path: "/hr/performance",
    keywords: ["performance", "reviews"],
  },
  {
    id: "hr-payroll",
    title: "Payroll",
    path: "/hr/payroll",
    keywords: ["payroll", "salary", "wages"],
  },
].map((document) => ({
  ...document,
  subtitle: `Open ${document.title.toLowerCase()}.`,
  meta: document.path,
}));

const normalizeSearchValue = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, " ");

const scoreDocumentMatch = (
  query: string,
  document: DocumentSearchItem,
): number => {
  const normalizedQuery = normalizeSearchValue(query);
  if (!normalizedQuery) {
    return 0;
  }

  const title = normalizeSearchValue(document.title);
  const meta = normalizeSearchValue(document.meta);
  const keywords = document.keywords.map(normalizeSearchValue);

  if (title === normalizedQuery) {
    return 1000;
  }

  if (keywords.some((keyword) => keyword === normalizedQuery)) {
    return 900;
  }

  if (title.startsWith(normalizedQuery)) {
    return 800;
  }

  if (keywords.some((keyword) => keyword.startsWith(normalizedQuery))) {
    return 700;
  }

  if (title.includes(normalizedQuery)) {
    return 600;
  }

  if (keywords.some((keyword) => keyword.includes(normalizedQuery))) {
    return 500;
  }

  if (meta.includes(normalizedQuery)) {
    return 300;
  }

  return 0;
};

const findMatchingDocuments = (query: string) =>
  searchableDocuments
    .map((document) => ({
      document,
      score: scoreDocumentMatch(query, document),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 8)
    .map((entry) => entry.document);

const isMacPlatform = () =>
  typeof window !== "undefined" &&
  /Mac|iPhone|iPad|iPod/.test(window.navigator.platform);

const readRecentSearches = () => {
  if (typeof window === "undefined") {
    return [] as string[];
  }

  try {
    const stored = window.localStorage.getItem(RECENT_SEARCHES_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [];
  }
};

const writeRecentSearches = (values: string[]) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      RECENT_SEARCHES_KEY,
      JSON.stringify(values.slice(0, MAX_RECENT_SEARCHES)),
    );
  } catch {
    // Ignore persistence failures and keep the in-memory list usable.
  }
};

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [documentResults, setDocumentResults] = useState<DocumentSearchItem[]>(
    [],
  );
  const [searchGroups, setSearchGroups] = useState<GlobalSearchGroup[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [isDeepSearchActive, setIsDeepSearchActive] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [tables, setTables] = useState<TableRegistryItem[]>([]);
  const [tablesLoading, setTablesLoading] = useState(true);
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const keyboardHint = isMacPlatform() ? "Cmd" : "Ctrl";

  // Load tables from backend on mount
  useEffect(() => {
    loadTables();
    setRecentSearches(readRecentSearches());
  }, []);

  const loadTables = async () => {
    try {
      setTablesLoading(true);
      const data = await fetchTableRegistry();
      setTables(data);
    } catch (err) {
      console.error("Failed to load tables:", err);
    } finally {
      setTablesLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsProfileOpen(false);
      }

      if (searchRef.current && !searchRef.current.contains(target)) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyboardShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsSearchOpen(true);
        window.setTimeout(() => searchInputRef.current?.focus(), 0);
      }

      if (event.key === "Escape") {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyboardShortcut);
    return () =>
      document.removeEventListener("keydown", handleKeyboardShortcut);
  }, []);

  // Update document results when search query changes - now uses backend tables
  useEffect(() => {
    const trimmedQuery = searchQuery.trim();

    if (!isSearchOpen || trimmedQuery.length < 2 || tablesLoading) {
      setDocumentResults([]);
      setSearchGroups([]);
      setIsSearching(false);
      setSearchError("");
      setIsDeepSearchActive(false);
      return;
    }

    const timer = window.setTimeout(() => {
      // Use tables from backend
      const filtered = filterTablesByQuery(tables, trimmedQuery, 8);
      const documents: DocumentSearchItem[] = filtered.map((table) => ({
        id: table.id,
        title: table.table_name,
        subtitle: `Open ${table.table_name.toLowerCase()}.`,
        meta: table.frontend_path || `/${table.module}/${table.table_code}`,
        path: table.frontend_path || `/${table.module}/${table.table_code}`,
        keywords: table.keywords || [],
      }));
      setDocumentResults(documents);
      setSearchGroups([]);
      setIsSearching(false);
      setSearchError("");
      setIsDeepSearchActive(false);
    }, 150);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isSearchOpen, searchQuery, tables, tablesLoading]);

  const themeIcons = {
    light: <Sun className="w-3.5 h-3.5" />,
    dark: <Moon className="w-3.5 h-3.5" />,
    system: <Monitor className="w-3.5 h-3.5" />,
  };

  const rememberSearch = (value: string) => {
    const normalized = value.trim();
    if (!normalized) {
      return;
    }

    const nextRecentSearches = [
      normalized,
      ...recentSearches.filter(
        (entry) => entry.toLowerCase() !== normalized.toLowerCase(),
      ),
    ].slice(0, MAX_RECENT_SEARCHES);

    setRecentSearches(nextRecentSearches);
    writeRecentSearches(nextRecentSearches);
  };

  const handleNavigate = (path: string, rememberedValue?: string) => {
    if (rememberedValue) {
      rememberSearch(rememberedValue);
    }

    navigate(path);
    setIsSearchOpen(false);
  };

  const handleResultSelect = (item: GlobalSearchItem) => {
    handleNavigate(item.href, item.title);
  };

  const handleDocumentSelect = (item: DocumentSearchItem) => {
    handleNavigate(item.path, searchQuery || item.title);
  };

  const handleDeepSearch = async () => {
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery.length < 2 || isSearching) {
      return;
    }

    setIsDeepSearchActive(true);
    setIsSearching(true);
    setSearchError("");

    try {
      const response = await fetchGlobalSearch(trimmedQuery);
      setSearchGroups(response.results.filter((group) => group.items.length > 0));
    } catch (error) {
      console.error("Global search failed", error);
      setSearchGroups([]);
      setSearchError("Search is temporarily unavailable.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleHardReload = async () => {
    if (isReloading) {
      return;
    }

    setIsReloading(true);

    try {
      await clearApplicationCache();
    } catch (error) {
      console.error("Failed to clear backend cache", error);
    }

    try {
      await clearFrontendCaches();
    } catch (error) {
      console.error("Failed to clear frontend cache", error);
    }

    window.location.reload();
  };

  const showDiscoveryState = searchQuery.trim().length < 2;

  return (
    <header className="sticky top-0 z-110 flex items-center justify-between px-4 py-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 mr-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex-1 max-w-xl relative" ref={searchRef}>
        <div className="relative group">
          <Search
            className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
              isSearchOpen ? "text-emerald-500" : "text-slate-400"
            }`}
          />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            placeholder="Search documents like medicine, suppliers, stock entries..."
            onFocus={() => setIsSearchOpen(true)}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setIsSearchOpen(true);
            }}
            onKeyDown={(event) => {
              if (event.key !== "Enter") {
                return;
              }

              const firstDocument = documentResults[0];
              if (firstDocument && !isDeepSearchActive) {
                event.preventDefault();
                handleDocumentSelect(firstDocument);
                return;
              }

              if (
                !isDeepSearchActive &&
                searchQuery.trim().length >= 2 &&
                documentResults.length === 0
              ) {
                event.preventDefault();
                void handleDeepSearch();
              }
            }}
            className="w-full pl-10 pr-24 py-1.5 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center space-x-1">
            <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-[10px] font-bold text-slate-400 dark:text-slate-500 shadow-sm">
              {keyboardHint}
            </kbd>
            <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-[10px] font-bold text-slate-400 dark:text-slate-500 shadow-sm">
              K
            </kbd>
          </div>
        </div>

        {isSearchOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 p-2">
            {showDiscoveryState ? (
              <div className="space-y-3">
                <div>
                  <p className="px-3 py-1.5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Recent Searches
                  </p>
                  <div className="space-y-0.5">
                    {recentSearches.length > 0 ? (
                      recentSearches.map((entry) => (
                        <button
                          key={entry}
                          onClick={() => {
                            setSearchQuery(entry);
                            setIsSearchOpen(true);
                            window.setTimeout(
                              () => searchInputRef.current?.focus(),
                              0,
                            );
                          }}
                          className="w-full flex items-center space-x-3 px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-left"
                        >
                          <Search className="w-3.5 h-3.5 text-slate-400" />
                          <span>{entry}</span>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-3 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        Start searching to build a recent history.
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <p className="px-3 py-1.5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Quick Links
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                    {quickLinks.map((link) => (
                      <button
                        key={link.path}
                        onClick={() => handleNavigate(link.path, link.name)}
                        className="flex items-center space-x-2.5 px-3 py-2 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-left border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                      >
                        <div className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-emerald-500">
                          {link.icon}
                        </div>
                        <span>{link.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-h-[26rem] overflow-y-auto">
                {isSearching && (
                  <div className="px-3 py-4 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    {isDeepSearchActive
                      ? "Deep searching across all database documents..."
                      : "Finding matching documents..."}
                  </div>
                )}

                {!isSearching && searchError && (
                  <div className="px-3 py-4 text-[11px] font-bold text-red-500">
                    {searchError}
                  </div>
                )}

                {!isSearching &&
                  !searchError &&
                  !isDeepSearchActive &&
                  documentResults.length === 0 && (
                  <div className="px-3 py-4 space-y-3">
                    <div>
                      <p className="text-[11px] font-black text-slate-700 dark:text-slate-200">
                        No matching document
                      </p>
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1">
                        Try a document name like medicine, suppliers, stock
                        entries, or purchases. If that still does not help, use
                        deep search to scan the database.
                      </p>
                    </div>
                    <button
                      onClick={() => void handleDeepSearch()}
                      className="w-full flex items-center justify-center rounded-xl bg-emerald-600 px-3 py-2.5 text-[11px] font-black uppercase tracking-widest text-white transition-colors hover:bg-emerald-500"
                    >
                      Deep Search
                    </button>
                  </div>
                )}

                {!isSearching &&
                  !searchError &&
                  !isDeepSearchActive &&
                  documentResults.length > 0 && (
                    <div className="mb-3 last:mb-0">
                      <p className="px-3 py-1.5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        Matching Documents
                      </p>
                      <div className="space-y-1">
                        {documentResults.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => handleDocumentSelect(item)}
                            className="w-full flex items-start justify-between gap-3 px-3 py-2.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-black text-slate-800 dark:text-slate-100 truncate">
                                  {item.title}
                                </span>
                                <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-widest">
                                  Document
                                </span>
                              </div>
                              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1 truncate">
                                {item.subtitle}
                              </p>
                              <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-1 truncate">
                                {item.meta}
                              </p>
                            </div>
                            <Search className="w-3.5 h-3.5 mt-1 shrink-0 text-slate-300 dark:text-slate-600" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                {!isSearching &&
                  !searchError &&
                  isDeepSearchActive &&
                  searchGroups.length === 0 && (
                    <div className="px-3 py-4 space-y-2">
                      <p className="text-[11px] font-black text-slate-700 dark:text-slate-200">
                        Deep search found no records
                      </p>
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                        No database documents matched this search.
                      </p>
                    </div>
                  )}

                {!isSearching &&
                  !searchError &&
                  isDeepSearchActive &&
                  searchGroups.map((group) => (
                    <div key={group.module} className="mb-3 last:mb-0">
                      <p className="px-3 py-1.5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        {group.label}
                      </p>
                      <div className="space-y-1">
                        {group.items.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => handleResultSelect(item)}
                            className="w-full flex items-start justify-between gap-3 px-3 py-2.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-black text-slate-800 dark:text-slate-100 truncate">
                                  {item.title}
                                </span>
                                <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-widest">
                                  {item.entity}
                                </span>
                              </div>
                              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1 truncate">
                                {item.subtitle}
                              </p>
                              <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-1 truncate">
                                {item.meta}
                              </p>
                            </div>
                            <Search className="w-3.5 h-3.5 mt-1 shrink-0 text-slate-300 dark:text-slate-600" />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center space-x-3">
        <button className="relative p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
        </button>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center space-x-2 p-1 pl-2 pr-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-600"
          >
            <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-black text-xs shadow-lg shadow-emerald-500/20">
              {user?.first_name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-[11px] font-black text-slate-800 dark:text-slate-200 leading-none uppercase">
                {user?.first_name || "User"}
              </p>
              <p className="text-[9px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-tighter">
                {user?.role || "User"}
              </p>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-300 ${
                isProfileOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50">
              <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                  Account
                </p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {user?.email || "user@example.com"}
                </p>
              </div>

              <div className="p-1.5">
                <button className="w-full flex items-center space-x-2.5 px-3 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-xs font-bold">
                  <User className="w-4 h-4" />
                  <span>Profile Settings</span>
                </button>
                <button className="w-full flex items-center space-x-2.5 px-3 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-xs font-bold">
                  <Settings className="w-4 h-4" />
                  <span>System Preferences</span>
                </button>
                <button
                  onClick={() => void handleHardReload()}
                  disabled={isReloading}
                  className="w-full flex items-center space-x-2.5 px-3 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-xs font-bold disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${isReloading ? "animate-spin" : ""}`}
                  />
                  <span>
                    {isReloading ? "Clearing Cache..." : "Hard Reload"}
                  </span>
                </button>
              </div>

              <div className="p-1.5 border-t border-slate-100 dark:border-slate-800">
                <p className="px-3 py-1.5 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Theme
                </p>
                <div className="grid grid-cols-3 gap-1 px-1.5 pb-1.5">
                  {(["light", "dark", "system"] as const).map(
                    (currentTheme) => (
                      <button
                        key={currentTheme}
                        onClick={() => setTheme(currentTheme)}
                        className={`flex flex-col items-center justify-center py-2 rounded-xl border transition-all ${
                          theme === currentTheme
                            ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400"
                            : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                        }`}
                      >
                        {themeIcons[currentTheme]}
                        <span className="text-[8px] font-black uppercase mt-1 tracking-tighter">
                          {currentTheme}
                        </span>
                      </button>
                    ),
                  )}
                </div>
              </div>

              <div className="p-1.5 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => logout()}
                  className="w-full flex items-center space-x-2.5 px-3 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors text-xs font-bold"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
