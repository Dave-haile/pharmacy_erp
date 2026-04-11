import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ChevronLeft, Clock3, Save, TimerReset, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import SearchableSelect from "../../../components/SearchableSelect";
import { FormField, SelectInput, TextAreaInput, TextInput } from "../../../components/ui/FormField";
import { useToast } from "../../../hooks/useToast";
import {
  attendanceCheckIn,
  attendanceCheckOut,
  createAttendanceRecord,
  fetchAttendanceMeta,
  fetchEmployees,
} from "../../../services/hr";
import { AttendanceRecordPayload, AttendanceStatus } from "../../../types/hr";

const EMPLOYEE_LOOKUP_PAGE_SIZE = 7;
const today = new Date().toISOString().split("T")[0];

const initialForm: AttendanceRecordPayload = {
  employee: 0,
  attendance_date: today,
  status: "present",
  check_in_time: null,
  check_out_time: null,
  notes: "",
};

const AttendanceForm: React.FC = () => {
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const [formData, setFormData] = useState<AttendanceRecordPayload>(initialForm);
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
    queryKey: ["attendance-form-employee-lookup", employeeLookupPage, debouncedEmployeeLookupSearch],
    queryFn: () =>
      fetchEmployees(employeeLookupPage, EMPLOYEE_LOOKUP_PAGE_SIZE, {
        search: debouncedEmployeeLookupSearch,
      }),
    staleTime: 30 * 1000,
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
    const activeError = metaError || employeeLookupError;
    if (!activeError) return;

    const message =
      activeError &&
      typeof activeError === "object" &&
      "response" in activeError &&
      activeError.response
        ? (activeError.response as { data?: { error?: string; message?: string } }).data?.error ||
          (activeError.response as { data?: { error?: string; message?: string } }).data?.message
        : "Failed to load attendance form data.";

    showError(message || "Failed to load attendance form data.");
  }, [employeeLookupError, metaError, showError]);

  const createRecordMutation = useMutation({
    mutationFn: createAttendanceRecord,
    onSuccess: (record) => {
      showSuccess("Attendance record created.");
      navigate(`/hr/attendance/${record.naming_series}`);
    },
    onError: (error) => {
      const message =
        error && typeof error === "object" && "response" in error && error.response
          ? (error.response as { data?: { error?: string; attendance_date?: string[] } }).data?.error ||
            (error.response as { data?: { error?: string; attendance_date?: string[] } }).data?.attendance_date?.[0]
          : "Failed to create attendance record.";
      showError(message || "Failed to create attendance record.");
    },
  });

  const checkInMutation = useMutation({
    mutationFn: ({ employee, attendanceDate }: { employee: number; attendanceDate: string }) =>
      attendanceCheckIn(employee, attendanceDate),
    onSuccess: (record) => {
      showSuccess("Check-in recorded.");
      navigate(`/hr/attendance/${record.naming_series}`);
    },
    onError: () => showError("Failed to record check-in."),
  });

  const checkOutMutation = useMutation({
    mutationFn: ({ employee, attendanceDate }: { employee: number; attendanceDate: string }) =>
      attendanceCheckOut(employee, attendanceDate),
    onSuccess: (record) => {
      showSuccess("Check-out recorded.");
      navigate(`/hr/attendance/${record.naming_series}`);
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
              New Attendance Record
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Register daily attendance, absence, or leave for an employee.
            </p>
          </div>
        </div>
      </header>

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
            />
          </FormField>
          <FormField label="Attendance Date" required>
            <TextInput
              type="date"
              value={formData.attendance_date}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, attendance_date: event.target.value }))
              }
            />
          </FormField>
          <FormField label="Status">
            <SelectInput
              value={formData.status}
              onChange={(event) => handleStatusChange(event.target.value as AttendanceStatus)}
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
              disabled={formData.status === "absent"}
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
              disabled={formData.status === "absent"}
            />
          </FormField>
        </div>

        <FormField label="Notes" className="mt-6">
          <TextAreaInput
            value={formData.notes}
            onChange={(event) => setFormData((prev) => ({ ...prev, notes: event.target.value }))}
            rows={4}
            placeholder="Optional shift note, explanation, or context"
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
            onClick={() => navigate("/hr/attendance")}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <X className="h-3.5 w-3.5" />
            Cancel
          </button>
          <button
            type="button"
            onClick={() =>
              checkInMutation.mutate({
                employee: formData.employee,
                attendanceDate: formData.attendance_date,
              })
            }
            disabled={checkInMutation.isPending || !formData.employee}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Clock3 className="h-3.5 w-3.5" />
            Check In
          </button>
          <button
            type="button"
            onClick={() =>
              checkOutMutation.mutate({
                employee: formData.employee,
                attendanceDate: formData.attendance_date,
              })
            }
            disabled={checkOutMutation.isPending || !formData.employee}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <TimerReset className="h-3.5 w-3.5" />
            Check Out
          </button>
          <button
            type="button"
            onClick={() => createRecordMutation.mutate(formData)}
            disabled={createRecordMutation.isPending || validationErrors.length > 0}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {createRecordMutation.isPending ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            {createRecordMutation.isPending ? "Saving..." : "Create Attendance"}
          </button>
        </div>
      </section>
    </div>
  );
};

export default AttendanceForm;

