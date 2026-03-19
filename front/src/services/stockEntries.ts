import { CreateStockEntry } from "../types/types";
import api from "./api";

export const createStockEntry = async (payload: CreateStockEntry) => {
  const res = await api.post("/api/inventory/stock-entries/create/", payload);
  return res.data;
};

export const fetchStockEntries = async (
  currentPage: number,
  pageSize: number,
  filters: {
    posting_number: string;
    invoice_number: string;
    supplier: string;
    status: string;
  },
) => {
  const params = new URLSearchParams({
    page: currentPage.toString(),
    page_size: pageSize.toString(),
  });

  if (filters.posting_number) {
    params.append("posting_number", filters.posting_number);
  }
  if (filters.invoice_number) {
    params.append("invoice_number", filters.invoice_number);
  }
  if (filters.supplier) {
    params.append("supplier", filters.supplier);
  }
  if (filters.status) {
    params.append("status", filters.status.toLowerCase());
  }

  const res = await api.get(
    `/api/inventory/stock-entries/?${params.toString()}`,
  );
  return res.data;
};

export const fetchStockEntryById = async (stockEntryId: string | number) => {
  const res = await api.get(`/api/inventory/stock-entries/${stockEntryId}/`);
  return res.data;
};

export const fetchStockEntryByPostingNumber = async (postingNumber: string) => {
  const res = await api.get(
    `/api/inventory/stock-entries/by-posting-number/${postingNumber}/`,
  );
  return res.data;
};

export const updateStockEntry = async (
  stockEntryId: string | number,
  payload: CreateStockEntry,
) => {
  const res = await api.put(
    `/api/inventory/stock-entries/${stockEntryId}/update/`,
    payload,
  );
  return res.data;
};

export const submitStockEntry = async (stockEntryId: string | number) => {
  const res = await api.post(
    `/api/inventory/stock-entries/${stockEntryId}/submit/`,
  );
  return res.data;
};
