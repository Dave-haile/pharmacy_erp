import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import DataTable, { Column } from "../../components/DataTable";
import { useToast } from "../../hooks/useToast";
import { useSuppliers } from "../../services/common";
import { fetchStockEntries } from "../../services/stockEntries";
import { StockEntrySummary } from "../../types/types";
import {
  DocumentHeader,
  DocumentPage,
  DocumentSummaryCard,
  documentPrimaryButtonClassName,
} from "../../components/common/DocumentUI";
import StockInItemsFilters from "./StockInItemsFilters";
import { currencyFormatter, numberFormatter } from "./stockEntryUtils";

const statusClassMap: Record<StockEntrySummary["status"], string> = {
  Posted:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  Draft:
    "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  Cancelled: "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400",
};

const StockInItemsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showError } = useToast();
  const [supplierInputSearch, setSupplierInputSearch] = useState("");
  const [selectedSupplierValue, setSelectedSupplierValue] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof StockEntrySummary;
    direction: "asc" | "desc";
  } | null>(null);
  const [filters, setFilters] = useState({
    posting_number: "",
    invoice_number: "",
    supplier: "",
    status: "",
  });
  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedFilters(filters), 300);
    return () => clearTimeout(timer);
  }, [filters]);

  const { supplierGroups } = useSuppliers(supplierInputSearch);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["stock-entries", currentPage, pageSize, debouncedFilters],
    queryFn: () => fetchStockEntries(currentPage, pageSize, debouncedFilters),
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (error) {
      const errorMessage =
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response
          ? (error.response as { data?: { error?: string; message?: string } })
              ?.data?.error ||
            (error.response as { data?: { error?: string; message?: string } })
              ?.data?.message
          : "Failed to post stock entry.";
      showError(errorMessage);
    }
  }, [error, showError]);

  const items = useMemo<StockEntrySummary[]>(
    () => data?.results || [],
    [data?.results],
  );
  const totalCount = data?.count || 0;

  const filteredItems = useMemo(() => {
    const next = [...items].filter((item) => {
      return (
        (debouncedFilters.posting_number === "" ||
          item.posting_number
            .toLowerCase()
            .includes(debouncedFilters.posting_number.toLowerCase())) &&
        (debouncedFilters.invoice_number === "" ||
          item.invoice_number
            .toLowerCase()
            .includes(debouncedFilters.invoice_number.toLowerCase())) &&
        (debouncedFilters.supplier === "" ||
          item.supplier
            .toLowerCase()
            .includes(debouncedFilters.supplier.toLowerCase())) &&
        (debouncedFilters.status === "" ||
          item.status === debouncedFilters.status)
      );
    });

    if (sortConfig) {
      next.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    } else {
      next.sort(
        (a, b) =>
          new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime(),
      );
    }

    return next;
  }, [debouncedFilters, items, sortConfig]);

  const paginatedItems = useMemo(() => filteredItems, [filteredItems]);
  const hasNextPage = Boolean(data?.has_next);
  const hasLoadedRows = items.length > 0;
  const isTableRefreshing = isFetching && hasLoadedRows;
  const visibleDrafts = filteredItems.filter(
    (item) => item.status === "Draft",
  ).length;
  const visiblePosted = filteredItems.filter(
    (item) => item.status === "Posted",
  ).length;
  const visibleValue = filteredItems.reduce(
    (sum, item) => sum + Number(item.grand_total || 0),
    0,
  );

  const requestSort = (key: keyof StockEntrySummary) => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const handleSupplierSearch = (value: string) => {
    setSupplierInputSearch(value);
    setSelectedSupplierValue("");
    setFilters((prev) => ({ ...prev, supplier: value }));
    setCurrentPage(1);
  };

  const handleSupplierChange = (value: string) => {
    const selectedSupplier = supplierGroups.find(
      (supplier) => supplier.value === value,
    );
    const supplierLabel = selectedSupplier?.label || "";

    setSelectedSupplierValue(value);
    setSupplierInputSearch(supplierLabel);
    setFilters((prev) => ({ ...prev, supplier: supplierLabel }));
    setCurrentPage(1);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleLoadMore = () => {
    setCurrentPage((prev) => prev + 1);
  };

  const columns: Column<StockEntrySummary>[] = [
    {
      header: "Posting No",
      sortKey: "posting_number",
      render: (item) => (
        <span className="rounded bg-emerald-50 px-2 py-1 text-[10px] font-mono font-bold text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
          {item.posting_number}
        </span>
      ),
    },
    {
      header: "Supplier / Invoice",
      sortKey: "supplier",
      render: (item) => (
        <div className="flex flex-col">
          <span className="text-[11px] font-black text-slate-800 dark:text-slate-200">
            {item.supplier}
          </span>
          <span className="text-[9px] font-mono font-bold uppercase text-slate-500">
            {item.invoice_number}
          </span>
        </div>
      ),
    },
    {
      header: "Lines",
      sortKey: "item_count",
      render: (item) => (
        <span className="text-[11px] font-black text-slate-700 dark:text-slate-300">
          {numberFormatter.format(item.item_count)}
        </span>
      ),
    },
    {
      header: "Total Qty",
      sortKey: "total_quantity",
      render: (item) => (
        <span className="text-[11px] font-black text-slate-700 dark:text-slate-300">
          {numberFormatter.format(item.total_quantity)}
        </span>
      ),
    },
    {
      header: "Grand Total",
      sortKey: "grand_total",
      render: (item) => (
        <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400">
          {currencyFormatter.format(Number(item.grand_total || 0))}
        </span>
      ),
    },
    {
      header: "Received By",
      sortKey: "received_by",
      render: (item) => (
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          {item.received_by}
        </span>
      ),
    },
    {
      header: "Posted At",
      sortKey: "posted_at",
      render: (item) => (
        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
          {new Date(item.posted_at).toLocaleString()}
        </span>
      ),
    },
    {
      header: "Status",
      headerClassName: "text-right",
      className: "text-right",
      render: (item) => (
        <span
          className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[8px] font-black uppercase tracking-widest ${statusClassMap[item.status]}`}
        >
          {item.status}
        </span>
      ),
    },
  ];

  const statusOptions = [
    { label: "Posted", value: "Posted" },
    { label: "Draft", value: "Draft" },
    { label: "Cancelled", value: "Cancelled" },
  ];

  const filtersContent = (
    <StockInItemsFilters
      filters={filters}
      statusOptions={statusOptions}
      supplierGroups={supplierGroups}
      selectedSupplierValue={selectedSupplierValue}
      onInputChange={handleFilterChange}
      onSupplierSearch={handleSupplierSearch}
      onSupplierChange={handleSupplierChange}
      onStatusChange={(value) => {
        setFilters((prev) => ({ ...prev, status: value }));
        setCurrentPage(1);
      }}
    />
  );

  const footer = (
    <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
      <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-800">
        {[10, 100, 500].map((size) => (
          <button
            key={size}
            onClick={() => handlePageSizeChange(size)}
            className={`rounded-lg px-4 py-1.5 text-[10px] font-black transition-all ${
              pageSize === size
                ? "bg-slate-900 text-white shadow-lg dark:bg-slate-700"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            {size}
          </button>
        ))}
      </div>

      <div className="flex items-center space-x-4">
        {hasNextPage && (
          <button
            onClick={handleLoadMore}
            className="rounded-xl border border-slate-200 bg-white px-6 py-2 text-[10px] font-black uppercase tracking-widest text-slate-800 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
          >
            Load More Records
          </button>
        )}
      </div>
    </div>
  );

  return (
    <DocumentPage>
      <DocumentHeader
        eyebrow="Stock Transactions"
        title="Stock Receipt Register"
        description="Track supplier intake documents in a consistent register layout that matches the document creation screens."
        onBack={() => navigate("/inventory")}
        meta={
          <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
            {numberFormatter.format(totalCount)} Total Records
          </span>
        }
        actions={
          <button
            onClick={() => navigate("/inventory/stock-entries/new-stock-entry")}
            className={documentPrimaryButtonClassName}
          >
            New Stock Entry
          </button>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DocumentSummaryCard
          label="Records In View"
          value={numberFormatter.format(filteredItems.length)}
          hint={`${numberFormatter.format(items.length)} loaded from current page`}
          tone="slate"
        />
        <DocumentSummaryCard
          label="Draft Documents"
          value={numberFormatter.format(visibleDrafts)}
          hint="Editable receipts in current result set"
          tone="amber"
        />
        <DocumentSummaryCard
          label="Posted Documents"
          value={numberFormatter.format(visiblePosted)}
          hint="Receipts already posted"
          tone="blue"
        />
        <DocumentSummaryCard
          label="Visible Value"
          value={currencyFormatter.format(visibleValue)}
          hint="Grand total across current result set"
          tone="emerald"
          valueClassName="text-emerald-700 dark:text-emerald-300"
        />
      </section>

      <DataTable
        columns={columns}
        data={paginatedItems}
        isLoading={isLoading && !hasLoadedRows}
        isRefreshing={isTableRefreshing}
        onRefresh={refetch}
        filters={filtersContent}
        footer={footer}
        onRowClick={(item) => {
          navigate(
            `/inventory/stock-entries/${item.posting_number}?id=${item.id}`,
            {
              state: { stockEntryId: item.id },
            },
          );
        }}
        rowClassName={(item) =>
          item.status_key === "draft" ? "" : "opacity-90"
        }
        sortConfig={sortConfig}
        onSort={requestSort}
        emptyMessage="No stock in items found"
        loadingMessage="Loading stock receipts..."
        refreshMessage="Updating register..."
        refreshLabel="Refresh"
        headerRight={
          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600">
            {isTableRefreshing && (
              <span className="inline-flex h-2 w-2 rounded-full bg-sky-500/80" />
            )}
            <span>
              {items.length} of {totalCount} Records
            </span>
          </div>
        }
      />
    </DocumentPage>
  );
};

export default StockInItemsPage;
