import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import SearchableSelect from "../components/SearchableSelect";
import DataTable, { Column } from "../components/DataTable";
import { useToast } from "../hooks/useToast";
import { fetchMedicines } from "../services/medicines";
import { MedicineItem } from "../types/types";
import { useQuery } from "@tanstack/react-query";
import { useCategories } from "../services/common";
import { fetchSuppliers } from "../services/suppler";

const ItemMaster: React.FC = () => {
  const [items, setItems] = useState<MedicineItem[]>([]);
  const [categoryInputSearch, setCategoryInputSearch] = useState("");
  const [supplierInputSearch, setSupplierInputSearch] = useState("");
  const [filters, setFilters] = useState<{
    name: string;
    generic_name: string;
    category: string;
    supplier: string;
  }>({
    name: "",
    generic_name: "",
    category: "",
    supplier: "",
  });
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
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
  const requestRef = useRef(0);
  const { data } = useQuery({
    queryKey: ["medicines", currentPage, pageSize, debouncedFilters],
    queryFn: () =>
      fetchMedicines(currentPage, pageSize, debouncedFilters),
    staleTime: 60 * 1000,
  });
  useEffect(() => {
    const requestId = ++requestRef.current;


    const loadData = async () => {
      try {
        if (requestRef.current === requestId) {
          setItems(data?.results || []);
          setTotalCount(data?.count || 0);
        }
      } catch (e) {
        console.error("Items fetch failed", e);

        if (e.response?.status !== 401) {
          const errorMessage =
            e.response?.data?.message ||
            e.response?.data?.error ||
            "Failed to fetch medicines. Please try again.";
          showError(errorMessage);
        }
      }
    };

    loadData();
  }, [data?.results, data?.count, showError]);



  const { data: suppliersData } = useQuery({
    queryKey: ["suppliers", supplierInputSearch],
    queryFn: () => fetchSuppliers(1, 5, supplierInputSearch),
    staleTime: 60 * 1000,
  });

  const supplierGroups = React.useMemo(() => {
    return suppliersData?.results?.map((supplier) => ({
      value: String(supplier.id),
      label: supplier.name,
      subtitle: `${supplier.phone} - ${supplier.email} - ${supplier.address}`,
    })) || [];
  }, [suppliersData?.results]);



  const paginatedItems = items;

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

  const Filters = (
    <div className="flex justify-between gap-4">
      <div className="flex-1">
        <div className="flex flex-nowrap gap-3 min-w-max">
          <div className="space-y-1.5 min-w-[160px]">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
              Product Name
            </label>
            <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 flex items-center space-x-2 focus-within:border-emerald-500/50 transition-all">
              <input
                type="text"
                name="name"
                placeholder="Search name..."
                className="bg-transparent outline-none text-[11px] w-full font-bold text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                value={filters.name}
                onChange={handleFilterChange}
              />
            </div>
          </div>
          <div className="space-y-1.5 min-w-[140px]">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
              Generic Name
            </label>
            <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 flex items-center space-x-2 focus-within:border-emerald-500/50 transition-all">
              <input
                type="text"
                name="generic_name"
                placeholder="Search Generic Name..."
                className="bg-transparent outline-none text-[11px] w-full font-mono font-bold text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                value={filters.generic_name}
                onChange={handleFilterChange}
              />
            </div>
          </div>
          <div className="space-y-1.5 min-w-[170px]">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
              Medicine Category
            </label>
            <SearchableSelect
              options={itemGroups}
              value={filters.category}
              onChange={handleCategoryChange}
              onSearch={setCategoryInputSearch}
              placeholder="Select Category"
              className="w-full"
              triggerClassName="bg-slate-50 dark:bg-[#1a1d21] border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white font-bold py-2"
              onCreateNew={() => navigate("/items/medicine-categories/new")}
              createNewText="Add New Medicine Category"
            />
          </div>
          <div className="space-y-1.5 min-w-[170px]">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
              Supplier
            </label>
            <SearchableSelect
              options={supplierGroups}
              value={filters.supplier}
              onChange={handleSupplierChange}
              onSearch={setSupplierInputSearch}
              placeholder="Select Supplier"
              className="w-full"
              triggerClassName="bg-slate-50 dark:bg-[#1a1d21] border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white font-bold py-2"
              onCreateNew={() => navigate("/suppliers/medicine-suppliers/new")}
              createNewText="Add New Medicine Supplier"
            />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end pt-2">
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
            className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${pageSize === size
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
          onClick={() => navigate("/inventory/medicines/new")}
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
        filters={Filters}
        footer={Footer}
        onRowClick={(item) => navigate(`/inventory/medicines/${item.naming_series}`)}
        selectable
        sortConfig={sortConfig}
        onSort={requestSort}
        loadingMessage="Accessing Master Registry..."
        emptyMessage="No items found in master database"
        headerRight={
          <div className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">
            {items.length} of {totalCount} Records
          </div>
        }
      />
    </div>
  );
};

export default ItemMaster;
