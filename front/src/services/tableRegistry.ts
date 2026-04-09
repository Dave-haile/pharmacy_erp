import api from "./api";

export interface TableColumn {
  name: string;
  label: string;
  type: string;
  required: boolean;
  description?: string;
  example?: string;
  include_in_import: boolean;
  include_in_export: boolean;
  is_identifier: boolean;
  choices?: string[];
  max_length?: number;
  null?: boolean;
  blank?: boolean;
  model_field?: boolean;
}

export interface TableRegistryItem {
  id: string;
  table_code: string;
  table_name: string;
  module: string;
  submodule?: string;
  frontend_path?: string;
  backend_endpoint?: string;
  keywords?: string[];
  importable: boolean;
  exportable: boolean;
  import_template?: string;
  description?: string;
  icon?: string;
  db_table_name?: string;
  model_class?: string;
  is_active?: boolean;
  columns?: TableColumn[];
}

export const fetchTableRegistry = async (): Promise<TableRegistryItem[]> => {
  const response = await api.get("/api/inventory/tables/");
  return response.data;
};

export const fetchTableDetail = async (
  tableCode: string
): Promise<TableRegistryItem> => {
  const response = await api.get(`/api/inventory/tables/${tableCode}/`);
  return response.data;
};

export const createTableRegistry = async (
  data: TableRegistryItem
): Promise<TableRegistryItem> => {
  const response = await api.post("/api/inventory/tables/", data);
  return response.data;
};

export const updateTableRegistry = async (
  tableCode: string,
  data: Partial<TableRegistryItem>
): Promise<TableRegistryItem> => {
  const response = await api.put(`/api/inventory/tables/${tableCode}/`, data);
  return response.data;
};

export const deleteTableRegistry = async (tableCode: string): Promise<void> => {
  await api.delete(`/api/inventory/tables/${tableCode}/`);
};

export const searchTableRegistry = async (
  query: string
): Promise<TableRegistryItem[]> => {
  const response = await api.get(
    `/api/inventory/tables/search/?q=${encodeURIComponent(query)}`
  );
  return response.data;
};

export const fetchImportableTables = async (): Promise<TableRegistryItem[]> => {
  const response = await api.get("/api/inventory/tables/importable/");
  return response.data;
};

export const filterTablesByQuery = (
  tables: TableRegistryItem[],
  query: string,
  limit = 8
): TableRegistryItem[] => {
  if (!query.trim()) return tables;
  const lowerQuery = query.toLowerCase();
  return tables
    .filter(
      (t) =>
        t.table_name.toLowerCase().includes(lowerQuery) ||
        t.table_code.toLowerCase().includes(lowerQuery) ||
        t.module.toLowerCase().includes(lowerQuery) ||
        t.keywords?.some((k) => k.toLowerCase().includes(lowerQuery))
    )
    .slice(0, limit);
};
