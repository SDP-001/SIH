"use client";

import React, { useEffect, useState } from "react";
import { api, UserSession } from "@/lib/api";
import { 
  FileEdit, CheckCircle2, XCircle, Clock, Plus, 
  RefreshCw, UserCheck, ShieldCheck, AlertCircle, Sparkles, Filter, FileText
} from "lucide-react";

interface CorrectionRequestsProps {
  user: UserSession;
}

export const CorrectionRequestsView: React.FC<CorrectionRequestsProps> = ({ user }) => {
  const [corrections, setCorrections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolveStatus, setResolveStatus] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [reviewNotes, setReviewNotes] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");

  const [formData, setFormData] = useState({
    student_id: "",
    field_name: "phone",
    requested_value: "",
    justification: "",
    supporting_doc_ref: ""
  });
  const [submitting, setSubmitting] = useState(false);

  const isAicte = user.roles.includes("SUPER_ADMIN") || user.roles.includes("AICTE_ADMIN");

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [corrList, stuList] = await Promise.all([
        api.getCorrections({ institution_id: isAicte ? undefined : (user.institution_id || undefined) }),
        api.getStudents({ institution_id: isAicte ? undefined : (user.institution_id || undefined) })
      ]);
      setCorrections(corrList);
      setStudents(stuList);
      if (stuList.length > 0 && !formData.student_id) {
        setFormData(prev => ({ ...prev, student_id: stuList[0].id }));
      }
    } catch (err) {
      console.error("Failed to load corrections", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.student_id || !formData.requested_value.trim() || !formData.justification.trim()) {
      alert("Please fill all required correction fields.");
      return;
    }

    const instId = user.institution_id || (students.find(s => s.id === formData.student_id)?.institution_id);
    if (!instId) {
      alert("No institution associated with this student.");
      return;
    }

    try {
      setSubmitting(true);
      await api.submitCorrection(formData, instId);
      setShowModal(false);
      setFormData({
        student_id: students[0]?.id || "",
        field_name: "phone",
        requested_value: "",
        justification: "",
        supporting_doc_ref: ""
      });
      fetchData();
    } catch (err: any) {
      alert(`Submission failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async () => {
    if (!resolvingId || !reviewNotes.trim()) {
      alert("Please enter review notes.");
      return;
    }
    try {
      await api.resolveCorrection(resolvingId, resolveStatus, reviewNotes);
      setResolvingId(null);
      setReviewNotes("");
      fetchData();
    } catch (err: any) {
      alert(`Resolution failed: ${err.message}`);
    }
  };

  const pendingCount = corrections.filter(c => c.status === "PENDING").length;
  const approvedCount = corrections.filter(c => c.status === "APPROVED").length;
  const rejectedCount = corrections.filter(c => c.status === "REJECTED").length;

  const filteredCorrections = corrections.filter(c => {
    if (filterStatus === "ALL") return true;
    return c.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
              Audit-Logged Inquiries
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Rule 9 Cryptographic Revision Integrity
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileEdit className="w-6 h-6 text-slate-900 dark:text-white" />
            Institutional Student Data Correction Requests
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Formal dual-key regulatory workflow for rectifying student demographic records, quota assignments, and APAAR linkage errors with full provenance.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition flex items-center gap-2 shadow-xs active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Submit Correction Request
          </button>
          <button
            onClick={fetchData}
            className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg transition shadow-xs active:scale-[0.98]"
            title="Refresh correction ledger"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-slate-700" : ""}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <button 
          onClick={() => setFilterStatus("ALL")}
          className={`p-5 rounded-xl border text-left transition-all shadow-xs bg-white dark:bg-slate-900 ${
            filterStatus === "ALL" 
              ? "border-slate-900 dark:border-white ring-2 ring-slate-900/10" 
              : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Filings</span>
            <span className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-800 dark:text-slate-200">
              <FileEdit className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2 tnum">{corrections.length}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Formal change petitions</div>
        </button>

        <button 
          onClick={() => setFilterStatus("PENDING")}
          className={`p-5 rounded-xl border text-left transition-all shadow-xs bg-white dark:bg-slate-900 ${
            filterStatus === "PENDING" 
              ? "border-amber-500 ring-2 ring-amber-500/10" 
              : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400">Pending Review</span>
            <span className="p-2 bg-amber-50 dark:bg-amber-950/50 rounded-lg text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2 tnum">{pendingCount}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Awaiting determination</div>
        </button>

        <button 
          onClick={() => setFilterStatus("APPROVED")}
          className={`p-5 rounded-xl border text-left transition-all shadow-xs bg-white dark:bg-slate-900 ${
            filterStatus === "APPROVED" 
              ? "border-emerald-500 ring-2 ring-emerald-500/10" 
              : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Approved</span>
            <span className="p-2 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2 tnum">{approvedCount}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Committed to registry</div>
        </button>

        <button 
          onClick={() => setFilterStatus("REJECTED")}
          className={`p-5 rounded-xl border text-left transition-all shadow-xs bg-white dark:bg-slate-900 ${
            filterStatus === "REJECTED" 
              ? "border-rose-500 ring-2 ring-rose-500/10" 
              : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-rose-700 dark:text-rose-400">Rejected</span>
            <span className="p-2 bg-rose-50 dark:bg-rose-950/50 rounded-lg text-rose-600 dark:text-rose-400">
              <XCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-2 tnum">{rejectedCount}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Preserved original data</div>
        </button>
      </div>

      {/* Corrections Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 md:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-900 dark:bg-white"></span>
              Correction Ledger Records ({filteredCorrections.length})
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 block">
              Immutable audit logs recorded on every state modification
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
            {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1 rounded-md text-[11px] font-medium transition ${
                  filterStatus === st 
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold" 
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-medium">
              <tr>
                <th className="px-4 py-3 text-[11px] uppercase tracking-wider">Student Name</th>
                <th className="px-4 py-3 text-[11px] uppercase tracking-wider">Registration No</th>
                <th className="px-4 py-3 text-[11px] uppercase tracking-wider">Target Field</th>
                <th className="px-4 py-3 text-[11px] uppercase tracking-wider">Current Value</th>
                <th className="px-4 py-3 text-[11px] uppercase tracking-wider">Requested Correction</th>
                <th className="px-4 py-3 text-[11px] uppercase tracking-wider">Justification</th>
                <th className="px-4 py-3 text-[11px] uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-[11px] uppercase tracking-wider text-right">Determination</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredCorrections.map((corr) => (
                <tr key={corr.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/70 transition">
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                    {corr.student_name}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400 tnum">
                    {corr.institution_reg_num}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                    {corr.field_name}
                  </td>
                  <td className="px-4 py-3 text-slate-400 line-through font-mono tnum">
                    {corr.current_value || "—"}
                  </td>
                  <td className="px-4 py-3 font-semibold text-emerald-600 dark:text-emerald-400 font-mono tnum">
                    {corr.requested_value}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400 max-w-xs truncate" title={corr.justification}>
                    {corr.justification}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border flex items-center gap-1 w-fit ${
                      corr.status === "PENDING" ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800" :
                      (corr.status === "APPROVED" ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800" : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800")
                    }`}>
                      {corr.status === "PENDING" && <Clock className="w-3 h-3 text-amber-600" />}
                      {corr.status === "APPROVED" && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                      {corr.status === "REJECTED" && <XCircle className="w-3 h-3 text-rose-600" />}
                      {corr.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {corr.status === "PENDING" ? (
                      <button
                        onClick={() => setResolvingId(corr.id)}
                        className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-[11px] font-medium transition shadow-xs active:scale-[0.98]"
                      >
                        Review
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        {corr.reviewer_name || "Reviewed"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredCorrections.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                    No student data correction requests filed under this criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Request Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-lg w-full border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <FileEdit className="w-4 h-4 text-slate-900 dark:text-white" />
                Submit Student Record Correction
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Select Student:</label>
                <select
                  value={formData.student_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, student_id: e.target.value }))}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 dark:focus:border-white"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.student_name} ({s.institution_reg_num})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Field to Correct:</label>
                <select
                  value={formData.field_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, field_name: e.target.value }))}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 dark:focus:border-white"
                >
                  <option value="phone">Mobile Phone Number</option>
                  <option value="email">Institutional Email</option>
                  <option value="date_of_birth">Date of Birth</option>
                  <option value="gender">Gender</option>
                  <option value="admission_category">Admission Category (SC/ST/OBC/GEN/EWS)</option>
                  <option value="is_supernumerary">Supernumerary Status (True/False)</option>
                  <option value="supernumerary_category">Supernumerary Category (TFW/PMSSS/J&K)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Corrected / Requested Value:</label>
                <input
                  type="text"
                  value={formData.requested_value}
                  onChange={(e) => setFormData(prev => ({ ...prev, requested_value: e.target.value }))}
                  placeholder="Enter accurate verified value..."
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 dark:focus:border-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Formal Justification:</label>
                <textarea
                  value={formData.justification}
                  onChange={(e) => setFormData(prev => ({ ...prev, justification: e.target.value }))}
                  placeholder="Explain rationale (e.g. verified against official Aadhaar or State DTE allotment letter)..."
                  rows={3}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 dark:focus:border-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Supporting Document Reference (Optional):</label>
                <input
                  type="text"
                  value={formData.supporting_doc_ref}
                  onChange={(e) => setFormData(prev => ({ ...prev, supporting_doc_ref: e.target.value }))}
                  placeholder="e.g. REG-MEMO-2024-8812"
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 dark:focus:border-white"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition disabled:opacity-50 shadow-xs"
                >
                  {submitting ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolution Modal */}
      {resolvingId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-md w-full border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-slate-900 dark:text-white" />
                Determine Correction Request
              </h3>
              <button onClick={() => setResolvingId(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition">✕</button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-2">Decision:</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setResolveStatus("APPROVED")}
                    className={`flex-1 py-2 rounded-lg font-semibold border transition ${
                      resolveStatus === "APPROVED" 
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-700 ring-2 ring-emerald-500/10" 
                        : "bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    APPROVE (Apply)
                  </button>
                  <button
                    type="button"
                    onClick={() => setResolveStatus("REJECTED")}
                    className={`flex-1 py-2 rounded-lg font-semibold border transition ${
                      resolveStatus === "REJECTED" 
                        ? "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-700 ring-2 ring-rose-500/10" 
                        : "bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    REJECT (Preserve)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Review Notes:</label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Record formal administrative determination notes for the audit ledger..."
                  rows={3}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 dark:focus:border-white"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setResolvingId(null)}
                  className="px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleResolve}
                  disabled={!reviewNotes.trim()}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition disabled:opacity-50 shadow-xs"
                >
                  Save Determination
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
