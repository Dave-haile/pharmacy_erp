import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ChevronDown,
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  Printer,
  UploadCloud,
} from "lucide-react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import SearchableSelect from "../../components/SearchableSelect";
import DataTable, { Column } from "../../components/DataTable";
import { useToast } from "../../hooks/useToast";
import {
  exportMedicines,
  fetchMedicines,
  MedicineFilters,
} from "../../services/medicines";
import { MedicineItem, Supplier } from "../../types/types";
import { useCategories } from "../../services/common";
import { fetchSuppliers } from "../../services/suppler";

const defaultFilters: MedicineFilters = {
  name: "",
  generic_name: "",
  category: "",
  supplier: "",
  status: "",
};

type RegistryExportFormat = "csv" | "json" | "xlsx" | "pdf";

const resolveDownloadFileName = (
  contentDisposition: string | undefined,
  fallback: string,
) => {
  if (!contentDisposition) return fallback;

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const simpleMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  return simpleMatch?.[1] || fallback;
};

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
};

const ItemMaster: React.FC = () => {
  const [categoryInputSearch, setCategoryInputSearch] = useState("");
  const [supplierInputSearch, setSupplierInputSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof MedicineItem;
    direction: "asc" | "desc";
  } | null>(null);
  const [debouncedFilters, setDebouncedFilters] =
    useState<MedicineFilters>(defaultFilters);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize filters from URL query params
  const [filters, setFilters] = useState<MedicineFilters>(() => {
    return {
      name: searchParams.get("name") || "",
      generic_name: searchParams.get("generic_name") || "",
      category: searchParams.get("category") || "",
      supplier: searchParams.get("supplier") || "",
      status: searchParams.get("status") || "",
    };
  });

  // Initialize currentPage from URL query params
  const [currentPage, setCurrentPage] = useState(() => {
    const pageParam = searchParams.get("page");
    return pageParam ? parseInt(pageParam, 10) : 1;
  });

  // Update URL when filters or page change
  useEffect(() => {
    const params = new URLSearchParams();

    if (filters.name) params.set("name", filters.name);
    if (filters.generic_name) params.set("generic_name", filters.generic_name);
    if (filters.category) params.set("category", filters.category);
    if (filters.supplier) params.set("supplier", filters.supplier);
    if (filters.status) params.set("status", filters.status);
    if (currentPage > 1) params.set("page", String(currentPage));

    setSearchParams(params, { replace: true });
  }, [filters, currentPage, setSearchParams]);
  const { showError, showInfo, showSuccess } = useToast();

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 500);

    return () => clearTimeout(handler);
  }, [filters]);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["medicines", currentPage, pageSize, debouncedFilters],
    queryFn: () =>
      fetchMedicines(currentPage, pageSize, {
        ...debouncedFilters,
        include_inactive: true,
      }),
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
    showError(
      errorMessage || "An unknown error occurred while fetching medicines.",
    );
  }, [error, showError]);

  const { data: suppliersData } = useQuery({
    queryKey: ["suppliers", supplierInputSearch],
    queryFn: () => fetchSuppliers(1, 5, supplierInputSearch),
    staleTime: 60 * 1000,
  });

  const supplierGroups = React.useMemo(() => {
    return (
      suppliersData?.results?.map((supplier: Supplier) => ({
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
    setCurrentPage(1);
  };

  const handleCategoryChange = (value: string) => {
    setFilters((prev) => ({ ...prev, category: value }));
    setCurrentPage(1);
  };

  const handleSupplierChange = (value: string) => {
    setFilters((prev) => ({ ...prev, supplier: value }));
    setCurrentPage(1);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const requestSort = (key: keyof MedicineItem) => {
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

  const handleExport = async (format: RegistryExportFormat) => {
    setIsExportMenuOpen(false);
    setIsExporting(true);

    try {
      const { blob, contentDisposition } = await exportMedicines(format, {
        ...filters,
        include_inactive: true,
      });
      const fallbackName = `medicine-registry.${format}`;
      downloadBlob(
        blob,
        resolveDownloadFileName(contentDisposition, fallbackName),
      );

      if (format === "pdf") {
        showInfo("Downloaded the PDF export generated by the backend.");
      } else {
        showSuccess("Downloaded the export generated by the backend.");
      }
    } catch (exportError) {
      console.error("Medicine export failed", exportError);
      showError("Failed to export the filtered medicine records.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = () => {
    navigate("/inventory/medicines/import");
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
          * {item.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];

  const statusOptions = [
    { label: "Draft", value: "Draft" },
    { label: "Submitted", value: "Submitted" },
  ];

  const exportOptions: Array<{
    key: RegistryExportFormat;
    label: string;
    icon: React.ReactNode;
  }> = [
    {
      key: "csv",
      label: "CSV",
      icon: <FileText className="h-4 w-4" />,
    },
    {
      key: "xlsx",
      label: "Excel",
      icon: <FileSpreadsheet className="h-4 w-4" />,
    },
    {
      key: "json",
      label: "JSON",
      icon: <FileJson className="h-4 w-4" />,
    },
    {
      key: "pdf",
      label: "PDF",
      icon: <Printer className="h-4 w-4" />,
    },
  ];

  const Filters = (
    <div className="grid grid-cols-2 gap-4 w-full items-start">
      <div className="flex-1">
        <div className="grid grid-cols-4 gap-3 min-w-max">
          <div className="space-y-1.5 min-w-40">
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
          <div className="space-y-1.5 min-w-35">
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
          <div className="space-y-1.5 min-w-42.5">
            <SearchableSelect
              options={itemGroups}
              value={filters.category}
              onChange={handleCategoryChange}
              onSearch={setCategoryInputSearch}
              placeholder="Select Category"
              className="w-full"
              triggerClassName="bg-slate-50 dark:bg-[#1a1d21] border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white font-bold py-2"
              onCreateNew={() => navigate("/inventory/categories/new")}
              createNewText="Add New Medicine Category"
            />
          </div>
          <div className="space-y-1.5 min-w-42.5">
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
          <div className="space-y-1.5 min-w-42.5">
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
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsExportMenuOpen((open) => !open)}
              disabled={isExporting}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest hover:text-slate-800 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm disabled:opacity-60"
            >
              <Download className="w-3 h-3" />
              <span>{isExporting ? "Exporting" : "Export"}</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            {isExportMenuOpen && (
              <>
                <button
                  type="button"
                  onClick={() => setIsExportMenuOpen(false)}
                  className="fixed inset-0 z-20 cursor-default"
                />
                <div className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                  {exportOptions.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => {
                        void handleExport(option.key);
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-[11px] font-bold text-slate-600 transition-all hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <span className="text-slate-400">{option.icon}</span>
                      <span>Export {option.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={handleImportClick}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest hover:text-slate-800 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm"
          >
            <UploadCloud className="w-3 h-3" />
            <span>Import</span>
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
