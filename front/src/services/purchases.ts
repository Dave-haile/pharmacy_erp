import api from "./api";
import type { PaginatedResponse, PurchaseDetail, PurchaseSummary } from "../types/types";

export const fetchPurchases = async (
  page = 1,
  pageSize = 10,
  filters?: { supplier?: string; status?: string },
) => {
  const params = new URLSearchParams();
  params.append("page", String(page));
  params.append("page_size", String(pageSize));
  if (filters?.supplier) params.append("supplier", filters.supplier);
  if (filters?.status) params.append("status", filters.status);
  const res = await api.get(`/api/inventory/purchases/?${params.toString()}`);
  return res.data as PaginatedResponse<PurchaseSummary>;
};

export const fetchPurchaseById = async (id: string | number) => {
  const res = await api.get(`/api/inventory/purchases/${id}/`);
  return res.data as PurchaseDetail;
};

