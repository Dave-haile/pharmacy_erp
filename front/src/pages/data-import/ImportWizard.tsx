import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  Loader2,
  X,
  Eye,
  Table,
} from "lucide-react";
import api from "../../services/api";

interface TableField {
  name: string;
  type: string;
  required: boolean;
  label: string;
  description?: string;
  example?: string;
  choices?: string[];
  max_length?: number;
  is_identifier?: boolean;
}

interface TableSchema {
  table_code: string;
  table_name: string;
  fields: TableField[]; // Columns marked for import (include_in_import: true)
  required_fields: string[];
  identifier_fields: string[];
  all_columns?: TableField[]; // All columns for reference
}

interface ImportPreview {
  valid_rows: Record<string, unknown>[];
  invalid_rows: {
    row: number;
    data: Record<string, unknown>;
    errors: string[];
  }[];
  total_count: number;
}

const ImportWizard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { tableCode, tableName, mode, backendEndpoint } = location.state || {};

  const [schema, setSchema] = useState<TableSchema | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [importResult, setImportResult] = useState<{
    created?: number;
    updated?: number;
    errors?: number;
  } | null>(null);

  useEffect(() => {
    if (!tableCode) {
      navigate("/system/data-import");
      return;
    }
    fetchSchema();
  }, [tableCode]);

  const fetchSchema = async () => {
    try {
      setIsLoading(true);
      setError("");
      const response = await api.get(
        `/api/inventory/tables/${tableCode}/schema/`,
      );
      setSchema(response.data);
    } catch (err) {
      setError("Failed to load table schema");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploadError("");
      setPreview(null);
    }
  };

  const handlePreview = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("mode", mode);

    try {
      const response = await api.post(
        `/api/inventory/tables/${tableCode}/import-preview/`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      setPreview(response.data);
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to preview file";
      setUploadError(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleImport = async () => {
    if (!file || !preview) return;

    setIsImporting(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("mode", mode);

    try {
      const response = await api.post(
        `/api/inventory/tables/${tableCode}/import/`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      setImportSuccess(true);
      setImportResult(response.data);
    } catch (err) {
      console.error(err);
      setUploadError("Import failed. Please try again.");
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    if (!schema) return;

    const headers = schema.fields.map((f) => f.name).join(",");
    const exampleRow = schema.fields.map((f) => f.example || "").join(",");

    const csvContent = [headers, exampleRow].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${tableCode}_template.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "string":
        return "ABC";
      case "number":
      case "decimal":
        return "123";
      case "date":
        return "📅";
      case "boolean":
        return "☑️";
      case "choice":
        return "⚡";
      default:
        return "?";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Loading table schema...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
            Error Loading Schema
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            {error}
          </p>
          <button
            onClick={() => navigate("/system/data-import")}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (importSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 max-w-md w-full text-center">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
            Import Successful!
          </h2>
          <div className="grid grid-cols-2 gap-4 my-6">
            {importResult?.created !== undefined && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl">
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {importResult.created}
                </p>
                <p className="text-xs text-slate-500">Created</p>
              </div>
            )}
            {importResult?.updated !== undefined && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl">
                <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
                  {importResult.updated}
                </p>
                <p className="text-xs text-slate-500">Updated</p>
              </div>
            )}
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate("/system/data-import")}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-medium hover:bg-slate-200"
            >
              Import More
            </button>
            {backendEndpoint && (
              <button
                onClick={() => navigate(backendEndpoint.replace("/api", ""))}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600"
              >
                View Records
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/system/data-import")}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-500" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Import {tableName}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Mode:{" "}
                <span
                  className={`font-medium ${
                    mode === "insert" ? "text-emerald-600" : "text-blue-600"
                  }`}
                >
                  {mode === "insert" ? "Insert New Records" : "Update Existing"}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Field Requirements Section */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Table className="w-5 h-5 text-emerald-500" />
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Field Requirements
              </h2>
            </div>
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Template
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {schema?.fields.map((field) => (
              <div
                key={field.name}
                className="px-6 py-4 flex items-start gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                  {getTypeIcon(field.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100 font-mono">
                      {field.name}
                    </span>
                    {field.required && (
                      <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-bold uppercase rounded">
                        Required
                      </span>
                    )}
                    {field.is_identifier && (
                      <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase rounded">
                        Identifier
                      </span>
                    )}
                    <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase rounded">
                      {field.type}
                    </span>
                    {field.max_length && (
                      <span className="text-xs text-slate-400">
                        Max {field.max_length} chars
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                    {field.label}
                  </p>

                  {field.description && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      {field.description}
                    </p>
                  )}

                  {field.example && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      Example:{" "}
                      <span className="font-mono text-slate-500">
                        {field.example}
                      </span>
                    </p>
                  )}

                  {field.choices && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {field.choices.map((choice) => (
                        <span
                          key={choice}
                          className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded"
                        >
                          {choice}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* File Upload Section */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-emerald-500" />
            Upload File
          </h2>

          {!file ? (
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 text-center">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer block">
                <FileSpreadsheet className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  CSV, Excel (.xlsx, .xls)
                </p>
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-10 h-10 text-emerald-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setFile(null);
                    setPreview(null);
                    setUploadError("");
                  }}
                  className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {uploadError && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 dark:text-red-400">
                    {uploadError}
                  </p>
                </div>
              )}

              {preview && (
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Preview
                    </p>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-emerald-600 dark:text-emerald-400">
                        ✓ {preview.valid_rows.length} valid
                      </span>
                      {preview.invalid_rows.length > 0 && (
                        <span className="text-red-600 dark:text-red-400">
                          ✗ {preview.invalid_rows.length} invalid
                        </span>
                      )}
                    </div>
                  </div>

                  {preview.invalid_rows.length > 0 && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/10">
                      <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-2">
                        Errors Found:
                      </p>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {preview.invalid_rows.slice(0, 5).map((row, i) => (
                          <p
                            key={i}
                            className="text-xs text-red-600 dark:text-red-400"
                          >
                            Row {row.row}: {row.errors.join(", ")}
                          </p>
                        ))}
                        {preview.invalid_rows.length > 5 && (
                          <p className="text-xs text-slate-500">
                            ...and {preview.invalid_rows.length - 5} more
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                {!preview ? (
                  <button
                    onClick={handlePreview}
                    disabled={isUploading}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white rounded-xl font-medium transition-colors"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        Preview Import
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleImport}
                    disabled={isImporting || preview.invalid_rows.length > 0}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white rounded-xl font-medium transition-colors"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Import {preview.valid_rows.length} Records
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportWizard;
