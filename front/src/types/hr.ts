import { PaginatedResponse } from "./types";

export type EmployeeStatus =
  | "active"
  | "on_leave"
  | "suspended"
  | "terminated"
  | "resigned";

export type EmploymentType = "full_time" | "part_time" | "contract" | "intern";

export type Gender = "male" | "female";

export type LeaveRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled";

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
  department_id: number;
  designation: string;
  designation_id: number | null;
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
  system_user: number | null;
  user_email?: string;
  user_full_name?: string;
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
  system_user: number | null;
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

export interface Designation {
  id: number;
  name: string;
  department: string | null;
  department_id: number | null;
  description: string;
  is_active: boolean;
  employee_count: number;
  created_at: string;
  updated_at: string;
}

export interface DesignationFilters {
  search?: string;
  include_inactive?: string;
}

export interface DesignationPayload {
  name: string;
  department: string | null;
  description: string;
  is_active: boolean;
}

export type DesignationListResponse = PaginatedResponse<Designation>;

export interface LeaveType {
  id: number;
  name: string;
  code: string;
  description: string;
  default_days: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LeaveTypePayload {
  name: string;
  code: string;
  description: string;
  default_days: number;
  is_active: boolean;
}

export interface LeaveTypeListResponse {
  results: LeaveType[];
  count: number;
}

export interface LeaveRequest {
  id: number;
  employee: number;
  employee_name: string;
  employee_code: string;
  employee_department: string;
  leave_type: number;
  leave_type_name: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: LeaveRequestStatus;
  status_label: string;
  approval_note: string;
  approved_by: number | null;
  approved_by_name?: string;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeaveRequestPayload {
  employee: number;
  leave_type: number;
  start_date: string;
  end_date: string;
  reason: string;
}

export interface LeaveRequestFilters {
  search?: string;
  status?: LeaveRequestStatus | "";
  employee?: string;
  leave_type?: string;
}

export type LeaveRequestListResponse = PaginatedResponse<LeaveRequest>;

export interface LeaveMetaEmployee {
  id: number;
  naming_series: string;
  full_name: string;
  department: string;
}

export interface LeaveMeta {
  employees: LeaveMetaEmployee[];
  leave_types: LeaveType[];
  statuses: Array<{ value: LeaveRequestStatus; label: string }>;
}

export type AttendanceStatus = "present" | "absent" | "on_leave";

export interface AttendanceRecord {
  id: number;
  naming_series: string;
  employee: number;
  employee_name: string;
  employee_code: string;
  employee_department: string;
  attendance_date: string;
  status: AttendanceStatus;
  status_label: string;
  check_in_time: string | null;
  check_out_time: string | null;
  notes: string;
  marked_by: number | null;
  marked_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface AttendanceRecordPayload {
  employee: number;
  attendance_date: string;
  status: AttendanceStatus;
  check_in_time?: string | null;
  check_out_time?: string | null;
  notes: string;
}

export interface AttendanceRecordFilters {
  search?: string;
  status?: AttendanceStatus | "";
  employee?: string;
  date_from?: string;
  date_to?: string;
}

export type AttendanceRecordListResponse = PaginatedResponse<AttendanceRecord>;

export interface AttendanceMeta {
  employees: LeaveMetaEmployee[];
  statuses: Array<{ value: AttendanceStatus; label: string }>;
}
