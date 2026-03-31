import api from "./api";
import { Supplier } from "../types/types";

export interface SupplierFilters {
  search?: string;
  name?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  status?: string;
  is_active?: string;
}

export const fetchSuppliers = async (
  currentPage: number,
  pageSize: number,
  searchOrFilters: string | SupplierFilters = "",
) => {
  const filters =
    typeof searchOrFilters === "string"
      ? { search: searchOrFilters }
      : searchOrFilters;

  const params = new URLSearchParams({
    page: currentPage.toString(),
    page_size: pageSize.toString(),
  });
  if (filters.search) {
    params.append("search", filters.search);
  }
  if (filters.name) {
    params.append("name", filters.name);
  }
  if (filters.contact_person) {
    params.append("contact_person", filters.contact_person);
  }
  if (filters.phone) {
    params.append("phone", filters.phone);
  }
  if (filters.email) {
    params.append("email", filters.email);
  }
  if (filters.address) {
    params.append("address", filters.address);
  }
  if (filters.status) {
    params.append("status", filters.status);
  }
  if (filters.is_active) {
    params.append("is_active", filters.is_active);
  }
  const res = await api.get(
    `/api/inventory/medicines/supplier/?${params.toString()}`,
  );
  return res.data;
};

export const fetchSupplierById = async (id: string | number) => {
  const res = await api.get(`/api/inventory/medicines/supplier/${id}/`);
  return res.data;
};

export const fetchSupplierByNamingSeries = async (namingSeries: string) => {
  const res = await api.get(
    `/api/inventory/medicines/supplier/by-naming-series/${namingSeries}/`,
  );
  return res.data;
};

export const fetchSupplierLogs = async (id: string | number) => {
  const res = await api.get(`/api/inventory/medicines/supplier/${id}/logs/`);
  return res.data;
};

export const createSupplier = async (supplier: Partial<Supplier>) => {
  const res = await api.post(
    `/api/inventory/medicines/supplier/create/`,
    supplier,
  );
  return res.data;
};

export const updateSupplier = async (
  id: string | number,
  supplier: Partial<Supplier>,
) => {
  const res = await api.put(
    `/api/inventory/medicines/supplier/${id}/update/`,
    supplier,
  );
  return res.data;
};

export const cancelSupplier = async (id: string | number) => {
  const res = await api.post(`/api/inventory/medicines/supplier/${id}/cancel/`);
  return res.data;
};

export const deleteSupplier = async (id: string | number) => {
  const res = await api.delete(
    `/api/inventory/medicines/supplier/${id}/delete/`,
  );
  return res.data as { message?: string };
};
