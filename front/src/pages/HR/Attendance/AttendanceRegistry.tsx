import React, { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Plus,
  Search,
  UserCheck,
} from "lucide-react";

import DataTable, { Column } from "../../../components/DataTable";
import SearchableSelect from "../../../components/SearchableSelect";
import { SelectInput, TextInput } from "../../../components/ui/FormField";
import { useToast } from "../../../hooks/useToast";
import { fetchAttendanceMeta, fetchAttendanceRecords, fetchEmployees } from "../../../services/hr";
import { AttendanceRecord, AttendanceRecordFilters, AttendanceStatus } from "../../../types/hr";

const EMPLOYEE_LOOKUP_PAGE_SIZE = 7;
const today = new Date().toISOString().split("T")[0];

type SortConfig = {
  key: keyof AttendanceRecord;
  direction: "asc" | "desc";
} | null;

const statusTone: Record<AttendanceStatus, string> = {
  present:
    "border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  absent:
    "border border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-400",
  on_leave:
    "border border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
};

const AttendanceRegistry: React.FC = () => {
  const navigate = useNavigate();
  const { showError } = useToast();
  const [filters, setFilters] = useState<AttendanceRecordFilters>({
    search: "",
    status: "",
    employee: "",
    date_from: today,
    date_to: today,
  });
  const [debouncedFilters, setDebouncedFilters] = useState<AttendanceRecordFilters>(filters);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [employeeLookupPage, setEmployeeLookupPage] = useState(1);
  const [employeeLookupSearch, setEmployeeLookupSearch] = useState("");
  const [debouncedEmployeeLookupSearch, setDebouncedEmployeeLookupSearch] = useState("");
  const [employeeOptions, setEmployeeOptions] = useState<
    { value: string; label: string; subtitle?: string }[]
  >([]);
  const [employeesHasNext, setEmployeesHasNext] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedFilters(filters);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [filters]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedEmployeeLookupSearch(employeeLookupSearch.trim());
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [employeeLookupSearch]);

  useEffect(() => {
    setEmployeeLookupPage(1);
  }, [debouncedEmployeeLookupSearch]);

  const { data: meta, error: metaError } = useQuery({
    queryKey: ["attendance-meta"],
    queryFn: fetchAttendanceMeta,
    staleTime: 60 * 1000,
  });

  const {
    data: employeeLookupData,
    error: employeeLookupError,
    isFetching: isEmployeeLookupFetching,
  } = useQuery({
    queryKey: ["attendance-registry-employee-lookup", employeeLookupPage, debouncedEmployeeLookupSearch],
    queryFn: () =>
      fetchEmployees(employeeLookupPage, EMPLOYEE_LOOKUP_PAGE_SIZE, {
        search: debouncedEmployeeLookupSearch,
      }),
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (!employeeLookupData) return;

    const mapped = employeeLookupData.results.map((employee) => ({
      value: String(employee.id),
      label: employee.full_name,
      subtitle: `${employee.department} | ${employee.naming_series}`,
    }));

    setEmployeeOptions((prev) => {
      if (employeeLookupPage === 1) return mapped;
      const merged = [...prev];
      const seen = new Set(prev.map((option) => option.value));
      mapped.forEach((option) => {
        if (!seen.has(option.value)) {
          merged.push(option);
        }
      });
      return merged;
    });

    setEmployeesHasNext(employeeLookupData.has_next);
  }, [employeeLookupData, employeeLookupPage]);

  useEffect(() => {
    const selectedEmployeeId = filters.employee || "";
    const selectedEmployee = meta?.employees.find(
      (employee) => String(employee.id) === selectedEmployeeId,
    );
    if (!selectedEmployee) return;

    setEmployeeOptions((prev) => {
      if (prev.some((option) => option.value === selectedEmployeeId)) {
        return prev;
      }

      return [
        {
          value: selectedEmployeeId,
          label: selectedEmployee.full_name,
          subtitle: `${selectedEmployee.department} | ${selectedEmployee.naming_series}`,
        },
        ...prev,
      ];
    });
  }, [filters.employee, meta?.employees]);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["attendance-records", currentPage, pageSize, debouncedFilters],
    queryFn: () => fetchAttendanceRecords(currentPage, pageSize, debouncedFilters),
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    const activeError = error || metaError || employeeLookupError;
    if (!activeError) return;

    const errorMessage =
      activeError &&
      typeof activeError === "object" &&
      "response" in activeError &&
      activeError.response
        ? (activeError.response as { data?: { error?: string; message?: string } }).data?.error ||
          (activeError.response as { data?: { error?: string; message?: string } }).data?.message
        : "Failed to fetch attendance records.";

    showError(errorMessage || "Failed to fetch attendance records.");
  }, [employeeLookupError, error, metaError, showError]);

  const items = useMemo<AttendanceRecord[]>(() => data?.results || [], [data?.results]);
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

  const requestSort = (key: keyof AttendanceRecord) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig?.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const columns: Column<AttendanceRecord>[] = [
    {
      header: "Attendance",
      sortKey: "attendance_date",
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
            <CalendarDays className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-black text-slate-800 dark:text-slate-100">
              {new Date(item.attendance_date).toLocaleDateString()}
            </span>
            <span className="text-[9px] text-slate-500 dark:text-slate-400">
              {item.employee_code}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Naming Series",
      sortKey: "naming_series",
      render: (item) => (
        <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-[10px] font-black text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          {item.naming_series}
        </span>
      ),
    },
    {
      header: "Employee",
      sortKey: "employee_name",
      render: (item) => (
        <div className="flex flex-col">
          <span className="text-[11px] font-black text-slate-800 dark:text-slate-100">
            {item.employee_name}
          </span>
          <span className="text-[9px] text-slate-500 dark:text-slate-400">
            {item.employee_department}
          </span>
        </div>
      ),
    },
    {
      header: "Status",
      sortKey: "status",
      render: (item) => (
        <span
          className={`inline-flex items-center rounded-md px-2 py-1 text-[8px] font-black uppercase tracking-[0.2em] ${statusTone[item.status]}`}
        >
          {item.status_label}
        </span>
      ),
    },
    {
      header: "Time Window",
      render: (item) => (
        <div className="flex flex-col text-[10px] font-bold text-slate-600 dark:text-slate-300">
          <span>In: {item.check_in_time || "-"}</span>
          <span>Out: {item.check_out_time || "-"}</span>
        </div>
      ),
    },
    {
      header: "Recorded By",
      sortKey: "marked_by_name",
      render: (item) => (
        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
          {item.marked_by_name || "System"}
        </span>
      ),
    },
    {
      header: "Notes",
      render: (item) => (
        <span className="line-clamp-2 text-[10px] font-medium text-slate-500 dark:text-slate-400">
          {item.notes || "No note provided"}
        </span>
      ),
    },
  ];

  const filtersUI = (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-6">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <TextInput
            value={filters.search || ""}
            onChange={(event) => {
              setFilters((prev) => ({ ...prev, search: event.target.value }));
              setCurrentPage(1);
            }}
            placeholder="Search attendance no, employee, code, or notes..."
            hasIcon
          />
        </div>
        <SelectInput
          value={filters.status || ""}
          onChange={(event) => {
            setFilters((prev) => ({
              ...prev,
              status: event.target.value as AttendanceRecordFilters["status"],
            }));
            setCurrentPage(1);
          }}
        >
          <option value="">All statuses</option>
          {meta?.statuses.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </SelectInput>
        <TextInput
          type="date"
          value={filters.date_from || ""}
          onChange={(event) => {
            setFilters((prev) => ({ ...prev, date_from: event.target.value }));
            setCurrentPage(1);
          }}
        />
        <TextInput
          type="date"
          value={filters.date_to || ""}
          onChange={(event) => {
            setFilters((prev) => ({ ...prev, date_to: event.target.value }));
            setCurrentPage(1);
          }}
        />
        <div className="lg:col-span-2">
          <SearchableSelect
            options={employeeOptions}
            value={filters.employee || ""}
            onChange={(value) => {
              setFilters((prev) => ({ ...prev, employee: value }));
              setCurrentPage(1);
            }}
            onSearch={setEmployeeLookupSearch}
            placeholder="Filter by employee"
            hasMore={employeesHasNext}
            onLoadMore={() => {
              if (!isEmployeeLookupFetching && employeesHasNext) {
                setEmployeeLookupPage((prev) => prev + 1);
              }
            }}
            loadMoreText="Load more"
            isLoading={isEmployeeLookupFetching}
            loadingText="Loading employees..."
            emptyText="No employees found"
          />
        </div>
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
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">
            HR Operations
          </p>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Attendance Registry
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {totalCount} attendance record{totalCount === 1 ? "" : "s"} available for review and updates.
          </p>
        </div>

        <button
          onClick={() => navigate("/hr/attendance/new")}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-500"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Attendance</span>
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
        onRowClick={(item) => navigate(`/hr/attendance/${item.naming_series}`)}
        emptyMessage="No attendance records found"
        loadingMessage="Loading attendance records..."
        sortConfig={sortConfig}
        onSort={requestSort}
        headerRight={
          <div className="flex items-center justify-end gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
            <UserCheck className="h-3.5 w-3.5" />
            Attendance Register
          </div>
        }
      />
    </div>
  );
};

export default AttendanceRegistry;



