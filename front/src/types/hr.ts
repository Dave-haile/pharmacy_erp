import { PaginatedResponse } from "./types";

export type EmployeeStatus =
  | "active"
  | "on_leave"
  | "suspended"
  | "terminated"
  | "resigned";

export type EmploymentType = "full_time" | "part_time" | "contract" | "intern";

export type Gender = "male" | "female";

export interface Employee {
  id: number;
  naming_series: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  full_name: string;
  work_email: string;
  personal_email: string;
  phone: string;
  alternate_phone: string;
  department: string;
  designation: string;
  employment_type: EmploymentType;
  employment_type_label: string;
  status: EmployeeStatus;
  status_label: string;
  gender: Gender;
  gender_label: string;
  date_of_birth: string | null;
  hire_date: string;
  confirmation_date: string | null;
  salary: string;
  manager_name: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  address: string;
  notes: string;
  profile_photo_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmployeeFilters {
  search?: string;
  department?: string;
  designation?: string;
  status?: EmployeeStatus | "";
  employment_type?: EmploymentType | "";
  include_inactive?: string;
}

export interface EmployeeFormPayload {
  first_name: string;
  middle_name: string;
  last_name: string;
  work_email: string;
  personal_email: string;
  phone: string;
  alternate_phone: string;
  department: string;
  designation: string;
  employment_type: EmploymentType;
  status: EmployeeStatus;
  gender: Gender;
  date_of_birth: string | null;
  hire_date: string;
  confirmation_date: string | null;
  salary: string;
  manager_name: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  address: string;
  notes: string;
  profile_photo: File | null;
  is_active: boolean;
}

export interface EmployeeFiltersMeta {
  departments: string[];
  designations: string[];
  statuses: Array<{ value: EmployeeStatus; label: string }>;
  employment_types: Array<{ value: EmploymentType; label: string }>;
  genders: Array<{ value: Gender; label: string }>;
}

export type EmployeeListResponse = PaginatedResponse<Employee>;

export interface Department {
  id: number;
  name: string;
  description: string;
  manager_name: string;
  is_active: boolean;
  employee_count: number;
  created_at: string;
  updated_at: string;
}

export interface DepartmentFilters {
  search?: string;
  include_inactive?: string;
}

export interface DepartmentPayload {
  name: string;
  description: string;
  manager_name: string;
  is_active: boolean;
}

export type DepartmentListResponse = PaginatedResponse<Department>;
