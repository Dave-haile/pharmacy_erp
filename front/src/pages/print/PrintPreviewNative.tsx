import React from "react";
import type { StockEntryDetail, StockOutDetail } from "@/src/types/types";

export interface PreviewFormatLike {
  id: number | string;
  document_type: string;
  document_type_label: string;
  name: string;
  slug: string;
  template_key: string;
  template_label?: string;
  description: string;
  html_template: string;
  css_template: string;
  js_template: string;
  has_custom_template: boolean;
  paper_size: string;
  orientation: "portrait" | "landscape";
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

const dateTimeFormatter = (value?: string | null) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "N/A";

const dateFormatter = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "N/A";

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const isScalarValue = (value: unknown) =>
  value == null ||
  typeof value === "string" ||
  typeof value === "number" ||
  typeof value === "boolean";

const humanizeKey = (value: string) =>
  value
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const looksLikeDate = (value: string) => {
  if (!/\d{4}-\d{2}-\d{2}/.test(value) && !/\d{2}:\d{2}/.test(value)) {
    return false;
  }
  return !Number.isNaN(new Date(value).getTime());
};

const formatValue = (value: unknown) => {
  if (value == null || value === "") return "N/A";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number")
    return Number.isFinite(value) ? String(value) : "N/A";
  if (typeof value === "string") {
    if (looksLikeDate(value)) {
      return value.includes(":")
        ? dateTimeFormatter(value)
        : dateFormatter(value);
    }
    return value;
  }
  return JSON.stringify(value, null, 2);
};

const DetailCard: React.FC<{
  label: string;
  value: unknown;
  emphasis?: boolean;
}> = ({ label, value, emphasis = false }) => (
  <div
    className={`rounded-2xl border p-4 ${emphasis ? "border-emerald-200 bg-emerald-50/70" : "border-slate-200 bg-slate-50"}`}
  >
    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
      {label}
    </p>
    <p className="mt-2 whitespace-pre-wrap break-words text-sm font-semibold text-slate-900">
      {formatValue(value)}
    </p>
  </div>
);

export const StockEntryPreview: React.FC<{
  data: StockEntryDetail;
  format: PreviewFormatLike;
}> = ({ data }) => {
  return (
    <div className="space-y-6 bg-white p-8 text-slate-900">
      <div className="flex justify-between border-b-2 border-slate-900 pb-4">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tighter">
            Stock Entry
          </h1>
          <p className="text-sm text-slate-500">{data.posting_number}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Status
          </p>
          <p className="text-sm font-bold text-emerald-600">{data.status}</p>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">
            Reference
          </h3>
          <p className="text-sm font-medium">{data.posting_number}</p>
          <p className="mt-1 text-xs text-slate-500">
            Updated: {dateTimeFormatter(data.posted_at || data.updated_at)}
          </p>
        </div>
        <div>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">
            Details
          </h3>
          <p className="text-sm font-medium">
            Supplier: {data.supplier || "N/A"}
          </p>
          <p className="text-sm font-medium">
            Receiver: {data.received_by || "N/A"}
          </p>
        </div>
      </div>

      <div className="mt-8">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="py-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                Item
              </th>
              <th className="py-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                Batch
              </th>
              <th className="py-2 text-right text-xs font-bold uppercase tracking-widest text-slate-400">
                Qty
              </th>
              <th className="py-2 text-right text-xs font-bold uppercase tracking-widest text-slate-400">
                Expiry
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.items?.map((item) => (
              <tr key={item.id}>
                <td className="py-3 text-sm font-medium">
                  {item.medicine_name}
                </td>
                <td className="py-3 text-sm text-slate-500">
                  {item.inventory_batch_number || item.batch_number || "N/A"}
                </td>
                <td className="py-3 text-right text-sm font-bold">
                  {item.quantity}
                </td>
                <td className="py-3 text-right text-sm text-slate-500">
                  {dateFormatter(item.expiry_date)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const StockOutPreview: React.FC<{
  data: StockOutDetail;
  format: PreviewFormatLike;
}> = ({ data }) => {
  return (
    <div className="space-y-6 bg-white p-8 text-slate-900">
      <div className="flex justify-between border-b-2 border-slate-900 pb-4">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tighter">
            Stock Out
          </h1>
          <p className="text-sm text-slate-500">{data.posting_number}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Status
          </p>
          <p className="text-sm font-bold text-emerald-600">{data.status}</p>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">
            Reference
          </h3>
          <p className="text-sm font-medium">{data.posting_number}</p>
          <p className="mt-1 text-xs text-slate-500">
            Created: {dateTimeFormatter(data.created_at)}
          </p>
        </div>
        <div>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">
            Details
          </h3>
          <p className="text-sm font-medium">
            Customer: {data.customer_name || "N/A"}
          </p>
          <p className="text-sm font-medium">
            Cashier: {data.cashier || "N/A"}
          </p>
        </div>
      </div>

      <div className="mt-8">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="py-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                Item
              </th>
              <th className="py-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                Batch
              </th>
              <th className="py-2 text-right text-xs font-bold uppercase tracking-widest text-slate-400">
                Qty
              </th>
              <th className="py-2 text-right text-xs font-bold uppercase tracking-widest text-slate-400">
                Expiry
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.items?.map((item) => (
              <tr key={item.id}>
                <td className="py-3 text-sm font-medium">
                  {item.medicine_name}
                </td>
                <td className="py-3 text-sm text-slate-500">
                  {item.inventory_batch_number || item.batch_number || "N/A"}
                </td>
                <td className="py-3 text-right text-sm font-bold">
                  {item.quantity}
                </td>
                <td className="py-3 text-right text-sm text-slate-500">
                  {dateFormatter(item.expiry_date)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const GenericDocumentPreview: React.FC<{
  data: unknown;
  format: PreviewFormatLike;
  documentLabel: string;
  documentRef: string;
  documentTitle: string;
  documentSubtitle?: string;
  documentMeta: Array<{ label: string; value: unknown }>;
}> = ({
  data,
  format,
  documentLabel,
  documentRef,
  documentTitle,
  documentSubtitle,
  documentMeta,
}) => {
  const entries = isPlainObject(data) ? Object.entries(data) : [];
  const scalarEntries = entries.filter(([, value]) => isScalarValue(value));
  const complexEntries = entries.filter(([, value]) => !isScalarValue(value));
  const descriptionEntry = scalarEntries.find(
    ([key]) => key === "description" || key === "notes",
  );
  const primaryEntries = scalarEntries
    .filter(([key]) => key !== "description" && key !== "notes")
    .slice(0, 8);
  const secondaryEntries = scalarEntries
    .filter(([key]) => key !== "description" && key !== "notes")
    .slice(8);

  return (
    <div className="space-y-8 bg-white p-8 text-slate-900">
      <div className="flex flex-col gap-4 border-b-2 border-slate-900 pb-6 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">
            {documentLabel}
          </p>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">
            {documentTitle}
          </h1>
          {documentSubtitle && (
            <p className="mt-1 text-sm text-slate-500">{documentSubtitle}</p>
          )}
        </div>
        <div className="text-left md:text-right">
          <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            Reference
          </p>
          <p className="text-sm font-bold text-slate-900">{documentRef}</p>
          <p className="mt-1 text-xs text-slate-500">{format.name}</p>
        </div>
      </div>

      {documentMeta.length > 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {documentMeta.map((meta, idx) => (
            <DetailCard
              key={`${meta.label}-${idx}`}
              label={meta.label}
              value={meta.value}
              emphasis
            />
          ))}
        </div>
      )}

      {descriptionEntry && (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            {humanizeKey(descriptionEntry[0])}
          </p>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
            {formatValue(descriptionEntry[1])}
          </p>
        </div>
      )}

      {primaryEntries.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {primaryEntries.map(([key, value]) => (
            <DetailCard key={key} label={humanizeKey(key)} value={value} />
          ))}
        </div>
      )}

      {secondaryEntries.length > 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            Additional Details
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {secondaryEntries.map(([key, value]) => (
              <DetailCard key={key} label={humanizeKey(key)} value={value} />
            ))}
          </div>
        </div>
      )}

      {complexEntries.length > 0 && (
        <div className="space-y-4">
          {complexEntries.map(([key, value]) => (
            <div
              key={key}
              className="rounded-3xl border border-slate-200 bg-white p-6"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                {humanizeKey(key)}
              </p>
              {Array.isArray(value) ? (
                <div className="mt-4 space-y-3">
                  {value.map((item, index) => (
                    <pre
                      key={`${key}-${index}`}
                      className="whitespace-pre-wrap break-all rounded-2xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-700"
                    >
                      {formatValue(item)}
                    </pre>
                  ))}
                </div>
              ) : (
                <pre className="mt-4 whitespace-pre-wrap break-all rounded-2xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-700">
                  {JSON.stringify(value, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}

      {!isPlainObject(data) && (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            Document Data
          </p>
          <pre className="mt-4 whitespace-pre-wrap break-all text-xs leading-relaxed text-slate-700">
            {formatValue(data)}
          </pre>
        </div>
      )}
    </div>
  );
};
