import { CreateMedicine } from "../types/types";
import api from "./api";

export const fetchMedicines = async (
  currentPage: number,
  pageSize: number,
  filters: {
    name: string;
    generic_name: string;
    category: string;
    supplier: string;
  },
) => {
  const params = new URLSearchParams({
    page: currentPage.toString(),
    page_size: pageSize.toString(),
  });

  const searchTerms = [];
  if (filters.name) searchTerms.push(filters.name);
  if (filters.generic_name) searchTerms.push(filters.generic_name);

  if (searchTerms.length > 0) {
    params.append("search", searchTerms.join(" "));
  }

  if (filters.category) {
    params.append("category", filters.category);
  }
  if (filters.supplier) {
    params.append("supplier", filters.supplier);
  }

  const res = await api.get(`/api/inventory/medicines/?${params.toString()}`);
  console.log(res.data);
  return res.data;
};

export const createMedicine = async (medicine: CreateMedicine) => {
  const res = await api.post(`/api/inventory/medicines/create/`, medicine);
  return res.data;
};
export const updateMedicine = async (
  id: string | number,
  medicine: Partial<CreateMedicine>,
) => {
  const res = await api.put(
    `/api/inventory/medicines/update/${id}/`,
    medicine,
  );
  return res.data;
};
export const deleteMedicine = async (id: string) => {
  const res = await api.delete(`/api/inventory/medicines/${id}/`);
  return res.data;
};
export const fetchMedicineById = async (naming_series: string) => {
  const res = await api.get(
    `/api/inventory/medicines/by-naming-series/${naming_series}/`,
  );
  return res.data;
};

export const fetchMedicineByNumericId = async (id: string) => {
  const res = await api.get(`/api/inventory/medicines/${id}/`);
  return res.data;
};
