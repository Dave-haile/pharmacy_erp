import { formatDistanceToNowStrict } from "date-fns";

import { Log } from "../types/types";

const FIELD_LABELS: Record<string, string> = {
  name: "name",
  generic_name: "generic name",
  barcode: "barcode",
  category_id: "category",
  supplier_id: "supplier",
  cost_price: "cost price",
  selling_price: "selling price",
  status: "status",
  description: "description",
  is_active: "active status",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  posted: "Posted",
  cancelled: "Cancelled",
};

const parseStatus = (value: unknown) => {
  if (typeof value !== "string") {
    return prettyValue(value);
  }

  const normalized = value.trim().toLowerCase();
  return STATUS_LABELS[normalized] ?? value;
};

export const parseLogDetails = (
  raw: string,
): Record<string, unknown> | null => {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
};

export const parseLogTimestamp = (value: string): Date | null => {
  const firstPass = new Date(value);
  if (!Number.isNaN(firstPass.getTime())) {
    return firstPass;
  }

  const normalized = value.replace(" ", "T");
  const secondPass = new Date(normalized);
  if (!Number.isNaN(secondPass.getTime())) {
    return secondPass;
  }

  return null;
};

export const formatRelativeLogTime = (value: string) => {
  const date = parseLogTimestamp(value);
  if (!date) {
    return value;
  }

  return formatDistanceToNowStrict(date, { addSuffix: true });
};

const fieldLabel = (key: string) =>
  FIELD_LABELS[key] ?? key.replace(/_/g, " ");

export const prettyValue = (value: unknown): string => {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "boolean") {
    return value ? "Active" : "Inactive";
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "string") {
    return parseStatus(value);
  }

  if (Array.isArray(value)) {
    return `${value.length} item${value.length === 1 ? "" : "s"}`;
  }

  return "updated";
};

const actorName = (log: Log) => log.username || "Administrator";

const formatChangeLines = (
  actor: string,
  changes: Record<string, { from?: unknown; to?: unknown }>,
) =>
  Object.entries(changes).map(
    ([field, delta]) =>
      `${actor} changed value of '${fieldLabel(field)}' from '${prettyValue(delta?.from)}' to '${prettyValue(delta?.to)}'.`,
  );

const formatStockEntrySummary = (
  actor: string,
  details: Record<string, unknown>,
) => {
  const postingNumber = details.posting_number;
  const lineItems = Array.isArray(details.items) ? details.items.length : null;

  if (postingNumber) {
    return `${actor} created stock entry '${String(postingNumber)}'${lineItems != null ? ` with ${lineItems} line item${lineItems === 1 ? "" : "s"}` : ""}.`;
  }

  return `${actor} created this stock entry.`;
};

export const formatLogLines = (log: Log): string[] => {
  const details = parseLogDetails(log.details);
  const actor = actorName(log);

  if (!details) {
    return [`${actor} ${log.action.toLowerCase()}.`];
  }

  const changesRaw = details.changes;
  if (changesRaw && typeof changesRaw === "object" && !Array.isArray(changesRaw)) {
    const lines = formatChangeLines(
      actor,
      changesRaw as Record<string, { from?: unknown; to?: unknown }>,
    );
    if (lines.length > 0) {
      return lines;
    }
  }

  const previousStatus = details.previous_status;
  const currentStatus = details.current_status ?? details.status;
  if (previousStatus !== undefined && currentStatus !== undefined) {
    return [
      `${actor} changed value of 'status' from '${prettyValue(previousStatus)}' to '${prettyValue(currentStatus)}'.`,
    ];
  }

  if (/posted/i.test(log.action)) {
    return [
      `${actor} changed value of 'status' from 'Draft' to '${prettyValue(details.status ?? "posted")}'.`,
    ];
  }

  if (/cancelled/i.test(log.action)) {
    return [
      `${actor} changed value of 'status' from 'Posted' to '${prettyValue(details.status ?? "cancelled")}'.`,
    ];
  }

  if (/supplier created/i.test(log.action) && details.name) {
    return [`${actor} created supplier '${String(details.name)}'.`];
  }

  if (/medicine created/i.test(log.action)) {
    const name = details.name ?? details.naming_series ?? details.medicine_id;
    return [`${actor} created medicine '${String(name)}'.`];
  }

  if (/stock entry draft created/i.test(log.action)) {
    return [formatStockEntrySummary(actor, details)];
  }

  if (/deleted/i.test(log.action)) {
    return [`${actor} deleted this record.`];
  }

  if (details.status !== undefined) {
    return [
      `${actor} set value of 'status' to '${prettyValue(details.status)}'.`,
    ];
  }

  return [`${actor} performed '${log.action}'.`];
};
