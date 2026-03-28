import api from "./api";

export const fetchNearExpiryReport = async (days = 30) => {
  const res = await api.get(`/api/inventory/reports/near-expiry/?days=${days}`);
  return res.data as {
    days: number;
    count: number;
    results: Array<{
      batch_id: number;
      batch_number: string;
      medicine_id: number | null;
      medicine_name: string;
      category: string;
      supplier: string;
      quantity: number;
      expiry_date: string;
      days_to_expiry: number;
      unit_cost: string;
    }>;
  };
};

export const fetchValuationReport = async () => {
  const res = await api.get(`/api/inventory/reports/valuation/`);
  return res.data as {
    count: number;
    total_value: string;
    results: Array<{
      medicine_id: number;
      medicine_name: string;
      category: string;
      quantity: number;
      value: string;
    }>;
  };
};

export const fetchSalesSummaryReport = async (filters?: {
  start_date?: string;
  end_date?: string;
}) => {
  const params = new URLSearchParams();
  if (filters?.start_date) params.append("start_date", filters.start_date);
  if (filters?.end_date) params.append("end_date", filters.end_date);
  const suffix = params.toString() ? `?${params.toString()}` : "";
  const res = await api.get(`/api/inventory/reports/sales-summary/${suffix}`);
  return res.data as {
    start_date: string | null;
    end_date: string | null;
    total_sales: string;
    sale_count: number;
    top_items: Array<{
      medicine_id: number;
      medicine_name: string;
      quantity: number;
      revenue: string;
    }>;
  };
};

