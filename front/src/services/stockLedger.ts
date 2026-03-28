import api from "./api";
import type { StockLedgerListResponse } from "../types/types";

export const fetchStockLedger = async (filters?: {
  page?: number;
  page_size?: number;
  start_date?: string;
  end_date?: string;
  medicine_id?: number | string;
  batch_id?: number | string;
  transaction_type?: string;
  reference?: string;
  q?: string;
}) => {
  const params = new URLSearchParams();

  if (filters?.page) params.append("page", String(filters.page));
  if (filters?.page_size) params.append("page_size", String(filters.page_size));
  if (filters?.start_date) params.append("start_date", filters.start_date);
  if (filters?.end_date) params.append("end_date", filters.end_date);
  if (filters?.medicine_id) params.append("medicine_id", String(filters.medicine_id));
  if (filters?.batch_id) params.append("batch_id", String(filters.batch_id));
  if (filters?.transaction_type)
    params.append("transaction_type", filters.transaction_type);
  if (filters?.reference) params.append("reference", filters.reference);
  if (filters?.q) params.append("q", filters.q);

  const suffix = params.toString() ? `?${params.toString()}` : "";
  const res = await api.get(`/api/inventory/stock-ledger/${suffix}`);
  return res.data as StockLedgerListResponse;
};

