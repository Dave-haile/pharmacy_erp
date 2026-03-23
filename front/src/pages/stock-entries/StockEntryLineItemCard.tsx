import React from "react";
import SearchableSelect from "../../components/SearchableSelect";
import { DatePicker } from "../../components/Calendar";
import {
  DocumentField,
  documentInputClassName,
  documentSecondaryButtonClassName,
  documentSelectTriggerClassName,
} from "../../components/common/DocumentUI";
import { MedicineItem, StockEntryItemInput } from "../../types/types";
import {
  currencyFormatter,
  formatMedicineCreatedDate,
  readOnlyFieldClassName,
} from "./stockEntryUtils";
import { useNavigate } from "react-router-dom";

interface StockEntryLineItemCardProps {
  index: number;
  item: StockEntryItemInput;
  isEditable: boolean;
  canRemove: boolean;
  medicineOptions: Array<{
    value: string;
    label: string;
    subtitle?: string;
  }>;
  selectedMedicine?: MedicineItem;
  isMedicineLoading: boolean;
  hasMedicineError: boolean;
  onSearchMedicine: (value: string) => void;
  onChangeField: (
    index: number,
    field: keyof StockEntryItemInput,
    value: string | number | null,
  ) => void;
  onRemove: (index: number) => void;
}

const StockEntryLineItemCard: React.FC<StockEntryLineItemCardProps> = ({
  index,
  item,
  isEditable,
  canRemove,
  medicineOptions,
  selectedMedicine,
  isMedicineLoading,
  hasMedicineError,
  onSearchMedicine,
  onChangeField,
  onRemove,
}) => {
  const lineTotal = Number(item.quantity || 0) * Number(item.unit_price || 0);
  const medicineStatus = selectedMedicine?.is_active
    ? selectedMedicine.status || "Active"
    : "Inactive";

  const navigate = useNavigate();

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/40">
      <div className="mb-4 flex flex-col gap-3 border-b border-slate-200 pb-4 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
            Line {index + 1}
          </p>
          <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">
            {item.batch_number || "Batch details pending"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
              Line Total
            </p>
            <p className="mt-1 text-lg font-black text-slate-900 dark:text-white">
              {currencyFormatter.format(lineTotal)}
            </p>
          </div>
          {canRemove && (
            <button
              type="button"
              onClick={() => onRemove(index)}
              className={`${documentSecondaryButtonClassName} border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30`}
            >
              Remove
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-12">
        <div className="lg:col-span-3">
          <DocumentField label="Medicine">
            <SearchableSelect
              options={medicineOptions}
              value={item.medicine_id != null ? String(item.medicine_id) : ""}
              onChange={(value) =>
                onChangeField(
                  index,
                  "medicine_id",
                  value ? Number(value) : null,
                )
              }
              onSearch={onSearchMedicine}
              placeholder="Search medicine"
              triggerClassName={documentSelectTriggerClassName}
              disabled={!isEditable}
              onCreateNew={() => navigate("inventory/medicines/new-medicine")}
              createNewText="Add New Medicine"
            />
          </DocumentField>
        </div>
        {item.medicine_id != null && (
          <div className="lg:col-span-9">
            <DocumentField
              label="Selected Medicine Snapshot"
              hint="Read-only master data from the medicine record"
            >
              {isMedicineLoading ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 px-4 py-4 text-sm font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-400">
                  Loading medicine details...
                </div>
              ) : hasMedicineError ? (
                <div className="rounded-xl border border-dashed border-red-200 bg-red-50 px-4 py-4 text-sm font-semibold text-red-600 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400">
                  Failed to load medicine details.
                </div>
              ) : selectedMedicine ? (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className={readOnlyFieldClassName}>
                    <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                      Naming Series
                    </span>
                    <span className="mt-2 break-all text-sm font-black text-slate-900 dark:text-white">
                      {selectedMedicine.naming_series || "-"}
                    </span>
                  </div>
                  <div className={readOnlyFieldClassName}>
                    <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                      Generic Name
                    </span>
                    <span className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {selectedMedicine.generic_name || "-"}
                    </span>
                  </div>
                  <div className={readOnlyFieldClassName}>
                    <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                      Category
                    </span>
                    <span className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {selectedMedicine.category || "-"}
                    </span>
                  </div>
                  <div className={readOnlyFieldClassName}>
                    <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                      Supplier
                    </span>
                    <span className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {selectedMedicine.supplier || "-"}
                    </span>
                  </div>
                  <div className={readOnlyFieldClassName}>
                    <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                      Barcode
                    </span>
                    <span className="mt-2 break-all font-mono text-sm font-bold text-slate-800 dark:text-slate-200">
                      {selectedMedicine.barcode || "-"}
                    </span>
                  </div>
                  <div className={readOnlyFieldClassName}>
                    <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                      Master Cost
                    </span>
                    <span className="mt-2 text-sm font-black text-slate-900 dark:text-white">
                      {currencyFormatter.format(
                        Number(selectedMedicine.cost_price || 0),
                      )}
                    </span>
                  </div>
                  <div className={readOnlyFieldClassName}>
                    <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                      Selling Price
                    </span>
                    <span className="mt-2 text-sm font-black text-slate-900 dark:text-white">
                      {currencyFormatter.format(
                        Number(selectedMedicine.selling_price || 0),
                      )}
                    </span>
                  </div>
                  <div className={readOnlyFieldClassName}>
                    <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                      Master Status
                    </span>
                    <span className="mt-2 text-sm font-black text-slate-900 dark:text-white">
                      {medicineStatus}
                    </span>
                    <span className="mt-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                      Created{" "}
                      {formatMedicineCreatedDate(selectedMedicine.created_at)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 px-4 py-4 text-sm font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-400">
                  Select a medicine to load its read-only master details.
                </div>
              )}
            </DocumentField>
          </div>
        )}
        <div className="lg:col-span-2">
          <DocumentField label="Batch Number">
            <input
              value={item.batch_number}
              onChange={(e) =>
                onChangeField(index, "batch_number", e.target.value)
              }
              className={documentInputClassName}
              placeholder="e.g. B-2026-001"
              disabled={!isEditable}
            />
          </DocumentField>
        </div>
        <div className="lg:col-span-2">
          <DocumentField label="MFG Date">
            <DatePicker
              value={item.manufacturing_date}
              onChange={(date) =>
                onChangeField(index, "manufacturing_date", date)
              }
              className="w-full"
              triggerClassName={documentSelectTriggerClassName}
              disabled={!isEditable}
            />
          </DocumentField>
        </div>
        <div className="lg:col-span-2">
          <DocumentField label="Expiry Date">
            <DatePicker
              value={item.expiry_date}
              onChange={(date) => onChangeField(index, "expiry_date", date)}
              className="w-full"
              triggerClassName={documentSelectTriggerClassName}
              disabled={!isEditable}
            />
          </DocumentField>
        </div>
        <div className="lg:col-span-1">
          <DocumentField label="Qty">
            <input
              type="number"
              min="1"
              value={item.quantity}
              onChange={(e) => onChangeField(index, "quantity", e.target.value)}
              className={`${documentInputClassName} appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}

              disabled={!isEditable}
            />
          </DocumentField>
        </div>
        <div className="lg:col-span-2">
          <DocumentField label="Unit Cost">
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={item.unit_price}
              onChange={(e) =>
                onChangeField(index, "unit_price", e.target.value)
              }
              className={`${documentInputClassName} appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}

              placeholder="0.00"
              disabled={!isEditable}
            />
          </DocumentField>
        </div>
        <div className="lg:col-span-4">
          <DocumentField label="Reference">
            <input
              value={item.reference}
              onChange={(e) =>
                onChangeField(index, "reference", e.target.value)
              }
              className={documentInputClassName}
              placeholder="Optional line reference"
              disabled={!isEditable}
            />
          </DocumentField>
        </div>
        <div className="lg:col-span-8">
          <DocumentField label="Line Notes">
            <input
              value={item.notes}
              onChange={(e) => onChangeField(index, "notes", e.target.value)}
              className={documentInputClassName}
              placeholder="Optional notes"
              disabled={!isEditable}
            />
          </DocumentField>
        </div>
      </div>
    </div>
  );
};

export default StockEntryLineItemCard;
