import React, { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  FileUp,
  Table2,
  UploadCloud,
} from "lucide-react";

import {
  DocumentCard,
  DocumentHeader,
  DocumentPage,
  documentPrimaryButtonClassName,
  documentSecondaryButtonClassName,
  DocumentSummaryCard,
} from "@/src/components/common/DocumentUI";
import { useToast } from "@/src/hooks/useToast";
import {
  importMedicines,
  previewMedicineImport,
  type MedicineImportPreviewResponse,
} from "@/src/services/medicines";

const MedicineImportPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { showError, showInfo, showSuccess } = useToast();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<MedicineImportPreviewResponse | null>(
    null,
  );
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const previewErrorCount = preview?.errors.length || 0;
  const visibleColumns = useMemo(
    () => preview?.columns || [],
    [preview?.columns],
  );

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setSelectedFile(file);
    setIsPreviewing(true);
    setPreview(null);

    try {
      const response = await previewMedicineImport(file);
      setPreview(response);

      if (response.can_import) {
        showSuccess(
          "File validated. Review the sample data and continue when ready.",
        );
      } else {
        showInfo(
          "The file was analyzed. Review the highlighted import issues before continuing.",
        );
      }
    } catch (error) {
      console.error("Medicine import preview failed", error);
      setPreview(null);
      showError("Failed to analyze the selected import file.");
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!selectedFile || !preview?.can_import) return;

    setIsImporting(true);
    try {
      const response = await importMedicines(selectedFile);
      if (response.failed > 0) {
        showError(
          `${response.message || "Medicine import completed with errors."} Created ${response.created}, failed ${response.failed}.`,
        );
        return;
      }

      showSuccess(
        response.message || `Imported ${response.created} medicines.`,
      );
      navigate("/inventory/medicines");
    } catch (error) {
      console.error("Medicine import failed", error);
      showError("Failed to import the selected file.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <DocumentPage>
      <DocumentHeader
        eyebrow="Medicine Import"
        title="Review Medicine Import File"
        description="Upload a CSV, JSON, or XLSX file, inspect the backend validation report, and confirm the import only after the file is clean."
        onBack={() => navigate("/inventory/medicines")}
        actions={
          <>
            <button
              type="button"
              onClick={handleChooseFile}
              disabled={isPreviewing || isImporting}
              className={documentSecondaryButtonClassName}
            >
              <UploadCloud className="mr-2 h-4 w-4" />
              {isPreviewing ? "Analyzing File" : "Choose File"}
            </button>
            <button
              type="button"
              onClick={() => void handleConfirmImport()}
              disabled={
                !selectedFile ||
                !preview?.can_import ||
                isPreviewing ||
                isImporting
              }
              className={documentPrimaryButtonClassName}
            >
              <FileUp className="mr-2 h-4 w-4" />
              {isImporting ? "Importing" : "Confirm Import"}
            </button>
          </>
        }
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.json,.xlsx"
        className="hidden"
        onChange={(event) => {
          void handleFileSelected(event);
        }}
      />

      <DocumentCard
        title="Selected File"
        description="The backend checks the file structure, validates required columns, and tests each row before import."
        accent="blue"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-600 dark:bg-sky-950/40 dark:text-sky-300">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900 dark:text-white">
                {selectedFile?.name || "No file selected"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {selectedFile
                  ? `${Math.max(1, Math.round(selectedFile.size / 1024))} KB`
                  : "Supported formats: CSV, JSON, XLSX"}
              </p>
            </div>
          </div>
          {!preview && (
            <p className="max-w-xl text-xs text-slate-500 dark:text-slate-400">
              After upload, you will see missing columns, row-level issues, and
              a sample of the parsed data before anything is imported.
            </p>
          )}
        </div>
      </DocumentCard>

      {preview && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <DocumentSummaryCard
              label="Detected Rows"
              value={preview.total_rows}
              hint={`Source: ${preview.source_format.toUpperCase()}`}
              tone="slate"
            />
            <DocumentSummaryCard
              label="Valid Rows"
              value={preview.valid_rows}
              hint="Ready to import"
              tone="emerald"
            />
            <DocumentSummaryCard
              label="Invalid Rows"
              value={preview.invalid_rows}
              hint="Need fixing before import"
              tone="amber"
            />
            <DocumentSummaryCard
              label="Reported Issues"
              value={previewErrorCount}
              hint={
                preview.can_import
                  ? "No blocking issues detected"
                  : "Check the issue list below"
              }
              tone={preview.can_import ? "blue" : "amber"}
            />
          </div>

          <DocumentCard
            title="Column Check"
            description="This compares the uploaded file structure with the expected medicine import format."
            accent={preview.can_import ? "emerald" : "amber"}
          >
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                  Detected Columns
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {preview.columns.length > 0 ? (
                    preview.columns.map((column) => (
                      <span
                        key={column}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                      >
                        {column}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      No readable columns detected.
                    </span>
                  )}
                </div>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-700 dark:text-amber-300">
                  Missing Required Columns
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {preview.missing_columns.length > 0 ? (
                    preview.missing_columns.map((column) => (
                      <span
                        key={column}
                        className="rounded-full border border-amber-300 bg-white px-3 py-1 text-[11px] font-semibold text-amber-700 dark:border-amber-800 dark:bg-slate-900 dark:text-amber-300"
                      >
                        {column}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-amber-700 dark:text-amber-300">
                      None
                    </span>
                  )}
                </div>
              </div>
              <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 dark:border-sky-900/40 dark:bg-sky-950/20">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-sky-700 dark:text-sky-300">
                  Unexpected Columns
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {preview.unexpected_columns.length > 0 ? (
                    preview.unexpected_columns.map((column) => (
                      <span
                        key={column}
                        className="rounded-full border border-sky-300 bg-white px-3 py-1 text-[11px] font-semibold text-sky-700 dark:border-sky-800 dark:bg-slate-900 dark:text-sky-300"
                      >
                        {column}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-sky-700 dark:text-sky-300">
                      None
                    </span>
                  )}
                </div>
              </div>
            </div>
          </DocumentCard>

          <DocumentCard
            title="Validation Report"
            description="Each issue includes the row and column so users can fix the source file quickly."
            accent={preview.can_import ? "emerald" : "amber"}
          >
            {preview.errors.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800">
                      <th className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                        Row
                      </th>
                      <th className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                        Column
                      </th>
                      <th className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                        Issue
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.errors.map((error, index) => (
                      <tr
                        key={`${error.row ?? "file"}-${error.column}-${index}`}
                        className="border-b border-slate-100 dark:border-slate-800/60"
                      >
                        <td className="px-3 py-3 text-sm font-black text-slate-900 dark:text-white">
                          {error.row ?? "File"}
                        </td>
                        <td className="px-3 py-3 text-sm font-semibold text-amber-700 dark:text-amber-300">
                          {error.column}
                        </td>
                        <td className="px-3 py-3 text-sm text-slate-600 dark:text-slate-300">
                          {error.message}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300">
                <CheckCircle2 className="h-5 w-5" />
                <p className="text-sm font-semibold">
                  No validation issues were found. This file is ready to import.
                </p>
              </div>
            )}
          </DocumentCard>

          <DocumentCard
            title="Sample Parsed Data"
            description="This is a backend preview of the first rows exactly as they were interpreted from the uploaded file."
            accent="slate"
          >
            {preview.sample_rows.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800">
                      <th className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                        Row
                      </th>
                      {visibleColumns.map((column) => (
                        <th
                          key={column}
                          className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400"
                        >
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.sample_rows.map((sampleRow) => (
                      <tr
                        key={sampleRow.row}
                        className="border-b border-slate-100 dark:border-slate-800/60"
                      >
                        <td className="px-3 py-3 text-sm font-black text-slate-900 dark:text-white">
                          {sampleRow.row}
                        </td>
                        {visibleColumns.map((column) => (
                          <td
                            key={`${sampleRow.row}-${column}`}
                            className="px-3 py-3 text-sm text-slate-600 dark:text-slate-300"
                          >
                            {sampleRow.values[column] || "-"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-600 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300">
                <Table2 className="h-5 w-5" />
                <p className="text-sm font-semibold">
                  No sample rows are available from this file.
                </p>
              </div>
            )}
          </DocumentCard>

          {!preview.can_import && (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
              <AlertTriangle className="mt-0.5 h-5 w-5" />
              <p className="text-sm font-semibold">
                Import is disabled until the reported issues are fixed in the
                source file and the file is uploaded again for a clean preview.
              </p>
            </div>
          )}
        </>
      )}
    </DocumentPage>
  );
};

export default MedicineImportPage;
