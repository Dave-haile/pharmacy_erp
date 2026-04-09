import {
  CreateMedicine,
  Log,
  MedicineItem,
  PaginatedResponse,
} from "../types/types";
import api from "./api";

export interface MedicineFilters {
  name: string;
  generic_name: string;
  category: string;
  supplier: string;
  status: string;
  include_inactive?: boolean;
}

export interface MedicineImportPreviewError {
  row: number | null;
  column: string;
  message: string;
}

export interface MedicineImportPreviewSampleRow {
  row: number;
  values: Record<string, string>;
}

export interface MedicineImportPreviewResponse {
  file_name: string;
  source_format: string;
  columns: string[];
  expected_columns: string[];
  missing_columns: string[];
  unexpected_columns: string[];
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  can_import: boolean;
  errors: MedicineImportPreviewError[];
  sample_rows: MedicineImportPreviewSampleRow[];
}

const buildMedicineQueryParams = (
  currentPage: number,
  pageSize: number,
  filters: MedicineFilters,
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
  if (filters.status) {
    params.append("status", filters.status);
  }
  if (filters.include_inactive) {
    params.append("include_inactive", "true");
  }

  return params;
};

const buildMedicineFilterParams = (filters: MedicineFilters) =>
  buildMedicineQueryParams(1, 10, filters);

export const fetchMedicines = async (
  currentPage: number,
  pageSize: number,
  filters: MedicineFilters,
) => {
  const params = buildMedicineQueryParams(currentPage, pageSize, filters);

  const res = await api.get(`/api/inventory/medicines/?${params.toString()}`);
  return res.data as PaginatedResponse<MedicineItem>;
};

export const exportMedicines = async (
  format: "csv" | "json" | "xlsx" | "pdf",
  filters: MedicineFilters,
) => {
  const params = buildMedicineFilterParams(filters);
  params.set("export_format", format);

  const res = await api.get(`/api/inventory/medicines/export/?${params.toString()}`, {
    responseType: "blob",
  });

  return {
    blob: res.data as Blob,
    contentDisposition: res.headers["content-disposition"] as string | undefined,
  };
};

export const importMedicines = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await api.post(`/api/inventory/medicines/import/`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data as {
    message?: string;
    created: number;
    failed: number;
    failures: Array<{ row: number; error: string }>;
  };
};

export const previewMedicineImport = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await api.post(`/api/inventory/medicines/import/preview/`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data as MedicineImportPreviewResponse;
};

export const createMedicine = async (medicine: CreateMedicine) => {
  const res = await api.post(`/api/inventory/medicines/create/`, medicine);
  return res.data;
};
export const updateMedicine = async (
  id: string | number,
  medicine: Partial<CreateMedicine>,
) => {
  const res = await api.put(`/api/inventory/medicines/update/${id}/`, medicine);
  return res.data;
};
export const deleteMedicine = async (id: string) => {
  const res = await api.delete(`/api/inventory/medicines/delete/${id}/`);
  return res.data;
};
export const fetchMedicineById = async (
  naming_series: string,
): Promise<MedicineItem> => {
  const res = await api.get(
    `/api/inventory/medicines/by-naming-series/${naming_series}/`,
  );
  return res.data;
};

export const fetchMedicineByNumericId = async (
  id: string | number,
): Promise<MedicineItem> => {
  const res = await api.get(`/api/inventory/medicines/${id}/`);
  return res.data;
};

export const fetchMedicineLogs = async (medicineId: number | string) => {
  const res = await api.get(`/api/inventory/medicines/${medicineId}/logs/`);
  return (res.data?.results || []) as Log[];
};
