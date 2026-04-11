import api from "./api";

export interface ExpiryNotification {
  id: number;
  batch: number;
  batch_number: string;
  medicine: number;
  medicine_name: string;
  expiry_date: string;
  days_to_expiry: number;
  quantity_at_risk: string;
  total_value_at_risk: string | null;
  status: string;
  status_label: string;
  priority: string;
  priority_label: string;
  is_expired: boolean;
  is_critical: boolean;
  notification_type: string;
  notes: string;
  action_taken: string;
  notified_at: string;
  acknowledged_at: string | null;
  actioned_at: string | null;
}

export interface ExpiryConfig {
  id: number;
  name: string;
  warning_days: number;
  critical_days: number;
  notification_frequency_days: number;
  auto_dispose_expired: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExpiryNotificationListResponse {
  count: number;
  results: ExpiryNotification[];
}

export const fetchExpiryNotifications = async (filters?: {
  status?: string;
  priority?: string;
}) => {
  const params = new URLSearchParams();
  if (filters?.status) params.append("status", filters.status);
  if (filters?.priority) params.append("priority", filters.priority);
  const suffix = params.toString() ? `?${params.toString()}` : "";
  const res = await api.get(`/api/inventory/expiry-notifications/${suffix}`);
  return res.data as ExpiryNotificationListResponse;
};

export const acknowledgeExpiryNotification = async (
  id: number,
  notes?: string
) => {
  const res = await api.post(
    `/api/inventory/expiry-notifications/${id}/acknowledge/`,
    { notes }
  );
  return res.data as { message: string };
};

export const actionExpiryNotification = async (
  id: number,
  actionTaken: string,
  notes?: string
) => {
  const res = await api.post(
    `/api/inventory/expiry-notifications/${id}/action/`,
    { action_taken: actionTaken, notes }
  );
  return res.data as { message: string };
};

export const fetchExpiryConfig = async () => {
  const res = await api.get("/api/inventory/expiry-config/");
  return res.data as ExpiryConfig;
};

export const updateExpiryConfig = async (data: {
  warning_days?: number;
  critical_days?: number;
  notification_frequency_days?: number;
  auto_dispose_expired?: boolean;
}) => {
  const res = await api.post("/api/inventory/expiry-config/update/", data);
  return res.data as { message: string };
};