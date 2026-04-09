import {
  CreateStockOut,
  Log,
  StockOutBatchOption,
  StockOutDetail,
  StockOutListResponse,
} from "../types/types";
import api from "./api";

export const fetchStockOuts = async () => {
  const res = await api.get("/api/inventory/stock-outs/");
  console.log("Fetched stock-outs:", res.data);
  return res.data as StockOutListResponse;
};

export const fetchStockOutById = async (saleId: string | number) => {
  const res = await api.get(`/api/inventory/stock-outs/${saleId}/`);
  console.log("Fetched stock-out:", res.data);
  return res.data as StockOutDetail;
};

export const fetchStockOutByPostingNumber = async (postingNumber: string) => {
  const res = await api.get(
    `/api/inventory/stock-outs/by-posting-number/${postingNumber}/`,
  );
  return res.data as StockOutDetail;
};

export const createStockOut = async (payload: CreateStockOut) => {
  const res = await api.post("/api/inventory/stock-outs/create/", payload);
  return res.data;
};

export const updateStockOut = async (
  saleId: string | number,
  payload: CreateStockOut,
) => {
  const res = await api.put(
    `/api/inventory/stock-outs/${saleId}/update/`,
    payload,
  );
  return res.data;
};

export const submitStockOut = async (saleId: string | number) => {
  const res = await api.post(`/api/inventory/stock-outs/${saleId}/submit/`);
  return res.data;
};

export const cancelStockOut = async (saleId: string | number) => {
  const res = await api.post(`/api/inventory/stock-outs/${saleId}/cancel/`);
  return res.data;
};

export const deleteStockOut = async (saleId: string | number) => {
  const res = await api.delete(`/api/inventory/stock-outs/${saleId}/delete/`);
  return res.data as { message?: string };
};

export const fetchStockOutBatchOptions = async (medicineId?: number | null) => {
  const params = new URLSearchParams();
  if (medicineId) {
    params.append("medicine_id", String(medicineId));
  }
  const suffix = params.toString() ? `?${params.toString()}` : "";
  const res = await api.get(`/api/inventory/stock-outs/batches/${suffix}`);
  return res.data.items as StockOutBatchOption[];
};

export const fetchStockOutLogs = async (saleId: string | number) => {
  const res = await api.get(`/api/inventory/stock-outs/${saleId}/logs/`);
  return res.data as Log[];
};
