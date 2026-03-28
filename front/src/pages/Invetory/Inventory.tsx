import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import DataTable, { Column } from "../../components/DataTable";
import {
  DocumentField,
  DocumentHeader,
  DocumentPage,
  DocumentSummaryCard,
  documentInputClassName,
  documentPrimaryButtonClassName,
} from "../../components/common/DocumentUI";
import { fetchInventoryOverview } from "../../services/inventory";
import { InventoryBatchItem, InventoryOverviewResponse } from "../../types/types";

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const statusClassMap: Record<InventoryBatchItem["status_key"], string> = {
  in_stock:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  low_stock:
    "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  expiring_soon:
    "border-orange-500/20 bg-orange-500/10 text-orange-600 dark:text-orange-400",
  expired: "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400",
};

const InventoryRegistryPage: React.FC = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    medicine: "",
    batch: "",
    sku: "",
    status: "",
  });
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof InventoryBatchItem;
    direction: "asc" | "desc";
  } | null>(null);
  const [inventory, setInventory] = useState<InventoryOverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedFilters(filters), 250);
    return () => clearTimeout(timer);
  }, [filters]);

  const loadInventory = async () => {
    setIsLoading(true);
    try {
      const response = await fetchInventoryOverview(debouncedFilters);
      setInventory(response);
    } catch (error) {
      console.error("Inventory registry load error:", error);
      setInventory(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadInventory();
  }, [debouncedFilters]);

  const items = useMemo(() => inventory?.items ?? [], [inventory?.items]);

  const sortedItems = useMemo(() => {
    const next = [...items];

    if (!sortConfig) {
      next.sort(
        (left, right) =>
          new Date(left.received_at).getTime() - new Date(right.received_at).getTime(),
      );
      return next;
    }

    next.sort((left, right) => {
      const leftValue = left[sortConfig.key];
      const rightValue = right[sortConfig.key];

      if (leftValue == null && rightValue == null) return 0;
      if (leftValue == null) return 1;
      if (rightValue == null) return -1;
      if (leftValue < rightValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (leftValue > rightValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return next;
  }, [items, sortConfig]);

  const summary = inventory?.summary;
  const visibleValue = sortedItems.reduce(
    (sum, item) => sum + Number(item.unit_cost || 0) * item.quantity,
    0,
  );

  const requestSort = (key: keyof InventoryBatchItem) => {
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

  const columns: Column<InventoryBatchItem>[] = [
    {
      header: "Medicine / SKU",
      sortKey: "medicine_name",
      render: (item) => (
        <div className="flex flex-col">
          <span className="text-[11px] font-black text-slate-800 dark:text-slate-200">
            {item.medicine_name}
          </span>
          <span className="text-[9px] font-mono font-bold uppercase text-slate-500">
            {item.naming_series || item.barcode}
          </span>
        </div>
      ),
    },
    {
      header: "Inventory Batch",
      sortKey: "batch_number",
      render: (item) => (
        <div className="flex flex-col">
          <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-mono font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {item.inventory_batch_number || item.batch_number}
          </span>
          <span className="mt-1 text-[9px] font-semibold uppercase tracking-widest text-slate-500">
            {item.category || "Uncategorized"}
          </span>
        </div>
      ),
    },
    {
      header: "On Hand",
      sortKey: "quantity",
      render: (item) => (
        <div className="flex flex-col">
          <span className="text-[11px] font-black text-slate-800 dark:text-slate-200">
            {item.quantity}
          </span>
          <span className="text-[9px] text-slate-500 dark:text-slate-400">
            {item.medicine_total_quantity} total for medicine
          </span>
        </div>
      ),
    },
    {
      header: "FIFO",
      sortKey: "fifo_priority",
      render: (item) => (
        <div className="flex flex-col">
          <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400">
            {item.sell_first
              ? "Sell First"
              : item.fifo_priority
                ? `Queue #${item.fifo_priority}`
                : "Not Sellable"}
          </span>
          <span className="text-[9px] text-slate-500 dark:text-slate-400">
            Received {formatDate(item.received_at)}
          </span>
        </div>
      ),
    },
    {
      header: "Expiry",
      sortKey: "expiry_date",
      render: (item) => (
        <div className="flex flex-col">
          <span className="text-[11px] font-black text-slate-700 dark:text-slate-300">
            {formatDate(item.expiry_date)}
          </span>
          <span className="text-[9px] text-slate-500 dark:text-slate-400">
            {item.is_expired ? "Expired" : `${item.days_to_expiry} days left`}
          </span>
        </div>
      ),
    },
    {
      header: "Status",
      headerClassName: "text-right",
      className: "text-right",
      render: (item) => (
        <span
          className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[8px] font-black uppercase tracking-widest ${statusClassMap[item.status_key]}`}
        >
          {item.status}
        </span>
      ),
    },
  ];

  const filtersContent = (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
      <DocumentField label="Medicine">
        <input
          name="medicine"
          value={filters.medicine}
          onChange={(event) =>
            setFilters((previous) => ({
              ...previous,
              medicine: event.target.value,
            }))
          }
          placeholder="Search medicine name"
          className={documentInputClassName}
        />
      </DocumentField>
      <DocumentField label="Inventory Batch">
        <input
          name="batch"
          value={filters.batch}
          onChange={(event) =>
            setFilters((previous) => ({
              ...previous,
              batch: event.target.value,
            }))
          }
          placeholder="Search batch number"
          className={documentInputClassName}
        />
      </DocumentField>
      <DocumentField label="SKU / Barcode">
        <input
          name="sku"
          value={filters.sku}
          onChange={(event) =>
            setFilters((previous) => ({
              ...previous,
              sku: event.target.value,
            }))
          }
          placeholder="Search SKU or barcode"
          className={documentInputClassName}
        />
      </DocumentField>
      <DocumentField label="Status">
        <select
          value={filters.status}
          onChange={(event) =>
            setFilters((previous) => ({
              ...previous,
              status: event.target.value,
            }))
          }
          className={documentInputClassName}
        >
          <option value="">All statuses</option>
          <option value="in_stock">In Stock</option>
          <option value="low_stock">Low Stock</option>
          <option value="expiring_soon">Expiring Soon</option>
          <option value="expired">Expired</option>
        </select>
      </DocumentField>
    </div>
  );

  return (
    <DocumentPage>
      <DocumentHeader
        eyebrow="Inventory Control"
        title="Inventory Batch Registry"
        description="Search active inventory batches, review FIFO sell order, and open any batch detail record from a consistent registry view."
        onBack={() => navigate("/inventory")}
        meta={
          <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
            {inventory?.total_count ?? 0} Visible Batches
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
          label="Tracked Medicines"
          value={summary?.total_medicines ?? 0}
          hint={`${summary?.total_batches ?? 0} active inventory batches`}
          tone="slate"
        />
        <DocumentSummaryCard
          label="Total On Hand"
          value={summary?.total_quantity ?? 0}
          hint="Quantity from posted receipts"
          tone="blue"
        />
        <DocumentSummaryCard
          label="Sell First"
          value={inventory?.fifo_candidates[0]?.inventory_batch_number || inventory?.fifo_candidates[0]?.batch_number || "None"}
          hint={
            inventory?.fifo_candidates[0]
              ? `${inventory.fifo_candidates[0].medicine_name} next in FIFO`
              : "No sellable inventory batch"
          }
          tone="amber"
        />
        <DocumentSummaryCard
          label="Visible Value"
          value={visibleValue.toFixed(2)}
          hint="Quantity multiplied by unit cost"
          tone="emerald"
          valueClassName="text-emerald-700 dark:text-emerald-300"
        />
      </section>

      <DataTable
        columns={columns}
        data={sortedItems}
        isLoading={isLoading}
        onRefresh={loadInventory}
        filters={filtersContent}
        onRowClick={(item) => navigate(`/inventory/${item.batch_id}`)}
        sortConfig={sortConfig}
        onSort={requestSort}
        emptyMessage="No inventory batches found"
        loadingMessage="Loading inventory registry..."
        refreshMessage="Refreshing inventory registry..."
        refreshLabel="Refresh"
        headerRight={
          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600">
            <span>
              {sortedItems.filter((item) => item.sell_first).length} Sell-First Batches
            </span>
            <span>
              {sortedItems.filter((item) => item.is_expiring_soon).length} Expiring Soon
            </span>
          </div>
        }
      />
    </DocumentPage>
  );
};

export default InventoryRegistryPage;
