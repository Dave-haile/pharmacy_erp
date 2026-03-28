import api from "./api";
import type {
  CreateStockAdjustment,
  PaginatedResponse,
  StockAdjustmentDetail,
  StockAdjustmentSummary,
  Log,
} from "../types/types";

export const fetchStockAdjustments = async (
  page = 1,
  pageSize = 10,
  filters?: { posting_number?: string; status?: string; reason?: string },
) => {
  const params = new URLSearchParams();
  params.append("page", String(page));
  params.append("page_size", String(pageSize));
  if (filters?.posting_number) params.append("posting_number", filters.posting_number);
  if (filters?.status) params.append("status", filters.status);
  if (filters?.reason) params.append("reason", filters.reason);
  const res = await api.get(`/api/inventory/stock-adjustments/?${params.toString()}`);
  return res.data as PaginatedResponse<StockAdjustmentSummary>;
};

export const fetchStockAdjustmentById = async (id: string | number) => {
  const res = await api.get(`/api/inventory/stock-adjustments/${id}/`);
  return res.data as StockAdjustmentDetail;
};

export const createStockAdjustment = async (payload: CreateStockAdjustment) => {
  const res = await api.post(`/api/inventory/stock-adjustments/create/`, payload);
  return res.data as { message?: string; adjustment: StockAdjustmentDetail };
};

export const updateStockAdjustment = async (
  id: string | number,
  payload: CreateStockAdjustment,
) => {
  const res = await api.put(
    `/api/inventory/stock-adjustments/${id}/update/`,
    payload,
  );
  return res.data as { message?: string; adjustment: StockAdjustmentDetail };
};

export const submitStockAdjustment = async (id: string | number) => {
  const res = await api.post(`/api/inventory/stock-adjustments/${id}/submit/`);
  return res.data as { message?: string; adjustment: StockAdjustmentDetail };
};

export const cancelStockAdjustment = async (id: string | number) => {
  const res = await api.post(`/api/inventory/stock-adjustments/${id}/cancel/`);
  return res.data as { message?: string; adjustment: StockAdjustmentDetail };
};

export const fetchStockAdjustmentLogs = async (id: string | number) => {
  const res = await api.get(`/api/inventory/stock-adjustments/${id}/logs/`);
  return res.data as Log[];
};

