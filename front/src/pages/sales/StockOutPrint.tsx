import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useToast } from "../../hooks/useToast";
import {
  fetchStockOutById,
  fetchStockOutByPostingNumber,
} from "../../services/stockOuts";
import type { StockOutDetail } from "../../types/types";
import { GetErrorMessage } from "../../components/ShowErrorToast";

const StockOutPrint: React.FC = () => {
  const navigate = useNavigate();
  const { postingNumber } = useParams<{ postingNumber: string }>();
  const [searchParams] = useSearchParams();
  const { showError } = useToast();

  const [data, setData] = useState<StockOutDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const saleId = searchParams.get("id");

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        let response: StockOutDetail;
        if (saleId) {
          response = await fetchStockOutById(saleId);
        } else if (postingNumber) {
          response = await fetchStockOutByPostingNumber(postingNumber);
        } else {
          throw new Error("Missing posting number.");
        }
        setData(response);
      } catch (error: unknown) {
        showError(GetErrorMessage(error, "stock-out", "load"));
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [postingNumber, saleId, showError]);

  const totals = useMemo(() => {
    if (!data) return { totalQty: 0, totalAmount: 0 };
    const totalQty = data.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = data.items.reduce(
      (sum, item) => sum + Number(item.subtotal || 0),
      0,
    );
    return { totalQty, totalAmount };
  }, [data]);

  useEffect(() => {
    if (!data) return;
    const timer = setTimeout(() => window.print(), 350);
    return () => clearTimeout(timer);
  }, [data]);

  if (isLoading) {
    return (
      <div className="p-6 text-sm font-semibold text-slate-600">
        Loading printable invoice...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="text-sm font-semibold text-rose-700">
          Could not load invoice.
        </div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold"
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white text-slate-900 min-h-screen p-8 print:p-0">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-start justify-between gap-4 border-b pb-4">
          <div>
            <div className="text-xl font-black tracking-tight">INVOICE</div>
            <div className="text-xs text-slate-600">
              {data.status_key === "draft"
                ? "DRAFT (not posted)"
                : data.status_key.toUpperCase()}
            </div>
          </div>
          <div className="text-right text-xs">
            <div className="font-bold">
              Invoice: <span className="font-mono">{data.invoice_number}</span>
            </div>
            <div className="text-slate-600">
              Posting: <span className="font-mono">{data.posting_number}</span>
            </div>
            <div className="text-slate-600">
              Date: {new Date(data.created_at).toLocaleString()}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
          <div>
            <div className="font-black uppercase tracking-widest text-[10px] text-slate-500">
              Customer
            </div>
            <div className="font-semibold">
              {data.customer_name?.trim() ? data.customer_name : "Walk-in"}
            </div>
          </div>
          <div className="text-right">
            <div className="font-black uppercase tracking-widest text-[10px] text-slate-500">
              Payment
            </div>
            <div className="font-semibold">{data.payment_method_label}</div>
          </div>
        </div>

        <table className="mt-6 w-full text-xs border-collapse">
          <thead>
            <tr className="border-b">
              <th className="py-2 text-left">Item</th>
              <th className="py-2 text-left">Batch</th>
              <th className="py-2 text-right">Qty</th>
              <th className="py-2 text-right">Unit</th>
              <th className="py-2 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item) => (
              <tr key={item.id} className="border-b">
                <td className="py-2">
                  <div className="font-semibold">{item.medicine_name}</div>
                </td>
                <td className="py-2 font-mono">{item.batch_number || "—"}</td>
                <td className="py-2 text-right font-semibold">{item.quantity}</td>
                <td className="py-2 text-right font-mono">
                  {item.price_at_sale}
                </td>
                <td className="py-2 text-right font-mono">{item.subtotal}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 flex justify-end">
          <div className="w-72 text-xs">
            <div className="flex justify-between py-1">
              <span className="text-slate-600">Total qty</span>
              <span className="font-semibold">{totals.totalQty}</span>
            </div>
            <div className="flex justify-between py-1 border-t">
              <span className="text-slate-600">Total amount</span>
              <span className="font-black">{data.total_amount}</span>
            </div>
          </div>
        </div>

        {data.notes?.trim() && (
          <div className="mt-4 text-xs">
            <div className="font-black uppercase tracking-widest text-[10px] text-slate-500">
              Notes
            </div>
            <div>{data.notes}</div>
          </div>
        )}

        <div className="mt-8 print:hidden flex gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-black uppercase tracking-widest text-white"
          >
            Print
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-700"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default StockOutPrint;

