import {
  BatchDetail,
  InventoryOverviewResponse,
} from "../types/types";
import api from "./api";

export const fetchInventoryOverview = async (filters?: {
  batch?: string;
  medicine?: string;
  sku?: string;
  status?: string;
}) => {
  const params = new URLSearchParams();

  if (filters?.batch) {
    params.append("batch", filters.batch);
  }
  if (filters?.medicine) {
    params.append("medicine", filters.medicine);
  }
  if (filters?.sku) {
    params.append("sku", filters.sku);
  }
  if (filters?.status) {
    params.append("status", filters.status);
  }

  const suffix = params.toString() ? `?${params.toString()}` : "";
  const res = await api.get(`/api/inventory/${suffix}`);
  return res.data as InventoryOverviewResponse;
};

export const fetchBatchDetail = async (batchId: string | number) => {
  const res = await api.get(`/api/inventory/batches/${batchId}/`);
  return res.data as BatchDetail;
};
