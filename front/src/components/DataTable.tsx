import React from "react";

export interface Column<T> {
  header: string;
  render: (item: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  sortKey?: keyof T;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void | Promise<unknown>;
  filters?: React.ReactNode;
  footer?: React.ReactNode;
  onRowClick?: (item: T) => void;
  selectable?: boolean;
  selectedIds?: Set<string | number>;
  onSelectChange?: (id: string | number) => void;
  onSelectAll?: (checked: boolean) => void;
  emptyMessage?: string;
  loadingMessage?: string;
  idField?: keyof T;
  rowClassName?: (item: T) => string;
  sortConfig?: { key: keyof T; direction: "asc" | "desc" } | null;
  onSort?: (key: keyof T) => void;
  headerRight?: React.ReactNode;
  refreshMessage?: string;
  refreshLabel?: string;
}

const DataTable = <T extends object>({
  columns,
  data,
  isLoading = false,
  isRefreshing = false,
  onRefresh,
  filters,
  footer,
  onRowClick,
  selectable = false,
  selectedIds = new Set(),
  onSelectChange,
  onSelectAll,
  emptyMessage = "No records found",
  loadingMessage = "Loading records...",
  idField = "id" as keyof T,
  rowClassName,
  sortConfig,
  onSort,
  headerRight,
  refreshMessage = "Refreshing",
  refreshLabel = "Refresh",
}: DataTableProps<T>) => {
  const allSelected = data.length > 0 && selectedIds.size === data.length;
  const showInitialLoadingState = isLoading && data.length === 0;
  const showRefreshState = isRefreshing && data.length > 0;
  const isRefreshDisabled = isLoading || isRefreshing;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm dark:shadow-2xl flex flex-col transition-colors">
      {/* Filter Section */}
      {filters && (
        <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          {filters}
        </div>
      )}

      {/* Table Section */}
      <div className="flex-1 min-h-[300px] relative">
        {(showRefreshState || onRefresh) && (
          <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
            {showRefreshState && (
              <div className="pointer-events-none inline-flex items-center rounded-full border border-sky-200 bg-sky-50/95 px-3 py-1 text-[9px] font-black uppercase tracking-[0.22em] text-sky-700 shadow-sm backdrop-blur dark:border-sky-900/40 dark:bg-sky-950/80 dark:text-sky-300">
                {refreshMessage}
              </div>
            )}
            {onRefresh && (
              <button
                type="button"
                onClick={() => {
                  void onRefresh();
                }}
                disabled={isRefreshDisabled}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/95 px-3 py-1 text-[9px] font-black uppercase tracking-[0.22em] text-slate-600 shadow-sm backdrop-blur transition-all hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900/95 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:text-white"
              >
                <svg
                  className={`h-3 w-3 ${isRefreshDisabled ? "animate-spin" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 4v5h5M20 20v-5h-5M5.64 18.36A9 9 0 1018.36 5.64L20 7.27M4 16.73l1.64 1.63"
                  />
                </svg>
                <span>{refreshLabel}</span>
              </button>
            )}
          </div>
        )}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              {headerRight && (
                <tr className="border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/10 dark:bg-white/5">
                  <th
                    colSpan={columns.length + (selectable ? 1 : 0)}
                    className="px-6 py-2 text-right"
                  >
                    {headerRight}
                  </th>
                </tr>
              )}
              <tr className="border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/30 dark:bg-transparent">
                {selectable && (
                  <th className="w-12 px-6 py-4">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(e) => onSelectAll?.(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-emerald-500 focus:ring-emerald-500/20 cursor-pointer"
                    />
                  </th>
                )}
                {columns.map((col, idx) => (
                  <th
                    key={idx}
                    onClick={() => col.sortKey && onSort?.(col.sortKey)}
                    className={`px-4 py-4 text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest ${col.sortKey ? "cursor-pointer hover:text-slate-600 dark:hover:text-slate-300 transition-colors" : ""} ${col.headerClassName || ""} ${col.className || ""}`}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{col.header}</span>
                      {col.sortKey && (
                        <div className="flex flex-col -space-y-1 opacity-30 group-hover:opacity-100">
                          <svg
                            className={`w-2 h-2 ${sortConfig?.key === col.sortKey && sortConfig.direction === "asc" ? "text-emerald-500 opacity-100" : ""}`}
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 8l-6 6h12l-6-6z" />
                          </svg>
                          <svg
                            className={`w-2 h-2 ${sortConfig?.key === col.sortKey && sortConfig.direction === "desc" ? "text-emerald-500 opacity-100" : ""}`}
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 16l6-6H6l6 6z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody
              className={`divide-y divide-slate-100 transition-opacity duration-300 dark:divide-slate-800/30 ${showRefreshState ? "opacity-70" : "opacity-100"
                }`}
            >
              {showInitialLoadingState ? (
                <tr>
                  <td
                    colSpan={columns.length + (selectable ? 1 : 0)}
                    className="px-4 py-20 text-center"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-600">
                      {loadingMessage}
                    </p>
                  </td>
                </tr>
              ) : data.length > 0 ? (
                data.map((item, rowIdx) => (
                  <tr
                    key={String(item[idField]) || rowIdx}
                    onClick={() => onRowClick?.(item)}
                    className={`transition-all group ${onRowClick ? "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/20" : ""} ${selectedIds.has(String(item[idField])) ? "bg-emerald-50/30 dark:bg-emerald-900/10" : ""} ${rowClassName ? rowClassName(item) : ""}`}
                  >
                    {selectable && (
                      <td
                        className="px-6 py-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.has(String(item[idField]))}
                          onChange={() =>
                            onSelectChange?.(String(item[idField]))
                          }
                          className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-emerald-500 focus:ring-emerald-500/20 cursor-pointer"
                        />
                      </td>
                    )}
                    {columns.map((col, colIdx) => (
                      <td
                        key={colIdx}
                        className={`px-4 py-4 ${col.className || ""}`}
                      >
                        {col.render(item)}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length + (selectable ? 1 : 0)}
                    className="px-4 py-20 text-center"
                  >
                    <p className="text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest text-[10px]">
                      {emptyMessage}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Section */}
      {footer && (
        <div className="p-4 md:p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
          {footer}
        </div>
      )}
    </div>
  );
};

export default DataTable;
