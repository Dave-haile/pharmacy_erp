import api from "./api";

export interface StockTakeItem {
  id: number;
  stock_take: number;
  medicine: number;
  medicine_name: string;
  medicine_generic_name?: string;
  medicine_barcode: string;
  batch: number | null;
  batch_number: string | null;
  system_quantity: string;
  counted_quantity: string;
  variance: string;
  variance_percentage: number;
  variance_status: string;
  unit_cost: string | null;
  unit_cost_display: string | null;
  notes: string;
  counted_by: number | null;
  counted_by_name: string | null;
  counted_at: string | null;
  created_at: string;
}

export interface StockTake {
  id: number;
  posting_number: string;
  title: string;
  status: string;
  status_label: string;
  notes: string;
  started_at: string | null;
  completed_at: string | null;
  created_by: number | null;
  created_by_name: string | null;
  totals: {
    total_items: number;
    matched_items: number;
    positive_variance_items: number;
    negative_variance_items: number;
    total_variance_value: number;
    accuracy_rate: number;
  };
  item_count: number;
  created_at: string;
  updated_at: string;
}

export interface StockTakeListResponse {
  count: number;
  results: StockTake[];
}

export interface StockTakeItemsPage {
  count: number;
  current_page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface StockTakeDetailResponse extends StockTake, StockTakeItemsPage {
  items: StockTakeItem[];
}

export const fetchStockTakes = async (filters?: {
  status?: string;
}) => {
  const params = new URLSearchParams();
  if (filters?.status) params.append("status", filters.status);
  const suffix = params.toString() ? `?${params.toString()}` : "";
  const res = await api.get(`/api/inventory/stock-takes/${suffix}`);
  return res.data as StockTakeListResponse;
};

export const fetchStockTake = async (
  id: number,
  params?: {
    page?: number;
    page_size?: number;
    item?: string;
    generic_name?: string;
    status?: string;
  }
) => {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append("page", String(params.page));
  if (params?.page_size) {
    searchParams.append("page_size", String(params.page_size));
  }
  if (params?.item) searchParams.append("item", params.item);
  if (params?.generic_name) {
    searchParams.append("generic_name", params.generic_name);
  }
  if (params?.status) searchParams.append("status", params.status);
  const suffix = searchParams.toString() ? `?${searchParams.toString()}` : "";
  const res = await api.get(`/api/inventory/stock-takes/${id}/${suffix}`);
  return res.data as StockTakeDetailResponse;
};

export const createStockTake = async (data: {
  title: string;
  notes?: string;
}) => {
  const res = await api.post("/api/inventory/stock-takes/create/", data);
  return res.data as { id: number; posting_number: string; message: string };
};

export const startStockTake = async (id: number) => {
  const res = await api.post(`/api/inventory/stock-takes/${id}/start/`);
  return res.data as { message: string; items_created: number; status: string };
};

export const countStockTakeItem = async (
  stockTakeId: number,
  itemId: number,
  data: { counted_quantity: string; notes?: string }
) => {
  const res = await api.post(
    `/api/inventory/stock-takes/${stockTakeId}/items/${itemId}/count/`,
    data
  );
  return res.data as { id: number; counted_quantity: string; variance: string; message: string };
};

export const completeStockTake = async (
  id: number,
  data: { apply_adjustments?: boolean; adjustment_reason?: string }
) => {
  const res = await api.post(`/api/inventory/stock-takes/${id}/complete/`, data);
  return res.data as { message: string; adjustments_made: number };
};

export const cancelStockTake = async (id: number) => {
  const res = await api.post(`/api/inventory/stock-takes/${id}/cancel/`);
  return res.data as { message: string };
};
