import { Category, Supplier } from "../types/types";
import { fetchCategories } from "./data";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { fetchSuppliers } from "./suppler";

export const loadCategories = async (
  ignore,
  setCategories,
  categoriesData,
  showError,
) => {
  try {
    if (!ignore && categoriesData !== undefined) {
      setCategories(categoriesData?.results || []);
    }
  } catch (e) {
    console.error("Categories fetch failed", e);
    if (e.response?.status !== 401) {
      const errorMessage =
        e.response?.data?.message ||
        e.response?.data?.error ||
        "Failed to fetch categories. Please try again.";
      showError(errorMessage);
    }
  }
};


export const useCategories = (categoryInputSearch: string) => {
  const { data: categoriesData } = useQuery({
    queryKey: ["categories", categoryInputSearch],
    queryFn: () => fetchCategories(1, 5, categoryInputSearch),
    staleTime: 60 * 1000,
  });

  const itemGroups = React.useMemo(() => {
    return categoriesData?.results?.map((category: Category) => ({
      value: String(category.id),
      label: category.name,
      subtitle: category.description,
    })) || [];
  }, [categoriesData?.results]);
  return { itemGroups, categoriesData };
};

export const loadSuppliers = async (
  ignore,
  setSuppliers,
  suppliersData,
  showError,
) => {
  try {
    if (!ignore && suppliersData !== undefined) {
      setSuppliers(suppliersData?.results || []);
    }
  } catch (e) {
    console.error("Suppliers fetch failed", e);
    if (e.response?.status !== 401) {
      const errorMessage =
        e.response?.data?.message ||
        e.response?.data?.error ||
        "Failed to fetch suppliers. Please try again.";
      showError(errorMessage);
    }
  }
};

export const useSuppliers = (supplierInputSearch: string) => {
  const { data: suppliersData } = useQuery({
    queryKey: ["suppliers", supplierInputSearch],
    queryFn: () => fetchSuppliers(1, 5, supplierInputSearch),
    staleTime: 60 * 1000,
  });

  const supplierGroups = React.useMemo(() => {
    return suppliersData?.results?.map((supplier: Supplier) => ({
      value: String(supplier.id),
      label: supplier.name,
      subtitle: `${supplier.phone} - ${supplier.email} - ${supplier.address}`,
    })) || [];
  }, [suppliersData?.results]);
  return { supplierGroups, suppliersData };
};