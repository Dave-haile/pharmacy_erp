import api from "./api";
import {
  CreateManagedUserPayload,
  ManagedUser,
  PaginatedResponse,
  ResetManagedUserPasswordPayload,
  UpdateManagedUserPayload,
  UserFilters,
} from "../types/types";

export const fetchUsers = async (
  currentPage: number,
  pageSize: number,
  filters: UserFilters = {},
): Promise<PaginatedResponse<ManagedUser>> => {
  const params = new URLSearchParams({
    page: currentPage.toString(),
    page_size: pageSize.toString(),
  });

  if (filters.email) params.append("email", filters.email);
  if (filters.name) params.append("name", filters.name);
  if (filters.role) params.append("role", filters.role);
  if (filters.is_active) params.append("is_active", filters.is_active);

  const res = await api.get(`/api/users/?${params.toString()}`);
  return res.data;
};

export const fetchUserByEmail = async (email: string): Promise<ManagedUser> => {
  const res = await api.get(
    `/api/users/by-email/${encodeURIComponent(email)}/`,
  );
  return res.data;
};

export const createUser = async (
  payload: CreateManagedUserPayload,
): Promise<ManagedUser> => {
  const res = await api.post("/api/users/", payload);
  return res.data;
};

export const updateUser = async (
  userId: number,
  payload: UpdateManagedUserPayload,
): Promise<ManagedUser> => {
  const res = await api.patch(`/api/users/${userId}/`, payload);
  return res.data;
};

export const resetUserPassword = async (
  userId: number,
  payload: ResetManagedUserPasswordPayload,
): Promise<{ message: string }> => {
  const res = await api.post(`/api/users/${userId}/reset-password/`, payload);
  return res.data;
};
