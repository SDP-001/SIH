"use client";

import React, { useEffect, useState } from "react";
import { api, UserSession } from "@/lib/api";
import { 
  Users, Building2, AlertTriangle, UploadCloud, 
  CheckCircle2, FileSpreadsheet, ArrowRight, ShieldCheck, 
  Clock, AlertCircle, Sparkles, FileEdit, Award
} from "lucide-react";

interface InstitutionDashboardProps {
  user: UserSession;
  onSelectTab: (tab: string) => void;
}

export const InstitutionDashboardView: React.FC<InstitutionDashboardProps> = ({ user, onSelectTab }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.institution_id) {
      fetchMetrics(user.institution_id);
    }
  }, [user]);

  const fetchMetrics = async (instId: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getInstitutionDashboard(instId);
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load institution metrics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-20 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 skeleton"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 skeleton"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-sm text-slate-900 dark:text-white">Connection Error</h4>
          <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5">{error}</p>
        </div>
        <button 
          onClick={() => user?.institution_id && fetchMetrics(user.institution_id)} 
          className="px-3.5 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  const isExcess = (data?.actual_enrolment || 0) > (data?.approved_intake || 0);
  const excessCount = Math.max(0, (data?.actual_enrolment || 0) - (data?.approved_intake || 0));

  return (
    <div className="space-y-6">
      
      {/* Institution Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 uppercase tracking-wider">
              Institution Portal
            </span>
            {isExcess ? (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                Excess Intake Detected (+{excessCount} seats)
              </span>
            ) : (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Intake Capacity Compliant
              </span>
            )}
            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              AY 2024-25
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            {data?.institution_name || "Institution Command Profile"}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-2xl leading-relaxed">
            Student records vault, sanctioned quota monitoring, supernumerary verification, and CSV/Excel bulk onboarding.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => onSelectTab("upload")}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition flex items-center gap-2 shadow-xs btn-press"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Bulk Upload Students</span>
          </button>
          <button
            onClick={() => onSelectTab("students")}
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition flex items-center gap-1.5 shadow-xs btn-press"
          >
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span>Student Directory</span>
          </button>
          <button
            onClick={() => onSelectTab("data_quality")}
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition flex items-center gap-1.5 shadow-xs btn-press"
          >
            <Award className="w-3.5 h-3.5 text-slate-500" />
            <span>Data Validation</span>
          </button>
          <button
            onClick={() => onSelectTab("corrections")}
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition flex items-center gap-1.5 shadow-xs btn-press"
          >
            <FileEdit className="w-3.5 h-3.5 text-slate-500" />
            <span>Correction Requests</span>
          </button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div 
          onClick={() => onSelectTab("students")}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs card-hover cursor-pointer transition flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total Students</span>
              <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center shrink-0">
                <Users className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight tnum">
              {(data?.total_students || 0).toLocaleString()}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
            Enrolled for Academic Year 2024-25
          </div>
        </div>

        {/* Approved Intake */}
        <div 
          onClick={() => onSelectTab("intake")}
          className={`bg-white dark:bg-slate-900 border rounded-xl p-5 shadow-xs card-hover cursor-pointer transition flex flex-col justify-between ${
            isExcess ? "border-amber-300 dark:border-amber-800" : "border-slate-200 dark:border-slate-800"
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Sanctioned Intake</span>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                isExcess ? "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400" : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
              }`}>
                <Building2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-baseline gap-2 tnum">
              <span>{(data?.approved_intake || 0).toLocaleString()}</span>
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                ({data?.actual_enrolment || 0} enrolled)
              </span>
            </div>
          </div>
          <div className={`mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px] font-medium ${
            isExcess ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
          }`}>
            {isExcess ? `Over-enrolled by +${excessCount} seats` : "Within sanctioned capacity"}
          </div>
        </div>

        {/* APAAR Status */}
        <div 
          onClick={() => onSelectTab("verify")}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs card-hover cursor-pointer transition flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">APAAR Verified</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-baseline gap-2 tnum">
              <span>{(data?.verified_apaar_count || 0).toLocaleString()}</span>
              <span className="text-xs font-normal text-emerald-600 dark:text-emerald-400">verified</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
            {data?.pending_apaar_verification || 0} pending verification check
          </div>
        </div>

        {/* Data Validation Quality */}
        <div 
          onClick={() => onSelectTab("data_quality")}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs card-hover cursor-pointer transition flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Validated Records</span>
              <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-baseline gap-2 tnum">
              <span>{(data?.validated_records || 0).toLocaleString()}</span>
              <span className="text-xs font-normal text-purple-600 dark:text-purple-400">clean</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
            {data?.records_with_warnings || 0} warnings · {data?.records_with_errors || 0} errors
          </div>
        </div>
      </div>

      {/* Course Breakdown Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Departmental Courses & Sanctioned Seat Quota
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Enrolment vs sanctioned capacity with supernumerary allowance breakdown
            </p>
          </div>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            AY 2024-25
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3 font-semibold">Course Name</th>
                <th className="px-4 py-3 font-semibold text-center">Approved Intake</th>
                <th className="px-4 py-3 font-semibold text-center">Actual Enrolment</th>
                <th className="px-4 py-3 font-semibold text-center">Supernumerary (TFW/EWS)</th>
                <th className="px-4 py-3 font-semibold">Capacity Utilization</th>
                <th className="px-4 py-3 font-semibold">Compliance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {data?.course_intake_breakdown?.map((item: any, idx: number) => {
                const excess = item.actual > item.approved;
                const pct = item.approved > 0 ? Math.round((item.actual / item.approved) * 100) : 0;
                return (
                  <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/70 transition">
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                      {item.course}
                    </td>
                    <td className="px-4 py-3 text-center font-medium font-mono tnum">
                      {item.approved}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-slate-900 dark:text-white font-mono tnum">
                      {item.actual}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-500 dark:text-slate-400 font-mono text-[11px] tnum">
                      {item.supernumerary_enrolled} / {item.supernumerary_quota} quota
                    </td>
                    <td className="px-4 py-3 min-w-[130px]">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${
                              excess ? "bg-amber-500" : pct > 90 ? "bg-slate-900 dark:bg-white" : "bg-emerald-500"
                            }`}
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                        <span className={`text-[10px] font-mono font-medium ${excess ? "text-amber-600 dark:text-amber-400 font-bold" : "text-slate-500"}`}>
                          {pct}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {excess ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800 flex items-center gap-1 w-fit">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          Excess (+{item.actual - item.approved} seats)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Compliant
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Upload Batches */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-5">
        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-slate-500" />
          Recent Bulk Upload Activity
        </h3>
        <div className="space-y-2">
          {data?.recent_batches?.map((batch: any) => (
            <div 
              key={batch.id} 
              className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">{batch.file_name}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {batch.imported_rows} imported · {batch.warning_rows} warnings · {batch.error_rows} errors
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                  batch.status === "COMPLETED" 
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800" 
                    : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800"
                }`}>
                  {batch.status}
                </span>
                <div className="text-[10px] text-slate-400 mt-1">
                  {new Date(batch.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
          {(!data?.recent_batches || data.recent_batches.length === 0) && (
            <p className="text-xs text-slate-400 text-center py-6">
              No recent upload batches. Click "Bulk Upload Students" to submit onboarding records.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
