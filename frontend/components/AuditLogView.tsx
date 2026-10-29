"use client";

import React, { useEffect, useState } from "react";
import { api, UserSession } from "@/lib/api";
import { Pagination } from "@/components/Pagination";
import { 
  ShieldCheck, RefreshCw, Search, Filter, Clock, 
  Activity, Database, ScrollText, Key,
  Lock, AlertTriangle, Eye, CheckCircle2, ChevronRight,
  X, Copy, Check, Terminal, FileText
} from "lucide-react";

interface AuditLogProps {
  user: UserSession;
}

export const AuditLogView: React.FC<AuditLogProps> = ({ user }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");
  const [resourceFilter, setResourceFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, resourceFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getAuditLogs({
        action: actionFilter || undefined,
        resource_type: resourceFilter || undefined,
        limit: 250
      });
      setLogs(res);
      setCurrentPage(1);
    } catch (err) {
      console.error("Failed to load audit logs", err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredLogs = logs.filter((log) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const action = log.action?.toLowerCase() || "";
    const userName = log.user_name?.toLowerCase() || "";
    const resourceId = log.resource_id?.toLowerCase() || "";
    const detailsStr = JSON.stringify(log.details || "").toLowerCase();
    return action.includes(term) || userName.includes(term) || resourceId.includes(term) || detailsStr.includes(term);
  });

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getActionBadge = (action: string) => {
    if (action.includes("INTAKE")) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          {action.replace(/_/g, " ")}
        </span>
      );
    }
    if (action.includes("LOGIN") || action.includes("AUTH")) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          {action.replace(/_/g, " ")}
        </span>
      );
    }
    if (action.includes("DUPLICATE")) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          {action.replace(/_/g, " ")}
        </span>
      );
    }
    if (action.includes("REVOKE") || action.includes("DELETE") || action.includes("FAIL")) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          {action.replace(/_/g, " ")}
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700">
        {action.replace(/_/g, " ")}
      </span>
    );
  };

  const QUICK_ACTIONS = [
    { label: "All Events", value: "" },
    { label: "Intake Revisions", value: "INTAKE" },
    { label: "Logins", value: "LOGIN" },
    { label: "Duplicate Triage", value: "DUPLICATE" },
    { label: "Verifications", value: "VERIFICATION" },
    { label: "Batch Ingestions", value: "BATCH" },
  ];

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 uppercase tracking-wider">
              Governance & Audit
            </span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
              Rule 15 Immutable Ledger
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-slate-900 dark:text-white shrink-0" />
            <span>Audit Ledger & Compliance Trails</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-2xl leading-relaxed">
            Tamper-evident audit trail recording student admissions, sanctioned quota revisions, duplicate triages, and credential verifications.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 hover:text-slate-950 dark:hover:text-white transition flex items-center gap-2 shadow-xs shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-slate-900 dark:text-white" : "text-slate-400"}`} />
          <span>Sync Ledger</span>
        </button>
      </div>

      {/* Filter and Quick Chips Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search actor, action, reference ID, details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-slate-900 dark:focus:border-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={resourceFilter}
              onChange={(e) => setResourceFilter(e.target.value)}
              className="py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-white"
            >
              <option value="">All Resource Types</option>
              <option value="INTAKE">Approved Intake</option>
              <option value="STUDENT">Student Record</option>
              <option value="USER">User Identity</option>
              <option value="VERIFICATION">Verification Token</option>
              <option value="DUPLICATE_ALERT">Duplicate Alert</option>
            </select>
          </div>
        </div>

        {/* Quick Action Category Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mr-1">Filter Action:</span>
          {QUICK_ACTIONS.map((qa) => (
            <button
              key={qa.value}
              onClick={() => setActionFilter(qa.value)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                actionFilter === qa.value
                  ? "bg-slate-900 text-white font-semibold shadow-xs dark:bg-white dark:text-slate-900"
                  : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 border border-slate-200 dark:border-slate-700"
              }`}
            >
              {qa.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Audit Trail Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3 font-semibold">Timestamp</th>
                <th className="px-4 py-3 font-semibold">Actor / User</th>
                <th className="px-4 py-3 font-semibold">Action Classification</th>
                <th className="px-4 py-3 font-semibold">Resource Type</th>
                <th className="px-4 py-3 font-semibold">Contextual Reason & Details</th>
                <th className="px-4 py-3 font-semibold text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {paginatedLogs.map((log) => {
                const initial = log.user_name ? log.user_name[0].toUpperCase() : "S";
                return (
                  <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/70 transition">
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-[11px] text-slate-500 tnum">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-[10px] flex items-center justify-center font-bold">
                          {initial}
                        </div>
                        <span className="truncate max-w-[140px]">{log.user_name || "System"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        {log.resource_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs max-w-sm truncate">
                      {log.details?.reason || (log.details ? JSON.stringify(log.details) : "—")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-xs font-semibold text-slate-900 dark:text-white hover:underline"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}

              {paginatedLogs.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    No matching audit trail events recorded in current filter.
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
          totalItems={filteredLogs.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          itemLabel="audit records"
        />
      </div>

      {/* Audit Record Deep Inspection Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl max-w-xl w-full p-6 space-y-4 text-slate-800 dark:text-slate-200 animate-view-enter">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-slate-900 dark:text-white" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Audit Record Deep Inspection
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="text-[10px] uppercase font-semibold text-slate-400">Action</div>
                  <div className="mt-0.5 font-mono font-bold text-slate-900 dark:text-white">{selectedLog.action}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="text-[10px] uppercase font-semibold text-slate-400">Timestamp (UTC)</div>
                  <div className="mt-0.5 font-mono text-slate-600 dark:text-slate-300 tnum">{new Date(selectedLog.created_at).toUTCString()}</div>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-semibold text-slate-400">Resource Reference ID</div>
                  <div className="mt-0.5 font-mono text-slate-900 dark:text-white text-xs truncate max-w-sm tnum">
                    {selectedLog.resource_id || "None"}
                  </div>
                </div>
                {selectedLog.resource_id && (
                  <button
                    onClick={() => copyToClipboard(selectedLog.resource_id, "res")}
                    className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"
                    title="Copy Resource ID"
                  >
                    {copiedId === "res" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>

              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">Audit Metadata (JSON):</span>
                <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg font-mono text-[11px] overflow-x-auto max-h-48 border border-slate-800">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs transition"
              >
                Close Audit Record
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
