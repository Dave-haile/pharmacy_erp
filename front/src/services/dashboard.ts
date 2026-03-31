import api from "./api";

export interface DashboardKpis {
  today_sales: string;
  today_sales_count: number;
  today_sales_trend: string;
  total_products: number;
  total_products_trend: string;
  low_stock_count: number;
  low_stock_trend: string;
  total_suppliers: number;
  total_suppliers_trend: string;
  inventory_value: string;
  inventory_units: number;
  expiring_soon_count: number;
  total_sales: string;
}

export interface DashboardChartPoint {
  label: string;
  sales?: string;
  income?: string;
  date?: string;
  hour?: number;
  month?: string;
  month_start?: string;
  sales_count?: number;
}

export interface DashboardTopProduct {
  medicine_id: number;
  name: string;
  value: string;
  quantity: number;
  color: string;
}

export interface DashboardActivityItem {
  id: number;
  timestamp: string;
  time: string;
  type: "success" | "warning" | "info";
  action: string;
  message: string;
  user: string;
}

export interface DashboardAlertItem {
  id: number;
  batch_id: number;
  batch_number: string;
  medicine_id: number;
  medicine_name: string;
  naming_series: string | null;
  quantity: number;
  status_key: "in_stock" | "low_stock" | "expiring_soon" | "expired";
  days_to_expiry: number;
}

export interface DashboardResponse {
  generated_at: string;
  kpis: DashboardKpis;
  charts: {
    weekly_sales: DashboardChartPoint[];
    daily_sales: DashboardChartPoint[];
    monthly_revenue: DashboardChartPoint[];
  };
  top_products: DashboardTopProduct[];
  recent_activity: DashboardActivityItem[];
  alerts: DashboardAlertItem[];
  inventory_summary: {
    total_batches: number;
    total_medicines: number;
    total_quantity: number;
    expiring_soon_count: number;
    expired_count: number;
    fifo_candidate_count: number;
    expiry_soon_days: number;
    low_stock_threshold: number;
  };
  inventory_status: {
    in_stock: number;
    low_stock: number;
    expiring_soon: number;
    expired: number;
  };
}

export const fetchDashboard = async (filters?: {
  expiry_soon_days?: number;
  low_stock_threshold?: number;
  refresh?: boolean;
}) => {
  const params = new URLSearchParams();
  if (filters?.expiry_soon_days) {
    params.append("expiry_soon_days", String(filters.expiry_soon_days));
  }
  if (filters?.low_stock_threshold) {
    params.append("low_stock_threshold", String(filters.low_stock_threshold));
  }
  if (filters?.refresh) {
    params.append("refresh", "1");
    params.append("_ts", String(Date.now()));
  }

  const suffix = params.toString() ? `?${params.toString()}` : "";
  const res = await api.get(`/api/inventory/dashboard/stats/${suffix}`);
  return res.data as DashboardResponse;
};
