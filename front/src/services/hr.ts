import api from "./api";
import {
  Department,
  DepartmentFilters,
  DepartmentListResponse,
  DepartmentPayload,
  Employee,
  EmployeeFilters,
  EmployeeFiltersMeta,
  EmployeeFormPayload,
  EmployeeListResponse,
} from "../types/hr";

const normalizeEmployeePayload = (
  payload: EmployeeFormPayload,
): EmployeeFormPayload => ({
  ...payload,
  gender: payload.gender === "female" ? "female" : "male",
});

const buildEmployeeFormData = (payload: EmployeeFormPayload): FormData => {
  const formData = new FormData();

  const appendValue = (key: string, value: string | boolean | File | null) => {
    if (value === null || value === "") return;
    if (typeof value === "boolean") {
      formData.append(key, value ? "true" : "false");
      return;
    }
    formData.append(key, value);
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
