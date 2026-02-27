import { MedicineItem, Category } from "../types/types";
import api from "./api";

export const fetchItems = async (
  setIsLoading: (loading: boolean) => void,
  currentPage: number,
  pageSize: number,
  filters: { name: string; sku: string; group: string },
  setItems: (items: MedicineItem[]) => void,
  setTotalCount: (count: number) => void,
  showError: (message: string) => void,
) => {
  try {
    setIsLoading(true);

    // Build query parameters
    const params = new URLSearchParams({
      page: currentPage.toString(),
      page_size: pageSize.toString(),
    });

    // Add search filters
    const searchTerms = [];
    if (filters.name) {
      searchTerms.push(filters.name);
    }
    if (filters.sku) {
      searchTerms.push(filters.sku);
    }
    if (searchTerms.length > 0) {
      params.append("search", searchTerms.join(" "));
    }
    if (filters.group) {
      params.append("category", filters.group);
    }

    const res = await api.get(`/api/inventory/medicines/?${params.toString()}`);

    console.log(res.data.results);

    setItems(res.data.results);
    setTotalCount(res.data.count);
  } catch (e) {
    console.error("Items fetch failed", e);

    if (e.response?.status !== 401) {
      const errorMessage =
        e.response?.data?.message ||
        e.response?.data?.error ||
        "Failed to fetch medicines. Please try again.";
      showError(errorMessage);
    }
  } finally {
    setIsLoading(false);
  }
};

export const fetchCategories = async (
  setIsLoading: (loading: boolean) => void,
  currentPage: number,
  pageSize: number,
  search: string,
  setCategories: (categories: Category[]) => void,
  setTotalCount: (count: number) => void,
  showError: (message: string) => void,
) => {
  try {
    setIsLoading(true);

    const params = new URLSearchParams({
      page: currentPage.toString(),
      page_size: pageSize.toString(),
    });

    if (search) {
      params.append("search", search);
    }

    const res = await api.get(
      `/api/inventory/medicine-categories/?${params.toString()}`,
    );

    console.log(res.data.results);

    setCategories(res.data.results);

    setTotalCount(res.data.count);
  } catch (e) {
    console.error("Categories fetch failed", e);
    if (e.response?.status !== 401) {
      const errorMessage =
        e.response?.data?.message ||
        e.response?.data?.error ||
        "Failed to fetch categories. Please try again.";
      showError(errorMessage);
    }
  } finally {
    setIsLoading(false);
  }
};
