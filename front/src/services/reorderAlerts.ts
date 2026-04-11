import api from "./api";

export interface ReorderAlert {
  id: number;
  medicine: number;
  medicine_name: string;
  medicine_barcode: string;
  current_stock: string;
  reorder_level: string;
  shortage_quantity: string;
  suggested_order_quantity: string;
  status: string;
  status_label: string;
  priority: string;
  priority_label: string;
  notes: string;
  triggered_at: string;
  acknowledged_at: string | null;
  acknowledged_by: number | null;
  acknowledged_by_name: string | null;
}

export interface ReorderConfig {
  id: number;
  medicine: number;
  medicine_name: string;
  reorder_level: string;
  safety_stock: string;
  reorder_quantity: string;
  lead_time_days: number;
  is_active: boolean;
  last_updated: string;
}

export interface ReorderAlertListResponse {
  count: number;
  results: ReorderAlert[];
}

export interface ReorderConfigListResponse {
  count: number;
  results: ReorderConfig[];
}

export const fetchReorderAlerts = async (filters?: {
  status?: string;
  priority?: string;
}) => {
  const params = new URLSearchParams();
  if (filters?.status) params.append("status", filters.status);
  if (filters?.priority) params.append("priority", filters.priority);
  const suffix = params.toString() ? `?${params.toString()}` : "";
  const res = await api.get(`/api/inventory/reorder-alerts/${suffix}`);
  return res.data as ReorderAlertListResponse;
};

export const acknowledgeReorderAlert = async (id: number, notes?: string) => {
  const res = await api.post(`/api/inventory/reorder-alerts/${id}/acknowledge/`, {
    notes,
  });
  return res.data as { message: string };
};

export const resolveReorderAlert = async (id: number, notes?: string) => {
  const res = await api.post(`/api/inventory/reorder-alerts/${id}/resolve/`, {
    notes,
  });
  return res.data as { message: string };
};

export const fetchReorderConfigs = async () => {
  const res = await api.get("/api/inventory/reorder-configs/");
  return res.data as ReorderConfigListResponse;
};

export const createReorderConfig = async (data: {
  medicine_id: number;
  reorder_level?: number;
  safety_stock?: number;
  reorder_quantity?: number;
  lead_time_days?: number;
  is_active?: boolean;
}) => {
  const res = await api.post("/api/inventory/reorder-configs/create/", data);
  return res.data as { id: number; medicine_id: number; message: string };
};