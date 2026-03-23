import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import DataTable, { Column } from "../../components/DataTable";
import {
  DocumentHeader,
  DocumentPage,
  DocumentSummaryCard,
  documentPrimaryButtonClassName,
} from "../../components/common/DocumentUI";
import { fetchStockOuts } from "../../services/stockOuts";
import { StockOutSummary } from "../../types/types";

const statusClassMap: Record<StockOutSummary["status"], string> = {
  Posted:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  Draft:
    "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  Cancelled: "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400",
};

const StockOutRegistry: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<StockOutSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    posting_number: "",
    invoice_number: "",
    customer_name: "",
    status: "",
  });

  const loadItems = async () => {
    setIsLoading(true);
    try {
      const response = await fetchStockOuts();
      setItems(response.results);
    } catch (error) {
      console.error("Failed to load stock-outs:", error);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      return (
        (filters.posting_number === "" ||
          item.posting_number
            .toLowerCase()
            .includes(filters.posting_number.toLowerCase())) &&
        (filters.invoice_number === "" ||
          item.invoice_number
            .toLowerCase()
            .includes(filters.invoice_number.toLowerCase())) &&
        (filters.customer_name === "" ||
          (item.customer_name || "walk-in customer")
            .toLowerCase()
            .includes(filters.customer_name.toLowerCase())) &&
        (filters.status === "" || item.status === filters.status)
      );
    });
  }, [filters, items]);

  const columns: Column<StockOutSummary>[] = [
    {
      header: "Posting No",
      render: (item) => (
        <span className="rounded bg-emerald-50 px-2 py-1 text-[10px] font-mono font-bold text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
          {item.posting_number}
        </span>
      ),
    },
    {
      header: "Customer / Invoice",
      render: (item) => (
        <div className="flex flex-col">
          <span className="text-[11px] font-black text-slate-800 dark:text-slate-200">
            {item.customer_name || "Walk-in customer"}
          </span>
          <span className="text-[9px] font-mono font-bold uppercase text-slate-500">
            {item.invoice_number}
          </span>
        </div>
      ),
    },
    {
      header: "Qty",
      render: (item) => (
        <span className="text-[11px] font-black text-slate-700 dark:text-slate-300">
          {item.total_quantity}
        </span>
      ),
    },
    {
      header: "Amount",
      render: (item) => (
        <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400">
          {item.total_amount}
        </span>
      ),
    },
    {
      header: "Cashier",
      render: (item) => (
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          {item.cashier}
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

  const filtersContent = (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <input
        name="posting_number"
        value={filters.posting_number}
        onChange={(event) =>
          setFilters((previous) => ({
            ...previous,
            posting_number: event.target.value,
          }))
        }
        placeholder="Posting number"
        className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
      />
      <input
        name="invoice_number"
        value={filters.invoice_number}
        onChange={(event) =>
          setFilters((previous) => ({
            ...previous,
            invoice_number: event.target.value,
          }))
        }
        placeholder="Invoice number"
        className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
      />
      <input
        name="customer_name"
        value={filters.customer_name}
        onChange={(event) =>
          setFilters((previous) => ({
            ...previous,
            customer_name: event.target.value,
          }))
        }
        placeholder="Customer"
        className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
      />
      <select
        value={filters.status}
        onChange={(event) =>
          setFilters((previous) => ({
            ...previous,
            status: event.target.value,
          }))
        }
        className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
      >
        <option value="">All statuses</option>
        <option value="Draft">Draft</option>
        <option value="Posted">Posted</option>
        <option value="Cancelled">Cancelled</option>
      </select>
    </div>
  );

  return (
    <DocumentPage>
      <DocumentHeader
        eyebrow="Sales & Distribution"
        title="Stock Out Register"
        description="Review draft, posted, and cancelled stock-out documents using the same registry pattern as stock entry."
        onBack={() => navigate("/dashboard")}
        actions={
          <button
            onClick={() => navigate("/inventory/sales/stock-outs/new-stock-out")}
            className={documentPrimaryButtonClassName}
          >
            New Stock Out
          </button>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DocumentSummaryCard
          label="Documents In View"
          value={String(filteredItems.length)}
          hint={`${items.length} loaded records`}
          tone="slate"
        />
        <DocumentSummaryCard
          label="Draft Documents"
          value={String(filteredItems.filter((item) => item.status === "Draft").length)}
          hint="Editable stock-out drafts"
          tone="amber"
        />
        <DocumentSummaryCard
          label="Posted Documents"
          value={String(filteredItems.filter((item) => item.status === "Posted").length)}
          hint="Inventory already deducted"
          tone="blue"
        />
        <DocumentSummaryCard
          label="Visible Value"
          value={String(
            filteredItems.reduce(
              (sum, item) => sum + Number(item.total_amount || 0),
              0,
            ),
          )}
          hint="Visible gross amount"
          tone="emerald"
          valueClassName="text-emerald-700 dark:text-emerald-300"
        />
      </section>

      <DataTable
        columns={columns}
        data={filteredItems}
        isLoading={isLoading}
        onRefresh={loadItems}
        filters={filtersContent}
        onRowClick={(item) =>
          navigate(`/inventory/sales/stock-outs/${item.posting_number}?id=${item.id}`, {
            state: { saleId: item.id },
          })
        }
        emptyMessage="No stock-out documents found"
        loadingMessage="Loading stock-out register..."
        refreshMessage="Refreshing stock-out register..."
        refreshLabel="Refresh"
      />
    </DocumentPage>
  );
};

export default StockOutRegistry;
