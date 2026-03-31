import React, { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Mail,
  Plus,
  Search,
  Shield,
  UserRound,
} from "lucide-react";

import { useAuth } from "../../auth/AuthContext";
import DataTable, { Column } from "../../components/DataTable";
import { useToast } from "../../hooks/useToast";
import { fetchUsers } from "../../services/users";
import { ManagedUser, UserFilters } from "../../types/types";

type SortConfig = {
  key: keyof ManagedUser;
  direction: "asc" | "desc";
} | null;

const roleTone: Record<string, string> = {
  admin:
    "border border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-400",
  manager:
    "border border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  pharmacist:
    "border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  cashier:
    "border border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
};

const formatRoleLabel = (role: string) =>
  role.charAt(0).toUpperCase() + role.slice(1);

const UserRegistry: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showError } = useToast();
  const [filters, setFilters] = useState<UserFilters>({
    email: "",
    name: "",
    role: "",
    is_active: "",
  });
  const [debouncedFilters, setDebouncedFilters] =
    useState<UserFilters>(filters);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedFilters(filters);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [filters]);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["user-registry", currentPage, pageSize, debouncedFilters],
    queryFn: () => fetchUsers(currentPage, pageSize, debouncedFilters),
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (!error) return;

    const errorMessage =
      error &&
      typeof error === "object" &&
      "response" in error &&
      error.response
        ? (error.response as { data?: { error?: string; message?: string } })
            ?.data?.error ||
          (error.response as { data?: { error?: string; message?: string } })
            ?.data?.message
        : "Failed to fetch users. Please try again.";

    showError(errorMessage);
  }, [error, showError]);

  const items = useMemo<ManagedUser[]>(
    () => data?.results || [],
    [data?.results],
  );
  const totalCount = data?.count || 0;
  const hasLoadedRows = items.length > 0;
  const isTableRefreshing = isFetching && hasLoadedRows;

  const sortedItems = useMemo(() => {
    if (!sortConfig) return items;

    return [...items].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      const normalizedA = String(aValue).toLowerCase();
      const normalizedB = String(bValue).toLowerCase();

      if (normalizedA < normalizedB) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (normalizedA > normalizedB) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [items, sortConfig]);

  const requestSort = (key: keyof ManagedUser) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig?.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const columns: Column<ManagedUser>[] = [
    {
      header: "User",
      sortKey: "first_name",
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
            <UserRound className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-black text-slate-800 dark:text-slate-100">
              {[item.first_name, item.last_name].filter(Boolean).join(" ") ||
                "Unnamed User"}
            </span>
            <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400">
              #{item.id}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Email",
      sortKey: "email",
      render: (item) => (
        <div className="flex items-center gap-2">
          <Mail className="h-3 w-3 text-slate-400" />
          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
            {item.email}
          </span>
        </div>
      ),
    },
    {
      header: "Role",
      sortKey: "role",
      render: (item) => (
        <span
          className={`inline-flex items-center rounded-md px-2 py-1 text-[8px] font-black uppercase tracking-[0.2em] ${
            roleTone[item.role] || roleTone.pharmacist
          }`}
        >
          {formatRoleLabel(item.role)}
        </span>
      ),
    },
    {
      header: "Access",
      sortKey: "is_active",
      render: (item) => (
        <span
          className={`inline-flex items-center rounded-md px-2 py-1 text-[8px] font-black uppercase tracking-[0.2em] ${
            item.is_active
              ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              : "border border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-400"
          }`}
        >
          {item.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      header: "Joined",
      sortKey: "date_joined",
      render: (item) => (
        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
          {item.date_joined
            ? new Date(item.date_joined).toLocaleDateString()
            : "N/A"}
        </span>
      ),
    },
  ];

  const Filters = (
    <div className="flex flex-col space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filters.name || ""}
            onChange={(e) => {
              setFilters((prev) => ({ ...prev, name: e.target.value }));
              setCurrentPage(1);
            }}
            placeholder="Search Name..."
            className="w-full bg-transparent pl-6 text-[11px] font-bold text-slate-800 outline-none placeholder:text-slate-400 dark:text-white"
          />
        </div>
        <div className="relative rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filters.email || ""}
            onChange={(e) => {
              setFilters((prev) => ({ ...prev, email: e.target.value }));
              setCurrentPage(1);
            }}
            placeholder="Search Email..."
            className="w-full bg-transparent pl-6 text-[11px] font-bold text-slate-800 outline-none placeholder:text-slate-400 dark:text-white"
          />
        </div>
        <select
          value={filters.role || ""}
          onChange={(e) => {
            setFilters((prev) => ({ ...prev, role: e.target.value }));
            setCurrentPage(1);
          }}
          className="w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-bold text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="">All roles</option>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="pharmacist">Pharmacist</option>
          <option value="cashier">Cashier</option>
        </select>
        <select
          value={filters.is_active || ""}
          onChange={(e) => {
            setFilters((prev) => ({ ...prev, is_active: e.target.value }));
            setCurrentPage(1);
          }}
          className="w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-bold text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="">All activity states</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>
    </div>
  );

  const Footer = (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-800">
        {[10, 25, 50].map((size) => (
          <button
            key={size}
            onClick={() => {
              setPageSize(size);
              setCurrentPage(1);
            }}
            className={`rounded-lg px-4 py-1.5 text-[10px] font-black transition-all ${
              pageSize === size
                ? "bg-slate-900 text-white dark:bg-slate-700"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            {size}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3">
        {data?.has_previous && (
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Previous
          </button>
        )}
        {data?.has_next && (
          <button
            onClick={() => setCurrentPage((prev) => prev + 1)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-800 dark:text-white md:text-xl">
              User Registry
            </h1>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Team access and role directory
            </p>
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={() => navigate("/users/new")}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-500"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New User</span>
          </button>
        )}
      </header>

      <DataTable
        columns={columns}
        data={sortedItems}
        isLoading={isLoading && !hasLoadedRows}
        isRefreshing={isTableRefreshing}
        onRefresh={refetch}
        filters={Filters}
        footer={Footer}
        onRowClick={(item) => navigate(`/users/${item.email}`)}
        selectable
        sortConfig={sortConfig}
        onSort={requestSort}
        loadingMessage="Loading user registry..."
        emptyMessage="No users found"
        refreshMessage="Updating"
        refreshLabel="Refresh"
        headerRight={
          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600">
            <Shield className="h-3.5 w-3.5" />
            <span>
              {items.length} of {totalCount} records
            </span>
          </div>
        }
      />
    </div>
  );
};

export default UserRegistry;
