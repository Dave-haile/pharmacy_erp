import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Clock3, Edit2, Save, TimerReset, X } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import SearchableSelect from "../../../components/SearchableSelect";
import { FormField, SelectInput, TextAreaInput, TextInput } from "../../../components/ui/FormField";
import { useToast } from "../../../hooks/useToast";
import {
  attendanceCheckIn,
  attendanceCheckOut,
  fetchAttendanceMeta,
  fetchAttendanceRecordByNamingSeries,
  fetchEmployees,
  updateAttendanceRecord,
} from "../../../services/hr";
import { AttendanceRecordPayload, AttendanceStatus } from "../../../types/hr";

const EMPLOYEE_LOOKUP_PAGE_SIZE = 7;

const AttendanceDetails: React.FC = () => {
  const { naming_series } = useParams<{ naming_series: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showError, showSuccess } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<AttendanceRecordPayload>({
    employee: 0,
    attendance_date: "",
    status: "present",
    check_in_time: null,
    check_out_time: null,
    notes: "",
  });
  const [employeeLookupPage, setEmployeeLookupPage] = useState(1);
  const [employeeLookupSearch, setEmployeeLookupSearch] = useState("");
  const [debouncedEmployeeLookupSearch, setDebouncedEmployeeLookupSearch] = useState("");
  const [employeeOptions, setEmployeeOptions] = useState<
    { value: string; label: string; subtitle?: string }[]
  >([]);
  const [employeesHasNext, setEmployeesHasNext] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedEmployeeLookupSearch(employeeLookupSearch.trim());
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [employeeLookupSearch]);

  useEffect(() => {
    setEmployeeLookupPage(1);
  }, [debouncedEmployeeLookupSearch]);

  const attendanceNamingSeries = naming_series || "";

  const { data: meta, error: metaError } = useQuery({
    queryKey: ["attendance-meta"],
    queryFn: fetchAttendanceMeta,
    staleTime: 60 * 1000,
  });

  const {
    data: record,
    error: recordError,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["attendance-record", attendanceNamingSeries],
    queryFn: () => fetchAttendanceRecordByNamingSeries(attendanceNamingSeries),
    enabled: attendanceNamingSeries.length > 0,
    staleTime: 30 * 1000,
  });

  const {
    data: employeeLookupData,
    error: employeeLookupError,
    isFetching: isEmployeeLookupFetching,
  } = useQuery({
    queryKey: ["attendance-details-employee-lookup", employeeLookupPage, debouncedEmployeeLookupSearch],
    queryFn: () =>
      fetchEmployees(employeeLookupPage, EMPLOYEE_LOOKUP_PAGE_SIZE, {
        search: debouncedEmployeeLookupSearch,
      }),
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (!record) return;

    setFormData({
      employee: record.employee,
      attendance_date: record.attendance_date,
      status: record.status,
      check_in_time: record.check_in_time,
      check_out_time: record.check_out_time,
      notes: record.notes || "",
    });
  }, [record]);

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
    const selectedEmployeeId = formData.employee ? String(formData.employee) : "";
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
  }, [formData.employee, meta?.employees]);

  useEffect(() => {
    const activeError = metaError || recordError || employeeLookupError;
    if (!activeError) return;

    const message =
      activeError &&
      typeof activeError === "object" &&
      "response" in activeError &&
      activeError.response
        ? (activeError.response as { data?: { error?: string; message?: string } }).data?.error ||
          (activeError.response as { data?: { error?: string; message?: string } }).data?.message
        : "Failed to load attendance record.";

    showError(message || "Failed to load attendance record.");
  }, [employeeLookupError, metaError, recordError, showError]);

  const refreshRecord = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["attendance-record", attendanceNamingSeries] }),
      queryClient.invalidateQueries({ queryKey: ["attendance-records"] }),
      queryClient.invalidateQueries({ queryKey: ["attendance-meta"] }),
    ]);
  };

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<AttendanceRecordPayload>) =>
      updateAttendanceRecord(attendanceNamingSeries, payload),
    onSuccess: async () => {
      showSuccess("Attendance record updated.");
      setIsEditing(false);
      await refreshRecord();
    },
    onError: (error) => {
      const message =
        error && typeof error === "object" && "response" in error && error.response
          ? (error.response as { data?: { error?: string; non_field_errors?: string[] } }).data?.error ||
            (error.response as { data?: { error?: string; non_field_errors?: string[] } }).data?.non_field_errors?.[0]
          : "Failed to update attendance record.";
      showError(message || "Failed to update attendance record.");
    },
  });

  const checkInMutation = useMutation({
    mutationFn: () => attendanceCheckIn(formData.employee, formData.attendance_date),
    onSuccess: async () => {
      showSuccess("Check-in recorded.");
      await refreshRecord();
    },
    onError: () => showError("Failed to record check-in."),
  });

  const checkOutMutation = useMutation({
    mutationFn: () => attendanceCheckOut(formData.employee, formData.attendance_date),
    onSuccess: async () => {
      showSuccess("Check-out recorded.");
      await refreshRecord();
    },
    onError: () => showError("Failed to record check-out."),
  });

  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    if (!formData.employee) errors.push("Employee is required.");
    if (!formData.attendance_date) errors.push("Attendance date is required.");
    if (formData.check_out_time && !formData.check_in_time) {
      errors.push("Check in time is required before check out.");
    }
    return errors;
  }, [formData]);

  const handleStatusChange = (status: AttendanceStatus) => {
    setFormData((prev) => ({
      ...prev,
      status,
      check_in_time: status === "absent" ? null : prev.check_in_time,
      check_out_time: status === "absent" ? null : prev.check_out_time,
    }));
  };

  if (isLoading && !record) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        Loading attendance record...
      </div>
    );
  }

  if (!record) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        Attendance record not found.
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/hr/attendance")}
            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">
              HR Operations
            </p>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Attendance Details
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Review and update a single attendance record.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Edit2 className="h-3.5 w-3.5" />
              Edit Record
            </button>
          ) : (
            <button
              onClick={() => {
                setIsEditing(false);
                setFormData({
                  employee: record.employee,
                  attendance_date: record.attendance_date,
                  status: record.status,
                  check_in_time: record.check_in_time,
                  check_out_time: record.check_out_time,
                  notes: record.notes || "",
                });
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <X className="h-3.5 w-3.5" />
              Cancel Edit
            </button>
          )}
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Employee</p>
          <h2 className="mt-2 text-lg font-black text-slate-900 dark:text-white">{record.employee_name}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">{record.employee_department}</p>
          <p className="mt-2 text-[10px] font-mono text-slate-500 dark:text-slate-400">{record.naming_series}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status</p>
          <span className="mt-3 inline-flex items-center rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[8px] font-black uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400">
            {record.status_label}
          </span>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Date: {new Date(record.attendance_date).toLocaleDateString()}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Time Window</p>
          <p className="mt-2 text-sm font-black text-slate-900 dark:text-white">In: {record.check_in_time || "-"}</p>
          <p className="text-sm font-black text-slate-900 dark:text-white">Out: {record.check_out_time || "-"}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Audit</p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Recorded by {record.marked_by_name || "System"}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Updated {new Date(record.updated_at).toLocaleString()}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          <FormField label="Employee" required className="xl:col-span-2">
            <SearchableSelect
              options={employeeOptions}
              value={formData.employee ? String(formData.employee) : ""}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, employee: value ? Number(value) : 0 }))
              }
              onSearch={setEmployeeLookupSearch}
              placeholder="Search employee"
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
              disabled={!isEditing}
            />
          </FormField>
          <FormField label="Attendance Date" required>
            <TextInput
              type="date"
              value={formData.attendance_date}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, attendance_date: event.target.value }))
              }
              disabled={!isEditing}
            />
          </FormField>
          <FormField label="Status">
            <SelectInput
              value={formData.status}
              onChange={(event) => handleStatusChange(event.target.value as AttendanceStatus)}
              disabled={!isEditing}
            >
              {meta?.statuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </SelectInput>
          </FormField>
          <FormField label="Check In">
            <TextInput
              type="time"
              value={formData.check_in_time || ""}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  check_in_time: event.target.value || null,
                }))
              }
              disabled={!isEditing || formData.status === "absent"}
            />
          </FormField>
          <FormField label="Check Out">
            <TextInput
              type="time"
              value={formData.check_out_time || ""}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  check_out_time: event.target.value || null,
                }))
              }
              disabled={!isEditing || formData.status === "absent"}
            />
          </FormField>
        </div>

        <FormField label="Notes" className="mt-6">
          <TextAreaInput
            value={formData.notes}
            onChange={(event) => setFormData((prev) => ({ ...prev, notes: event.target.value }))}
            rows={4}
            placeholder="Optional shift note, explanation, or context"
            disabled={!isEditing}
          />
        </FormField>

        {validationErrors.length > 0 ? (
          <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs text-amber-700 dark:text-amber-300">
            {validationErrors.join(" ")}
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => checkInMutation.mutate()}
            disabled={checkInMutation.isPending || !formData.employee || isEditing}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Clock3 className="h-3.5 w-3.5" />
            Check In
          </button>
          <button
            type="button"
            onClick={() => checkOutMutation.mutate()}
            disabled={checkOutMutation.isPending || !formData.employee || isEditing}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <TimerReset className="h-3.5 w-3.5" />
            Check Out
          </button>
          {isEditing ? (
            <button
              type="button"
              onClick={() => updateMutation.mutate(formData)}
              disabled={updateMutation.isPending || validationErrors.length > 0}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {updateMutation.isPending ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </button>
          ) : null}
        </div>
      </section>

      {isFetching ? (
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Refreshing attendance record...</p>
      ) : null}
    </div>
  );
};

export default AttendanceDetails;
