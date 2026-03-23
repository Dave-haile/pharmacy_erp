import React from "react";
import SearchableSelect from "../../components/SearchableSelect";
import Select from "../../components/ui/SelectTag";
import {
  DocumentField,
  documentInputClassName,
  documentSelectTriggerClassName,
} from "../../components/common/DocumentUI";

interface StockInItemsFiltersProps {
  filters: {
    posting_number: string;
    invoice_number: string;
    supplier: string;
    status: string;
  };
  statusOptions: Array<{ label: string; value: string }>;
  supplierGroups: Array<{ value: string; label: string; subtitle?: string }>;
  selectedSupplierValue: string;
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
  onSupplierSearch: (value: string) => void;
  onSupplierChange: (value: string) => void;
  onStatusChange: (value: string) => void;
}

const StockInItemsFilters: React.FC<StockInItemsFiltersProps> = ({
  filters,
  statusOptions,
  supplierGroups,
  selectedSupplierValue,
  onInputChange,
  onSupplierSearch,
  onSupplierChange,
  onStatusChange,
}) => {
  const filterInputClassName = `${documentInputClassName} border-none bg-transparent shadow-none focus:bg-transparent focus:ring-0 dark:bg-transparent`;

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DocumentField label="Posting Number">
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
            <input
              type="text"
              name="posting_number"
              placeholder="Search posting number"
              className={filterInputClassName}
              value={filters.posting_number}
              onChange={onInputChange}
            />
          </div>
        </DocumentField>
        <DocumentField label="Invoice Number">
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
            <input
              type="text"
              name="invoice_number"
              placeholder="Search invoice number"
              className={filterInputClassName}
              value={filters.invoice_number}
              onChange={onInputChange}
            />
          </div>
        </DocumentField>
        <DocumentField label="Supplier">
          <SearchableSelect
            options={supplierGroups}
            value={selectedSupplierValue}
            placeholder="Search supplier"
            className="w-full"
            triggerClassName={documentSelectTriggerClassName}
            onSearch={onSupplierSearch}
            onChange={onSupplierChange}
          />
        </DocumentField>
        <DocumentField label="Status">
          <Select
            options={statusOptions}
            value={filters.status}
            placeholder="Select status"
            allowEmpty
            emptyLabel="All statuses"
            triggerClassName={documentSelectTriggerClassName}
            onChange={onStatusChange}
          />
        </DocumentField>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
          Auto Filter
        </span>
        <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-400">
          Latest First
        </span>
      </div>
    </div>
  );
};

export default StockInItemsFilters;
