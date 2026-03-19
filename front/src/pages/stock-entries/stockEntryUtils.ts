import { StockEntryItemInput } from "../../types/types";

export const emptyItem = (): StockEntryItemInput => ({
  medicine_id: null,
  batch_number: "",
  manufacturing_date: "",
  expiry_date: "",
  quantity: "",
  unit_price: "",
  reference: "",
  notes: "",
});

export const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

export const numberFormatter = new Intl.NumberFormat("en-US");

export const readOnlyFieldClassName =
  "flex min-h-[78px] flex-col justify-between rounded-xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/80";

export const formatMedicineCreatedDate = (value?: string) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString();
};
