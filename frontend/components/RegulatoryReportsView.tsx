"use client";

import React, { useEffect, useState } from "react";
import { api, UserSession, API_BASE_URL } from "@/lib/api";
import { 
  FileSpreadsheet, Download, Filter, RefreshCw, 
  Printer, Calendar, Building2, CheckCircle2,
  Table, Layers, Sparkles
} from "lucide-react";
import { Pagination } from "@/components/Pagination";

interface RegulatoryReportsProps {
  user: UserSession;
}

export const RegulatoryReportsView: React.FC<RegulatoryReportsProps> = ({ user }) => {
  const [reportTypes, setReportTypes] = useState<{ id: string; title: string }[]>([]);
  const [selectedType, setSelectedType] = useState("institution_enrolment");
  const [academicYear, setAcademicYear] = useState("2024-2025");
  const [stateFilter, setStateFilter] = useState("");
  const [reportData, setReportData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const isAicte = user.roles.includes("SUPER_ADMIN") || user.roles.includes("AICTE_ADMIN");

  useEffect(() => {
    api.getReportTypes().then(setReportTypes).catch(console.error);
  }, []);

  useEffect(() => {
    fetchReport();
  }, [selectedType, academicYear, stateFilter, user]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await api.generateReport({
        report_type: selectedType,
        academic_year: academicYear,
        institution_id: isAicte ? undefined : (user.institution_id || undefined),
        state: stateFilter || undefined
      });
      setReportData(res);
      setCurrentPage(1);
    } catch (err) {
      console.error("Failed to fetch report", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = () => {
    const sp = new URLSearchParams();
    sp.set("report_type", selectedType);
    sp.set("academic_year", academicYear);
    if (!isAicte && user.institution_id) sp.set("institution_id", user.institution_id);
    if (stateFilter) sp.set("state", stateFilter);
    window.open(`${API_BASE_URL}/reports/export/csv?${sp.toString()}`, "_blank");
  };

  const handleExportXlsx = () => {
    const sp = new URLSearchParams();
    sp.set("report_type", selectedType);
    sp.set("academic_year", academicYear);
    if (!isAicte && user.institution_id) sp.set("institution_id", user.institution_id);
    if (stateFilter) sp.set("state", stateFilter);
    window.open(`${API_BASE_URL}/reports/export/xlsx?${sp.toString()}`, "_blank");
  };

  const handlePrint = () => {
    window.print();
  };

  const columns = reportData?.data && reportData.data.length > 0 ? Object.keys(reportData.data[0]) : [];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 uppercase tracking-wider">
              Reports & Analytics
            </span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              8 Mandated Compliance Schemas
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-slate-900 dark:text-white shrink-0" />
            <span>AICTE Regulatory Reports & Compliance Exports</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-2xl leading-relaxed">
            Generate structured compliance reports from live database tables across institutional enrolments, sanctioned quotas, and duplicate cases.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleExportXlsx}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-white" />
            <span>Export XLSX</span>
          </button>
          <button
            onClick={handlePrint}
            className="p-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition shadow-xs"
            title="Print Report"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Report Type:
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="py-1.5 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-white min-w-[220px]"
            >
              {reportTypes.map((rt) => (
                <option key={rt.id} value={rt.id}>{rt.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Academic Year:
            </label>
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="py-1.5 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-white"
            >
              <option value="2024-2025">AY 2024-25</option>
              <option value="2023-2024">AY 2023-24</option>
            </select>
          </div>

          {isAicte && (
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                State Scope:
              </label>
              <select
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="py-1.5 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-white"
              >
                <option value="">National (All States)</option>
                <option value="Delhi">Delhi NCT</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Karnataka">Karnataka</option>
              </select>
            </div>
          )}
        </div>

        <button
          onClick={fetchReport}
          className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition shadow-xs self-end md:self-center shrink-0"
          title="Refresh Data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-slate-700" : ""}`} />
        </button>
      </div>

      {/* Live Data Preview Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Table className="w-4 h-4 text-slate-900 dark:text-white" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {reportData?.title || "Report Preview"} ({reportData?.row_count || 0} Records)
            </h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tnum">
            Live Database Connection
          </span>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-500 space-y-2">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-slate-900 dark:text-white" />
              <p className="text-xs font-medium">Generating report preview...</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  {columns.map((col, idx) => (
                    <th key={idx} className="px-4 py-3 font-semibold">
                      {col.replace(/_/g, " ")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {reportData?.data?.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((row: any, rIdx: number) => (
                  <tr key={rIdx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/70 transition">
                    {columns.map((col, cIdx) => (
                      <td key={cIdx} className="px-4 py-3 font-medium">
                        {String(row[col] ?? "—")}
                      </td>
                    ))}
                  </tr>
                ))}
                {(!reportData?.data || reportData.data.length === 0) && (
                  <tr>
                    <td colSpan={columns.length || 1} className="px-4 py-12 text-center text-slate-400">
                      No records found for this report configuration.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Dedicated Previous & Next Pagination */}
        {reportData?.data && reportData.data.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={Math.max(1, Math.ceil(reportData.data.length / pageSize))}
            totalItems={reportData.data.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            itemLabel="report rows"
          />
        )}
      </div>
    </div>
  );
};
