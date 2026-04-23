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
  Settings,
  Columns,
  Info,
  ChevronRight,
} from "lucide-react";
import api from "../../services/api";

interface ReferenceInfo {
  is_reference: boolean;
  reference_model?: string;
  reference_table?: string;
  reference_label_field?: string;
  reference_id_field?: string;
}

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
  is_reference?: boolean;
  reference_info?: ReferenceInfo | null;
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
    error_details?: { row: number; errors: string[] }[];
  } | null>(null);

  // Modal states
  const [showFieldRequirementsModal, setShowFieldRequirementsModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set());
  const [includeSampleData, setIncludeSampleData] = useState(true);
  const [sampleDataCount, setSampleDataCount] = useState(5);

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
    setUploadError("");

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

      // Show error details if there were import errors
      if (response.data.error_details && response.data.error_details.length > 0) {
        const errorCount = response.data.error_details.length;
        setUploadError(
          `Import completed with ${errorCount} error(s). Check the error details below.`
        );
      }
    } catch (err: unknown) {
      console.error(err);
      let errorMsg = "Import failed. Please try again.";

      // Try to extract detailed error from response
      const axiosError = err as {
        response?: {
          data?: { error?: string; detail?: string; errors?: string[] };
          status?: number;
        };
        message?: string;
      };

      if (axiosError.response?.data?.error) {
        errorMsg = axiosError.response.data.error;
      } else if (axiosError.response?.data?.detail) {
        errorMsg = axiosError.response.data.detail;
      } else if (axiosError.response?.data?.errors) {
        errorMsg = axiosError.response.data.errors.join("; ");
      } else if (axiosError.message) {
        errorMsg = axiosError.message;
      }

      setUploadError(errorMsg);
      setImportSuccess(false);
    } finally {
      setIsImporting(false);
    }
  };

  // Initialize selected columns when schema loads
  useEffect(() => {
    if (schema?.fields) {
      setSelectedColumns(new Set(schema.fields.map((f) => f.name)));
    }
  }, [schema]);

  const handleColumnToggle = (columnName: string) => {
    const newSelected = new Set(selectedColumns);
    if (newSelected.has(columnName)) {
      newSelected.delete(columnName);
    } else {
      newSelected.add(columnName);
    }
    setSelectedColumns(newSelected);
  };

  const handleSelectAllColumns = () => {
    if (schema?.fields) {
      setSelectedColumns(new Set(schema.fields.map((f) => f.name)));
    }
  };

  const handleDeselectAllColumns = () => {
    setSelectedColumns(new Set());
  };

  const downloadTemplate = () => {
    if (!schema || selectedColumns.size === 0) return;

    const selectedFields = schema.fields.filter((f) => selectedColumns.has(f.name));
    const headers = selectedFields.map((f) => f.name).join(",");

    let csvContent = headers + "\n";

    // Add sample data rows if requested
    if (includeSampleData && sampleDataCount > 0) {
      for (let i = 0; i < sampleDataCount; i++) {
        const row = selectedFields.map((f) => {
          // Generate contextual sample data based on field type
          if (f.is_reference) {
            return `Sample ${f.label}`;
          }
          if (f.example) {
            return f.example;
          }
          if (f.type === "boolean") {
            return i % 2 === 0 ? "true" : "false";
          }
          if (f.type === "integer" || f.type === "decimal") {
            return String(i + 1);
          }
          if (f.choices && f.choices.length > 0) {
            return f.choices[i % f.choices.length];
          }
          return `Sample ${f.label} ${i + 1}`;
        });
        csvContent += row.join(",") + "\n";
      }
    }

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${tableCode}_template.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportModal(false);
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
        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => setShowFieldRequirementsModal(true)}
            className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-lg transition-all group"
          >
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30 transition-colors">
              <Table className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="text-left flex-1">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Field Requirements
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                View required fields and data types
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-400 transition-colors" />
          </button>

          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-lg transition-all group"
          >
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
              <Download className="w-6 h-6 text-blue-500" />
            </div>
            <div className="text-left flex-1">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Download Template
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Customize and export import template
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-400 transition-colors" />
          </button>
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
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-red-700 dark:text-red-400 font-medium">
                        {uploadError}
                      </p>

                      {/* Show import error details if available */}
                      {importResult?.error_details && importResult.error_details.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                            Error Details:
                          </p>
                          <div className="max-h-40 overflow-y-auto space-y-1 bg-white dark:bg-slate-800 rounded-lg p-2 border border-red-100 dark:border-red-800">
                            {importResult.error_details.map((error, idx) => (
                              <div
                                key={idx}
                                className="text-xs text-red-600 dark:text-red-400 py-1 px-2 hover:bg-red-50 dark:hover:bg-red-900/10 rounded"
                              >
                                <span className="font-mono font-medium">Row {error.row}:</span>{" "}
                                {error.errors.join(", ")}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
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

      {/* Field Requirements Modal */}
      {showFieldRequirementsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center">
                  <Table className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                    Field Requirements
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {schema?.fields.length || 0} fields available for import
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowFieldRequirementsModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
                {schema?.fields.map((field) => (
                  <div
                    key={field.name}
                    className={`p-4 rounded-xl border transition-all ${
                      field.required
                        ? "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800"
                        : "bg-slate-50 dark:bg-slate-700/30 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                        field.required
                          ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                      }`}>
                        {getTypeIcon(field.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className={`text-sm font-bold font-mono ${
                            field.required
                              ? "text-red-700 dark:text-red-300"
                              : "text-slate-800 dark:text-slate-100"
                          }`}>
                            {field.name}
                          </span>
                          {field.required && (
                            <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold uppercase rounded-full">
                              Required
                            </span>
                          )}
                          {field.is_identifier && (
                            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase rounded-full">
                              Identifier
                            </span>
                          )}
                          {field.is_reference && (
                            <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-[10px] font-bold uppercase rounded-full">
                              Reference
                            </span>
                          )}
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase rounded-full">
                            {field.type}
                          </span>
                        </div>

                        <p className="text-sm text-slate-700 dark:text-slate-300 mb-1">
                          {field.label}
                        </p>

                        {field.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                            {field.description}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-4 text-xs">
                          {field.example && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-400">Example:</span>
                              <code className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300 font-mono">
                                {field.example}
                              </code>
                            </div>
                          )}
                          {field.max_length && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-400">Max:</span>
                              <span className="text-slate-600 dark:text-slate-300">{field.max_length} chars</span>
                            </div>
                          )}
                        </div>

                        {field.choices && field.choices.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs text-slate-400 mb-1.5">Allowed values:</p>
                            <div className="flex flex-wrap gap-1.5">
                              {field.choices.map((choice) => (
                                <span
                                  key={choice}
                                  className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-xs rounded-lg"
                                >
                                  {choice}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {field.is_reference && field.reference_info && (
                          <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-100 dark:border-purple-800/30">
                            <p className="text-xs text-purple-700 dark:text-purple-300 flex items-center gap-2">
                              <Info className="w-4 h-4" />
                              You can reference this field by name (e.g., "Dermatology") or ID
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-slate-600 dark:text-slate-400">Required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                    <span className="text-slate-600 dark:text-slate-400">Optional</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowFieldRequirementsModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-medium hover:bg-slate-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Template Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                  <Download className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                    Download Template
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Customize your import template
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Data Options */}
              <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Template Options
                </h3>
                <div className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeSampleData}
                      onChange={(e) => setIncludeSampleData(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-blue-500 focus:ring-blue-500"
                    />
                    <div>
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        Include sample data
                      </p>
                      <p className="text-xs text-slate-500">
                        Add example rows to help understand the format
                      </p>
                    </div>
                  </label>

                  {includeSampleData && (
                    <div className="ml-7">
                      <label className="text-xs text-slate-600 dark:text-slate-400 mb-1.5 block">
                        Number of sample rows: {sampleDataCount}
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="20"
                        value={sampleDataCount}
                        onChange={(e) => setSampleDataCount(parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                      <div className="flex justify-between text-xs text-slate-400 mt-1">
                        <span>1</span>
                        <span>20</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Column Selection */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Columns className="w-4 h-4" />
                    Select Columns ({selectedColumns.size}/{schema?.fields.length || 0})
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSelectAllColumns}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      onClick={handleDeselectAllColumns}
                      className="text-xs text-slate-500 hover:text-slate-600 font-medium"
                    >
                      None
                    </button>
                  </div>
                </div>

                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-700 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 w-10">
                          <input
                            type="checkbox"
                            checked={selectedColumns.size === (schema?.fields.length || 0)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                handleSelectAllColumns();
                              } else {
                                handleDeselectAllColumns();
                              }
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-blue-500"
                          />
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-400">
                          Column Name
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-400">
                          Type
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-400">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {schema?.fields.map((field) => (
                        <tr
                          key={field.name}
                          className={`${
                            field.required ? "bg-red-50/30 dark:bg-red-900/5" : ""
                          } hover:bg-slate-50 dark:hover:bg-slate-700/30`}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedColumns.has(field.name)}
                              onChange={() => handleColumnToggle(field.name)}
                              className="w-4 h-4 rounded border-slate-300 text-blue-500"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-slate-800 dark:text-slate-100 font-mono">
                                {field.name}
                              </p>
                              <p className="text-xs text-slate-500">{field.label}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded">
                              {field.type}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {field.required ? (
                              <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold rounded">
                                Required
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs rounded">
                                Optional
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 shrink-0 flex justify-end gap-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={downloadTemplate}
                disabled={selectedColumns.size === 0}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportWizard;
