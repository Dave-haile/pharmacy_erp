import api from "./api";
import type { Log, PaginatedResponse } from "../types/types";

export const fetchAuditLogs = async (filters?: {
  page?: number;
  page_size?: number;
  q?: string;
  action?: string;
  user?: string;
}) => {
  const params = new URLSearchParams();
  if (filters?.page) params.append("page", String(filters.page));
  if (filters?.page_size) params.append("page_size", String(filters.page_size));
  if (filters?.q) params.append("q", filters.q);
  if (filters?.action) params.append("action", filters.action);
  if (filters?.user) params.append("user", filters.user);

  const suffix = params.toString() ? `?${params.toString()}` : "";
  const res = await api.get(`/api/inventory/audit-logs/${suffix}`);
  return res.data as PaginatedResponse<Log>;
};

