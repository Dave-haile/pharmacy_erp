import api from "./api";

export interface GlobalSearchItem {
  id: string;
  entity: string;
  title: string;
  subtitle: string;
  meta: string;
  href: string;
}

export interface GlobalSearchGroup {
  module: string;
  label: string;
  items: GlobalSearchItem[];
}

export interface GlobalSearchResponse {
  query: string;
  results: GlobalSearchGroup[];
  total_count: number;
}

export const fetchGlobalSearch = async (
  query: string,
  limit = 5,
): Promise<GlobalSearchResponse> => {
  const params = new URLSearchParams({
    q: query,
    limit: limit.toString(),
  });

  const response = await api.get(`/api/inventory/global-search/?${params.toString()}`);
  return response.data;
};
