import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import SearchableSelect from "../components/SearchableSelect";
import DataTable, { Column } from "../components/DataTable";
import { useToast } from "../hooks/useToast";
import { fetchMedicines } from "../services/medicines";
import { MedicineItem } from "../types/types";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useCategories } from "../services/common";
import { fetchSuppliers } from "../services/suppler";

const ItemMaster: React.FC = () => {
  const [categoryInputSearch, setCategoryInputSearch] = useState("");
  const [supplierInputSearch, setSupplierInputSearch] = useState("");
  const [filters, setFilters] = useState<{
    name: string;
    generic_name: string;
    category: string;
    supplier: string;
    status: string;
  }>({
    name: "",
    generic_name: "",
    category: "",
    supplier: "",
    status: "",
  });
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);
  const navigate = useNavigate();
  const { showError } = useToast();

  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 500); // wait 500ms

    return () => clearTimeout(handler);
  }, [filters]);
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["medicines", currentPage, pageSize, debouncedFilters],
    queryFn: () => fetchMedicines(currentPage, pageSize, debouncedFilters),
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (!error) return;

    const errorMessage =
      error &&
      typeof error === "object" &&
      "response" in error &&
      error.response
        ? (error.response as { data?: { error?: string; message?: string } })
            ?.data?.error ||
          (error.response as { data?: { error?: string; message?: string } })
            ?.data?.message
        : "Failed to fetch medicines. Please try again.";
    showError(errorMessage);
  }, [error, showError]);

  const { data: suppliersData } = useQuery({
    queryKey: ["suppliers", supplierInputSearch],
    queryFn: () => fetchSuppliers(1, 5, supplierInputSearch),
    staleTime: 60 * 1000,
  });

  const supplierGroups = React.useMemo(() => {
    return (
      suppliersData?.results?.map((supplier) => ({
        value: String(supplier.id),
        label: supplier.name,
        subtitle: `${supplier.phone} - ${supplier.email} - ${supplier.address}`,
      })) || []
    );
  }, [suppliersData?.results]);

  const items = useMemo<MedicineItem[]>(
    () => data?.results || [],
    [data?.results],
  );
  const totalCount = data?.count || 0;
  const paginatedItems = items;
  const hasLoadedRows = items.length > 0;
  const isTableRefreshing = isFetching && hasLoadedRows;

  const handleLoadMore = () => {
    setCurrentPage((prev) => prev + 1);
  };

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1); // Reset to first page on filter change
  };

  const handleCategoryChange = (value: string) => {
    setFilters((prev) => ({ ...prev, category: value }));
    setCurrentPage(1); // Reset to first page on filter change
  };

  const handleSupplierChange = (value: string) => {
    setFilters((prev) => ({ ...prev, supplier: value }));
    setCurrentPage(1); // Reset to first page on filter change
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when page size changes
  };

  const requestSort = (key: string) => {
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

  const { itemGroups } = useCategories(categoryInputSearch);

  const columns: Column<MedicineItem>[] = [
    {
      header: "Naming Series",
      sortKey: "naming_series",
      render: (item) => (
        <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded">
          {item.naming_series}
        </span>
      ),
    },
    {
      header: "Specification",
      sortKey: "name",
      render: (item) => (
        <div className="flex flex-col">
          <span className="font-black text-slate-800 dark:text-slate-200 text-[11px] group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
            {item.name}
          </span>
          <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-tight">
            {item.barcode}
          </span>
        </div>
      ),
    },
    {
      header: "Generic Name",
      sortKey: "generic_name",
      render: (item) => (
        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
          {item.generic_name || "-"}
        </span>
      ),
    },
    {
      header: "Category",
      sortKey: "category",
      render: (item) => (
        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
          {item.category}
        </span>
      ),
    },
    {
      header: "Supplier",
      sortKey: "supplier",
      render: (item) => (
        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
          {item.supplier || "-"}
        </span>
      ),
    },
    {
      header: "Cost Price",
      sortKey: "cost_price",
      render: (item) => (
        <span className="text-[11px] font-black text-slate-600 dark:text-slate-400">
          ${item.cost_price}
        </span>
      ),
    },
    {
      header: "Selling Price",
      sortKey: "selling_price",
      render: (item) => (
        <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-500/80">
          ${item.selling_price}
        </span>
      ),
    },
    {
      header: "Status",
      headerClassName: "text-right",
      className: "text-right",
      render: (item) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 text-[8px] font-black uppercase tracking-widest border border-emerald-500/20">
          • {item.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];

  const statusOptions = [
    { label: "Draft", value: "Draft" },
    { label: "Submitted", value: "Submitted" },
  ];

  const Filters = (
    <div className="grid grid-cols-2 gap-4 w-full items-start">
      <div className="flex-1">
        <div className="grid grid-cols-4 gap-3 min-w-max">
          <div className="space-y-1.5 min-w-[160px]">
            <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 flex items-center space-x-2 focus-within:border-emerald-500/50 transition-all">
              <input
                type="text"
                name="name"
                placeholder="Search name..."
                className="bg-transparent outline-none text-[11px] w-full font-bold text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                value={filters.name}
                onChange={handleFilterChange}
                autoComplete="off"
              />
            </div>
          </div>
          <div className="space-y-1.5 min-w-[140px]">
            <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 flex items-center space-x-2 focus-within:border-emerald-500/50 transition-all">
              <input
                type="text"
                name="generic_name"
                placeholder="Search Generic Name..."
                className="bg-transparent outline-none text-[11px] w-full font-mono font-bold text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                value={filters.generic_name}
                onChange={handleFilterChange}
                autoComplete="off"
              />
            </div>
          </div>
          <div className="space-y-1.5 min-w-[170px]">
            <SearchableSelect
              options={itemGroups}
              value={filters.category}
              onChange={handleCategoryChange}
              onSearch={setCategoryInputSearch}
              placeholder="Select Category"
              className="w-full"
              triggerClassName="bg-slate-50 dark:bg-[#1a1d21] border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white font-bold py-2"
              onCreateNew={() => navigate("/inventory/medicine-categories/new")}
              createNewText="Add New Medicine Category"
            />
          </div>
          <div className="space-y-1.5 min-w-[170px]">
            <SearchableSelect
              options={supplierGroups}
              value={filters.supplier}
              onChange={handleSupplierChange}
              onSearch={setSupplierInputSearch}
              placeholder="Select Supplier"
              className="w-full"
              triggerClassName="bg-slate-50 dark:bg-[#1a1d21] border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white font-bold py-2"
              onCreateNew={() => navigate("/inventory/suppliers/new")}
              createNewText="Add New Medicine Supplier"
            />
          </div>
          <div className="space-y-1.5 min-w-[170px]">
            <div className="relative">
              {!filters.status && (
                <span className="pointer-events-none absolute left-3 top-1/2 z-1 -translate-y-1/2 text-[11px] font-mono font-bold text-slate-400 dark:text-slate-500">
                  Status
                </span>
              )}
              <select
                autoComplete="off"
                name="status"
                value={filters.status || ""}
                onChange={handleFilterChange}
                className={`w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 pr-9 text-[11px] font-mono font-bold transition-all focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-slate-800 dark:bg-slate-800 ${
                  filters.status
                    ? "text-slate-800 dark:text-white"
                    : "text-transparent"
                }`}
              >
                <option value=""></option>
                {statusOptions.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                    className="text-slate-800 dark:text-white"
                  >
                    {option.label}
                  </option>
                ))}
              </select>
              <svg
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end">
        <div className="flex items-center space-x-2">
          <button className="flex items-center space-x-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest hover:text-slate-800 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm">
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M3 4.5h18m-18 7.5h18m-18 7.5h18"
              />
            </svg>
            <span>Filter</span>
          </button>
          <button className="flex items-center space-x-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest hover:text-slate-800 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm">
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
              />
            </svg>
            <span>Last Updated</span>
          </button>
        </div>
      </div>
    </div>
  );

  const Footer = (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {[10, 100, 500].map((size) => (
          <button
            key={size}
            onClick={() => handlePageSizeChange(size)}
            className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${
              pageSize === size
                ? "bg-slate-900 dark:bg-slate-700 text-white shadow-lg"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            {size}
          </button>
        ))}
      </div>

      <div className="flex items-center space-x-4">
        {items.length >= pageSize && (
          <button
            onClick={handleLoadMore}
            className="px-6 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl font-black text-[10px] shadow-sm transition-all uppercase tracking-widest border border-slate-200 dark:border-slate-700"
          >
            Load More Records
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <header className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate("/inventory")}
            className="p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-slate-500 dark:text-slate-400 shadow-sm"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </button>
          <div>
            <h1 className="text-lg md:text-xl font-black text-slate-800 dark:text-white tracking-tight">
              Item Registry
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-[10px] uppercase tracking-widest">
              Master Specification Database
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate("/inventory/medicines/new-medicine")}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-600/20 transition-all flex items-center space-x-2"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span>Register Item</span>
        </button>
      </header>

      <DataTable
        columns={columns}
        data={paginatedItems}
        isLoading={isLoading && !hasLoadedRows}
        isRefreshing={isTableRefreshing}
        onRefresh={refetch}
        filters={Filters}
        footer={Footer}
        onRowClick={(item) =>
          navigate(`/inventory/medicines/${item.naming_series}`)
        }
        selectable
        sortConfig={sortConfig}
        onSort={requestSort}
        loadingMessage="Accessing Master Registry..."
        emptyMessage="No items found in master database"
        refreshMessage="Updating"
        refreshLabel="Refresh"
        headerRight={
          <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest dark:text-slate-600">
            {isTableRefreshing && (
              <span className="inline-flex h-2 w-2 rounded-full bg-sky-500/80" />
            )}
            <span>
              {items.length} of {totalCount} Records
            </span>
          </div>
        }
      />
    </div>
  );
};

export default ItemMaster;
