"use client";

import React, { useState } from "react";
import { api, UserSession, API_BASE_URL } from "@/lib/api";
import { 
  UploadCloud, FileSpreadsheet, Download, CheckCircle2, 
  AlertTriangle, XCircle, ArrowRight, RefreshCw, FileText,
  Check, ArrowLeft, ShieldAlert, Sparkles, Filter, ChevronRight
} from "lucide-react";
import { Pagination } from "@/components/Pagination";

interface BulkUploadViewProps {
  user: UserSession;
  onUploadSuccess: () => void;
}

interface RowValidationResult {
  rowIndex: number;
  data: Record<string, any>;
  isValid: boolean;
  errors: { field: string; message: string; severity: "CRITICAL" | "ERROR" | "WARNING" | "INFO"; suggestedFix: string }[];
}

const TARGET_FIELDS = [
  { key: "student_name", label: "Student Full Name", required: true },
  { key: "institution_reg_num", label: "Institutional Roll / Reg No", required: true },
  { key: "apaar_id", label: "12-Digit APAAR Identifier", required: true },
  { key: "course_code", label: "Course / Branch Code", required: true },
  { key: "email", label: "Student Email Address", required: true },
  { key: "phone", label: "Contact Phone Number", required: false },
  { key: "admission_year", label: "Admission Year", required: true },
  { key: "academic_year", label: "Academic Cycle (e.g. 2024-2025)", required: true },
  { key: "admission_category", label: "Seat Category (GENERAL/OBC/SC/ST)", required: false },
  { key: "is_supernumerary", label: "Supernumerary Flag (TRUE/FALSE)", required: false },
  { key: "supernumerary_category", label: "Supernumerary Category (TFW/EWS)", required: false }
];

export const BulkUploadView: React.FC<BulkUploadViewProps> = ({ user, onUploadSuccess }) => {
  // Wizard steps: 1 = Upload, 2 = Mapping, 3 = Validation Preview, 4 = Commit & Report
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Upload state
  const [file, setFile] = useState<File | null>(null);
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Step 2: Mapping state
  const [mappings, setMappings] = useState<Record<string, string>>({});

  // Step 3: Validation preview state
  const [validationResults, setValidationResults] = useState<RowValidationResult[]>([]);
  const [previewFilter, setPreviewFilter] = useState<"ALL" | "VALID" | "FLAGGED">("ALL");
  const [previewPage, setPreviewPage] = useState(1);
  const previewPageSize = 8;

  // Step 4: Commit state
  const [committing, setCommitting] = useState(false);
  const [commitResult, setCommitResult] = useState<any | null>(null);

  const downloadSample = (type: "csv" | "xlsx") => {
    window.open(`${API_BASE_URL}/imports/template?file_format=${type}`, "_blank");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setUploadError(null);

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
          if (lines.length > 0) {
            const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
            setParsedHeaders(headers);

            const rows: Record<string, string>[] = [];
            for (let i = 1; i < Math.min(lines.length, 50); i++) {
              const vals = lines[i].split(",").map(v => v.trim().replace(/^"|"$/g, ""));
              const rowObj: Record<string, string> = {};
              headers.forEach((h, idx) => {
                rowObj[h] = vals[idx] || "";
              });
              rows.push(rowObj);
            }
            setParsedRows(rows);

            // Auto-detect mappings
            const autoMap: Record<string, string> = {};
            headers.forEach(h => {
              const cleanH = h.toLowerCase().replace(/[^a-z0-9]/g, "");
              const match = TARGET_FIELDS.find(tf => {
                const cleanT = tf.key.toLowerCase().replace(/[^a-z0-9]/g, "");
                return cleanH.includes(cleanT) || cleanT.includes(cleanH);
              });
              if (match) {
                autoMap[h] = match.key;
              }
            });
            setMappings(autoMap);
          }
        } catch (err) {
          console.warn("Client preview parse error", err);
        }
      };
      reader.readAsText(selected);
    }
  };

  const handleProceedToValidation = () => {
    const results: RowValidationResult[] = parsedRows.map((row, idx) => {
      const errors: RowValidationResult["errors"] = [];

      TARGET_FIELDS.filter(f => f.required).forEach(f => {
        const sourceHeader = Object.keys(mappings).find(k => mappings[k] === f.key);
        const val = sourceHeader ? row[sourceHeader]?.trim() : "";
        if (!val) {
          errors.push({
            field: f.label,
            message: `Mandatory field '${f.label}' is missing or empty.`,
            severity: "CRITICAL",
            suggestedFix: "Supply non-empty value in uploaded spreadsheet."
          });
        }
      });

      const apaarHeader = Object.keys(mappings).find(k => mappings[k] === "apaar_id");
      const apaarVal = apaarHeader ? row[apaarHeader]?.trim() : "";
      if (apaarVal) {
        const cleanId = apaarVal.replace(/\D/g, "");
        if (cleanId.length !== 12 && !apaarVal.startsWith("SIM-")) {
          errors.push({
            field: "APAAR Identifier",
            message: `APAAR ID '${apaarVal}' is not a 12-digit standard identifier.`,
            severity: "ERROR",
            suggestedFix: "Verify 12-digit format or simulated test ID."
          });
        }
      }

      const emailHeader = Object.keys(mappings).find(k => mappings[k] === "email");
      const emailVal = emailHeader ? row[emailHeader]?.trim() : "";
      if (emailVal && !emailVal.includes("@")) {
        errors.push({
          field: "Email Address",
          message: `Invalid email address syntax '${emailVal}'.`,
          severity: "ERROR",
          suggestedFix: "Provide valid email format user@domain.com."
        });
      }

      return {
        rowIndex: idx + 1,
        data: row,
        isValid: errors.filter(e => e.severity === "CRITICAL" || e.severity === "ERROR").length === 0,
        errors
      };
    });

    setValidationResults(results);
    setCurrentStep(3);
  };

  const handleExecuteCommit = async () => {
    if (!file || !user.institution_id) return;
    try {
      setCommitting(true);
      const res = await api.uploadBatch(file, user.institution_id);
      setCommitResult(res);
      setCurrentStep(4);
      onUploadSuccess();
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setCommitting(false);
    }
  };

  const handleExportFailedRows = () => {
    const failed = validationResults.filter(r => !r.isValid);
    if (failed.length === 0) {
      alert("No invalid rows to export. All records passed validation!");
      return;
    }

    const headers = [...parsedHeaders, "VALIDATION_ERRORS"];
    const rows = failed.map(r => {
      const errMsgs = r.errors.map(e => `[${e.severity}] ${e.message}`).join(" | ");
      const rowValues = parsedHeaders.map(h => {
        let v = String(r.data[h] || "");
        if (/^[=+\-@]/.test(v)) {
          v = `'${v}`;
        }
        return `"${v.replace(/"/g, '""')}"`;
      });
      rowValues.push(`"${errMsgs.replace(/"/g, '""')}"`);
      return rowValues.join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Quarantined_Rows_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 uppercase tracking-wider">
              Bulk Data Import
            </span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              Guided 4-Step Ingestion Wizard
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-slate-900 dark:text-white shrink-0" />
            <span>Student Onboarding & Bulk Import Wizard</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-2xl leading-relaxed">
            Multi-stage ingestion: Raw spreadsheet intake → interactive schema column alignment → explainable dry-run validation preview → transactional database commitment.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => downloadSample("csv")}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 hover:text-slate-950 dark:hover:text-white transition flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Template (CSV)</span>
          </button>
          <button
            onClick={() => downloadSample("xlsx")}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 hover:text-slate-950 dark:hover:text-white transition flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Template (XLSX)</span>
          </button>
        </div>
      </div>

      {/* 4-Step Progress Stepper Bar */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          {[
            { step: 1, label: "1. Upload File", desc: "Select CSV or Excel file" },
            { step: 2, label: "2. Column Mapping", desc: "Align with schema fields" },
            { step: 3, label: "3. Validation Preview", desc: "Dry-run row checks" },
            { step: 4, label: "4. Confirmation", desc: "Transactional persist" }
          ].map((s) => {
            const isCurrent = currentStep === s.step;
            const isCompleted = currentStep > s.step;
            return (
              <div 
                key={s.step} 
                className={`p-3 rounded-lg border transition ${
                  isCurrent 
                    ? "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700" 
                    : isCompleted 
                    ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400" 
                    : "bg-slate-50/50 dark:bg-slate-850 border-slate-100 dark:border-slate-800 text-slate-400"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isCurrent 
                      ? "bg-slate-900 text-white" 
                      : isCompleted
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}>
                    {isCompleted ? "✓" : s.step}
                  </span>
                  <span className={`font-semibold ${isCurrent ? "text-slate-900 dark:text-white" : isCompleted ? "text-emerald-700 dark:text-emerald-400" : "text-slate-500"}`}>
                    {s.label}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 pl-7 hidden sm:block">
                  {s.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* STEP 1: File Upload */}
      {currentStep === 1 && (
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-slate-400 rounded-xl p-10 text-center transition bg-slate-50/50 dark:bg-slate-850/50">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center mx-auto mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Upload institutional student admission spreadsheet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4 max-w-sm mx-auto">
              Supported formats: CSV (.csv), Excel (.xlsx) · Maximum size: 15MB · UTF-8
            </p>

            <input
              type="file"
              id="file-upload"
              accept=".csv, .xlsx"
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="file-upload"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg cursor-pointer inline-flex items-center gap-2 transition shadow-xs"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Browse File</span>
            </label>

            {file && (
              <div className="mt-5 p-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg inline-flex items-center gap-3 text-xs shadow-xs max-w-sm w-full text-left">
                <FileSpreadsheet className="w-5 h-5 text-slate-800 dark:text-slate-200 shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="font-semibold text-slate-900 dark:text-white block truncate">{file.name}</span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {(file.size / 1024).toFixed(1)} KB · {parsedRows.length} sample rows parsed
                  </span>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500">
              Automatic column heuristics will match headers to standard fields.
            </span>
            <button
              onClick={() => setCurrentStep(2)}
              disabled={!file}
              className="px-4 py-2 font-semibold text-xs bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition disabled:opacity-40 flex items-center gap-1.5 shadow-xs"
            >
              <span>Next: Map Columns</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Interactive Column Mapping */}
      {currentStep === 2 && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Map Uploaded Headers to Target Schema
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Confirm which spreadsheet columns match each required student field.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded">
              {parsedHeaders.length} Columns Found
            </span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Target Field</th>
                  <th className="px-4 py-2.5 font-semibold">Required</th>
                  <th className="px-4 py-2.5 font-semibold">Uploaded File Column</th>
                  <th className="px-4 py-2.5 font-semibold">Sample Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {TARGET_FIELDS.map((tf) => {
                  const mappedSource = Object.keys(mappings).find(k => mappings[k] === tf.key) || "";
                  const previewVal = mappedSource && parsedRows.length > 0 ? parsedRows[0][mappedSource] : "—";

                  return (
                    <tr key={tf.key} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/70 transition">
                      <td className="px-4 py-2.5 font-semibold text-slate-900 dark:text-white">
                        {tf.label}
                        <div className="text-[10px] font-mono text-slate-400 font-normal">{tf.key}</div>
                      </td>
                      <td className="px-4 py-2.5">
                        {tf.required ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            REQUIRED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500">
                            OPTIONAL
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <select
                          value={mappedSource}
                          onChange={(e) => {
                            const newMap = { ...mappings };
                            Object.keys(newMap).forEach(k => {
                              if (newMap[k] === tf.key) delete newMap[k];
                            });
                            if (e.target.value) {
                              newMap[e.target.value] = tf.key;
                            }
                            setMappings(newMap);
                          }}
                          className="w-full max-w-xs p-1.5 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-slate-900 dark:focus:border-white"
                        >
                          <option value="">— Select Column —</option>
                          {parsedHeaders.map((h) => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-slate-500 text-xs truncate max-w-xs tnum">
                        {previewVal || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-3.5 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 transition flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <button
              onClick={handleProceedToValidation}
              className="px-4 py-2 font-semibold text-xs bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition flex items-center gap-1.5 shadow-xs"
            >
              <span>Next: Validation Preview</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Validation Preview */}
      {currentStep === 3 && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Pre-Commit Validation Preview
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Review row-level validation results before committing to the student database.
              </p>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
              <button
                onClick={() => setPreviewFilter("ALL")}
                className={`px-2.5 py-1 rounded-md font-medium transition ${previewFilter === "ALL" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold" : "text-slate-600"}`}
              >
                All ({validationResults.length})
              </button>
              <button
                onClick={() => setPreviewFilter("VALID")}
                className={`px-2.5 py-1 rounded-md font-medium transition ${previewFilter === "VALID" ? "bg-emerald-600 text-white font-semibold" : "text-slate-600"}`}
              >
                Valid ({validationResults.filter(r => r.isValid).length})
              </button>
              <button
                onClick={() => setPreviewFilter("FLAGGED")}
                className={`px-2.5 py-1 rounded-md font-medium transition ${previewFilter === "FLAGGED" ? "bg-rose-600 text-white font-semibold" : "text-slate-600"}`}
              >
                Flagged ({validationResults.filter(r => !r.isValid).length})
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-96 rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 sticky top-0">
                <tr>
                  <th className="px-3.5 py-2.5 font-semibold">Row #</th>
                  <th className="px-3.5 py-2.5 font-semibold">Student Name</th>
                  <th className="px-3.5 py-2.5 font-semibold">Roll Number</th>
                  <th className="px-3.5 py-2.5 font-semibold">APAAR ID</th>
                  <th className="px-3.5 py-2.5 font-semibold">Status</th>
                  <th className="px-3.5 py-2.5 font-semibold">Validation Findings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {(() => {
                  const filtered = validationResults.filter(r => {
                    if (previewFilter === "VALID") return r.isValid;
                    if (previewFilter === "FLAGGED") return !r.isValid;
                    return true;
                  });
                  return filtered.slice((previewPage - 1) * previewPageSize, previewPage * previewPageSize).map((r) => {
                    const nameHeader = Object.keys(mappings).find(k => mappings[k] === "student_name");
                    const regHeader = Object.keys(mappings).find(k => mappings[k] === "institution_reg_num");
                    const apaarHeader = Object.keys(mappings).find(k => mappings[k] === "apaar_id");

                    return (
                      <tr key={r.rowIndex} className={`hover:bg-slate-50/70 transition ${!r.isValid ? "bg-rose-50/30" : ""}`}>
                        <td className="px-3.5 py-2.5 font-mono text-slate-400 tnum">
                          #{r.rowIndex}
                        </td>
                        <td className="px-3.5 py-2.5 font-semibold text-slate-900 dark:text-white">
                          {nameHeader ? r.data[nameHeader] : "—"}
                        </td>
                        <td className="px-3.5 py-2.5 font-mono text-slate-600 dark:text-slate-300 tnum">
                          {regHeader ? r.data[regHeader] : "—"}
                        </td>
                        <td className="px-3.5 py-2.5 font-mono text-slate-500 tnum">
                          {apaarHeader ? r.data[apaarHeader] : "—"}
                        </td>
                        <td className="px-3.5 py-2.5">
                          {r.isValid ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              PASS
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              FLAGGED
                            </span>
                          )}
                        </td>
                        <td className="px-3.5 py-2.5">
                          {r.errors.length > 0 ? (
                            <div className="space-y-0.5">
                              {r.errors.map((err, eIdx) => (
                                <div key={eIdx} className="text-[11px] text-rose-600">
                                  <span className="font-semibold">[{err.severity}]</span> {err.message}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-emerald-600 text-[11px]">Valid and ready to import</span>
                          )}
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>

          {/* Validation Table Pagination with Previous and Next */}
          {(() => {
            const filtered = validationResults.filter(r => {
              if (previewFilter === "VALID") return r.isValid;
              if (previewFilter === "FLAGGED") return !r.isValid;
              return true;
            });
            return (
              <Pagination
                currentPage={previewPage}
                totalPages={Math.max(1, Math.ceil(filtered.length / previewPageSize))}
                totalItems={filtered.length}
                pageSize={previewPageSize}
                onPageChange={setPreviewPage}
                itemLabel="preview rows"
              />
            );
          })()}

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-3.5 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 transition flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportFailedRows}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-750 hover:text-slate-950 dark:hover:text-white transition flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Export Flagged Rows</span>
              </button>
              <button
                onClick={handleExecuteCommit}
                disabled={committing}
                className="px-4 py-2 font-semibold text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition flex items-center gap-1.5 shadow-xs"
              >
                <Check className="w-4 h-4" />
                <span>{committing ? "Committing..." : "Commit Valid Rows"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: Import Confirmation */}
      {currentStep === 4 && (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="text-center py-2 space-y-2">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Student Batch Ingestion Completed
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Validated records have been committed to the institutional registry and recorded in the audit log.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-semibold uppercase text-slate-400">Total Rows</span>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5 tnum font-mono">
                {commitResult?.total_rows || validationResults.length}
              </div>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <span className="text-[10px] font-semibold uppercase text-emerald-700 dark:text-emerald-400">Committed Valid</span>
              <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-0.5 tnum font-mono">
                {commitResult?.valid_rows || validationResults.filter(r => r.isValid).length}
              </div>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
              <span className="text-[10px] font-semibold uppercase text-amber-700 dark:text-amber-400">Warnings</span>
              <div className="text-xl font-bold text-amber-700 dark:text-amber-300 mt-0.5 tnum font-mono">
                {commitResult?.warning_rows || 0}
              </div>
            </div>
            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-lg border border-rose-200 dark:border-rose-800">
              <span className="text-[10px] font-semibold uppercase text-rose-700 dark:text-rose-400">Quarantined</span>
              <div className="text-xl font-bold text-rose-700 dark:text-rose-300 mt-0.5 tnum font-mono">
                {commitResult?.error_rows || validationResults.filter(r => !r.isValid).length}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={handleExportFailedRows}
              className="px-3.5 py-1.5 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 hover:text-slate-950 dark:hover:text-white transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Download Quarantined CSV</span>
            </button>
            <button
              onClick={() => {
                setFile(null);
                setParsedRows([]);
                setValidationResults([]);
                setCurrentStep(1);
              }}
              className="px-4 py-1.5 font-semibold text-xs bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-xs transition"
            >
              Upload Another Batch
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
