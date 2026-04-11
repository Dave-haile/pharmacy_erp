import api from "./api";
import {
  AttendanceMeta,
  AttendanceRecord,
  AttendanceRecordFilters,
  AttendanceRecordListResponse,
  AttendanceRecordPayload,
  Department,
  DepartmentFilters,
  DepartmentListResponse,
  DepartmentPayload,
  Designation,
  DesignationFilters,
  DesignationListResponse,
  DesignationPayload,
  Employee,
  EmployeeFilters,
  EmployeeFiltersMeta,
  EmployeeFormPayload,
  EmployeeListResponse,
  LeaveMeta,
  LeaveRequest,
  LeaveRequestFilters,
  LeaveRequestListResponse,
  LeaveRequestPayload,
  LeaveType,
  LeaveTypeListResponse,
  LeaveTypePayload,
} from "../types/hr";

const normalizeEmployeePayload = (
  payload: EmployeeFormPayload,
): EmployeeFormPayload => ({
  ...payload,
  gender: payload.gender === "female" ? "female" : "male",
});

const buildEmployeeFormData = (payload: EmployeeFormPayload): FormData => {
  const formData = new FormData();

  const appendValue = (
    key: string,
    value: string | number | boolean | File | null,
  ) => {
    if (value === null || value === "") return;
    if (value instanceof File) {
      formData.append(key, value);
      return;
    }
    if (typeof value === "boolean") {
      formData.append(key, value ? "true" : "false");
      return;
    }
    formData.append(key, String(value));
  };

  appendValue("first_name", payload.first_name);
  appendValue("middle_name", payload.middle_name);
  appendValue("last_name", payload.last_name);
  appendValue("work_email", payload.work_email);
  appendValue("personal_email", payload.personal_email);
  appendValue("phone", payload.phone);
  appendValue("alternate_phone", payload.alternate_phone);
  appendValue("department", payload.department);
  appendValue("designation", payload.designation);
  appendValue("system_user", payload.system_user);
  appendValue("employment_type", payload.employment_type);
  appendValue("status", payload.status);
  appendValue("gender", payload.gender);
  appendValue("date_of_birth", payload.date_of_birth);
  appendValue("hire_date", payload.hire_date);
  appendValue("confirmation_date", payload.confirmation_date);
  appendValue("salary", payload.salary);
  appendValue("manager_name", payload.manager_name);
  appendValue("emergency_contact_name", payload.emergency_contact_name);
  appendValue("emergency_contact_phone", payload.emergency_contact_phone);
  appendValue("address", payload.address);
  appendValue("notes", payload.notes);
  appendValue("profile_photo", payload.profile_photo);
  appendValue("is_active", payload.is_active);

  return formData;
};

export const fetchEmployees = async (
  currentPage: number,
  pageSize: number,
  filters: EmployeeFilters = {},
): Promise<EmployeeListResponse> => {
  const params = new URLSearchParams({
    page: currentPage.toString(),
    page_size: pageSize.toString(),
  });

  if (filters.search) params.append("search", filters.search);
  if (filters.department) params.append("department", filters.department);
  if (filters.designation) params.append("designation", filters.designation);
  if (filters.status) params.append("status", filters.status);
  if (filters.employment_type) {
    params.append("employment_type", filters.employment_type);
  }
  if (filters.include_inactive) {
    params.append("include_inactive", filters.include_inactive);
  }

  const res = await api.get(`/api/hr/employees/?${params.toString()}`);
  return res.data;
};

export const fetchEmployeeByNamingSeries = async (
  namingSeries: string,
): Promise<Employee> => {
  const res = await api.get(
    `/api/hr/employees/by-naming-series/${encodeURIComponent(namingSeries)}/`,
  );
  return res.data;
};

export const createEmployee = async (
  payload: EmployeeFormPayload,
): Promise<Employee> => {
  const normalizedPayload = normalizeEmployeePayload(payload);
  const res = await api.post(
    "/api/hr/employees/create/",
    buildEmployeeFormData(normalizedPayload),
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return res.data.employee;
};

export const updateEmployee = async (
  employeeId: number,
  payload: EmployeeFormPayload,
): Promise<Employee> => {
  const normalizedPayload = normalizeEmployeePayload(payload);
  const res = await api.put(
    `/api/hr/employees/${employeeId}/update/`,
    buildEmployeeFormData(normalizedPayload),
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return res.data.employee;
};

export const deleteEmployee = async (
  employeeId: number,
): Promise<{ message: string }> => {
  const res = await api.delete(`/api/hr/employees/${employeeId}/delete/`);
  return res.data;
};

export const fetchEmployeeFiltersMeta =
  async (): Promise<EmployeeFiltersMeta> => {
    const res = await api.get("/api/hr/employees/filters/");
    return res.data;
  };

export const fetchDepartments = async (
  currentPage: number,
  pageSize: number,
  filters: DepartmentFilters = {},
): Promise<DepartmentListResponse> => {
  const params = new URLSearchParams({
    page: currentPage.toString(),
    page_size: pageSize.toString(),
  });

  if (filters.search) params.append("search", filters.search);
  if (filters.include_inactive) {
    params.append("include_inactive", filters.include_inactive);
  }

  const res = await api.get(`/api/hr/departments/?${params.toString()}`);
  return res.data;
};

export const fetchDepartmentById = async (
  departmentId: number,
): Promise<Department> => {
  const res = await api.get(`/api/hr/departments/${departmentId}/`);
  return res.data;
};

export const createDepartment = async (
  payload: DepartmentPayload,
): Promise<Department> => {
  const res = await api.post("/api/hr/departments/create/", payload);
  return res.data.department;
};

export const updateDepartment = async (
  departmentId: number,
  payload: DepartmentPayload,
): Promise<Department> => {
  const res = await api.put(`/api/hr/departments/${departmentId}/update/`, payload);
  return res.data.department;
};

export const deleteDepartment = async (
  departmentId: number,
): Promise<{ message: string }> => {
  const res = await api.delete(`/api/hr/departments/${departmentId}/delete/`);
  return res.data;
};

export const fetchDesignations = async (
  currentPage: number,
  pageSize: number,
  filters: DesignationFilters = {},
): Promise<DesignationListResponse> => {
  const params = new URLSearchParams({
    page: currentPage.toString(),
    page_size: pageSize.toString(),
  });

  if (filters.search) params.append("search", filters.search);
  if (filters.include_inactive) {
    params.append("include_inactive", filters.include_inactive);
  }

  const res = await api.get(`/api/hr/designations/?${params.toString()}`);
  return res.data;
};

export const fetchDesignationById = async (
  designationId: number,
): Promise<Designation> => {
  const res = await api.get(`/api/hr/designations/${designationId}/`);
  return res.data;
};

export const createDesignation = async (
  payload: DesignationPayload,
): Promise<Designation> => {
  const res = await api.post("/api/hr/designations/create/", payload);
  return res.data.designation;
};

export const updateDesignation = async (
  designationId: number,
  payload: Partial<DesignationPayload>,
): Promise<Designation> => {
  const res = await api.put(`/api/hr/designations/${designationId}/update/`, payload);
  return res.data.designation;
};

export const deleteDesignation = async (
  designationId: number,
): Promise<{ message: string }> => {
  const res = await api.delete(`/api/hr/designations/${designationId}/delete/`);
  return res.data;
};

export const fetchLeaveMeta = async (): Promise<LeaveMeta> => {
  const res = await api.get("/api/hr/leave/meta/");
  return res.data;
};

export const fetchLeaveTypes = async (
  includeInactive = false,
): Promise<LeaveTypeListResponse> => {
  const params = new URLSearchParams();
  if (includeInactive) params.append("include_inactive", "true");
  const res = await api.get(`/api/hr/leave/types/?${params.toString()}`);
  return res.data;
};

export const createLeaveType = async (
  payload: LeaveTypePayload,
): Promise<LeaveType> => {
  const res = await api.post("/api/hr/leave/types/create/", payload);
  return res.data.leave_type;
};

export const updateLeaveType = async (
  leaveTypeId: number,
  payload: Partial<LeaveTypePayload>,
): Promise<LeaveType> => {
  const res = await api.patch(`/api/hr/leave/types/${leaveTypeId}/update/`, payload);
  return res.data.leave_type;
};

export const deleteLeaveType = async (
  leaveTypeId: number,
): Promise<{ message: string }> => {
  const res = await api.delete(`/api/hr/leave/types/${leaveTypeId}/delete/`);
  return res.data;
};

export const fetchLeaveRequests = async (
  currentPage: number,
  pageSize: number,
  filters: LeaveRequestFilters = {},
): Promise<LeaveRequestListResponse> => {
  const params = new URLSearchParams({
    page: currentPage.toString(),
    page_size: pageSize.toString(),
  });

  if (filters.search) params.append("search", filters.search);
  if (filters.status) params.append("status", filters.status);
  if (filters.employee) params.append("employee", filters.employee);
  if (filters.leave_type) params.append("leave_type", filters.leave_type);

  const res = await api.get(`/api/hr/leave/requests/?${params.toString()}`);
  return res.data;
};

export const createLeaveRequest = async (
  payload: LeaveRequestPayload,
): Promise<LeaveRequest> => {
  const res = await api.post("/api/hr/leave/requests/create/", payload);
  return res.data.leave_request;
};

export const updateLeaveRequest = async (
  leaveRequestId: number,
  payload: Partial<LeaveRequestPayload>,
): Promise<LeaveRequest> => {
  const res = await api.patch(`/api/hr/leave/requests/${leaveRequestId}/update/`, payload);
  return res.data.leave_request;
};

export const approveLeaveRequest = async (
  leaveRequestId: number,
  approval_note = "",
): Promise<LeaveRequest> => {
  const res = await api.post(`/api/hr/leave/requests/${leaveRequestId}/approve/`, {
    approval_note,
  });
  return res.data.leave_request;
};

export const rejectLeaveRequest = async (
  leaveRequestId: number,
  approval_note = "",
): Promise<LeaveRequest> => {
  const res = await api.post(`/api/hr/leave/requests/${leaveRequestId}/reject/`, {
    approval_note,
  });
  return res.data.leave_request;
};

export const cancelLeaveRequest = async (
  leaveRequestId: number,
  approval_note = "",
): Promise<LeaveRequest> => {
  const res = await api.post(`/api/hr/leave/requests/${leaveRequestId}/cancel/`, {
    approval_note,
  });
  return res.data.leave_request;
};

export const fetchAttendanceMeta = async (): Promise<AttendanceMeta> => {
  const res = await api.get("/api/hr/attendance/meta/");
  return res.data;
};

export const fetchAttendanceRecords = async (
  currentPage: number,
  pageSize: number,
  filters: AttendanceRecordFilters = {},
): Promise<AttendanceRecordListResponse> => {
  const params = new URLSearchParams({
    page: currentPage.toString(),
    page_size: pageSize.toString(),
  });

  if (filters.search) params.append("search", filters.search);
  if (filters.status) params.append("status", filters.status);
  if (filters.employee) params.append("employee", filters.employee);
  if (filters.date_from) params.append("date_from", filters.date_from);
  if (filters.date_to) params.append("date_to", filters.date_to);

  const res = await api.get(`/api/hr/attendance/records/?${params.toString()}`);
  return res.data;
};

export const fetchAttendanceRecordByNamingSeries = async (
  namingSeries: string,
): Promise<AttendanceRecord> => {
  const res = await api.get(
    `/api/hr/attendance/records/by-naming-series/${encodeURIComponent(namingSeries)}/`,
  );
  return res.data;
};

export const createAttendanceRecord = async (
  payload: AttendanceRecordPayload,
): Promise<AttendanceRecord> => {
  const res = await api.post("/api/hr/attendance/records/create/", payload);
  return res.data.attendance_record;
};

export const updateAttendanceRecord = async (
  namingSeries: string,
  payload: Partial<AttendanceRecordPayload>,
): Promise<AttendanceRecord> => {
  const res = await api.patch(
    `/api/hr/attendance/records/by-naming-series/${encodeURIComponent(namingSeries)}/update/`,
    payload,
  );
  return res.data.attendance_record;
};

export const attendanceCheckIn = async (
  employee: number,
  attendance_date: string,
): Promise<AttendanceRecord> => {
  const res = await api.post("/api/hr/attendance/check-in/", {
    employee,
    attendance_date,
  });
  return res.data.attendance_record;
};

export const attendanceCheckOut = async (
  employee: number,
  attendance_date: string,
): Promise<AttendanceRecord> => {
  const res = await api.post("/api/hr/attendance/check-out/", {
    employee,
    attendance_date,
  });
  return res.data.attendance_record;
};



