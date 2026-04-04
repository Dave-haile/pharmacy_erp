import React, { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  Plus,
  Search,
  Shield,
  UserRound,
} from "lucide-react";

import DataTable, { Column } from "../../components/DataTable";
import { SelectInput, TextInput } from "../../components/ui/FormField";
import { useToast } from "../../hooks/useToast";
import { fetchEmployeeFiltersMeta, fetchEmployees } from "../../services/hr";
import { Employee, EmployeeFilters } from "../../types/hr";

type SortConfig = {
  key: keyof Employee;
  direction: "asc" | "desc";
} | null;

const statusTone: Record<string, string> = {
  active:
    "border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  on_leave:
    "border border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  suspended:
    "border border-orange-500/20 bg-orange-500/10 text-orange-700 dark:text-orange-400",
  terminated:
    "border border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-400",
  resigned:
    "border border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-400",
};

const EmployeeRegistry: React.FC = () => {
  const navigate = useNavigate();
  const { showError } = useToast();
  const [filters, setFilters] = useState<EmployeeFilters>({
    search: "",
    department: "",
    status: "",
    employment_type: "",
    include_inactive: "",
  });
  const [debouncedFilters, setDebouncedFilters] =
    useState<EmployeeFilters>(filters);
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
    queryKey: ["employees", currentPage, pageSize, debouncedFilters],
    queryFn: () => fetchEmployees(currentPage, pageSize, debouncedFilters),
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
  });

  const { data: meta } = useQuery({
    queryKey: ["employee-filter-meta"],
    queryFn: fetchEmployeeFiltersMeta,
    staleTime: 5 * 60 * 1000,
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
        : "Failed to fetch employees.";

    showError(errorMessage);
  }, [error, showError]);

  const items = useMemo<Employee[]>(() => data?.results || [], [data?.results]);
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

  const requestSort = (key: keyof Employee) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig?.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const columns: Column<Employee>[] = [
    {
      header: "Employee",
      sortKey: "first_name",
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
            <UserRound className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-black text-slate-800 dark:text-slate-100">
              {item.full_name}
            </span>
            <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400">
              {item.naming_series}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Role",
      sortKey: "designation",
      render: (item) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-700 dark:text-slate-200">
            <Briefcase className="h-3.5 w-3.5 text-slate-400" />
            <span>{item.designation}</span>
          </div>
          <div className="text-[9px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            {item.department}
          </div>
        </div>
      ),
    },
    {
      header: "Contact",
      sortKey: "work_email",
      render: (item) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-700 dark:text-slate-200">
            <Mail className="h-3.5 w-3.5 text-slate-400" />
            <span>{item.work_email}</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-400">
            <Phone className="h-3.5 w-3.5 text-slate-400" />
            <span>{item.phone}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Status",
      sortKey: "status",
      render: (item) => (
        <span
          className={`inline-flex items-center rounded-md px-2 py-1 text-[8px] font-black uppercase tracking-[0.2em] ${
            statusTone[item.status] || statusTone.active
          }`}
        >
          {item.status_label}
        </span>
      ),
    },
    {
      header: "Joined",
      sortKey: "hire_date",
      render: (item) => (
        <div className="space-y-1">
          <div className="text-[10px] font-bold text-slate-700 dark:text-slate-200">
            {new Date(item.hire_date).toLocaleDateString()}
          </div>
          <div className="text-[9px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            {item.employment_type_label}
          </div>
        </div>
      ),
    },
  ];

  const filterUI = (
    <div className="flex flex-col space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <TextInput
            type="text"
            value={filters.search || ""}
            onChange={(e) => {
              setFilters((prev) => ({ ...prev, search: e.target.value }));
              setCurrentPage(1);
            }}
            placeholder="Search employee, email, phone, or series..."
            size="sm"
            hasIcon
            className="placeholder:text-slate-400"
          />
        </div>
        <SelectInput
          value={filters.department || ""}
          onChange={(e) => {
            setFilters((prev) => ({ ...prev, department: e.target.value }));
            setCurrentPage(1);
          }}
          size="sm"
        >
          <option value="">All departments</option>
          {meta?.departments.map((department) => (
            <option key={department} value={department}>
              {department}
            </option>
          ))}
        </SelectInput>
        <SelectInput
          value={filters.status || ""}
          onChange={(e) => {
            setFilters((prev) => ({
              ...prev,
              status: e.target.value as EmployeeFilters["status"],
            }));
            setCurrentPage(1);
          }}
          size="sm"
        >
          <option value="">All statuses</option>
          {meta?.statuses.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </SelectInput>
        <SelectInput
          value={filters.employment_type || ""}
          onChange={(e) => {
            setFilters((prev) => ({
              ...prev,
              employment_type: e.target
                .value as EmployeeFilters["employment_type"],
            }));
            setCurrentPage(1);
          }}
          size="sm"
        >
          <option value="">All employment types</option>
          {meta?.employment_types.map((employmentType) => (
            <option key={employmentType.value} value={employmentType.value}>
              {employmentType.label}
            </option>
          ))}
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
            onClick={() => navigate("/hr")}
            className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-800 dark:text-white md:text-xl">
              Employee Directory
            </h1>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Core HR master data and workforce records
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate("/hr/employees/new")}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-500"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Employee</span>
        </button>
      </header>

      <DataTable
        columns={columns}
        data={sortedItems}
        isLoading={isLoading && !hasLoadedRows}
        isRefreshing={isTableRefreshing}
        onRefresh={refetch}
        filters={filterUI}
        footer={footer}
        onRowClick={(item) => navigate(`/hr/employees/${item.naming_series}`)}
        sortConfig={sortConfig}
        onSort={requestSort}
        loadingMessage="Loading employee directory..."
        emptyMessage="No employees found"
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

export default EmployeeRegistry;
