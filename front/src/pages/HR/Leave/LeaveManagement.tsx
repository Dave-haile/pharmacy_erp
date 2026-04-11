import React, { useEffect, useMemo, useState } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Plus,
  ShieldCheck,
  Trash2,
  Calendar,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Database
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import SearchableSelect from "../../../components/SearchableSelect";
import {
  FormField,
  SelectInput,
  TextAreaInput,
  TextInput,
} from "../../../components/ui/FormField";
import { useToast } from "../../../hooks/useToast";
import {
  approveLeaveRequest,
  cancelLeaveRequest,
  createLeaveRequest,
  createLeaveType,
  deleteLeaveType,
  fetchEmployees,
  fetchLeaveMeta,
  fetchLeaveRequests,
  fetchLeaveTypes,
  rejectLeaveRequest,
} from "../../../services/hr";
import {
  LeaveRequestFilters,
  LeaveRequestPayload,
  LeaveTypePayload,
} from "../../../types/hr";

const EMPLOYEE_LOOKUP_PAGE_SIZE = 7;

const initialLeaveType: LeaveTypePayload = {
  name: "",
  code: "",
  description: "",
  default_days: 1,
  is_active: true,
};

const initialLeaveRequest: LeaveRequestPayload = {
  employee: 0,
  leave_type: 0,
  start_date: "",
  end_date: "",
  reason: "",
};

const statusTone: Record<string, string> = {
  pending:
    "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  approved:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  rejected:
    "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-400",
  cancelled:
    "border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-400",
};

const LeaveManagement: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showError, showSuccess } = useToast();
  const [leaveTypeForm, setLeaveTypeForm] =
    useState<LeaveTypePayload>(initialLeaveType);
  const [leaveRequestForm, setLeaveRequestForm] =
    useState<LeaveRequestPayload>(initialLeaveRequest);
  const [filters, setFilters] = useState<LeaveRequestFilters>({
    search: "",
    status: "",
    employee: "",
    leave_type: "",
  });
  const [debouncedFilters, setDebouncedFilters] =
    useState<LeaveRequestFilters>(filters);
  const [page, setPage] = useState(1);
  const [employeeLookupPage, setEmployeeLookupPage] = useState(1);
  const [employeeLookupSearch, setEmployeeLookupSearch] = useState("");
  const fetchEmployeesNextPage = () => setEmployeeLookupPage((prev) => prev + 1);
  const [debouncedEmployeeLookupSearch, setDebouncedEmployeeLookupSearch] =
    useState("");
  const [employeeOptions, setEmployeeOptions] = useState<
    { value: string; label: string; subtitle?: string }[]
  >([]);
  const [employeesHasNext, setEmployeesHasNext] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedFilters(filters), 300);
    return () => window.clearTimeout(timeout);
  }, [filters]);

  useEffect(() => {
    const timeout = window.setTimeout(
      () => setDebouncedEmployeeLookupSearch(employeeLookupSearch.trim()),
      300,
    );
    return () => window.clearTimeout(timeout);
  }, [employeeLookupSearch]);

  const { data: meta, error: metaError } = useQuery({
    queryKey: ["leave-meta"],
    queryFn: fetchLeaveMeta,
    staleTime: 60 * 1000,
  });

  const { data: leaveTypesData, error: leaveTypesError } = useQuery({
    queryKey: ["leave-types"],
    queryFn: () => fetchLeaveTypes(),
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    setEmployeeLookupPage(1);
  }, [debouncedEmployeeLookupSearch]);

  const {
    data: employeeLookupData,
    error: employeeLookupError,
    isFetching: isEmployeeLookupFetching,
  } = useQuery({
    queryKey: [
      "employees-lookup",
      employeeLookupPage,
      debouncedEmployeeLookupSearch,
    ],
    queryFn: () =>
      fetchEmployees(employeeLookupPage, EMPLOYEE_LOOKUP_PAGE_SIZE, {
        search: debouncedEmployeeLookupSearch,
      }),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (!employeeLookupData) return;

    const mapped = employeeLookupData.results.map((employee) => ({
      value: String(employee.id),
      label: employee.full_name,
      subtitle: `${employee.department} • ${employee.naming_series}`,
    }));

    setEmployeeOptions((prev) => {
      if (employeeLookupPage === 1) {
        return mapped;
      }

      const merged = [...prev];
      const existingIds = new Set(prev.map((option) => option.value));
      mapped.forEach((option) => {
        if (!existingIds.has(option.value)) {
          merged.push(option);
        }
      });
      return merged;
    });

    setEmployeesHasNext(employeeLookupData.has_next);
  }, [employeeLookupData, employeeLookupPage]);

  useEffect(() => {
    setEmployeeLookupPage(1);
  }, [debouncedEmployeeLookupSearch]);

  useEffect(() => {
    const selectedEmployeeId = leaveRequestForm.employee
      ? String(leaveRequestForm.employee)
      : "";
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
          subtitle: `${selectedEmployee.department} • ${selectedEmployee.naming_series}`,
        },
        ...prev,
      ];
    });
  }, [leaveRequestForm.employee, meta?.employees]);

  const {
    data: leaveRequestsData,
    error: leaveRequestsError,
    isFetching,
  } = useQuery({
    queryKey: ["leave-requests", page, debouncedFilters],
    queryFn: () => fetchLeaveRequests(page, 10, debouncedFilters),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    const error =
      metaError || leaveTypesError || leaveRequestsError || employeeLookupError;
    if (!error) return;
    const message =
      error &&
        typeof error === "object" &&
        "response" in error &&
        error.response
        ? (error.response as { data?: { error?: string; message?: string } })
          .data?.error ||
        (error.response as { data?: { error?: string; message?: string } })
          .data?.message
        : "Failed to load leave management data.";
    showError(
      message ||
      "An unknown error occurred while loading leave management data.",
    );
  }, [
    employeeLookupError,
    leaveRequestsError,
    leaveTypesError,
    metaError,
    showError,
  ]);

  const refreshLeaveData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["leave-meta"] }),
      queryClient.invalidateQueries({ queryKey: ["leave-types"] }),
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] }),
      queryClient.invalidateQueries({ queryKey: ["employees"] }),
      queryClient.invalidateQueries({ queryKey: ["employees-lookup"] }),
    ]);
  };

  const createLeaveTypeMutation = useMutation({
    mutationFn: createLeaveType,
    onSuccess: async () => {
      showSuccess("Leave type created successfully.");
      setLeaveTypeForm(initialLeaveType);
      await refreshLeaveData();
    },
    onError: (error) => {
      const message =
        error &&
          typeof error === "object" &&
          "response" in error &&
          error.response
          ? (
            error.response as {
              data?: { error?: string; code?: string[]; name?: string[] };
            }
          ).data?.error ||
          (
            error.response as {
              data?: { error?: string; code?: string[]; name?: string[] };
            }
          ).data?.code?.[0] ||
          (
            error.response as {
              data?: { error?: string; code?: string[]; name?: string[] };
            }
          ).data?.name?.[0]
          : "Failed to create leave type.";
      showError(
        message || "An unknown error occurred while creating the leave type.",
      );
    },
  });

  const createLeaveRequestMutation = useMutation({
    mutationFn: createLeaveRequest,
    onSuccess: async () => {
      showSuccess("Leave request submitted successfully.");
      setLeaveRequestForm(initialLeaveRequest);
      setEmployeeLookupSearch("");
      setDebouncedEmployeeLookupSearch("");
      setEmployeeLookupPage(1);
      await refreshLeaveData();
    },
    onError: (error) => {
      const message =
        error &&
          typeof error === "object" &&
          "response" in error &&
          error.response
          ? (
            error.response as {
              data?: { error?: string; end_date?: string[] };
            }
          ).data?.error ||
          (
            error.response as {
              data?: { error?: string; end_date?: string[] };
            }
          ).data?.end_date?.[0]
          : "Failed to create leave request.";
      showError(
        message ||
        "An unknown error occurred while submitting the leave request.",
      );
    },
  });

  const handleLeaveRequestEmployeeChange = (val: string) => {
    setLeaveRequestForm((prev) => ({
      ...prev,
      employee: val ? Number(val) : 0,
    }));
  };

  const approvalMutation = useMutation({
    mutationFn: async ({
      id,
      action,
    }: {
      id: number;
      action: "approve" | "reject" | "cancel";
    }) => {
      if (action === "approve") return approveLeaveRequest(id);
      if (action === "reject") return rejectLeaveRequest(id);
      return cancelLeaveRequest(id);
    },
    onSuccess: async (_, variables) => {
      showSuccess(`Leave request ${variables.action}d successfully.`);
      await refreshLeaveData();
    },
    onError: (error) => {
      const message =
        error &&
          typeof error === "object" &&
          "response" in error &&
          error.response
          ? (error.response as { data?: { error?: string; message?: string } })
            .data?.error ||
          (error.response as { data?: { error?: string; message?: string } })
            .data?.message
          : "Failed to update leave request.";
      showError(
        message ||
        "An unknown error occurred while updating the leave request.",
      );
    },
  });

  const deleteLeaveTypeMutation = useMutation({
    mutationFn: deleteLeaveType,
    onSuccess: async () => {
      showSuccess("Leave type deleted successfully.");
      await refreshLeaveData();
    },
    onError: (error) => {
      const message =
        error &&
          typeof error === "object" &&
          "response" in error &&
          error.response
          ? (error.response as { data?: { error?: string; message?: string } })
            .data?.error ||
          (error.response as { data?: { error?: string; message?: string } })
            .data?.message
          : "Failed to delete leave type.";
      showError(
        message || "An unknown error occurred while deleting the leave type.",
      );
    },
  });

  const leaveRequests = leaveRequestsData?.results || [];
  const leaveTypes = leaveTypesData?.results || [];

  const requestValidationErrors = useMemo(() => {
    const errors: string[] = [];
    if (!leaveRequestForm.employee) errors.push("Employee is required.");
    if (!leaveRequestForm.leave_type) errors.push("Leave type is required.");
    if (!leaveRequestForm.start_date) errors.push("Start date is required.");
    if (!leaveRequestForm.end_date) errors.push("End date is required.");
    return errors;
  }, [leaveRequestForm]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <header className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate("/hr")}
            className="p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-slate-500 dark:text-slate-400 shadow-sm"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
          <div>
            <h1 className="text-lg md:text-xl font-black text-slate-800 dark:text-white tracking-tight">Leave Management</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-[10px] uppercase tracking-widest">Absence Workflow & Approvals</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate("/hr/leave-types")}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center space-x-2"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Leave Types</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* New Leave Type Section */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                <Plus className="h-4 w-4 text-emerald-500" />
              </div>
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">
                Quick Leave Type
              </h2>
            </div>
          </div>
          <div className="space-y-4">
            <FormField label="Name" required>
              <TextInput
                value={leaveTypeForm.name}
                onChange={(e) =>
                  setLeaveTypeForm((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder="Annual Leave"
              />
            </FormField>
            <FormField label="Code" required>
              <TextInput
                value={leaveTypeForm.code}
                onChange={(e) =>
                  setLeaveTypeForm((prev) => ({
                    ...prev,
                    code: e.target.value.toUpperCase(),
                  }))
                }
                placeholder="ANNUAL"
              />
            </FormField>
            <FormField label="Default Days">
              <TextInput
                type="number"
                min="1"
                value={String(leaveTypeForm.default_days)}
                onChange={(e) =>
                  setLeaveTypeForm((prev) => ({
                    ...prev,
                    default_days: Math.max(1, Number(e.target.value || 1)),
                  }))
                }
              />
            </FormField>
            <FormField label="Description">
              <TextAreaInput
                value={leaveTypeForm.description}
                onChange={(e) =>
                  setLeaveTypeForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={3}
                placeholder="Internal guidance..."
              />
            </FormField>
            <button
              type="button"
              onClick={() => createLeaveTypeMutation.mutate(leaveTypeForm)}
              disabled={createLeaveTypeMutation.isPending}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>
                {createLeaveTypeMutation.isPending
                  ? "Configuring..."
                  : "Register Leave Type"}
              </span>
            </button>
          </div>
        </section>

        {/* New Leave Request Section */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex items-center gap-2">
            <div className="p-1.5 bg-blue-500/10 rounded-lg">
              <ShieldCheck className="h-4 w-4 text-blue-500" />
            </div>
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">
              New Request
            </h2>
          </div>
          <div className="space-y-4">
            <FormField label="Employee" required>
              <SearchableSelect
                options={employeeOptions}
                value={
                  leaveRequestForm.employee
                    ? String(leaveRequestForm.employee)
                    : ""
                }
                onChange={handleLeaveRequestEmployeeChange}
                placeholder="Search employee..."
                // onSearchChange={setEmployeeLookupSearch}
                // isLoading={isEmployeeLookupFetching}
                // onScrollEnd={
                //   employeesHasNext ? fetchEmployeesNextPage : undefined
                // }
                createNewText="Create New Employee"
                onCreateNew={() => navigate("/hr/employees/create")}
                onSearch={setEmployeeLookupSearch}
              />
            </FormField>
            <FormField label="Leave Type" required>
              <SelectInput
                value={
                  leaveRequestForm.leave_type
                    ? String(leaveRequestForm.leave_type)
                    : ""
                }
                onChange={(e) =>
                  setLeaveRequestForm((prev) => ({
                    ...prev,
                    leave_type: Number(e.target.value),
                  }))
                }
                options={[
                  { value: "", label: "Select type..." },
                  ...(meta?.leave_types.map((type) => ({
                    value: String(type.id),
                    label: type.name,
                  })) || []),
                ]}
              />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Start Date" required>
                <TextInput
                  type="date"
                  value={leaveRequestForm.start_date}
                  onChange={(e) =>
                    setLeaveRequestForm((prev) => ({
                      ...prev,
                      start_date: e.target.value,
                    }))
                  }
                />
              </FormField>
              <FormField label="End Date" required>
                <TextInput
                  type="date"
                  value={leaveRequestForm.end_date}
                  onChange={(e) =>
                    setLeaveRequestForm((prev) => ({
                      ...prev,
                      end_date: e.target.value,
                    }))
                  }
                />
              </FormField>
            </div>
            <FormField label="Reason">
              <TextAreaInput
                value={leaveRequestForm.reason}
                onChange={(e) =>
                  setLeaveRequestForm((prev) => ({
                    ...prev,
                    reason: e.target.value,
                  }))
                }
                rows={3}
                placeholder="Reason for leave..."
              />
            </FormField>
            <button
              type="button"
              onClick={() =>
                createLeaveRequestMutation.mutate(leaveRequestForm)
              }
              disabled={
                createLeaveRequestMutation.isPending ||
                requestValidationErrors.length > 0
              }
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>
                {createLeaveRequestMutation.isPending
                  ? "Submitting..."
                  : "Submit Application"}
              </span>
            </button>
          </div>
        </section>

        {/* Existing Leave Types List */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-slate-500/10 rounded-lg">
                <Database className="h-4 w-4 text-slate-500" />
              </div>
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">
                Active Registry
              </h2>
            </div>
          </div>
          <div className="space-y-3">
            {leaveTypes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No types configured</p>
              </div>
            ) : (
              leaveTypes.map((type) => (
                <div
                  key={type.id}
                  className="group flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3 transition-all hover:border-slate-200 hover:bg-white dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-slate-700 dark:hover:bg-slate-900"
                >
                  <div
                    className="cursor-pointer"
                    onClick={() => navigate(`/hr/leave-types/${type.code}`)}
                  >
                    <p className="text-[11px] font-black text-slate-800 dark:text-slate-200 group-hover:text-blue-600 transition-colors">
                      {type.name}
                    </p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                      {type.code} • {type.default_days} Days
                    </p>
                  </div>
                  <button
                    onClick={() => deleteLeaveTypeMutation.mutate(type.id)}
                    disabled={deleteLeaveTypeMutation.isPending}
                    className="rounded-lg p-2 text-slate-400 transition-all hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Leave Requests Table */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 p-6 dark:border-slate-800">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-500/10 rounded-lg">
                <Calendar className="h-4 w-4 text-blue-500" />
              </div>
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">
                Application Queue
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <SelectInput
                className="w-32"
                value={filters.status}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, status: e.target.value }))
                }
                options={[
                  { value: "", label: "All Status" },
                  { value: "pending", label: "Pending" },
                  { value: "approved", label: "Approved" },
                  { value: "rejected", label: "Rejected" },
                  { value: "cancelled", label: "Cancelled" },
                ]}
              />
              <TextInput
                className="w-48"
                placeholder="Search employee..."
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Employee
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Type
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Period
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">
                  Status
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isFetching && !leaveRequestsData ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fetching records...</p>
                    </div>
                  </td>
                </tr>
              ) : leaveRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No applications found</p>
                  </td>
                </tr>
              ) : (
                leaveRequests.map((request) => (
                  <tr
                    key={request.id}
                    className="group transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                          <User className="w-4 h-4 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-[11px] font-black text-slate-800 dark:text-slate-200">
                            {request.employee_name}
                          </p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                            {request.employee_code}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                        {request.leave_type_name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold">
                          {request.start_date} → {request.end_date}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-[8px] font-black uppercase tracking-widest ${statusTone[request.status]
                          }`}
                      >
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        {request.status === "pending" && (
                          <>
                            <button
                              onClick={() =>
                                approvalMutation.mutate({
                                  id: request.id,
                                  action: "approve",
                                })
                              }
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors dark:hover:bg-emerald-500/10"
                              title="Approve"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() =>
                                approvalMutation.mutate({
                                  id: request.id,
                                  action: "reject",
                                })
                              }
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors dark:hover:bg-rose-500/10"
                              title="Reject"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {request.status === "approved" && (
                          <button
                            onClick={() =>
                              approvalMutation.mutate({
                                id: request.id,
                                action: "cancel",
                              })
                            }
                            className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors dark:hover:bg-slate-800"
                            title="Cancel"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {leaveRequestsData && leaveRequestsData.total_pages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 p-6 dark:border-slate-800">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Page {page} of {leaveRequestsData.total_pages}
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-slate-200 p-2 text-slate-500 shadow-sm transition-all hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={page >= leaveRequestsData.total_pages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-slate-200 p-2 text-slate-500 shadow-sm transition-all hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default LeaveManagement;
