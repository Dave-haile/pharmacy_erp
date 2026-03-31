import api from "./api";

export interface InventoryHubSummaryResponse {
  generated_at: string;
  category_stock_levels: Array<{
    category: string;
    stock: number;
  }>;
  inventory_value_trend: Array<{
    month: string;
    month_start: string;
    value: string;
  }>;
  stock_distribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  summary: {
    total_batches: number;
    total_medicines: number;
    total_quantity: number;
    expiring_soon_count: number;
    expired_count: number;
    fifo_candidate_count: number;
    expiry_soon_days: number;
    low_stock_threshold: number;
    total_value: string;
  };
}

export const fetchInventoryHubSummary = async (filters?: {
  expiry_soon_days?: number;
  low_stock_threshold?: number;
}) => {
  const params = new URLSearchParams();
  if (filters?.expiry_soon_days) {
    params.append("expiry_soon_days", String(filters.expiry_soon_days));
  }
  if (filters?.low_stock_threshold) {
    params.append("low_stock_threshold", String(filters.low_stock_threshold));
  }

  const suffix = params.toString() ? `?${params.toString()}` : "";
  const res = await api.get(`/api/inventory/hub/summary/${suffix}`);
  return res.data as InventoryHubSummaryResponse;
};
