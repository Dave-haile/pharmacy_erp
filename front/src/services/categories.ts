import { Category, CreateCategory, Log } from "../types/types";
import api from "./api";

export interface CategoryFilters {
  search?: string;
  name?: string;
  description?: string;
  parent_category?: string;
}

export const fetchCategories = async (
  currentPage: number,
  pageSize: number,
  searchOrFilters: string | CategoryFilters = "",
) => {
  const filters =
    typeof searchOrFilters === "string"
      ? { search: searchOrFilters }
      : searchOrFilters;

  const params = new URLSearchParams({
    page: currentPage.toString(),
    page_size: pageSize.toString(),
  });

  if (filters.search) params.append("search", filters.search);
  if (filters.name) params.append("name", filters.name);
  if (filters.description) params.append("description", filters.description);
  if (filters.parent_category) {
    params.append("parent_category", filters.parent_category);
  }

  const res = await api.get(
    `/api/inventory/medicine-categories/?${params.toString()}`,
  );
  return res.data;
};

export const fetchCategoryById = async (
  id: string | number,
): Promise<Category> => {
  const res = await api.get(`/api/inventory/medicine-categories/${id}/`);
  return res.data;
};

export const fetchCategoryByNamingSeries = async (
  namingSeries: string,
): Promise<Category> => {
  const res = await api.get(
    `/api/inventory/medicine-categories/by-naming-series/${namingSeries}/`,
  );
  return res.data;
};

export const createCategory = async (payload: CreateCategory) => {
  const res = await api.post(
    `/api/inventory/medicine-categories/create/`,
    payload,
  );
  return res.data;
};

export const updateCategory = async (
  id: string | number,
  payload: Partial<CreateCategory>,
) => {
  const res = await api.put(
    `/api/inventory/medicine-categories/${id}/update/`,
    payload,
  );
  return res.data;
};

export const fetchCategoryLogs = async (id: string | number) => {
  const res = await api.get(`/api/inventory/medicine-categories/${id}/logs/`);
  return (res.data?.results || []) as Log[];
};
