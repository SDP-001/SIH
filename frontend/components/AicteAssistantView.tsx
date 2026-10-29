"use client";

import React, { useState } from "react";
import { api, UserSession } from "@/lib/api";
import { 
  Bot, Sparkles, Search, ArrowRight, ShieldCheck, 
  Database, Info, AlertTriangle, FileSpreadsheet, RefreshCw,
  ExternalLink, BarChart3, HelpCircle, CheckCircle2,
  Cpu, Zap
} from "lucide-react";

interface AicteAssistantProps {
  user: UserSession;
  onNavigateTab?: (tab: string) => void;
}

const PRESET_QUERIES = [
  "Which institutions have unresolved intake discrepancies?",
  "How many records are awaiting verification?",
  "Which courses have the most validation errors?",
  "Show enrolment trends for the selected academic year.",
  "Summarize unresolved duplicate alerts."
];

export const AicteAssistantView: React.FC<AicteAssistantProps> = ({ user, onNavigateTab }) => {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [academicYear, setAcademicYear] = useState("2024-2025");

  const handleAsk = async (qText?: string) => {
    const queryToRun = qText || question;
    if (!queryToRun.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const res = await api.askOfficerAssistant(queryToRun, academicYear, user.institution_id || undefined);
      setResponse(res);
      if (qText) setQuestion(qText);
    } catch (err: any) {
      setError(err.message || "Failed to process query");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 px-2 py-0.5 rounded-md text-[11px] font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-slate-900 dark:text-white" />
              Explainable AI Intelligence
            </span>
            <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md text-[11px] font-medium flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              Zero Hallucination Guarantee
            </span>
            <span className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md text-[11px] font-medium">
              RBAC Guarded
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bot className="w-6 h-6 text-slate-900 dark:text-white" />
            AICTE Regulatory Officer Assistant
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Execute conversational inquiries against live student admissions and sanctioned capacity quotas. 
            All responses are computed deterministically via structured SQL queries with complete audit lineage.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <select
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            className="py-2 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-slate-900 dark:focus:border-white shadow-xs"
          >
            <option value="2024-2025">Academic Year 2024-2025</option>
            <option value="2023-2024">Academic Year 2023-2024</option>
          </select>
        </div>
      </div>

      {/* Query Input Card */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleAsk(); }}
          className="flex flex-col sm:flex-row gap-2.5"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask an analytical question e.g. Which institutions have unresolved intake discrepancies?..."
              className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 bg-white dark:bg-slate-950 focus:border-slate-900 dark:focus:border-white focus:outline-none transition"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50 shrink-0 shadow-xs active:scale-[0.98]"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                <span>Executing Query...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-white" />
                <span>Run Analysis</span>
              </>
            )}
          </button>
        </form>

        {/* Suggested Queries */}
        <div>
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-slate-900 dark:text-white" />
            <span>Recommended Regulatory Inquiries (Click to Execute):</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESET_QUERIES.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAsk(q)}
                disabled={loading}
                className="text-[11px] bg-slate-50 hover:bg-slate-100 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg transition font-medium text-left shadow-xs"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Query Result Card */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-400 p-4 rounded-xl text-xs font-medium flex items-center justify-between shadow-xs animate-fade-in">
          <span>{error}</span>
        </div>
      )}

      {response && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5 p-6 animate-fade-in">
          {/* Answer Headline */}
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 flex items-center gap-1.5">
                <Database className="w-3 h-3 text-slate-900 dark:text-white" />
                Intent: {response.structured_intent.replace(/_/g, " ")}
              </span>
              <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                Computed Against Live Normalized Schema
              </span>
            </div>
            <h2 className="text-base md:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
              {response.summary_answer}
            </h2>
          </div>

          {/* Numerical Metrics Grid */}
          {response.metric_values && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(response.metric_values).map(([key, val]: [string, any], idx) => (
                <div key={idx} className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block truncate">
                    {key.replace(/_/g, " ")}
                  </span>
                  <span className="text-2xl font-bold text-slate-900 dark:text-white mt-1 block tnum">
                    {val}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Supporting Records Table */}
          {response.supporting_data && response.supporting_data.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                <span>Underlying Structured Records ({response.supporting_data.length}):</span>
                {onNavigateTab && (
                  <button
                    onClick={() => {
                      if (response.structured_intent.includes("INTAKE")) onNavigateTab("intake");
                      else if (response.structured_intent.includes("DUPLICATE")) onNavigateTab("duplicates");
                      else if (response.structured_intent.includes("VERIFICATION")) onNavigateTab("students");
                      else onNavigateTab("reports");
                    }}
                    className="text-[11px] text-slate-900 dark:text-white hover:underline flex items-center gap-1 font-semibold"
                  >
                    Open Authorized Module
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-medium">
                    <tr>
                      {Object.keys(response.supporting_data[0]).map((h, idx) => (
                        <th key={idx} className="px-3.5 py-2.5 capitalize text-[11px] text-slate-600 dark:text-slate-400">
                          {h.replace(/_/g, " ")}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {response.supporting_data.map((row: any, rIdx: number) => (
                      <tr key={rIdx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/70 transition">
                        {Object.values(row).map((v: any, cIdx: number) => (
                          <td key={cIdx} className="px-3.5 py-2 text-slate-700 dark:text-slate-300 font-medium">
                            {String(v)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Data Lineage & Explanation Footer */}
          <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-start gap-3">
            <Info className="w-4 h-4 text-slate-700 dark:text-slate-300 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-slate-900 dark:text-white block">Execution Lineage & Governance:</span>
              <p className="leading-relaxed text-[11px] text-slate-600 dark:text-slate-300">
                {response.explainability_notes}
              </p>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-mono">
                ISO Timestamp: {new Date(response.generated_at).toISOString()} · Processed under Indian Technical Education RBAC boundaries.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
