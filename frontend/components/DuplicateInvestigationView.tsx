"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Pagination } from "@/components/Pagination";
import { 
  AlertTriangle, ShieldAlert, CheckCircle2, XCircle, 
  Clock, ArrowRight, Building2, User, Search, RefreshCw,
  Filter, Eye, HelpCircle, ShieldCheck, X, FileText,
  UserCheck, AlertCircle, Sparkles, Check
} from "lucide-react";

export const DuplicateInvestigationView: React.FC = () => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<any | null>(null);
  const [resolutionStatus, setResolutionStatus] = useState("CONFIRMED_DUPLICATE");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [resolving, setResolving] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  useEffect(() => {
    fetchAlerts();
  }, [statusFilter, severityFilter]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getDuplicateAlerts(
        statusFilter === "ALL" ? undefined : statusFilter,
        severityFilter === "ALL" ? undefined : severityFilter
      );
      setAlerts(res);
      setCurrentPage(1);
    } catch (err: any) {
      setError(err.message || "Failed to load duplicate alerts");
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedAlert) return;
    try {
      setResolving(true);
      await api.resolveDuplicate(selectedAlert.id, resolutionStatus, resolutionNotes);
      setSelectedAlert(null);
      setResolutionNotes("");
      fetchAlerts();
    } catch (err: any) {
      alert(`Resolution failed: ${err.message}`);
    } finally {
      setResolving(false);
    }
  };

  const getMatchCategoryBadge = (category: string) => {
    switch (category) {
      case "CROSS_INSTITUTION_ENROLMENT":
        return <span className="bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800 px-2 py-0.5 rounded text-[10px] font-semibold">CROSS-INSTITUTION</span>;
      case "EXACT_APAAR_CONFLICT":
        return <span className="bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 px-2 py-0.5 rounded text-[10px] font-semibold">EXACT APAAR CONFLICT</span>;
      case "SAME_INSTITUTION_REG_DUPLICATE":
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 px-2 py-0.5 rounded text-[10px] font-semibold">REGISTRATION CONFLICT</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 px-2 py-0.5 rounded text-[10px] font-medium">{category}</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "NEW":
        return <span className="bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800 px-2.5 py-0.5 rounded-full text-[10px] font-semibold">NEW ALERT</span>;
      case "UNDER_REVIEW":
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800 px-2.5 py-0.5 rounded-full text-[10px] font-semibold">UNDER REVIEW</span>;
      case "CONFIRMED_DUPLICATE":
        return <span className="bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800 px-2.5 py-0.5 rounded-full text-[10px] font-semibold">CONFIRMED DUPLICATE</span>;
      case "NOT_A_DUPLICATE":
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 px-2.5 py-0.5 rounded-full text-[10px] font-semibold">CLEARED (VALID)</span>;
      default:
        return <span className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 px-2.5 py-0.5 rounded-full text-[10px] font-medium">{status}</span>;
    }
  };

  const filteredAlerts = alerts.filter(a => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (a.student_name && a.student_name.toLowerCase().includes(term)) ||
      (a.apaar_masked && a.apaar_masked.toLowerCase().includes(term)) ||
      (a.institution_a_name && a.institution_a_name.toLowerCase().includes(term)) ||
      (a.institution_b_name && a.institution_b_name.toLowerCase().includes(term)) ||
      (a.id && a.id.toLowerCase().includes(term))
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredAlerts.length / pageSize));
  const paginatedAlerts = filteredAlerts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 uppercase tracking-wider">
              Duplicate Investigation
            </span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              Non-Negotiable Rule 1 Human Oversight
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <span>Duplicate Records & Concurrent Enrolment Triage</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-2xl leading-relaxed">
            Identifies repeat records within batches, intra-institution registries, cross-institutional concurrent enrolments, and APAAR conflicts with explainable determination workflows.
          </p>
        </div>

        <button
          onClick={fetchAlerts}
          className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 hover:text-slate-950 dark:hover:text-white transition flex items-center gap-2 shadow-xs shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-slate-700" : "text-slate-400"}`} />
          <span>Refresh Cases</span>
        </button>
      </div>

      {/* Safeguard Notice */}
      <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 rounded-xl text-xs space-y-1">
        <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
          <ShieldCheck className="w-4 h-4 text-slate-900 dark:text-white shrink-0" />
          <span>Regulatory Human Oversight Mandate (Rule 1)</span>
        </div>
        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
          Students are <strong>never automatically rejected or disqualified</strong> solely based on algorithmic match flags. Consequential decisions strictly require assigned human review, institutional verification, and complete audit logging.
        </p>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mr-1">Status:</span>
          {["ALL", "NEW", "UNDER_REVIEW", "CONFIRMED_DUPLICATE", "NOT_A_DUPLICATE"].map((st) => (
            <button
              key={st}
              onClick={() => { setStatusFilter(st); setCurrentPage(1); }}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                statusFilter === st
                  ? "bg-slate-900 text-white font-semibold shadow-xs"
                  : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 border border-slate-200 dark:border-slate-700"
              }`}
            >
              {st.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student, APAAR..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-slate-900 dark:focus:border-white w-56"
          />
        </div>
      </div>

      {/* Main Alert List */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3 font-semibold">Alert ID & Time</th>
                <th className="px-4 py-3 font-semibold">Severity</th>
                <th className="px-4 py-3 font-semibold">Match Classification</th>
                <th className="px-4 py-3 font-semibold">Student Record References</th>
                <th className="px-4 py-3 font-semibold">Masked APAAR</th>
                <th className="px-4 py-3 font-semibold">Review Status</th>
                <th className="px-4 py-3 font-semibold text-right">Human Triage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {paginatedAlerts.map((alert) => (
                <tr key={alert.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/70 transition">
                  <td className="px-4 py-3">
                    <div className="font-mono text-slate-900 dark:text-white font-medium text-xs tnum">
                      {alert.id.slice(0, 10)}...
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {alert.created_at ? new Date(alert.created_at).toLocaleDateString() : "Today"}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      alert.severity === "CRITICAL" || alert.severity === "HIGH"
                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}>
                      {alert.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {getMatchCategoryBadge(alert.match_category)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {alert.student_name || "Enrolment Record"}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                      <span>{alert.institution_a_name}</span>
                      {alert.institution_b_name && (
                        <>
                          <span className="text-slate-400">↔</span>
                          <span>{alert.institution_b_name}</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">
                    <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px] tnum border border-slate-200 dark:border-slate-700">
                      {alert.apaar_masked || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(alert.status)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => {
                        setSelectedAlert(alert);
                        setResolutionStatus(alert.status === "NEW" ? "CONFIRMED_DUPLICATE" : alert.status);
                        setResolutionNotes(alert.resolution_notes || "");
                      }}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-white rounded-md font-semibold text-xs transition border border-slate-300 dark:border-slate-700"
                    >
                      Investigate
                    </button>
                  </td>
                </tr>
              ))}

              {paginatedAlerts.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    No duplicate alert cases found for current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Dedicated Previous & Next Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredAlerts.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          itemLabel="cases"
        />
      </div>

      {/* Side-by-side Investigation Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-200 animate-view-enter">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Duplicate Case Determination (Human Review)
                </h3>
              </div>
              <button 
                onClick={() => setSelectedAlert(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                {/* Institution A Record */}
                <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Record Reference A
                  </div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">
                    {selectedAlert.student_name || "Enrolment Candidate"}
                  </div>
                  <div className="text-slate-500">
                    <strong>Institution:</strong> {selectedAlert.institution_a_name || "Primary Institute"}
                  </div>
                  <div className="text-slate-500 font-mono">
                    <strong>APAAR:</strong> {selectedAlert.apaar_masked}
                  </div>
                </div>

                {/* Institution B Record */}
                <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                    Record Reference B
                  </div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">
                    {selectedAlert.student_name || "Conflicting Candidate"}
                  </div>
                  <div className="text-slate-500">
                    <strong>Institution:</strong> {selectedAlert.institution_b_name || "Secondary Institute"}
                  </div>
                  <div className="text-slate-500 font-mono">
                    <strong>APAAR:</strong> {selectedAlert.apaar_masked}
                  </div>
                </div>
              </div>

              {/* Match Reason Analysis */}
              <div className="p-3 bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-900 dark:text-amber-200 space-y-1">
                <strong>Match Reason & Evidence:</strong>
                <p className="text-[11px] leading-relaxed">
                  {selectedAlert.match_reason || "Deterministic match identified identical APAAR identifier across distinct approved institution rolls for concurrent academic year 2024-25."}
                </p>
              </div>

              {/* Resolution Form */}
              <div className="space-y-3 pt-2">
                <label className="block font-semibold text-slate-900 dark:text-white">
                  Assign Regulatory Determination:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setResolutionStatus("CONFIRMED_DUPLICATE")}
                    className={`p-2.5 rounded-lg border text-xs font-semibold text-center transition ${
                      resolutionStatus === "CONFIRMED_DUPLICATE"
                        ? "bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    Confirm Duplicate
                  </button>
                  <button
                    type="button"
                    onClick={() => setResolutionStatus("NOT_A_DUPLICATE")}
                    className={`p-2.5 rounded-lg border text-xs font-semibold text-center transition ${
                      resolutionStatus === "NOT_A_DUPLICATE"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    False Positive (Clear)
                  </button>
                  <button
                    type="button"
                    onClick={() => setResolutionStatus("UNDER_REVIEW")}
                    className={`p-2.5 rounded-lg border text-xs font-semibold text-center transition ${
                      resolutionStatus === "UNDER_REVIEW"
                        ? "bg-amber-50 border-amber-500 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    Under Investigation
                  </button>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Auditor Notes & Justification *
                  </label>
                  <textarea
                    rows={3}
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Enter formal justification recorded to immutable audit ledger..."
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-slate-900 dark:focus:border-white"
                  />
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedAlert(null)}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResolve}
                disabled={resolving || !resolutionNotes.trim()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50 shadow-xs"
              >
                {resolving ? "Recording Decision..." : "Commit Determination"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
