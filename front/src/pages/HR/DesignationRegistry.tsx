import React, { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Briefcase,
  Building2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
} from "lucide-react";

import DataTable, { Column } from "../../components/DataTable";
import { SelectInput, TextInput } from "../../components/ui/FormField";
import { useToast } from "../../hooks/useToast";
import { fetchDesignations } from "../../services/hr";
import { Designation, DesignationFilters } from "../../types/hr";

type SortConfig = {
  key: keyof Designation;
  direction: "asc" | "desc";
} | null;

const DesignationRegistry: React.FC = () => {
  const navigate = useNavigate();
  const { showError } = useToast();
  const [filters, setFilters] = useState<DesignationFilters>({
    search: "",
    include_inactive: "",
  });
  const [debouncedFilters, setDebouncedFilters] =
    useState<DesignationFilters>(filters);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedFilters(filters);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [filters]);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["designations", currentPage, pageSize, debouncedFilters],
    queryFn: () => fetchDesignations(currentPage, pageSize, debouncedFilters),
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
        : "Failed to fetch designations.";

    showError(
      errorMessage || "An unknown error occurred while fetching designations.",
    );
  }, [error, showError]);

  const items = useMemo<Designation[]>(
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

  const requestSort = (key: keyof Designation) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig?.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const columns: Column<Designation>[] = [
    {
      header: "Designation",
      sortKey: "name",
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
            <Briefcase className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-black text-slate-800 dark:text-slate-100">
              {item.name}
            </span>
            <span className="text-[9px] text-slate-500 dark:text-slate-400">
              {item.description || "No description"}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Department",
      sortKey: "department",
      render: (item) => (
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-700 dark:text-slate-200">
          <Building2 className="h-3.5 w-3.5 text-slate-400" />
          <span>{item.department || "All departments"}</span>
        </div>
      ),
    },
    {
      header: "Employees",
      headerClassName: "text-right",
      className: "text-right",
      sortKey: "employee_count",
      render: (item) => (
        <span className="text-[10px] font-black text-slate-700 dark:text-slate-200">
          {item.employee_count ?? 0}
        </span>
      ),
    },
    {
      header: "Status",
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
  ];

  const filtersUI = (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative sm:col-span-2 lg:col-span-3">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <TextInput
            value={filters.search || ""}
            onChange={(event) => {
              setFilters((prev) => ({ ...prev, search: event.target.value }));
              setCurrentPage(1);
            }}
            placeholder="Search designation, department, or description..."
            hasIcon
          />
        </div>
        <SelectInput
          value={filters.include_inactive || ""}
          onChange={(event) => {
            setFilters((prev) => ({
              ...prev,
              include_inactive: event.target.value,
            }));
            setCurrentPage(1);
          }}
        >
          <option value="">Active only</option>
          <option value="true">Include inactive</option>
        </SelectInput>
      </div>
    </div>
  );

  const footer = (
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
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400">
          Page {data?.current_page || 1} of {data?.total_pages || 1}
        </div>
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
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-500">
            HR Structure
          </p>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Designation Registry
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {totalCount} designation{totalCount === 1 ? "" : "s"} available for
            employee assignment.
          </p>
        </div>

        <button
          onClick={() => navigate("/hr/designations/new")}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-500"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Designation</span>
        </button>
      </header>

      <DataTable
        columns={columns}
        data={sortedItems}
        isLoading={isLoading}
        isRefreshing={isTableRefreshing}
        onRefresh={refetch}
        filters={filtersUI}
        footer={footer}
        onRowClick={(item) => navigate(`/hr/designations/${item.id}`)}
        emptyMessage="No designations found"
        loadingMessage="Loading designations..."
        sortConfig={sortConfig}
        onSort={requestSort}
        headerRight={
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
            Designation Management
          </span>
        }
      />
    </div>
  );
};

export default DesignationRegistry;
