import React from 'react';

export interface Column<T = unknown> {
  key: string;
  title: string;
  render?: (value: unknown, row: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface DataTableProps<T = unknown> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  loadingText?: string;
  emptyText?: string;
  className?: string;
  rowClassName?: string | ((row: T, index: number) => string);
  onRowClick?: (row: T, index: number) => void;
  pagination?: {
    currentPage: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
    pageSizeOptions?: number[];
  };
  responsive?: boolean;
  striped?: boolean;
  hoverable?: boolean;
  compact?: boolean;
}

const DataTable = <T = unknown>({
  data,
  columns,
  loading = false,
  loadingText = "Loading data...",
  emptyText = "No data available",
  className = "",
  rowClassName = "",
  onRowClick,
  pagination,
  responsive = true,
  striped = true,
  hoverable = true,
  compact = false,
}: DataTableProps<T>) => {
  const getRowClassName = (row: T, index: number) => {
    const baseClasses = hoverable ? "hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors" : "";
    const clickableClasses = onRowClick ? "cursor-pointer" : "";
    const stripedClasses = striped && index % 2 === 1 ? "bg-slate-50/30 dark:bg-slate-800/30" : "";
    const customClasses = typeof rowClassName === 'function' ? rowClassName(row, index) : rowClassName;
    
    return `${baseClasses} ${clickableClasses} ${stripedClasses} ${customClasses}`.trim();
  };

  const getCellClassName = (column: Column<T>) => {
    const alignClass = column.align === 'center' ? 'text-center' : 
                      column.align === 'right' ? 'text-right' : 'text-left';
    return `px-4 py-${compact ? '2' : '3'} ${alignClass} ${column.className || ''}`.trim();
  };

  const getHeaderClassName = (column: Column<T>) => {
    const alignClass = column.align === 'center' ? 'text-center' : 
                      column.align === 'right' ? 'text-right' : 'text-left';
    return `px-4 py-${compact ? '2' : '3'} text-[8px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest ${alignClass} ${column.headerClassName || ''}`.trim();
  };

  const renderCell = (column: Column<T>, row: T, index: number) => {
    const value = (row as Record<string, unknown>)[column.key];
    if (column.render) {
      return column.render(value, row, index);
    }
    return value;
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden ${className}`}>
        <div className="p-10 text-center">
          <div className="animate-spin h-5 w-5 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest text-[8px]">
            {loadingText}
          </p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden ${className}`}>
        <div className="p-10 text-center">
          <p className="text-slate-400 dark:text-slate-500 font-medium text-sm">
            {emptyText}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className={`${responsive ? 'overflow-x-auto' : ''}`}>
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 dark:bg-slate-800/50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={getHeaderClassName(column)}
                    style={{ width: column.width }}
                  >
                    {column.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.map((row, index) => (
                <tr
                  key={(row as Record<string, unknown>).id || index}
                  className={getRowClassName(row, index)}
                  onClick={() => onRowClick?.(row, index)}
                >
                  {columns.map((column) => (
                    <td key={column.key} className={getCellClassName(column)}>
                      {renderCell(column, row, index)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {pagination && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Rows per page:
            </span>
            {(pagination.pageSizeOptions || [10, 25, 50, 100]).map((size) => (
              <button
                key={size}
                onClick={() => pagination.onPageSizeChange(size)}
                className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                  pagination.pageSize === size
                    ? "bg-slate-900 dark:bg-emerald-600 text-white shadow-lg"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                {size}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
              Showing {Math.min(pagination.pageSize, pagination.total)} of {pagination.total} items
            </span>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${
                  pagination.currentPage === 1
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                Previous
              </button>
              <span className="px-3 py-1 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                {pagination.currentPage}
              </span>
              <button
                onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage * pagination.pageSize >= pagination.total}
                className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${
                  pagination.currentPage * pagination.pageSize >= pagination.total
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
