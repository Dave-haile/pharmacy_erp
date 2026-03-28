import api from "./api";
import type { GrnDetail, GrnSummary, PaginatedResponse } from "../types/types";

export const fetchGrns = async (
  page = 1,
  pageSize = 10,
  filters?: { invoice_number?: string; supplier?: string },
) => {
  const params = new URLSearchParams();
  params.append("page", String(page));
  params.append("page_size", String(pageSize));
  if (filters?.invoice_number) params.append("invoice_number", filters.invoice_number);
  if (filters?.supplier) params.append("supplier", filters.supplier);
  const res = await api.get(`/api/inventory/grn/?${params.toString()}`);
  return res.data as PaginatedResponse<GrnSummary>;
};

export const fetchGrnById = async (id: string | number) => {
  const res = await api.get(`/api/inventory/grn/${id}/`);
  return res.data as GrnDetail;
};

