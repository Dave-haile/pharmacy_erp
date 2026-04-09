import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowLeft,
  ChevronDown,
  Code,
  FileText,
  Info,
  Layout,
  Pencil,
  Plus,
  Printer,
  Save,
  Settings,
  Trash2,
  X,
} from "lucide-react";
import { useAuth } from "@/src/auth/AuthContext";
import { GetErrorMessage } from "@/src/components/ShowErrorToast";
import { useConfirmDialog } from "@/src/hooks/useConfirmDialog";
import { useToast } from "@/src/hooks/useToast";
import {
  GenericDocumentPreview,
  PreviewFormatLike,
  StockEntryPreview,
  StockOutPreview,
} from "@/src/pages/print/PrintPreviewNative";
import {
  createPrintFormat,
  deletePrintFormat,
  fetchPrintFormats,
  updatePrintFormat,
} from "@/src/services/printFormats";
import { fetchStockEntryByPostingNumber } from "@/src/services/stockEntries";
import { fetchStockOutByPostingNumber } from "@/src/services/stockOuts";
import type {
  CreatePrintFormatPayload,
  PrintDocumentType as ApiPrintDocumentType,
  PrintFormat,
  StockEntryDetail,
  StockOutDetail,
} from "@/src/types/types";

type RouteDocumentType = string;

interface PrintPreviewLocationState {
  documentData?: unknown;
  documentTitle?: string;
  documentSubtitle?: string;
  documentMeta?: Array<{ label: string; value: unknown }>;
}

type PreviewFormat = PreviewFormatLike;

const apiDocumentTypeMap: Record<string, ApiPrintDocumentType> = {
  medicine: "medicine",
  supplier: "supplier",
  employee: "employee",
  department: "department",
  category: "category",
  "stock-entry": "stock_entry",
  "stock-out": "stock_out",
  "stock-adjustment": "stock_adjustment",
  "sales-return": "sales_return",
  "supplier-return": "supplier_return",
  purchase: "purchase",
  grn: "grn",
};

const documentTypeLabels: Record<string, string> = {
  category: "Category",
  department: "Department",
  employee: "Employee",
  grn: "GRN",
  "stock-entry": "Stock Entry",
  "stock-adjustment": "Stock Adjustment",
  "stock-out": "Stock Out",
  "sales-return": "Sales Return",
  "supplier-return": "Supplier Return",
  medicine: "Medicine",
  purchase: "Purchase",
  supplier: "Supplier",
};

const routeToApiDocumentType = (
  value?: string,
): ApiPrintDocumentType | null => {
  if (!value) return null;
  return apiDocumentTypeMap[value] || null;
};

const humanizeRouteType = (value?: string) =>
  (value || "document")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const getDocumentTypeLabel = (value?: string) =>
  (value && documentTypeLabels[value]) || humanizeRouteType(value);

const defaultHtmlTemplate = (documentLabel: string) => `
<html>
  <head></head>
  <body>
<div class="page">
  <div class="hero">
    <div>
      <p class="eyebrow">${documentLabel} Print Format</p>
      <h1 class="title">{{ data.posting_number }}</h1>
      <p class="muted">Status: {{ data.status }}</p>
    </div>
  </div>
  <div class="meta">
    <p>Reference: <strong>{{ data.posting_number }}</strong></p>
    <p>Created: <strong>{{ data.created_at }}</strong></p>
  </div>
  <div class="card">
    <p class="eyebrow">Document Data</p>
    <pre>{{ json data }}</pre>
  </div>
</div>
</body>
</html>
`;

const defaultCssTemplate = `
.page { font-family: "Inter", system-ui, sans-serif; color: #0f172a; padding: 40px; background: white; }
.hero { display: flex; justify-content: space-between; gap: 24px; border-bottom: 2px solid #0f172a; padding-bottom: 24px; margin-bottom: 32px; }
.eyebrow { margin: 0 0 8px; font-size: 10px; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase; color: #10b981; }
.title { margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.02em; }
.muted { color: #64748b; font-size: 14px; margin: 4px 0 0; }
.meta { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px; }
.meta p { margin: 0; font-size: 14px; }
.card { border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; background: #f8fafc; }
pre { white-space: pre-wrap; overflow-wrap: anywhere; font-size: 12px; line-height: 1.6; color: #334155; margin: 0; }
`;

const defaultJsTemplate = 'console.log("Print data", window.PRINT_DATA);';

const makeSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const serializeForTemplate = (value: unknown) =>
  value == null
    ? ""
    : typeof value === "string"
      ? value
      : JSON.stringify(value, null, 2);

const resolvePath = (source: unknown, path: string) => {
  if (
    path === "this" ||
    path === "item" ||
    path === "index" ||
    path === "@index"
  ) {
    if (
      typeof source === "object" &&
      source !== null &&
      path in (source as Record<string, unknown>)
    ) {
      return (source as Record<string, unknown>)[path];
    }
    return "";
  }

  if (path.startsWith("this.") || path.startsWith("item.")) {
    const [head, ...rest] = path.split(".");
    const scopedSource =
      typeof source === "object" && source !== null
        ? (source as Record<string, unknown>)[head]
        : undefined;

    return rest.reduce<unknown>((current, key) => {
      if (current == null) return "";
      if (Array.isArray(current) && /^\d+$/.test(key)) {
        return current[Number(key)];
      }
      if (
        typeof current === "object" &&
        key in (current as Record<string, unknown>)
      ) {
        return (current as Record<string, unknown>)[key];
      }
      return "";
    }, scopedSource);
  }

  return path.split(".").reduce<unknown>((current, key) => {
    if (current == null) return "";
    if (Array.isArray(current) && /^\d+$/.test(key))
      return current[Number(key)];
    if (
      typeof current === "object" &&
      key in (current as Record<string, unknown>)
    ) {
      return (current as Record<string, unknown>)[key];
    }
    return "";
  }, source);
};

const isTemplateValueTruthy = (value: unknown) =>
  Array.isArray(value) ? value.length > 0 : Boolean(value);

const renderConditionalBlock = (
  conditionPath: string,
  block: string,
  context: Record<string, unknown>,
) => {
  const branches: Array<{ path: string | null; content: string }> = [];
  const branchPattern =
    /\{\{\s*else\s+if\s+([@a-zA-Z0-9_.]+)\s*\}\}|\{\{\s*else\s*\}\}/g;

  let currentPath: string | null = conditionPath;
  let lastIndex = 0;

  for (const match of block.matchAll(branchPattern)) {
    const tokenIndex = match.index ?? 0;
    branches.push({
      path: currentPath,
      content: block.slice(lastIndex, tokenIndex),
    });

    currentPath = match[1] || null;
    lastIndex = tokenIndex + match[0].length;
  }

  branches.push({
    path: currentPath,
    content: block.slice(lastIndex),
  });

  const selectedBranch = branches.find((branch) => {
    if (branch.path === null) return true;
    return isTemplateValueTruthy(resolvePath(context, branch.path));
  });

  return renderTemplateString(selectedBranch?.content || "", context);
};

const renderTemplateString = (
  template: string,
  context: Record<string, unknown>,
): string => {
  const withConditionals = template.replace(
    /\{\{\s*#if\s+([@a-zA-Z0-9_.]+)\s*\}\}([\s\S]*?)\{\{\s*\/if\s*\}\}/g,
    (_, path, block) => renderConditionalBlock(path, block, context),
  );

  const withLoops = withConditionals.replace(
    /\{\{\s*#each\s+([@a-zA-Z0-9_.]+)\s*\}\}([\s\S]*?)\{\{\s*\/each\s*\}\}/g,
    (_, path, block) => {
      const collection = resolvePath(context, path);
      if (!Array.isArray(collection) || collection.length === 0) return "";

      return collection
        .map((item, index) =>
          renderTemplateString(block, {
            ...context,
            this: item,
            item,
            index,
            "@index": index,
          }),
        )
        .join("");
    },
  );

  return withLoops.replace(
    /\{\{\s*(json\s+)?([@a-zA-Z0-9_.]+)\s*\}\}/g,
    (_, jsonFlag, path) => {
      const value = resolvePath(context, path);
      return jsonFlag ? serializeForTemplate(value) : String(value ?? "");
    },
  );
};

const buildCustomPreviewDocument = (
  format: PreviewFormat,
  documentTypeLabel: string,
  documentData: unknown,
) => {
  const context = {
    data: documentData,
    format,
    document_type: format.document_type,
    document_type_label: documentTypeLabel,
  };
  const html = renderTemplateString(
    (format.html_template || "").trim() ||
      defaultHtmlTemplate(documentTypeLabel),
    context,
  );
  const css = renderTemplateString(format.css_template || "", context);
  const js = renderTemplateString(format.js_template || "", context);
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Print Preview</title><style>@page { size: ${format.paper_size} ${format.orientation}; margin: 12mm; } html,body{margin:0;padding:0;background:white}${css}</style></head><body>${html}<script>window.PRINT_DATA=${JSON.stringify(documentData)};window.PRINT_FORMAT=${JSON.stringify(format)};</script><script>${js}</script></body></html>`;
};

const buildDefaultFormat = (
  routeDocumentType: string,
  documentTypeLabel: string,
): PreviewFormat => ({
  id: `builtin-${routeDocumentType || "document"}`,
  document_type: routeDocumentType || "document",
  document_type_label: documentTypeLabel,
  name: "Default Layout",
  slug: "default-layout",
  template_key: "standard",
  template_label: "Standard",
  description: `Built-in default print layout for ${documentTypeLabel}.`,
  html_template: defaultHtmlTemplate(documentTypeLabel),
  css_template: defaultCssTemplate,
  js_template: defaultJsTemplate,
  has_custom_template: false,
  paper_size: "A4",
  orientation: "portrait",
  is_active: true,
  is_default: true,
  created_at: "",
  updated_at: "",
});

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const deriveDocumentTitle = (data: unknown, fallback: string) => {
  if (!isObjectRecord(data)) return fallback;
  const candidates = [
    data.name,
    data.full_name,
    data.posting_number,
    data.invoice_number,
    data.naming_series,
    data.reference_document,
  ];
  const title = candidates.find(
    (value) => typeof value === "string" && value.trim().length > 0,
  );
  return typeof title === "string" ? title : fallback;
};

const deriveDocumentMeta = (data: unknown) => {
  if (!isObjectRecord(data)) return [];
  const keyLabels: Record<string, string> = {
    status: "Status",
    supplier: "Supplier",
    customer_name: "Customer",
    category: "Category",
    department: "Department",
    designation: "Designation",
    is_active: "Active",
    updated_at: "Updated",
  };
  return Object.entries(keyLabels)
    .map(([key, label]) => ({ label, value: data[key] }))
    .filter(
      (item) =>
        item.value !== undefined &&
        item.value !== null &&
        !(typeof item.value === "string" && item.value.trim() === ""),
    )
    .slice(0, 4);
};

const hasLocationPrintData = (
  value: PrintPreviewLocationState | null,
): value is PrintPreviewLocationState => Boolean(value?.documentData);

const readPersistedPrintState = (storageKey: string) => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as PrintPreviewLocationState) : null;
  } catch {
    return null;
  }
};

const persistPrintState = (
  storageKey: string,
  value: PrintPreviewLocationState,
) => {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(storageKey, JSON.stringify(value));
  } catch {}
};

const helperCodeLabel = "{ data.posting_number }";
const helperCodeJson = "{ json data }";
const helperCodeEach = "#each data.items";
const helperCodeIf = "#if data.notes";
const guideHtmlExample = `
<html>
<body>
<div class="page">
  <h1>{{ data.posting_number }}</h1>
  <p>Supplier: {{ data.supplier }}</p>

  {{#if data.notes}}
    <p class="notes">Notes: {{ data.notes }}</p>
  {{else}}
    <p class="notes muted">No notes for this document.</p>
  {{/if}}

  <table class="items">
    <thead>
      <tr>
        <th>#</th>
        <th>Item</th>
        <th>Qty</th>
      </tr>
    </thead>
    <tbody>
      {{#each data.items}}
        <tr>
          <td>{{ @index }}</td>
          <td>{{ this.medicine_name }}</td>
          <td>{{ this.quantity }}</td>
        </tr>
      {{/each}}
    </tbody>
  </table>
</div>
</body>
</html>
`;
const guideCssExample = `.page {
  font-family: "Inter", system-ui, sans-serif;
  padding: 32px;
  color: #0f172a;
}

.items {
  width: 100%;
  border-collapse: collapse;
}

.items th,
.items td {
  border-bottom: 1px solid #cbd5e1;
  padding: 10px 8px;
  text-align: left;
}`;
const guideJsExample = `const data = window.PRINT_DATA;
const format = window.PRINT_FORMAT;

console.log("Document", data);
console.log("Format", format);

window.addEventListener("load", () => {
  document.title = data.posting_number || format.name || "Print Preview";
});`;
const guideIfExample = `{{#if data.notes}}
  <div class="notes">Notes: {{ data.notes }}</div>
{{else if data.customer_name}}
  <div class="notes">Customer: {{ data.customer_name }}</div>
{{else if data.supplier}}
  <div class="notes">Supplier: {{ data.supplier }}</div>
{{else}}
  <div class="notes muted">No notes, customer, or supplier found.</div>
{{/if}}`;

const buildGuideFormat = (documentTypeLabel: string): PreviewFormat => ({
  id: "__guide__",
  document_type: "guide",
  document_type_label: `${documentTypeLabel} Guide`,
  name: "Help / Guide",
  slug: "__guide__",
  template_key: "standard",
  template_label: "Guide",
  description: "How to build custom print formats.",
  html_template: "",
  css_template: "",
  js_template: "",
  has_custom_template: false,
  paper_size: "A4",
  orientation: "portrait",
  is_active: true,
  is_default: false,
  created_at: "",
  updated_at: "",
});

const PrintBuilderGuide: React.FC = () => (
  <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
    <div className="border-b border-slate-100 pb-4 dark:border-slate-800">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">
        Builder Guide
      </p>
      <h2 className="mt-2 text-xl font-black text-slate-900 dark:text-white">
        How To Create Your Own Print Layout
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
        Choose a layout name, edit the HTML, CSS, and JS tabs, then save. You
        can always start small and improve the design step by step.
      </p>
    </div>

    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/40">
        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-600">
          1. Insert Data
        </p>
        <p className="mt-2 text-xs leading-6 text-slate-600 dark:text-slate-300">
          Use placeholders to print values from the document.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-950 p-3 text-[11px] leading-6 text-emerald-300">
          {`{{ data.posting_number }}
{{ data.supplier }}
{{ data.customer_name }}
{{ data.total_amount }}
{{ json data }}`}
        </pre>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/40">
        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-600">
          2. Loop Through Items
        </p>
        <p className="mt-2 text-xs leading-6 text-slate-600 dark:text-slate-300">
          Use <code>{`{{#each data.items}}`}</code> to print repeating rows such
          as item lines.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-950 p-3 text-[11px] leading-6 text-emerald-300">
          {`{{#each data.items}}
  <tr>
    <td>{{ @index }}</td>
    <td>{{ this.medicine_name }}</td>
    <td>{{ this.quantity }}</td>
  </tr>
{{/each}}`}
        </pre>
      </div>
    </div>

    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/40">
      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-violet-600">
        3. Show Or Hide Content With If / Else If / Else
      </p>
      <p className="mt-2 text-xs leading-6 text-slate-600 dark:text-slate-300">
        Use <code>{`{{#if data.field}}`}</code> when a field may be empty. Add
        <code>{` {{else if data.other_field}} `}</code> to check another value
        before the final <code>{`{{else}}`}</code>. This is useful for notes,
        customer names, supplier fields, optional dates, or item arrays that may
        be missing.
      </p>
      <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-950 p-3 text-[11px] leading-6 text-violet-300">
        {guideIfExample}
      </pre>
      <div className="mt-3 space-y-2 text-xs leading-6 text-slate-600 dark:text-slate-300">
        <p>
          The first matching block is shown. You can check one field, then try
          more choices with <code>{` {{else if ...}} `}</code>, and finally use
          <code>{` {{else}} `}</code> as the fallback.
        </p>
        <p>
          For lists, <code>{`{{#if data.items}}`}</code> checks whether the
          array has at least one row.
        </p>
        <p>
          Example order: notes first, then customer name, then supplier, then a
          final default message.
        </p>
        <p>
          If you are unsure whether a field exists, print{" "}
          <code>{`{{ json data }}`}</code> first and check the preview.
        </p>
      </div>
    </div>

    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/40">
      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-blue-600">
        HTML Example
      </p>
      <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-950 p-3 text-[11px] leading-6 text-emerald-300">
        {guideHtmlExample}
      </pre>
    </div>

    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/40">
      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-sky-600">
        CSS Example
      </p>
      <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-950 p-3 text-[11px] leading-6 text-blue-300">
        {guideCssExample}
      </pre>
    </div>

    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/40">
      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-amber-600">
        JavaScript Example
      </p>
      <p className="mt-2 text-xs leading-6 text-slate-600 dark:text-slate-300">
        Use <code>window.PRINT_DATA</code> for the current document and{" "}
        <code>window.PRINT_FORMAT</code> for the saved format settings.
      </p>
      <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-950 p-3 text-[11px] leading-6 text-amber-300">
        {guideJsExample}
      </pre>
    </div>

    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 dark:border-slate-600 dark:bg-slate-800/30">
      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">
        Tips
      </p>
      <div className="mt-2 space-y-2 text-xs leading-6 text-slate-600 dark:text-slate-300">
        <p>
          If you do not know the field names yet, print{" "}
          <code>{`{{ json data }}`}</code> first and inspect the preview.
        </p>
        <p>
          Put structure in HTML, styling in CSS, and only small behaviors in JS.
        </p>
        <p>
          Save multiple formats with clear names like "A4 Invoice" or "Thermal
          Receipt".
        </p>
      </div>
    </div>
  </div>
);

const PrintPreviewPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { confirm } = useConfirmDialog();
  const { showError, showSuccess } = useToast();
  const { documentType: routeDocumentType = "document", documentRef } =
    useParams<{ documentType: RouteDocumentType; documentRef: string }>();
  const [searchParams] = useSearchParams();
  const customPreviewRef = useRef<HTMLIFrameElement | null>(null);
  const [selectedFormatSlug, setSelectedFormatSlug] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingFormatId, setEditingFormatId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"html" | "css" | "js">("html");
  const locationState = location.state as PrintPreviewLocationState | null;
  const storageKey = useMemo(
    () => `print-preview:${routeDocumentType}:${documentRef || "unknown"}`,
    [documentRef, routeDocumentType],
  );
  const [persistedState, setPersistedState] =
    useState<PrintPreviewLocationState | null>(() =>
      readPersistedPrintState(storageKey),
    );
  const incomingState = hasLocationPrintData(locationState)
    ? locationState
    : persistedState;

  const apiDocumentType = routeToApiDocumentType(routeDocumentType);
  const documentTypeLabel = getDocumentTypeLabel(routeDocumentType);
  const defaultFormat = useMemo(
    () => buildDefaultFormat(routeDocumentType, documentTypeLabel),
    [documentTypeLabel, routeDocumentType],
  );
  const guideFormat = useMemo(
    () => buildGuideFormat(documentTypeLabel),
    [documentTypeLabel],
  );
  const canManageSavedFormats = Boolean(apiDocumentType);
  const canEditFormats = ["admin", "manager", "pharmacist"].includes(
    user?.role || "",
  );
  const canDeleteFormats = ["admin", "manager"].includes(user?.role || "");

  const [draftFormat, setDraftFormat] = useState<CreatePrintFormatPayload>({
    document_type: "stock_entry",
    name: "",
    slug: "",
    template_key: "standard",
    description: "",
    html_template: defaultHtmlTemplate(documentTypeLabel),
    css_template: defaultCssTemplate,
    js_template: defaultJsTemplate,
    paper_size: "A4",
    orientation: "portrait",
    is_default: false,
  });

  useEffect(() => {
    setPersistedState(readPersistedPrintState(storageKey));
  }, [storageKey]);

  useEffect(() => {
    if (!hasLocationPrintData(locationState)) return;
    persistPrintState(storageKey, locationState);
    setPersistedState(locationState);
  }, [locationState, storageKey]);

  const replaceSearchParams = useCallback(
    (nextParams: URLSearchParams) => {
      navigate(
        { pathname: location.pathname, search: `?${nextParams.toString()}` },
        { replace: true, state: location.state },
      );
    },
    [navigate, location.pathname, location.state],
  );

  useEffect(() => {
    if (!apiDocumentType) return;
    setDraftFormat((prev) => ({
      ...prev,
      document_type: apiDocumentType,
      html_template:
        prev.document_type === apiDocumentType
          ? prev.html_template
          : defaultHtmlTemplate(documentTypeLabel),
    }));
  }, [apiDocumentType, documentTypeLabel]);

  const formatsQuery = useQuery({
    queryKey: ["print-formats", apiDocumentType],
    queryFn: async () => {
      if (!apiDocumentType) return { results: [] as PrintFormat[] };
      return fetchPrintFormats(apiDocumentType);
    },
    enabled: Boolean(apiDocumentType),
  });

  const documentQuery = useQuery({
    queryKey: ["print-preview", apiDocumentType, documentRef],
    queryFn: async () => {
      if (!apiDocumentType || !documentRef)
        throw new Error("Missing document reference.");
      return apiDocumentType === "stock_entry"
        ? await fetchStockEntryByPostingNumber(documentRef)
        : await fetchStockOutByPostingNumber(documentRef);
    },
    enabled: Boolean(
      apiDocumentType && documentRef && !incomingState?.documentData,
    ),
  });

  const createFormatMutation = useMutation({
    mutationFn: createPrintFormat,
    onSuccess: (response) => {
      if (!apiDocumentType) return;
      showSuccess(response.message || "Print format created successfully.");
      void queryClient.invalidateQueries({
        queryKey: ["print-formats", apiDocumentType],
      });
      setEditingFormatId(null);
      setIsCreateOpen(false);
      setSelectedFormatSlug(response.print_format.slug);
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set("format", response.print_format.slug);
      replaceSearchParams(nextParams);
    },
    onError: (error) =>
      showError(GetErrorMessage(error, "print format", "create")),
  });

  const updateFormatMutation = useMutation({
    mutationFn: ({
      printFormatId,
      payload,
    }: {
      printFormatId: number;
      payload: CreatePrintFormatPayload;
    }) => updatePrintFormat(printFormatId, payload),
    onSuccess: (response) => {
      if (!apiDocumentType) return;
      showSuccess(response.message || "Print format updated successfully.");
      void queryClient.invalidateQueries({
        queryKey: ["print-formats", apiDocumentType],
      });
      setEditingFormatId(response.print_format.id);
      setSelectedFormatSlug(response.print_format.slug);
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set("format", response.print_format.slug);
      replaceSearchParams(nextParams);
    },
    onError: (error) =>
      showError(GetErrorMessage(error, "print format", "update")),
  });

  const deleteFormatMutation = useMutation({
    mutationFn: deletePrintFormat,
    onSuccess: async (response) => {
      if (!apiDocumentType) return;
      showSuccess(response.message || "Print format deleted successfully.");
      await queryClient.invalidateQueries({
        queryKey: ["print-formats", apiDocumentType],
      });
      setEditingFormatId(null);
      setIsCreateOpen(false);
      setSelectedFormatSlug(defaultFormat.slug);
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set("format", defaultFormat.slug);
      replaceSearchParams(nextParams);
    },
    onError: (error) =>
      showError(GetErrorMessage(error, "print format", "delete")),
  });

  useEffect(() => {
    if (!formatsQuery.error || !apiDocumentType) return;
    showError(GetErrorMessage(formatsQuery.error, "print formats", "load"));
  }, [apiDocumentType, formatsQuery.error, showError]);

  useEffect(() => {
    if (!documentQuery.error || !apiDocumentType) return;
    showError(GetErrorMessage(documentQuery.error, "print preview", "load"));
  }, [apiDocumentType, documentQuery.error, showError]);

  const apiFormats = useMemo(
    () => formatsQuery.data?.results || [],
    [formatsQuery.data?.results],
  );

  const formats = useMemo<PreviewFormat[]>(() => {
    const filteredFormats = apiFormats.filter(
      (format) =>
        format.slug !== defaultFormat.slug && format.slug !== guideFormat.slug,
    );
    return [defaultFormat, guideFormat, ...filteredFormats];
  }, [apiFormats, defaultFormat, guideFormat]);

  useEffect(() => {
    if (formats.length === 0) return;
    const requested = searchParams.get("format") || "";
    const fallback =
      formats.find((item) => item.slug === requested) ||
      formats.find((item) => item.is_default) ||
      formats[0];
    if (!fallback) return;
    setSelectedFormatSlug(fallback.slug);
    if (fallback.slug !== requested) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set("format", fallback.slug);
      replaceSearchParams(nextParams);
    }
  }, [formats, searchParams, replaceSearchParams]);

  const selectedFormat = useMemo(
    () =>
      formats.find((item) => item.slug === selectedFormatSlug) ||
      formats.find((item) => item.is_default) ||
      formats[0] ||
      null,
    [formats, selectedFormatSlug],
  );
  const isGuideSelected = selectedFormat?.slug === guideFormat.slug;
  const selectedSavedFormat =
    selectedFormat &&
    typeof selectedFormat.id === "number" &&
    selectedFormat.slug !== guideFormat.slug
      ? (selectedFormat as PrintFormat)
      : null;
  const canEditSelectedFormat = Boolean(selectedSavedFormat && canEditFormats);
  const canDeleteSelectedFormat = Boolean(
    selectedSavedFormat && !selectedSavedFormat.is_default && canDeleteFormats,
  );

  const documentData =
    incomingState?.documentData ?? documentQuery.data ?? null;
  const documentTitle =
    incomingState?.documentTitle ||
    deriveDocumentTitle(documentData, documentRef || documentTypeLabel);
  const documentSubtitle = incomingState?.documentSubtitle;
  const documentMeta =
    incomingState?.documentMeta || deriveDocumentMeta(documentData);

  const pageStyle = selectedFormat
    ? `@page { size: ${selectedFormat.paper_size} ${selectedFormat.orientation}; margin: 12mm; }`
    : "";

  const previewPaperStyle = useMemo(() => {
    if (!selectedFormat) return undefined;
    const paper = selectedFormat.paper_size.toLowerCase();
    const isLandscape = selectedFormat.orientation === "landscape";
    const presets: Record<string, { width: number; height: number }> = {
      a4: { width: 794, height: 1123 },
      letter: { width: 816, height: 1056 },
      thermal: { width: 320, height: 960 },
    };
    const preset = presets[paper] || presets.a4;
    const width = isLandscape ? preset.height : preset.width;
    const minHeight = isLandscape ? preset.width : preset.height;
    return {
      width: "100%",
      maxWidth: `${width}px`,
      minHeight: `${minHeight}px`,
    };
  }, [selectedFormat]);

  const customPreviewDocument = useMemo(() => {
    if (!selectedFormat || !documentData || !selectedFormat.has_custom_template)
      return "";
    return buildCustomPreviewDocument(
      selectedFormat,
      documentTypeLabel,
      documentData,
    );
  }, [documentData, documentTypeLabel, selectedFormat]);

  const previewContent = useMemo(() => {
    if (isGuideSelected) {
      return <PrintBuilderGuide />;
    }
    if (!selectedFormat || !documentData) return null;
    if (selectedFormat.has_custom_template) {
      return (
        <iframe
          ref={customPreviewRef}
          title={`${selectedFormat.name} preview`}
          srcDoc={customPreviewDocument}
          className="min-h-200 w-full rounded-2xl border border-slate-200 bg-white shadow-inner dark:border-slate-700 dark:bg-slate-950"
        />
      );
    }
    if (apiDocumentType === "stock_entry") {
      return (
        <StockEntryPreview
          data={documentData as StockEntryDetail}
          format={selectedFormat}
        />
      );
    }
    if (apiDocumentType === "stock_out") {
      return (
        <StockOutPreview
          data={documentData as StockOutDetail}
          format={selectedFormat}
        />
      );
    }
    return (
      <GenericDocumentPreview
        data={documentData}
        format={selectedFormat}
        documentLabel={documentTypeLabel}
        documentRef={documentRef || documentTitle}
        documentTitle={documentTitle}
        documentSubtitle={documentSubtitle}
        documentMeta={documentMeta}
      />
    );
  }, [
    apiDocumentType,
    customPreviewDocument,
    documentData,
    documentMeta,
    documentRef,
    documentSubtitle,
    documentTitle,
    documentTypeLabel,
    isGuideSelected,
    selectedFormat,
  ]);

  const handleCreateFormat = () => {
    if (!apiDocumentType) return;
    const name = draftFormat.name.trim();
    const slug = makeSlug(draftFormat.slug || name);
    if (!name) return showError("Print format name is required.");
    if (!slug) return showError("Print format slug is required.");
    const payload = {
      ...draftFormat,
      document_type: apiDocumentType,
      name,
      slug,
    };

    if (editingFormatId) {
      updateFormatMutation.mutate({
        printFormatId: editingFormatId,
        payload,
      });
      return;
    }

    createFormatMutation.mutate(payload);
  };

  const handleEditSelectedFormat = () => {
    if (!selectedSavedFormat) return;
    setEditingFormatId(selectedSavedFormat.id);
    setDraftFormat({
      document_type: selectedSavedFormat.document_type,
      name: selectedSavedFormat.name,
      slug: selectedSavedFormat.slug,
      template_key: selectedSavedFormat.template_key,
      description: selectedSavedFormat.description || "",
      html_template:
        selectedSavedFormat.html_template ||
        defaultHtmlTemplate(documentTypeLabel),
      css_template: selectedSavedFormat.css_template || defaultCssTemplate,
      js_template: selectedSavedFormat.js_template || defaultJsTemplate,
      paper_size: selectedSavedFormat.paper_size,
      orientation: selectedSavedFormat.orientation,
      is_default: selectedSavedFormat.is_default,
    });
    setActiveTab("html");
    setIsCreateOpen(true);
  };

  const handleDeleteSelectedFormat = async () => {
    if (!selectedSavedFormat) return;
    const result = await confirm({
      title: "Delete Print Format",
      message:
        "This will permanently delete the selected print format. You cannot undo this action.",
      confirmLabel: "Delete Format",
      cancelLabel: "Cancel",
      variant: "danger",
    });
    if (!result.confirmed) return;
    deleteFormatMutation.mutate(selectedSavedFormat.id);
  };

  const resetDraftFormat = useCallback(() => {
    setEditingFormatId(null);
    setDraftFormat({
      document_type: apiDocumentType || "stock_entry",
      name: "",
      slug: "",
      template_key: "standard",
      description: "",
      html_template: defaultHtmlTemplate(documentTypeLabel),
      css_template: defaultCssTemplate,
      js_template: defaultJsTemplate,
      paper_size: "A4",
      orientation: "portrait",
      is_default: false,
    });
  }, [apiDocumentType, documentTypeLabel]);

  const handleOpenPrint = () => {
    if (isGuideSelected) return;
    if (
      selectedFormat?.has_custom_template &&
      customPreviewRef.current?.contentWindow
    ) {
      customPreviewRef.current.contentWindow.focus();
      customPreviewRef.current.contentWindow.print();
      return;
    }
    window.print();
  };

  const isLoading =
    !isGuideSelected && (formatsQuery.isLoading || documentQuery.isLoading);

  if (!routeDocumentType || !documentRef) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="max-w-md rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-xl dark:border-rose-900/30 dark:bg-slate-900">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
            <X className="h-8 w-8" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">
            Unsupported Route
          </h2>
          <p className="mb-6 text-slate-500 dark:text-slate-400">
            The print preview route you accessed is missing required parameters.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="w-full rounded-xl bg-slate-900 py-3 font-bold text-white dark:bg-white dark:text-slate-900"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12 text-slate-900 dark:bg-slate-950 dark:text-white">
      <style>{pageStyle}</style>

      <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-md print:hidden dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="hidden sm:block">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">
                Print Preview
              </p>
              <h1 className="max-w-50 truncate text-sm font-bold text-slate-900 dark:text-white">
                {documentTypeLabel} - {documentRef}
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* <div className="mr-2 hidden items-center rounded-lg bg-slate-100 p-1 dark:bg-slate-800 md:flex">
              <button className="rounded-md bg-white p-1.5 text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"><Monitor className="h-4 w-4" /></button>
              <button className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><Smartphone className="h-4 w-4" /></button>
            </div> */}
            <button
              onClick={handleOpenPrint}
              disabled={isGuideSelected}
              className="flex items-center space-x-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none"
            >
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">
                {isGuideSelected ? "Guide Open" : "Print"}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 print:p-0">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="space-y-6 print:hidden lg:col-span-4">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-100 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-800/50">
                <h2 className="flex items-center text-sm font-bold">
                  <Settings className="mr-2 h-4 w-4 text-emerald-500" />
                  Format Settings
                </h2>
              </div>
              <div className="space-y-4 p-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                    Selected Layout
                  </label>
                  <div className="relative">
                    <select
                      value={selectedFormat?.slug || ""}
                      onChange={(event) => {
                        const nextSlug = event.target.value;
                        setSelectedFormatSlug(nextSlug);
                        setEditingFormatId(null);
                        setIsCreateOpen(false);
                        if (nextSlug === guideFormat.slug) {
                          setIsCreateOpen(false);
                        }
                        const nextParams = new URLSearchParams(searchParams);
                        nextParams.set("format", nextSlug);
                        replaceSearchParams(nextParams);
                      }}
                      className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition-all focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      {formats.map((format) => (
                        <option key={format.id} value={format.slug}>
                          {format.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                {canManageSavedFormats && (
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        const nextOpen = !isCreateOpen;
                        setIsCreateOpen(nextOpen);
                        if (selectedFormatSlug === guideFormat.slug) {
                          setSelectedFormatSlug(defaultFormat.slug);
                          const nextParams = new URLSearchParams(searchParams);
                          nextParams.set("format", defaultFormat.slug);
                          replaceSearchParams(nextParams);
                        }
                        if (nextOpen) {
                          resetDraftFormat();
                        }
                      }}
                      className={`w-full rounded-xl border px-4 py-3 text-sm font-bold transition-all ${isCreateOpen ? "border-slate-200 bg-slate-100 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white" : "border-emerald-100 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:border-emerald-900/30 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40"}`}
                    >
                      <span className="flex items-center justify-center space-x-2">
                        {isCreateOpen ? (
                          <X className="h-4 w-4" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                        <span>
                          {isCreateOpen
                            ? "Cancel Builder"
                            : "Create Custom Layout"}
                        </span>
                      </span>
                    </button>

                    {canEditSelectedFormat && !isCreateOpen && (
                      <button
                        type="button"
                        onClick={handleEditSelectedFormat}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                      >
                        <span className="flex items-center justify-center space-x-2">
                          <Pencil className="h-4 w-4" />
                          <span>Edit Selected Layout</span>
                        </span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {!canManageSavedFormats && (
                <div className="flex items-start space-x-3 border-t border-amber-100 bg-amber-50 p-4 dark:border-amber-900/30 dark:bg-amber-900/20">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300">
                    Saved custom formats are not available for this route yet.
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-linear-to-br from-emerald-600 to-teal-700 p-6 text-white shadow-lg shadow-emerald-600/20">
              <h3 className="mb-2 flex items-center font-bold">
                <Layout className="mr-2 h-4 w-4" />
                Pro Tip
              </h3>
              <p className="text-xs leading-relaxed text-emerald-50 opacity-90">
                Custom layouts let you use full HTML and CSS to match your
                branding. You can also expose dynamic document fields through
                the template placeholders.
              </p>
            </div>
          </div>

          <div className="space-y-6 lg:col-span-8">
            {isCreateOpen && canManageSavedFormats ? (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
                  <h2 className="flex items-center font-bold text-slate-900 dark:text-white">
                    <Code className="mr-2 h-4 w-4 text-emerald-500" />
                    {editingFormatId ? "Edit Layout" : "Layout Builder"}
                  </h2>
                  <div className="flex items-center gap-2">
                    {editingFormatId && (
                      <button
                        type="button"
                        onClick={() => {
                          resetDraftFormat();
                          setSelectedFormatSlug(defaultFormat.slug);
                          const nextParams = new URLSearchParams(searchParams);
                          nextParams.set("format", defaultFormat.slug);
                          replaceSearchParams(nextParams);
                        }}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-bold text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        New Format
                      </button>
                    )}
                    {canDeleteSelectedFormat && (
                      <button
                        type="button"
                        onClick={() => void handleDeleteSelectedFormat()}
                        disabled={deleteFormatMutation.isPending}
                        className="flex items-center space-x-1 rounded-lg border border-rose-200 px-3 py-2 text-[11px] font-bold text-rose-600 transition-all hover:bg-rose-50 disabled:opacity-50 dark:border-rose-900/40 dark:text-rose-400 dark:hover:bg-rose-950/30"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>
                          {deleteFormatMutation.isPending
                            ? "Deleting..."
                            : "Delete"}
                        </span>
                      </button>
                    )}
                    <button
                      onClick={handleCreateFormat}
                      disabled={
                        createFormatMutation.isPending ||
                        updateFormatMutation.isPending
                      }
                      className="flex items-center space-x-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white transition-all hover:opacity-90 disabled:opacity-50 dark:bg-white dark:text-slate-900"
                    >
                      {editingFormatId ? (
                        <Pencil className="h-3.5 w-3.5" />
                      ) : (
                        <Save className="h-3.5 w-3.5" />
                      )}
                      <span>
                        {createFormatMutation.isPending ||
                        updateFormatMutation.isPending
                          ? "Saving..."
                          : editingFormatId
                            ? "Update Format"
                            : "Save Format"}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="space-y-6 p-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                        Format Name
                      </label>
                      <input
                        value={draftFormat.name}
                        onChange={(e) =>
                          setDraftFormat((p) => ({
                            ...p,
                            name: e.target.value,
                            slug:
                              !p.slug || p.slug === makeSlug(p.name)
                                ? makeSlug(e.target.value)
                                : p.slug,
                          }))
                        }
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800"
                        placeholder="e.g. Modern Invoice"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                        Slug
                      </label>
                      <input
                        value={draftFormat.slug || ""}
                        onChange={(e) =>
                          setDraftFormat((p) => ({
                            ...p,
                            slug: makeSlug(e.target.value),
                          }))
                        }
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800"
                        placeholder="modern-invoice"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                        Paper Size
                      </label>
                      <select
                        value={draftFormat.paper_size}
                        onChange={(e) =>
                          setDraftFormat((p) => ({
                            ...p,
                            paper_size: e.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none dark:border-slate-700 dark:bg-slate-800"
                      >
                        <option value="A4">A4</option>
                        <option value="Letter">Letter</option>
                        <option value="Thermal">Thermal (80mm)</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                        Orientation
                      </label>
                      <select
                        value={draftFormat.orientation}
                        onChange={(e) =>
                          setDraftFormat((p) => ({
                            ...p,
                            orientation: e.target.value as
                              | "portrait"
                              | "landscape",
                          }))
                        }
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none dark:border-slate-700 dark:bg-slate-800"
                      >
                        <option value="portrait">Portrait</option>
                        <option value="landscape">Landscape</option>
                      </select>
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                        Template Type
                      </label>
                      <select
                        value={draftFormat.template_key}
                        onChange={(e) =>
                          setDraftFormat((p) => ({
                            ...p,
                            template_key: e.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none dark:border-slate-700 dark:bg-slate-800"
                      >
                        <option value="standard">Standard</option>
                        <option value="compact">Compact</option>
                        <option value="invoice">Invoice</option>
                        <option value="receipt">Receipt</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex w-fit items-center space-x-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                      <button
                        onClick={() => setActiveTab("html")}
                        className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${activeTab === "html" ? "bg-white text-emerald-600 shadow-sm dark:bg-slate-700 dark:text-emerald-400" : "text-slate-500"}`}
                      >
                        HTML
                      </button>
                      <button
                        onClick={() => setActiveTab("css")}
                        className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${activeTab === "css" ? "bg-white text-emerald-600 shadow-sm dark:bg-slate-700 dark:text-emerald-400" : "text-slate-500"}`}
                      >
                        CSS
                      </button>
                      <button
                        onClick={() => setActiveTab("js")}
                        className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${activeTab === "js" ? "bg-white text-emerald-600 shadow-sm dark:bg-slate-700 dark:text-emerald-400" : "text-slate-500"}`}
                      >
                        JS
                      </button>
                    </div>
                    {activeTab === "html" && (
                      <textarea
                        rows={12}
                        value={draftFormat.html_template}
                        onChange={(e) =>
                          setDraftFormat((p) => ({
                            ...p,
                            html_template: e.target.value,
                          }))
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-slate-950 px-5 py-4 font-mono text-xs text-emerald-400 outline-none focus:ring-2 focus:ring-emerald-500/50 dark:border-slate-700"
                      />
                    )}
                    {activeTab === "css" && (
                      <textarea
                        rows={12}
                        value={draftFormat.css_template}
                        onChange={(e) =>
                          setDraftFormat((p) => ({
                            ...p,
                            css_template: e.target.value,
                          }))
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-slate-950 px-5 py-4 font-mono text-xs text-blue-400 outline-none focus:ring-2 focus:ring-blue-500/50 dark:border-slate-700"
                      />
                    )}
                    {activeTab === "js" && (
                      <textarea
                        rows={12}
                        value={draftFormat.js_template}
                        onChange={(e) =>
                          setDraftFormat((p) => ({
                            ...p,
                            js_template: e.target.value,
                          }))
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-slate-950 px-5 py-4 font-mono text-xs text-amber-400 outline-none focus:ring-2 focus:ring-amber-500/50 dark:border-slate-700"
                      />
                    )}
                  </div>

                  <div className="flex items-start space-x-3 rounded-xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/30 dark:bg-blue-900/20">
                    <Info className="mt-0.5 h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <div className="text-xs leading-relaxed text-blue-800 dark:text-blue-300">
                      Use <code>{`{{ ${helperCodeLabel} }}`}</code> for dynamic
                      data. Use <code>{`{{ ${helperCodeJson} }}`}</code> to
                      inspect the full data object. Use{" "}
                      <code>{`{{ ${helperCodeEach} }}`}</code> ...{" "}
                      <code>{`{{ /each }}`}</code> to loop through arrays like
                      line items. Use <code>{`{{ ${helperCodeIf} }}`}</code> ...{" "}
                      <code>{`{{ else if data.other_field }}`}</code> ...{" "}
                      <code>{`{{ else }}`}</code> ... <code>{`{{ /if }}`}</code>{" "}
                      for optional fields. To read the full help page, choose{" "}
                      <strong>Help / Guide</strong> in the Selected Layout
                      dropdown.
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {isLoading ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-20 text-center dark:border-slate-800 dark:bg-slate-900">
                    <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
                    <p className="font-medium text-slate-500 dark:text-slate-400">
                      Generating preview...
                    </p>
                  </div>
                ) : !selectedFormat || !previewContent ? (
                  <div className="rounded-2xl border border-rose-200 bg-white p-20 text-center dark:border-rose-900/30 dark:bg-slate-900">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                      <FileText className="h-8 w-8" />
                    </div>
                    <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">
                      Preview Unavailable
                    </h3>
                    <p className="mx-auto max-w-sm text-slate-500 dark:text-slate-400">
                      We could not load the preview for this document. Please
                      ensure the document exists and try again.
                    </p>
                  </div>
                ) : (
                  <div className="group relative">
                    <div
                      className={`mx-auto bg-white shadow-2xl shadow-slate-200 transition-all duration-500 dark:shadow-none ${selectedFormat.template_key === "receipt" ? "max-w-100" : "max-w-full"} print:max-w-none print:shadow-none`}
                      style={
                        selectedFormat.template_key === "receipt"
                          ? undefined
                          : previewPaperStyle
                      }
                    >
                      {previewContent}
                    </div>
                    <div className="absolute right-4 top-4 rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 print:hidden dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-300">
                      {selectedFormat.paper_size} {selectedFormat.orientation}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintPreviewPage;
