import api from "./api";

export const fetchNearExpiryReport = async (days = 30) => {
  const res = await api.get(`/api/inventory/reports/near-expiry/?days=${days}`);
  return res.data as {
    days: number;
    count: number;
    results: Array<{
      batch_id: number;
      batch_number: string;
      medicine_id: number | null;
      medicine_name: string;
      category: string;
      supplier: string;
      quantity: number;
      expiry_date: string;
      days_to_expiry: number;
      unit_cost: string;
    }>;
  };
};

export const fetchValuationReport = async () => {
  const res = await api.get(`/api/inventory/reports/valuation/`);
  return res.data as {
    count: number;
    total_value: string;
    results: Array<{
      medicine_id: number;
      medicine_name: string;
      category: string;
      quantity: number;
      value: string;
    }>;
  };
};

export const fetchSalesSummaryReport = async (filters?: {
  start_date?: string;
  end_date?: string;
}) => {
  const params = new URLSearchParams();
  if (filters?.start_date) params.append("start_date", filters.start_date);
  if (filters?.end_date) params.append("end_date", filters.end_date);
  const suffix = params.toString() ? `?${params.toString()}` : "";
  const res = await api.get(`/api/inventory/reports/sales-summary/${suffix}`);
  return res.data as {
    start_date: string | null;
    end_date: string | null;
    total_sales: string;
    sale_count: number;
    top_items: Array<{
      medicine_id: number;
      medicine_name: string;
      quantity: number;
      revenue: string;
    }>;
  };
};

export interface InventoryStatusItem {
  id: number;
  batch_id: number;
  batch_number: string;
  medicine_id: number;
  medicine_name: string;
  generic_name: string;
  category: string;
  supplier: string;
  quantity: number;
  unit_cost: string;
  selling_price: string;
  expiry_date: string;
  status: string;
  status_key: string;
  days_to_expiry: number;
  is_expired: boolean;
  is_expiring_soon: boolean;
  is_low_stock: boolean;
}

export interface InventoryStatusSummary {
  total_items: number;
  total_medicines: number;
  total_quantity: number;
  total_valuation: string;
  in_stock_count: number;
  low_stock_count: number;
  expiring_soon_count: number;
  expired_count: number;
  out_of_stock_count: number;
  expiry_soon_days: number;
  low_stock_threshold: number;
}

export interface InventoryStatusResponse {
  generated_at: string;
  summary: InventoryStatusSummary;
  stock_distribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  category_valuation: Array<{
    name: string;
    value: string;
    quantity: number;
    item_count: number;
  }>;
  items: InventoryStatusItem[];
  pagination: {
    page: number;
    page_size: number;
    total_count: number;
    total_pages: number;
  };
  filters: {
    categories: string[];
    statuses: string[];
  };
}

export const fetchInventoryStatusReport = async (filters?: {
  page?: number;
  page_size?: number;
  search?: string;
  category?: string;
  status?: string;
  expiry_soon_days?: number;
  low_stock_threshold?: number;
}) => {
  const params = new URLSearchParams();
  if (filters?.page) params.append("page", String(filters.page));
  if (filters?.page_size) params.append("page_size", String(filters.page_size));
  if (filters?.search) params.append("search", filters.search);
  if (filters?.category) params.append("category", filters.category);
  if (filters?.status) params.append("status", filters.status);
  if (filters?.expiry_soon_days)
    params.append("expiry_soon_days", String(filters.expiry_soon_days));
  if (filters?.low_stock_threshold)
    params.append("low_stock_threshold", String(filters.low_stock_threshold));

  const suffix = params.toString() ? `?${params.toString()}` : "";
  const res = await api.get(`/api/inventory/reports/status/${suffix}`);
  return res.data as InventoryStatusResponse;
};

