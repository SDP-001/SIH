"use client";

import React, { useEffect, useState } from "react";
import { api, UserSession } from "@/lib/api";
import { 
  TrendingUp, AlertTriangle, CheckCircle2, History, 
  FileEdit, RefreshCw, ShieldCheck, Info, X, Check,
  Search, SlidersHorizontal, ArrowUpRight, BarChart3,
  Building2, BookOpen, Layers, Users
} from "lucide-react";
import { Pagination } from "@/components/Pagination";

interface IntakeMonitoringProps {
  user: UserSession;
}

export const IntakeMonitoringView: React.FC<IntakeMonitoringProps> = ({ user }) => {
  const [intakes, setIntakes] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [academicYear, setAcademicYear] = useState("2024-2025");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [onlyExcessFilter, setOnlyExcessFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // History modal state (Rule 9)
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedIntakeForHistory, setSelectedIntakeForHistory] = useState<any | null>(null);
  const [intakeHistory, setIntakeHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Revise intake modal state (Rule 9)
  const [reviseModalOpen, setReviseModalOpen] = useState(false);
  const [selectedIntakeForRevise, setSelectedIntakeForRevise] = useState<any | null>(null);
  const [newApprovedIntake, setNewApprovedIntake] = useState<number>(0);
  const [newSupernumerary, setNewSupernumerary] = useState<number>(0);
  const [approvalOrderRef, setApprovalOrderRef] = useState("");
  const [revisionReason, setRevisionReason] = useState("");
  const [revising, setRevising] = useState(false);
  const [reviseSuccess, setReviseSuccess] = useState<string | null>(null);
  const [reviseError, setReviseError] = useState<string | null>(null);

  const isAicteAdmin = user?.roles?.includes("AICTE_ADMIN") || user?.roles?.includes("SUPER_ADMIN");
  const isInstAdmin = user?.roles?.includes("INSTITUTION_ADMIN");
  const canRevise = isAicteAdmin || isInstAdmin;

  useEffect(() => {
    fetchData();
  }, [user, academicYear]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [intakeRes, alertRes] = await Promise.all([
        api.getIntakes(user?.institution_id || undefined),
        api.getIntakeAlerts(academicYear, user?.institution_id || undefined)
      ]);
      setIntakes(intakeRes);
      setAlerts(alertRes);
    } catch (err) {
      console.error("Failed to load intake data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenHistory = async (intake: any) => {
    setSelectedIntakeForHistory(intake);
    setHistoryModalOpen(true);
    setHistoryLoading(true);
    try {
      const history = await api.getIntakeHistory(intake.id);
      setIntakeHistory(history);
    } catch (err) {
      console.error("Failed to fetch intake revision history", err);
      setIntakeHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleOpenRevise = (intake: any) => {
    setSelectedIntakeForRevise(intake);
    setNewApprovedIntake(intake.approved_intake);
    setNewSupernumerary(intake.supernumerary_quota || 0);
    setApprovalOrderRef(`AICTE/AB/${academicYear}/ORD-${Math.floor(1000 + Math.random() * 9000)}`);
    setRevisionReason("AICTE Approval Bureau sanctioned capacity adjustment pursuant to official review.");
    setReviseSuccess(null);
    setReviseError(null);
    setReviseModalOpen(true);
  };

  const handleSubmitRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIntakeForRevise) return;
    if (!approvalOrderRef.trim() || !revisionReason.trim()) {
      setReviseError("Approval Order Reference and Revision Reason are strictly mandatory.");
      return;
    }

    try {
      setRevising(true);
      setReviseError(null);
      await api.setApprovedIntake({
        course_id: selectedIntakeForRevise.course_id,
        academic_year: selectedIntakeForRevise.academic_year,
        approved_intake: Number(newApprovedIntake),
        supernumerary_quota: Number(newSupernumerary),
        approval_order_ref: approvalOrderRef.trim(),
        revision_reason: revisionReason.trim()
      }, selectedIntakeForRevise.institution_id);

      setReviseSuccess("Approved intake revised successfully. Revision record preserved in accordance with Rule 9.");
      setTimeout(() => {
        setReviseModalOpen(false);
        fetchData();
      }, 1200);
    } catch (err: any) {
      setReviseError(err.message || "Failed to revise intake.");
    } finally {
      setRevising(false);
    }
  };

  const filteredIntakes = intakes.filter((intake) => {
    const isExcess = intake.actual_enrolment > intake.approved_intake;
    if (onlyExcessFilter && !isExcess) return false;
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      intake.course_name?.toLowerCase().includes(term) ||
      intake.course_code?.toLowerCase().includes(term) ||
      intake.institution_name?.toLowerCase().includes(term)
    );
  });

  const totalSanctioned = intakes.reduce((acc, i) => acc + (i.approved_intake || 0), 0);
  const totalEnrolled = intakes.reduce((acc, i) => acc + (i.actual_enrolment || 0), 0);
  const excessIntakeCount = intakes.filter(i => i.actual_enrolment > i.approved_intake).length;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 uppercase tracking-wider">
              Enrolment & Intake
            </span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
              Rule 5 & 9 Quota Engine
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-slate-900 dark:text-white shrink-0" />
            <span>Enrolment & Intake Capacity Monitoring</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-2xl leading-relaxed">
            Autonomous admission tracking comparing reported student admissions against AICTE-sanctioned intake quotas with tamper-evident revision history.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <select
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            className="py-1.5 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-white shadow-xs"
          >
            <option value="2024-2025">Academic Year 2024-25</option>
            <option value="2023-2024">Academic Year 2023-24</option>
          </select>
          <button
            onClick={fetchData}
            className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition shadow-xs"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-slate-900 dark:text-white" : ""}`} />
          </button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">
            <span>Sanctioned Quota</span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white tnum">{totalSanctioned.toLocaleString()}</div>
          <div className="text-[10px] text-slate-400 mt-1">Approved base seats capacity</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">
            <span>Reported Admissions</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tnum">{totalEnrolled.toLocaleString()}</div>
          <div className="text-[10px] text-slate-400 mt-1">Verified enrolled students</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">
            <span>Excess Quota Programs</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 tnum">{excessIntakeCount}</div>
          <div className="text-[10px] text-slate-400 mt-1">Programs requiring review</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">
            <span>Programs Monitored</span>
            <Layers className="w-4 h-4 text-slate-900 dark:text-white" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white tnum">{intakes.length}</div>
          <div className="text-[10px] text-slate-400 mt-1">Active technical courses</div>
        </div>
      </div>

      {/* Regulatory Standards Card */}
      <div className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 p-4 rounded-xl text-xs space-y-2">
        <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
          <ShieldCheck className="w-4 h-4 text-slate-900 dark:text-white" />
          <span>AICTE Regulatory Counting Standards & Non-Negotiable Safeguards</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-slate-600 dark:text-slate-300">
          <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
            <strong className="text-slate-900 dark:text-white block mb-0.5">Rule 5: Supernumerary Seat Accounting</strong>
            Supernumerary seats (TFW 5%, EWS 10%, PMSSS, Kashmiri Migrants) are evaluated independently from regular intake.
          </div>
          <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
            <strong className="text-slate-900 dark:text-white block mb-0.5">Rule 9: Immutable Revision History</strong>
            Sanctioned intake records are never silently overwritten. Every adjustment creates an immutable audit trail with order ref and reason.
          </div>
        </div>
      </div>

      {/* Excess Intake Alert Banner */}
      {alerts.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-4 rounded-xl shadow-xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                  Intake Capacity Discrepancies ({alerts.length} Flagged Programs)
                </h3>
                <span className="text-[10px] font-semibold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded">
                  Pending Review
                </span>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                Programs reported student admissions exceeding sanctioned intake. Anomaly is flagged for human review.
              </p>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                {alerts.map((a, idx) => (
                  <div key={idx} className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-amber-200 dark:border-amber-800 text-xs space-y-1.5 shadow-xs">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">{a.institution_name}</div>
                        <div className="text-slate-500 dark:text-slate-400 text-[11px]">{a.course_name}</div>
                      </div>
                      <span className="font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded text-[11px]">
                        +{a.excess_seats} excess ({a.excess_percentage}%)
                      </span>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-100 dark:border-slate-700 text-[11px] space-y-0.5">
                      <div className="flex justify-between text-slate-500">
                        <span>Sanctioned Base:</span>
                        <strong className="text-slate-900 dark:text-white">{a.approved_intake}</strong>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Actual Enrolment:</span>
                        <strong className="text-amber-600">{a.actual_enrolment}</strong>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Supernumerary:</span>
                        <span>{a.supernumerary_enrolled || 0} / {a.supernumerary_quota || 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Intake Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Course-Wise Sanctioned Quota & Enrolment Breakdown
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Showing {filteredIntakes.length} of {intakes.length} academic programs
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search course or code..."
                className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-slate-900 dark:focus:border-white w-44"
              />
            </div>

            <button
              onClick={() => setOnlyExcessFilter(!onlyExcessFilter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border flex items-center gap-1.5 ${
                onlyExcessFilter
                  ? "bg-amber-50 text-amber-700 border-amber-300 font-semibold"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Excess Only ({excessIntakeCount})</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3 font-semibold">Course & Code</th>
                <th className="px-4 py-3 font-semibold text-center">Approved Intake</th>
                <th className="px-4 py-3 font-semibold text-center">Actual Enrolment</th>
                <th className="px-4 py-3 font-semibold text-center">Supernumerary Quota</th>
                <th className="px-4 py-3 font-semibold text-center">Utilization</th>
                <th className="px-4 py-3 font-semibold">Capacity Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredIntakes.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((intake) => {
                const ratio = intake.approved_intake > 0 
                  ? Math.round((intake.actual_enrolment / intake.approved_intake) * 100) 
                  : 0;
                const isExcess = intake.actual_enrolment > intake.approved_intake;

                return (
                  <tr key={intake.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/70 transition">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900 dark:text-white">{intake.course_name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {intake.course_code} · AY {intake.academic_year}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center font-medium font-mono tnum">
                      {intake.approved_intake}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-slate-900 dark:text-white font-mono tnum">
                      {intake.actual_enrolment}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-500 font-mono text-[11px] tnum">
                      {intake.supernumerary_enrolled || 0} / {intake.supernumerary_quota || 0}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="w-20 mx-auto">
                        <div className="flex justify-between text-[10px] mb-0.5 text-slate-500">
                          <span>{ratio}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${
                              isExcess ? "bg-amber-500" : (ratio >= 90 ? "bg-slate-900 dark:bg-white" : "bg-emerald-600")
                            }`}
                            style={{ width: `${Math.min(ratio, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {isExcess ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800 flex items-center gap-1 w-fit">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          Excess (+{intake.actual_enrolment - intake.approved_intake})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Compliant
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenHistory(intake)}
                          className="px-2.5 py-1 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 hover:text-slate-950 dark:hover:text-white rounded-md font-medium transition flex items-center gap-1 border border-slate-200 dark:border-slate-700 shadow-xs"
                          title="View Rule 9 historical revisions"
                        >
                          <History className="w-3 h-3 text-slate-400" />
                          <span>History</span>
                        </button>
                        {canRevise && (
                          <button
                            onClick={() => handleOpenRevise(intake)}
                            className="px-2.5 py-1 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md font-medium transition flex items-center gap-1 shadow-xs"
                            title="Revise sanctioned quota"
                          >
                            <FileEdit className="w-3 h-3 text-slate-900 dark:text-white" />
                            <span>Revise</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredIntakes.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No intake records found matching filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Dedicated Previous & Next Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={Math.max(1, Math.ceil(filteredIntakes.length / pageSize))}
          totalItems={filteredIntakes.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          itemLabel="academic programs"
        />
      </div>

      {/* History Modal (Rule 9) */}
      {historyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg max-w-2xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-200 animate-view-enter">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300 uppercase">
                    Rule 9 Audit Trail
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <History className="w-4 h-4 text-slate-900 dark:text-white" />
                    <span>Approved Intake Revision History</span>
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Program: {selectedIntakeForHistory?.course_name} (AY {selectedIntakeForHistory?.academic_year})
                </p>
              </div>
              <button
                onClick={() => setHistoryModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 text-[11px]">
                <strong>AICTE Rule 9 Compliance:</strong> Historical approved intake figures are never overwritten. Every revision creates an immutable revision log with approval reference, reason, and actor ID.
              </div>

              {historyLoading ? (
                <div className="py-8 text-center text-slate-400">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-900 dark:text-white" />
                  Loading revision logs...
                </div>
              ) : intakeHistory.length === 0 ? (
                <div className="py-8 text-center text-slate-400 p-6">
                  <Info className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700 dark:text-slate-300">No Historical Revisions Logged</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Current intake of {selectedIntakeForHistory?.approved_intake} seats is the baseline record.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {intakeHistory.map((rev, index) => (
                    <div key={rev.id || index} className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white text-xs">
                          Revision #{intakeHistory.length - index}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400 tnum">
                          {new Date(rev.created_at).toLocaleString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-800">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-medium">Intake Shift</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {rev.previous_intake} seats → <span className="text-slate-900 dark:text-white font-bold">{rev.new_intake} seats</span>
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-medium">Supernumerary Shift</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {rev.previous_supernumerary} seats → <span className="text-slate-900 dark:text-white font-bold">{rev.new_supernumerary} seats</span>
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] space-y-0.5 text-slate-600 dark:text-slate-300">
                        <div>
                          <span className="font-medium text-slate-400">Approval Order Ref: </span>
                          <span className="font-mono font-semibold text-slate-900 dark:text-white">{rev.approval_order_ref || "AICTE/REG/SANCTION"}</span>
                        </div>
                        <div>
                          <span className="font-medium text-slate-400">Regulatory Reason: </span>
                          <span>{rev.revision_reason || "Approved pursuant to institutional appeal."}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setHistoryModalOpen(false)}
                className="px-4 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-medium text-xs transition"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revise Modal (Rule 9 Audit Trail) */}
      {reviseModalOpen && selectedIntakeForRevise && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg max-w-lg w-full border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-200 animate-view-enter">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <FileEdit className="w-4 h-4 text-slate-900 dark:text-white" />
                  <span>Revise Sanctioned Intake (Rule 9 Preserved)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedIntakeForRevise.course_name} · Current Sanctioned: {selectedIntakeForRevise.approved_intake} seats
                </p>
              </div>
              <button
                onClick={() => setReviseModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitRevision} className="p-6 space-y-4 text-xs">
              {reviseSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>{reviseSuccess}</span>
                </div>
              )}

              {reviseError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>{reviseError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    New Approved Intake:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={newApprovedIntake}
                    onChange={(e) => setNewApprovedIntake(Number(e.target.value))}
                    required
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Supernumerary Quota:
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="200"
                    value={newSupernumerary}
                    onChange={(e) => setNewSupernumerary(Number(e.target.value))}
                    required
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  AICTE Approval Order Reference:
                </label>
                <input
                  type="text"
                  value={approvalOrderRef}
                  onChange={(e) => setApprovalOrderRef(e.target.value)}
                  placeholder="e.g. AICTE/AB/2024-25/ORD-7819"
                  required
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Regulatory Justification / Revision Reason:
                </label>
                <textarea
                  value={revisionReason}
                  onChange={(e) => setRevisionReason(e.target.value)}
                  rows={3}
                  required
                  placeholder="Explain why intake is being adjusted..."
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-white"
                />
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-[11px] text-slate-500 dark:text-slate-400">
                <span className="font-medium text-slate-700 dark:text-slate-300">Rule 9 Guarantee:</span> The previous intake value ({selectedIntakeForRevise.approved_intake} seats) will be archived in the revision log and will remain verifiable by regulatory auditors.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setReviseModalOpen(false)}
                  className="px-4 py-1.5 font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={revising}
                  className="px-4 py-1.5 font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${revising ? "animate-spin" : ""}`} />
                  <span>{revising ? "Saving Revision..." : "Record Revision"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
