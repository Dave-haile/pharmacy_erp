import api from "./api";
import type {
  CreateSupplierReturn,
  PaginatedResponse,
  SupplierReturnDetail,
  SupplierReturnSummary,
  Log,
} from "../types/types";

export const fetchSupplierReturns = async (
  page = 1,
  pageSize = 10,
  filters?: { posting_number?: string; supplier?: string; status?: string },
) => {
  const params = new URLSearchParams();
  params.append("page", String(page));
  params.append("page_size", String(pageSize));
  if (filters?.posting_number) params.append("posting_number", filters.posting_number);
  if (filters?.supplier) params.append("supplier", filters.supplier);
  if (filters?.status) params.append("status", filters.status);
  const res = await api.get(`/api/inventory/supplier-returns/?${params.toString()}`);
  return res.data as PaginatedResponse<SupplierReturnSummary>;
};

export const fetchSupplierReturnById = async (id: string | number) => {
  const res = await api.get(`/api/inventory/supplier-returns/${id}/`);
  return res.data as SupplierReturnDetail;
};

export const createSupplierReturn = async (payload: CreateSupplierReturn) => {
  const res = await api.post(`/api/inventory/supplier-returns/create/`, payload);
  return res.data as { message?: string; supplier_return: SupplierReturnDetail };
};

export const updateSupplierReturn = async (
  id: string | number,
  payload: CreateSupplierReturn,
) => {
  const res = await api.put(
    `/api/inventory/supplier-returns/${id}/update/`,
    payload,
  );
  return res.data as { message?: string; supplier_return: SupplierReturnDetail };
};

export const submitSupplierReturn = async (id: string | number) => {
  const res = await api.post(`/api/inventory/supplier-returns/${id}/submit/`);
  return res.data as { message?: string; supplier_return: SupplierReturnDetail };
};

export const cancelSupplierReturn = async (id: string | number) => {
  const res = await api.post(`/api/inventory/supplier-returns/${id}/cancel/`);
  return res.data as { message?: string; supplier_return: SupplierReturnDetail };
};

export const fetchSupplierReturnLogs = async (id: string | number) => {
  const res = await api.get(`/api/inventory/supplier-returns/${id}/logs/`);
  return res.data as Log[];
};

