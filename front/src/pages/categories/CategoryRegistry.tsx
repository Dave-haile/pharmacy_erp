import React, { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  FolderTree,
  Plus,
  Search,
} from "lucide-react";

import DataTable, { Column } from "../../components/DataTable";
import SearchableSelect from "../../components/SearchableSelect";
import { useToast } from "../../hooks/useToast";
import { fetchCategories, CategoryFilters } from "../../services/categories";
import { useCategories } from "../../services/common";
import { Category } from "../../types/types";

type SortConfig = {
  key: keyof Category;
  direction: "asc" | "desc";
} | null;

const CategoryRegistry: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showError } = useToast();
  const [parentSearch, setParentSearch] = useState("");

  // Initialize filters from URL query params
  const [filters, setFilters] = useState<CategoryFilters>(() => ({
    name: searchParams.get("name") || "",
    description: searchParams.get("description") || "",
    parent_category: searchParams.get("parent_category") || "",
  }));

  const [debouncedFilters, setDebouncedFilters] =
    useState<CategoryFilters>(filters);

  // Initialize currentPage from URL query params
  const [currentPage, setCurrentPage] = useState(() => {
    const pageParam = searchParams.get("page");
    return pageParam ? parseInt(pageParam, 10) : 1;
  });

  const [pageSize, setPageSize] = useState(10);
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  // Update URL when filters or page change
  useEffect(() => {
    const params = new URLSearchParams();

    if (filters.name) params.set("name", filters.name);
    if (filters.description) params.set("description", filters.description);
    if (filters.parent_category) params.set("parent_category", filters.parent_category);
    if (currentPage > 1) params.set("page", String(currentPage));

    setSearchParams(params, { replace: true });
  }, [filters, currentPage, setSearchParams]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedFilters(filters);
    }, 350);
    return () => window.clearTimeout(timeoutId);
  }, [filters]);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["category-registry", currentPage, pageSize, debouncedFilters],
    queryFn: () => fetchCategories(currentPage, pageSize, debouncedFilters),
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
        : "Failed to fetch categories. Please try again.";

    showError(errorMessage);
  }, [error, showError]);

  const items = useMemo<Category[]>(() => data?.results || [], [data?.results]);
  const totalCount = data?.count || 0;
  const hasLoadedRows = items.length > 0;
  const isTableRefreshing = isFetching && hasLoadedRows;
  const { itemGroups } = useCategories(parentSearch);

  const sortedItems = useMemo(() => {
    if (!sortConfig) return items;

    return [...items].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      const normalizedA = String(aValue).toLowerCase();
      const normalizedB = String(bValue).toLowerCase();

      if (normalizedA < normalizedB) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (normalizedA > normalizedB) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [items, sortConfig]);

  const requestSort = (key: keyof Category) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig?.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const columns: Column<Category>[] = [
    {
      header: "Category",
      sortKey: "name",
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
            <FolderTree className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-black text-slate-800 dark:text-slate-100">
              {item.name}
            </span>
            <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400">
              {item.naming_series || item.category_name || `#${item.id}`}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Description",
      sortKey: "description",
      render: (item) => (
        <span className="line-clamp-2 text-[10px] font-medium text-slate-500 dark:text-slate-400">
          {item.description || "-"}
        </span>
      ),
    },
    {
      header: "Parent",
      sortKey: "parent_category_name",
      render: (item) => (
        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
          {item.parent_category_name || "Root"}
        </span>
      ),
    },
    {
      header: "Medicines",
      headerClassName: "text-right",
      className: "text-right",
      sortKey: "medicine_count",
      render: (item) => (
        <span className="text-[10px] font-black text-slate-700 dark:text-slate-200">
          {item.medicine_count ?? 0}
        </span>
      ),
    },
    {
      header: "Subcategories",
      headerClassName: "text-right",
      className: "text-right",
      sortKey: "child_count",
      render: (item) => (
        <span className="text-[10px] font-black text-slate-700 dark:text-slate-200">
          {item.child_count ?? 0}
        </span>
      ),
    },
    {
      header: "Created",
      sortKey: "created_at",
      render: (item) => (
        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
          {new Date(item.created_at).toLocaleDateString()}
        </span>
      ),
    },
  ];

  const Filters = (
    <div className="flex flex-col space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="relative rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filters.name || ""}
            onChange={(e) => {
              setFilters((prev) => ({ ...prev, name: e.target.value }));
              setCurrentPage(1);
            }}
            placeholder="Search Category Name..."
            className="w-full bg-transparent pl-6 text-[11px] font-bold text-slate-800 outline-none placeholder:text-slate-400 dark:text-white"
          />
        </div>
        <div className="relative rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filters.description || ""}
            onChange={(e) => {
              setFilters((prev) => ({ ...prev, description: e.target.value }));
              setCurrentPage(1);
            }}
            placeholder="Search Description..."
            className="w-full bg-transparent pl-6 text-[11px] font-bold text-slate-800 outline-none placeholder:text-slate-400 dark:text-white"
          />
        </div>
        <SearchableSelect
          options={itemGroups}
          value={filters.parent_category || ""}
          onChange={(value) => {
            setFilters((prev) => ({ ...prev, parent_category: value }));
            setCurrentPage(1);
          }}
          onSearch={setParentSearch}
          placeholder="Select Parent Category"
          className="w-full"
          triggerClassName="bg-slate-50 dark:bg-[#1a1d21] border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white font-bold py-2"
          onCreateNew={() => navigate("/inventory/categories/new")}
          createNewText="Add New Category"
        />
      </div>
    </div>
  );

  const Footer = (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-800">
        {[10, 25, 50].map((size) => (
          <button
            key={size}
            onClick={() => {
              setPageSize(size);
              setCurrentPage(1);
            }}
            className={`rounded-lg px-4 py-1.5 text-[10px] font-black transition-all ${
              pageSize === size
                ? "bg-slate-900 text-white dark:bg-slate-700"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            {size}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3">
        {data?.has_previous && (
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Previous
          </button>
        )}
        {data?.has_next && (
          <button
            onClick={() => setCurrentPage((prev) => prev + 1)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate("/inventory")}
            className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-800 dark:text-white md:text-xl">
              Category Registry
            </h1>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Inventory classification structure
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate("/inventory/categories/new")}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-500"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Category</span>
        </button>
      </header>

      <DataTable
        columns={columns}
        data={sortedItems}
        isLoading={isLoading && !hasLoadedRows}
        isRefreshing={isTableRefreshing}
        onRefresh={refetch}
        filters={Filters}
        footer={Footer}
        onRowClick={(item) =>
          navigate(`/inventory/categories/${item.naming_series || item.id}`)
        }
        selectable
        sortConfig={sortConfig}
        onSort={requestSort}
        loadingMessage="Loading category registry..."
        emptyMessage="No categories found"
        refreshMessage="Updating"
        refreshLabel="Refresh"
        headerRight={
          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600">
            {isTableRefreshing && (
              <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-sky-500/80" />
            )}
            <span>
              {items.length} of {totalCount} records
            </span>
          </div>
        }
      />
    </div>
  );
};

export default CategoryRegistry;
