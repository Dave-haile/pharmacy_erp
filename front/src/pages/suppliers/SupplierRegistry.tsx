// import React, { useEffect, useMemo, useState } from "react";
// import { keepPreviousData, useQuery } from "@tanstack/react-query";
// import { useNavigate } from "react-router-dom";
// import DataTable, { Column } from "../../components/DataTable";
// import { useToast } from "../../hooks/useToast";
// import {
//   fetchSuppliers,
//   SupplierFilters,
// } from "../../services/suppler";
// import { Supplier } from "../../types/types";

// type SortConfig = {
//   key: keyof Supplier;
//   direction: "asc" | "desc";
// } | null;

// const statusClassMap: Record<string, string> = {
//   Draft:
//     "bg-amber-500/10 text-amber-700 border border-amber-500/20 dark:text-amber-400",
//   Submitted:
//     "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 dark:text-emerald-400",
//   Cancelled:
//     "bg-rose-500/10 text-rose-700 border border-rose-500/20 dark:text-rose-400",
// };

// const SupplierRegistry: React.FC = () => {
//   const navigate = useNavigate();
//   const { showError } = useToast();
//   const [filters, setFilters] = useState<SupplierFilters>({
//     search: "",
//     status: "",
//     is_active: "",
//   });
//   const [debouncedFilters, setDebouncedFilters] =
//     useState<SupplierFilters>(filters);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [pageSize, setPageSize] = useState(10);
//   const [sortConfig, setSortConfig] = useState<SortConfig>(null);

//   useEffect(() => {
//     const timeoutId = window.setTimeout(() => {
//       setDebouncedFilters(filters);
//     }, 350);

//     return () => window.clearTimeout(timeoutId);
//   }, [filters]);

//   const { data, isLoading, isFetching, error, refetch } = useQuery({
//     queryKey: ["supplier-registry", currentPage, pageSize, debouncedFilters],
//     queryFn: () => fetchSuppliers(currentPage, pageSize, debouncedFilters),
//     staleTime: 60 * 1000,
//     placeholderData: keepPreviousData,
//   });

//   useEffect(() => {
//     if (!error) return;

//     const errorMessage =
//       error &&
//       typeof error === "object" &&
//       "response" in error &&
//       error.response
//         ? (error.response as { data?: { error?: string; message?: string } })
//             ?.data?.error ||
//           (error.response as { data?: { error?: string; message?: string } })
//             ?.data?.message
//         : "Failed to fetch suppliers. Please try again.";

//     showError(errorMessage);
//   }, [error, showError]);

//   const items = useMemo<Supplier[]>(() => data?.results || [], [data?.results]);
//   const totalCount = data?.count || 0;
//   const hasLoadedRows = items.length > 0;
//   const isTableRefreshing = isFetching && hasLoadedRows;

//   const sortedItems = useMemo(() => {
//     if (!sortConfig) return items;

//     return [...items].sort((a, b) => {
//       const aValue = a[sortConfig.key];
//       const bValue = b[sortConfig.key];

//       if (aValue == null && bValue == null) return 0;
//       if (aValue == null) return 1;
//       if (bValue == null) return -1;

//       const normalizedA = String(aValue).toLowerCase();
//       const normalizedB = String(bValue).toLowerCase();

//       if (normalizedA < normalizedB) {
//         return sortConfig.direction === "asc" ? -1 : 1;
//       }
//       if (normalizedA > normalizedB) {
//         return sortConfig.direction === "asc" ? 1 : -1;
//       }
//       return 0;
//     });
//   }, [items, sortConfig]);

//   const requestSort = (key: keyof Supplier) => {
//     let direction: "asc" | "desc" = "asc";
//     if (sortConfig?.key === key && sortConfig.direction === "asc") {
//       direction = "desc";
//     }
//     setSortConfig({ key, direction });
//   };

//   const columns: Column<Supplier>[] = [
//     {
//       header: "Supplier",
//       sortKey: "name",
//       render: (item) => (
//         <div className="flex flex-col">
//           <span className="text-[11px] font-black text-slate-800 dark:text-slate-100">
//             {item.name}
//           </span>
//           <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400">
//             #{item.id}
//           </span>
//         </div>
//       ),
//     },
//     {
//       header: "Contact Person",
//       sortKey: "contact_person",
//       render: (item) => (
//         <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
//           {item.contact_person || "-"}
//         </span>
//       ),
//     },
//     {
//       header: "Contact",
//       render: (item) => (
//         <div className="flex flex-col">
//           <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
//             {item.phone || "-"}
//           </span>
//           <span className="text-[9px] text-slate-500 dark:text-slate-400">
//             {item.email || "-"}
//           </span>
//         </div>
//       ),
//     },
//     {
//       header: "Address",
//       sortKey: "address",
//       render: (item) => (
//         <span className="line-clamp-2 text-[10px] font-medium text-slate-500 dark:text-slate-400">
//           {item.address || "-"}
//         </span>
//       ),
//     },
//     {
//       header: "Items",
//       headerClassName: "text-right",
//       className: "text-right",
//       sortKey: "medicine_count",
//       render: (item) => (
//         <span className="text-[10px] font-black text-slate-700 dark:text-slate-200">
//           {item.medicine_count ?? 0}
//         </span>
//       ),
//     },
//     {
//       header: "Status",
//       sortKey: "status",
//       render: (item) => (
//         <span
//           className={`inline-flex items-center rounded-md px-2 py-1 text-[8px] font-black uppercase tracking-[0.2em] ${
//             statusClassMap[item.status || "Draft"] || statusClassMap.Draft
//           }`}
//         >
//           {item.status || "Draft"}
//         </span>
//       ),
//     },
//     {
//       header: "Activity",
//       render: (item) => (
//         <span
//           className={`inline-flex items-center rounded-md px-2 py-1 text-[8px] font-black uppercase tracking-[0.2em] ${
//             item.is_active
//               ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 dark:text-emerald-400"
//               : "bg-slate-500/10 text-slate-700 border border-slate-500/20 dark:text-slate-400"
//           }`}
//         >
//           {item.is_active ? "Active" : "Inactive"}
//         </span>
//       ),
//     },
//   ];

//   const Filters = (
//     <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
//       <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
//         <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800">
//           <input
//             type="text"
//             value={filters.search || ""}
//             onChange={(e) => {
//               setFilters((prev) => ({ ...prev, search: e.target.value }));
//               setCurrentPage(1);
//             }}
//             placeholder="Search supplier, contact, phone, email..."
//             className="w-full bg-transparent text-[11px] font-bold text-slate-800 outline-none placeholder:text-slate-400 dark:text-white"
//           />
//         </div>
//         <div className="relative">
//           <select
//             value={filters.status || ""}
//             onChange={(e) => {
//               setFilters((prev) => ({ ...prev, status: e.target.value }));
//               setCurrentPage(1);
//             }}
//             className="w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 pr-9 text-[11px] font-bold text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100"
//           >
//             <option value="">All statuses</option>
//             <option value="Draft">Draft</option>
//             <option value="Submitted">Submitted</option>
//             <option value="Cancelled">Cancelled</option>
//           </select>
//         </div>
//         <div className="relative">
//           <select
//             value={filters.is_active || ""}
//             onChange={(e) => {
//               setFilters((prev) => ({ ...prev, is_active: e.target.value }));
//               setCurrentPage(1);
//             }}
//             className="w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 pr-9 text-[11px] font-bold text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100"
//           >
//             <option value="">All activity states</option>
//             <option value="true">Active</option>
//             <option value="false">Inactive</option>
//           </select>
//         </div>
//       </div>
//       <div className="flex items-center justify-end">
//         <button
//           onClick={() => navigate("/inventory/suppliers/new")}
//           className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-500"
//         >
//           <span>New Supplier</span>
//         </button>
//       </div>
//     </div>
//   );

//   const Footer = (
//     <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
//       <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-800">
//         {[10, 25, 50].map((size) => (
//           <button
//             key={size}
//             onClick={() => {
//               setPageSize(size);
//               setCurrentPage(1);
//             }}
//             className={`rounded-lg px-4 py-1.5 text-[10px] font-black transition-all ${
//               pageSize === size
//                 ? "bg-slate-900 text-white dark:bg-slate-700"
//                 : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
//             }`}
//           >
//             {size}
//           </button>
//         ))}
//       </div>
//       <div className="flex items-center gap-3">
//         {data?.has_previous && (
//           <button
//             onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
//             className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300"
//           >
//             Previous
//           </button>
//         )}
//         {data?.has_next && (
//           <button
//             onClick={() => setCurrentPage((prev) => prev + 1)}
//             className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300"
//           >
//             Next
//           </button>
//         )}
//       </div>
//     </div>
//   );

//   return (
//     <div className="space-y-6 animate-in fade-in duration-500 pb-12">
//       <header className="flex items-center justify-between gap-4">
//         <div className="flex items-center space-x-3">
//           <button
//             onClick={() => navigate("/inventory")}
//             className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
//           >
//             <svg
//               className="h-3.5 w-3.5"
//               fill="none"
//               stroke="currentColor"
//               viewBox="0 0 24 24"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth="2.5"
//                 d="M10 19l-7-7m0 0l7-7m-7 7h18"
//               />
//             </svg>
//           </button>
//           <div>
//             <h1 className="text-lg font-black tracking-tight text-slate-800 dark:text-white md:text-xl">
//               Supplier Registry
//             </h1>
//             <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
//               Approved vendor directory
//             </p>
//           </div>
//         </div>
//       </header>

//       <DataTable
//         columns={columns}
//         data={sortedItems}
//         isLoading={isLoading && !hasLoadedRows}
//         isRefreshing={isTableRefreshing}
//         onRefresh={refetch}
//         filters={Filters}
//         footer={Footer}
//         onRowClick={(item) => navigate(`/inventory/suppliers/${item.id}`)}
//         selectable
//         sortConfig={sortConfig}
//         onSort={requestSort}
//         loadingMessage="Loading supplier registry..."
//         emptyMessage="No suppliers found"
//         refreshMessage="Updating"
//         refreshLabel="Refresh"
//         headerRight={
//           <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600">
//             {isTableRefreshing && (
//               <span className="inline-flex h-2 w-2 rounded-full bg-sky-500/80" />
//             )}
//             <span>
//               {items.length} of {totalCount} records
//             </span>
//           </div>
//         }
//       />
//     </div>
//   );
// };

// export default SupplierRegistry;
import React, { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import DataTable, { Column } from "../../components/DataTable";
import { useToast } from "../../hooks/useToast";
import { fetchSuppliers, SupplierFilters } from "../../services/suppler";
import { Supplier } from "../../types/types";
import {
  Plus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Building2,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";

type SortConfig = {
  key: keyof Supplier;
  direction: "asc" | "desc";
} | null;

const statusClassMap: Record<string, string> = {
  Draft:
    "bg-amber-500/10 text-amber-700 border border-amber-500/20 dark:text-amber-400",
  Submitted:
    "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 dark:text-emerald-400",
  Cancelled:
    "bg-rose-500/10 text-rose-700 border border-rose-500/20 dark:text-rose-400",
};

const SupplierRegistry: React.FC = () => {
  const navigate = useNavigate();
  const { showError } = useToast();
  const [filters, setFilters] = useState<SupplierFilters>({
    name: "",
    contact_person: "",
    phone: "",
    email: "",
    address: "",
    status: "",
    is_active: "",
  });
  const [debouncedFilters, setDebouncedFilters] =
    useState<SupplierFilters>(filters);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedFilters(filters);
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [filters]);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["supplier-registry", currentPage, pageSize, debouncedFilters],
    queryFn: () => fetchSuppliers(currentPage, pageSize, debouncedFilters),
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
        : "Failed to fetch suppliers. Please try again.";

    showError(errorMessage);
  }, [error, showError]);

  const items = useMemo<Supplier[]>(() => data?.results || [], [data?.results]);
  const totalCount = data?.count || 0;
  const hasLoadedRows = items.length > 0;
  const isTableRefreshing = isFetching && hasLoadedRows;

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

  const requestSort = (key: keyof Supplier) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig?.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const statusOptions = [
    { value: "", label: "" },
    { value: "Draft", label: "Draft" },
    { value: "Submitted", label: "Submitted" },
    { value: "Cancelled", label: "Cancelled" },
  ];

  const columns: Column<Supplier>[] = [
    {
      header: "Supplier",
      sortKey: "name",
      render: (item) => (
        <div className="flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
            <Building2 className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-black text-slate-800 dark:text-slate-100">
              {item.name}
            </span>
            <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400">
              #{item.id}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Contact Person",
      sortKey: "contact_person",
      render: (item) => (
        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
          {item.contact_person || "-"}
        </span>
      ),
    },
    {
      header: "Contact Info",
      render: (item) => (
        <div className="flex flex-col space-y-0.5">
          <div className="flex items-center space-x-1.5">
            <Phone className="h-2.5 w-2.5 text-slate-400" />
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
              {item.phone || "-"}
            </span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Mail className="h-2.5 w-2.5 text-slate-400" />
            <span className="text-[9px] text-slate-500 dark:text-slate-400">
              {item.email || "-"}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Address",
      sortKey: "address",
      render: (item) => (
        <div className="flex items-start space-x-1.5 max-w-[200px]">
          <MapPin className="mt-0.5 h-2.5 w-2.5 shrink-0 text-slate-400" />
          <span className="line-clamp-2 text-[10px] font-medium text-slate-500 dark:text-slate-400">
            {item.address || "-"}
          </span>
        </div>
      ),
    },
    {
      header: "Items",
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
      header: "Status",
      sortKey: "status",
      render: (item) => (
        <span
          className={`inline-flex items-center rounded-md px-2 py-1 text-[8px] font-black uppercase tracking-[0.2em] ${statusClassMap[item.status || "Draft"] || statusClassMap.Draft
            }`}
        >
          {item.status || "Draft"}
        </span>
      ),
    },
    {
      header: "Activity",
      render: (item) => (
        <span
          className={`inline-flex items-center rounded-md px-2 py-1 text-[8px] font-black uppercase tracking-[0.2em] ${item.is_active
              ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 dark:text-emerald-400"
              : "bg-slate-500/10 text-slate-700 border border-slate-500/20 dark:text-slate-400"
            }`}
        >
          {item.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];

  const Filters = (
    <div className="flex flex-col space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="relative rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filters.name || ""}
            onChange={(e) => {
              setFilters((prev) => ({ ...prev, name: e.target.value }));
              setCurrentPage(1);
            }}
            placeholder="Search Name..."
            className="w-full bg-transparent pl-6 text-[11px] font-bold text-slate-800 outline-none placeholder:text-slate-400 dark:text-white"
          />
        </div>
        <div className="relative rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filters.contact_person || ""}
            onChange={(e) => {
              setFilters((prev) => ({
                ...prev,
                contact_person: e.target.value,
              }));
              setCurrentPage(1);
            }}
            placeholder="Search Contact..."
            className="w-full bg-transparent pl-6 text-[11px] font-bold text-slate-800 outline-none placeholder:text-slate-400 dark:text-white"
          />
        </div>
        <div className="relative rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filters.phone || ""}
            onChange={(e) => {
              setFilters((prev) => ({ ...prev, phone: e.target.value }));
              setCurrentPage(1);
            }}
            placeholder="Search Phone..."
            className="w-full bg-transparent pl-6 text-[11px] font-bold text-slate-800 outline-none placeholder:text-slate-400 dark:text-white"
          />
        </div>
        <div className="relative rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filters.email || ""}
            onChange={(e) => {
              setFilters((prev) => ({ ...prev, email: e.target.value }));
              setCurrentPage(1);
            }}
            placeholder="Search Email..."
            className="w-full bg-transparent pl-6 text-[11px] font-bold text-slate-800 outline-none placeholder:text-slate-400 dark:text-white"
          />
        </div>
        <div className="relative rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filters.address || ""}
            onChange={(e) => {
              setFilters((prev) => ({ ...prev, address: e.target.value }));
              setCurrentPage(1);
            }}
            placeholder="Search Address..."
            className="w-full bg-transparent pl-6 text-[11px] font-bold text-slate-800 outline-none placeholder:text-slate-400 dark:text-white"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
            onChange={(e) => {
              setFilters((prev) => ({ ...prev, status: e.target.value }));
              setCurrentPage(1);
            }}
            className={`w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 pr-9 text-[11px] font-bold text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100
              ${filters.status ? "text-slate-800 dark:text-white" : "text-transparent"}`}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Filter className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 pointer-events-none text-slate-400" />
        </div>
        <div className="relative">
          {!filters.is_active && (
            <span className="pointer-events-none absolute left-3 top-1/2 z-1 -translate-y-1/2 text-[11px] font-mono font-bold text-slate-400 dark:text-slate-500">
              Active
            </span>
          )}
          <select
            autoComplete={false}
            value={filters.is_active || ""}
            onChange={(e) => {
              setFilters((prev) => ({ ...prev, is_active: e.target.value }));
              setCurrentPage(1);
            }}
            className={`w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 pr-9 text-[11px] font-bold text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100
              ${filters.status
                ? "text-slate-800 dark:text-white"
                : "text-transparent"
              }
              `}
          >
            <option value=""></option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <Filter className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 pointer-events-none text-slate-400" />
        </div>
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
            className={`rounded-lg px-4 py-1.5 text-[10px] font-black transition-all ${pageSize === size
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
              Supplier Registry
            </h1>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Approved vendor directory
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/inventory/suppliers/new-supplier")}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-500"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Supplier</span>
          </button>
        </div>
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
          navigate(`/inventory/suppliers/${item.naming_series ?? item.id}`)
        }
        selectable
        sortConfig={sortConfig}
        onSort={requestSort}
        loadingMessage="Loading supplier registry..."
        emptyMessage="No suppliers found"
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

export default SupplierRegistry;
