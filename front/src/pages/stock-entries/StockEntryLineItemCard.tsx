import React, { useState } from "react";
import SearchableSelect from "../../components/SearchableSelect";
import { DatePicker } from "../../components/Calendar";
import {
  DocumentField,
  documentInputClassName,
  documentSecondaryButtonClassName,
  documentSelectTriggerClassName,
} from "../../components/common/DocumentUI";
import { MedicineItem, StockEntryItemInput } from "../../types/types";
import { currencyFormatter } from "./stockEntryUtils";
import { useNavigate } from "react-router-dom";
import { Info } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

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
  const [isHoveringDetails, setIsHoveringDetails] = useState(false);

  const navigate = useNavigate();

  // return (
  //   <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/40">
  //     <div className="mb-4 flex flex-col gap-3 border-b border-slate-200 pb-4 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
  //       <div>
  //         <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
  //           Line {index + 1}
  //         </p>
  //         <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">
  //           {item.batch_number || "Batch details pending"}
  //         </p>
  //       </div>
  //       <div className="flex flex-wrap items-center gap-3">
  //         <div className="text-right">
  //           <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
  //             Line Total
  //           </p>
  //           <p className="mt-1 text-lg font-black text-slate-900 dark:text-white">
  //             {currencyFormatter.format(lineTotal)}
  //           </p>
  //         </div>
  //         {canRemove && (
  //           <button
  //             type="button"
  //             onClick={() => onRemove(index)}
  //             className={`${documentSecondaryButtonClassName} border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30`}
  //           >
  //             Remove
  //           </button>
  //         )}
  //       </div>
  //     </div>

  //     <div className="grid gap-5 lg:grid-cols-12">
  //       <div className="lg:col-span-3">
  //         <DocumentField label="Medicine">
  //           <SearchableSelect
  //             options={medicineOptions}
  //             value={item.medicine_id != null ? String(item.medicine_id) : ""}
  //             onChange={(value) =>
  //               onChangeField(
  //                 index,
  //                 "medicine_id",
  //                 value ? Number(value) : null,
  //               )
  //             }
  //             onSearch={onSearchMedicine}
  //             placeholder="Search medicine"
  //             triggerClassName={documentSelectTriggerClassName}
  //             disabled={!isEditable}
  //             onCreateNew={() => navigate("inventory/medicines/new-medicine")}
  //             createNewText="Add New Medicine"
  //           />
  //         </DocumentField>
  //       </div>
  //       {item.medicine_id != null && (
  //         <div className="lg:col-span-9">
  //           <DocumentField
  //             label="Selected Medicine Snapshot"
  //             hint="Read-only master data from the medicine record"
  //           >
  //             {isMedicineLoading ? (
  //               <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 px-4 py-4 text-sm font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-400">
  //                 Loading medicine details...
  //               </div>
  //             ) : hasMedicineError ? (
  //               <div className="rounded-xl border border-dashed border-red-200 bg-red-50 px-4 py-4 text-sm font-semibold text-red-600 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400">
  //                 Failed to load medicine details.
  //               </div>
  //             ) : selectedMedicine ? (
  //               <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
  //                 <div className={readOnlyFieldClassName}>
  //                       <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
  //                     Generic Name
  //                   </span>
  //                   <span className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
  //                     {selectedMedicine.generic_name || "-"}
  //                   </span>
  //                 </div>
  //                 <div className={readOnlyFieldClassName}>
  //                       <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
  //                         <div className="flex flex-col">
  //                           <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
  //                             Category
  //                           </span>
  //                           <span className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
  //                             {selectedMedicine.category || "-"}
  //                           </span>
  //                         </div>
  //                         <div className="flex flex-col">
  //                           <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
  //                             Supplier
  //                           </span>
  //                           <span className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
  //                             {selectedMedicine.supplier || "-"}
  //                           </span>
  //                         </div>
  //                       </div>
  //                     </div>
  //                 <div className={readOnlyFieldClassName}>
  //                   <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
  //                     Barcode
  //                   </span>
  //                       <span className="mt-2 break-all font-mono text-sm font-bold text-slate-800 dark:text-white">
  //                     {selectedMedicine.barcode || "-"}
  //                   </span>
  //                 </div>
  //                 <div className={readOnlyFieldClassName}>
  //                       <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
  //                         <div className="flex flex-col">
  //                           <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
  //                             Master Cost
  //                           </span>
  //                           <span className="mt-1 text-sm font-black text-slate-900 dark:text-white">
  //                             {currencyFormatter.format(
  //                               Number(selectedMedicine.cost_price || 0),
  //                             )}
  //                           </span>
  //                         </div>
  //                         <div className="flex flex-col">
  //                           <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
  //                             Selling Price
  //                           </span>
  //                           <span className="mt-1 text-sm font-black text-slate-900 dark:text-white">
  //                             {currencyFormatter.format(
  //                               Number(selectedMedicine.selling_price || 0),
  //                             )}
  //                           </span>
  //                         </div>
  //                       </div>
  //                 </div>
  //               </div>
  //             ) : (
  //               <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 px-4 py-4 text-sm font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-400">
  //                 Select a medicine to load its read-only master details.
  //               </div>
  //             )}
  //           </DocumentField>
  //         </div>
  //       )}
  //       <div className="lg:col-span-2">
  //         <DocumentField label="Batch Number">
  //           <input
  //             value={item.batch_number}
  //             onChange={(e) =>
  //               onChangeField(index, "batch_number", e.target.value)
  //             }
  //             className={documentInputClassName}
  //             placeholder="e.g. B-2026-001"
  //             disabled={!isEditable}
  //           />
  //         </DocumentField>
  //       </div>
  //       <div className="lg:col-span-2">
  //         <DocumentField label="MFG Date">
  //           <DatePicker
  //             value={item.manufacturing_date}
  //             onChange={(date) =>
  //               onChangeField(index, "manufacturing_date", date)
  //             }
  //             className="w-full"
  //             triggerClassName={documentSelectTriggerClassName}
  //             disabled={!isEditable}
  //           />
  //         </DocumentField>
  //       </div>
  //       <div className="lg:col-span-2">
  //         <DocumentField label="Expiry Date">
  //           <DatePicker
  //             value={item.expiry_date}
  //             onChange={(date) => onChangeField(index, "expiry_date", date)}
  //             className="w-full"
  //             triggerClassName={documentSelectTriggerClassName}
  //             disabled={!isEditable}
  //           />
  //         </DocumentField>
  //       </div>
  //       <div className="lg:col-span-1">
  //         <DocumentField label="Qty">
  //           <input
  //             type="number"
  //             min="1"
  //             value={item.quantity}
  //             onChange={(e) => onChangeField(index, "quantity", e.target.value)}
  //             className={`${documentInputClassName} appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
  //             disabled={!isEditable}
  //           />
  //         </DocumentField>
  //       </div>
  //       <div className="lg:col-span-2">
  //         <DocumentField label="Unit Cost">
  //           <input
  //             type="number"
  //             min="0.01"
  //             step="0.01"
  //             value={item.unit_price}
  //             onChange={(e) =>
  //               onChangeField(index, "unit_price", e.target.value)
  //             }
  //             className={`${documentInputClassName} appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
  //             placeholder="0.00"
  //             disabled={!isEditable}
  //           />
  //         </DocumentField>
  //       </div>
  //       <div className="lg:col-span-4">
  //         <DocumentField label="Reference">
  //           <input
  //             value={item.reference}
  //             onChange={(e) =>
  //               onChangeField(index, "reference", e.target.value)
  //             }
  //             className={documentInputClassName}
  //             placeholder="Optional line reference"
  //             disabled={!isEditable}
  //           />
  //         </DocumentField>
  //       </div>
  //       <div className="lg:col-span-8">
  //         <DocumentField label="Line Notes">
  //           <input
  //             value={item.notes}
  //             onChange={(e) => onChangeField(index, "notes", e.target.value)}
  //             className={documentInputClassName}
  //             placeholder="Optional notes"
  //             disabled={!isEditable}
  //           />
  //         </DocumentField>
  //       </div>
  //     </div>
  //   </div>
  // );

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

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-12">
        <div className="relative min-w-0 md:col-span-2 xl:col-span-3">
          <DocumentField
            label={
              <div className="flex items-center gap-1.5">
                <span>Medicine</span>
                {item.medicine_id && (
                  <div
                    onMouseEnter={() => setIsHoveringDetails(true)}
                    onMouseLeave={() => setIsHoveringDetails(false)}
                    className="cursor-help text-slate-400 hover:text-emerald-500 transition-colors"
                  >
                    <Info size={12} />
                  </div>
                )}
              </div>
            }
          >
            <SearchableSelect
              options={medicineOptions}
              value={item.medicine_id != null ? String(item.medicine_id) : ""}
              onChange={(value) =>
                onChangeField(index, "medicine_id", value || null)
              }
              onSearch={onSearchMedicine}
              placeholder="Search medicine"
              triggerClassName={documentSelectTriggerClassName}
              disabled={!isEditable}
              onCreateNew={() => navigate("/inventory/items/new")}
              createNewText="Add New Medicine"
            />
          </DocumentField>

          <AnimatePresence>
            {isHoveringDetails && item.medicine_id && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute left-0 top-full z-300 mt-2 w-100 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Medicine Details
                  </h4>
                  {selectedMedicine && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-tighter ${selectedMedicine.is_active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}
                    >
                      {selectedMedicine.is_active ? "Active" : "Inactive"}
                    </span>
                  )}
                </div>

                {isMedicineLoading ? (
                  <div className="py-4 text-center text-xs font-medium text-slate-500">
                    Loading details...
                  </div>
                ) : hasMedicineError ? (
                  <div className="py-4 text-center text-xs font-medium text-red-500">
                    Failed to load details
                  </div>
                ) : selectedMedicine ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                          Generic Name
                        </span>
                        <span className="mt-1 text-xs font-bold text-slate-900 dark:text-white">
                          {selectedMedicine.generic_name || "-"}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                          Barcode
                        </span>
                        <span className="mt-1 font-mono text-xs font-bold text-slate-900 dark:text-white">
                          {selectedMedicine.barcode || "-"}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                          Category
                        </span>
                        <span className="mt-1 text-xs font-bold text-slate-900 dark:text-white">
                          {selectedMedicine.category || "-"}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                          Supplier
                        </span>
                        <span className="mt-1 text-xs font-bold text-slate-900 dark:text-white">
                          {selectedMedicine.supplier || "-"}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                          Master Cost
                        </span>
                        <span className="mt-1 text-sm font-black text-emerald-600 dark:text-emerald-400">
                          {currencyFormatter.format(
                            Number(selectedMedicine.cost_price || 0),
                          )}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                          Selling Price
                        </span>
                        <span className="mt-1 text-sm font-black text-blue-600 dark:text-blue-400">
                          {currencyFormatter.format(
                            Number(selectedMedicine.selling_price || 0),
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="min-w-0 xl:col-span-2">
          <DocumentField label="Batch Number">
            <input
              value={item.batch_number}
              onChange={(e) =>
                onChangeField(index, "batch_number", e.target.value)
              }
              className={`${documentInputClassName} w-full min-w-0`}
              placeholder="e.g. B-2026-001"
              disabled={!isEditable}
            />
          </DocumentField>
        </div>
        <div className="min-w-0 xl:col-span-2">
          <DocumentField label="MFG Date">
            <DatePicker
              value={item.manufacturing_date}
              onChange={(date) =>
                onChangeField(index, "manufacturing_date", date)
              }
              className="w-full min-w-0"
              triggerClassName={documentSelectTriggerClassName}
              disabled={!isEditable}
            />
          </DocumentField>
        </div>
        <div className="min-w-0 xl:col-span-2">
          <DocumentField label="Expiry Date">
            <DatePicker
              value={item.expiry_date}
              onChange={(date) => onChangeField(index, "expiry_date", date)}
              className="w-full min-w-0"
              triggerClassName={documentSelectTriggerClassName}
              disabled={!isEditable}
            />
          </DocumentField>
        </div>
        <div className="min-w-0 xl:col-span-1">
          <DocumentField label="Qty">
            <input
              type="number"
              min="1"
              value={item.quantity}
              onChange={(e) => onChangeField(index, "quantity", e.target.value)}
              className={`${documentInputClassName} w-full min-w-0 appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
              disabled={!isEditable}
            />
          </DocumentField>
        </div>
        <div className="min-w-0 xl:col-span-2">
          <DocumentField label="Unit Cost">
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={item.unit_price}
              onChange={(e) =>
                onChangeField(index, "unit_price", e.target.value)
              }
              className={`${documentInputClassName} w-full min-w-0 appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
              placeholder="0.00"
              disabled={!isEditable}
            />
          </DocumentField>
        </div>
        <div className="min-w-0 xl:col-span-4">
          <DocumentField label="Reference">
            <input
              value={item.reference}
              onChange={(e) =>
                onChangeField(index, "reference", e.target.value)
              }
              className={`${documentInputClassName} w-full min-w-0`}
              placeholder="Optional line reference"
              disabled={!isEditable}
            />
          </DocumentField>
        </div>
        <div className="min-w-0 md:col-span-2 xl:col-span-8">
          <DocumentField label="Line Notes">
            <input
              value={item.notes}
              onChange={(e) => onChangeField(index, "notes", e.target.value)}
              className={`${documentInputClassName} w-full min-w-0`}
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
