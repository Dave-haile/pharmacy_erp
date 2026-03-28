import api from "./api";
import type {
  CreateSalesReturn,
  PaginatedResponse,
  SalesReturnDetail,
  SalesReturnSummary,
  Log,
} from "../types/types";

export const fetchSalesReturns = async (
  page = 1,
  pageSize = 10,
  filters?: { posting_number?: string; reference_invoice?: string; status?: string },
) => {
  const params = new URLSearchParams();
  params.append("page", String(page));
  params.append("page_size", String(pageSize));
  if (filters?.posting_number) params.append("posting_number", filters.posting_number);
  if (filters?.reference_invoice)
    params.append("reference_invoice", filters.reference_invoice);
  if (filters?.status) params.append("status", filters.status);
  const res = await api.get(`/api/inventory/sales-returns/?${params.toString()}`);
  return res.data as PaginatedResponse<SalesReturnSummary>;
};

export const fetchSalesReturnById = async (id: string | number) => {
  const res = await api.get(`/api/inventory/sales-returns/${id}/`);
  return res.data as SalesReturnDetail;
};

export const createSalesReturn = async (payload: CreateSalesReturn) => {
  const res = await api.post(`/api/inventory/sales-returns/create/`, payload);
  return res.data as { message?: string; sales_return: SalesReturnDetail };
};

export const updateSalesReturn = async (
  id: string | number,
  payload: CreateSalesReturn,
) => {
  const res = await api.put(`/api/inventory/sales-returns/${id}/update/`, payload);
  return res.data as { message?: string; sales_return: SalesReturnDetail };
};

export const submitSalesReturn = async (id: string | number) => {
  const res = await api.post(`/api/inventory/sales-returns/${id}/submit/`);
  return res.data as { message?: string; sales_return: SalesReturnDetail };
};

export const cancelSalesReturn = async (id: string | number) => {
  const res = await api.post(`/api/inventory/sales-returns/${id}/cancel/`);
  return res.data as { message?: string; sales_return: SalesReturnDetail };
};

export const fetchSalesReturnLogs = async (id: string | number) => {
  const res = await api.get(`/api/inventory/sales-returns/${id}/logs/`);
  return res.data as Log[];
};

