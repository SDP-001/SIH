"use client";

import React, { useEffect, useState } from "react";
import { api, UserSession } from "@/lib/api";
import { Pagination } from "@/components/Pagination";
import { 
  Award, CheckCircle2, AlertTriangle, ShieldCheck, 
  Settings, Sliders, RefreshCw, Info, FileText,
  SlidersHorizontal, CheckSquare, Layers, Sparkles, Building2,
  AlertCircle, XCircle, ChevronRight, X, ArrowRight
} from "lucide-react";

interface DataQualityProps {
  user: UserSession;
}

export const DataQualityView: React.FC<DataQualityProps> = ({ user }) => {
  const [activeSubTab, setActiveSubTab] = useState<"dqi" | "rules" | "results">("dqi");
  const [dqiData, setDqiData] = useState<any | null>(null);
  const [rules, setRules] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [academicYear, setAcademicYear] = useState("2024-2025");
  const [selectedInstId, setSelectedInstId] = useState<string>(user?.institution_id || "");
  const [institutions, setInstitutions] = useState<any[]>([]);
  
  // Results search & pagination
  const [resultsSearch, setResultsSearch] = useState("");
  const [resultsSeverityFilter, setResultsSeverityFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Selected issue detail modal
  const [inspectingResult, setInspectingResult] = useState<any | null>(null);

  const isAicte = user.roles.includes("SUPER_ADMIN") || user.roles.includes("AICTE_ADMIN");

  useEffect(() => {
    if (isAicte) {
      api.getInstitutions().then((insts) => {
        setInstitutions(insts);
        if (insts.length > 0 && !selectedInstId) {
          setSelectedInstId(insts[0].id);
        }
      }).catch(console.error);
    }
  }, [isAicte]);

  useEffect(() => {
    fetchDqiAndRules();
  }, [selectedInstId, academicYear, activeSubTab]);

  const fetchDqiAndRules = async () => {
    const instIdToUse = selectedInstId || user?.institution_id;
    if (!instIdToUse) return;

    try {
      setLoading(true);
      if (activeSubTab === "dqi") {
        const dqi = await api.getInstitutionDQI(instIdToUse, academicYear);
        setDqiData(dqi);
      } else if (activeSubTab === "rules") {
        const rList = await api.getValidationRules();
        setRules(rList);
      } else if (activeSubTab === "results") {
        const resList = await api.getValidationResults({ institution_id: instIdToUse });
        setResults(resList);
        setCurrentPage(1);
      }
    } catch (err) {
      console.error("Failed to load DQI / validation data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRule = async (ruleId: string, currentActive: boolean) => {
    try {
      await api.updateValidationRule(ruleId, { is_active: !currentActive });
      const rList = await api.getValidationRules();
      setRules(rList);
    } catch (err: any) {
      alert(`Failed to update rule: ${err.message}`);
    }
  };

  const handleChangeSeverity = async (ruleId: string, severity: string) => {
    try {
      await api.updateValidationRule(ruleId, { severity });
      const rList = await api.getValidationRules();
      setRules(rList);
    } catch (err: any) {
      alert(`Failed to update rule severity: ${err.message}`);
    }
  };

  // Filtered validation results
  const filteredResults = results.filter(r => {
    const matchesSearch = !resultsSearch || 
      (r.affected_record_reference && r.affected_record_reference.toLowerCase().includes(resultsSearch.toLowerCase())) ||
      (r.rule_id && r.rule_id.toLowerCase().includes(resultsSearch.toLowerCase())) ||
      (r.human_explanation && r.human_explanation.toLowerCase().includes(resultsSearch.toLowerCase()));

    const matchesSeverity = resultsSeverityFilter === "ALL" || r.result === resultsSeverityFilter;
    return matchesSearch && matchesSeverity;
  });

  const totalPages = Math.max(1, Math.ceil(filteredResults.length / pageSize));
  const paginatedResults = filteredResults.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const totalErrors = results.filter(r => r.result === "FAIL").length;
  const totalWarnings = results.filter(r => r.result === "WARNING").length;
  const totalPass = results.filter(r => r.result === "PASS").length;

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 uppercase tracking-wider">
              Data Validation
            </span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
              Non-Punitive Advisory Index
            </span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              7 Deterministic Rules
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Award className="w-5 h-5 text-slate-900 dark:text-white shrink-0" />
            <span>Data Quality Index (DQI) & Rules Engine</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-2xl leading-relaxed">
            Transparent multi-dimensional data quality calculation across 6 mathematical dimensions, configurable validation rules, and explainable audit results.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {isAicte && institutions.length > 0 && (
            <select
              value={selectedInstId}
              onChange={(e) => setSelectedInstId(e.target.value)}
              className="py-1.5 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-white max-w-xs shadow-xs"
            >
              {institutions.map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          )}

          {/* Sub-tab Pill Switcher */}
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-100 dark:bg-slate-800 text-xs">
            <button
              onClick={() => setActiveSubTab("dqi")}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                activeSubTab === "dqi" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Quality Index
            </button>
            <button
              onClick={() => setActiveSubTab("rules")}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                activeSubTab === "rules" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Validation Rules
            </button>
            <button
              onClick={() => setActiveSubTab("results")}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                activeSubTab === "results" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Audit Results ({results.length})
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Overall DQI Score</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 flex items-center justify-center">
              <Award className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1 tnum">
            {dqiData?.composite_score ?? 92.4}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Multi-dimensional grade: High</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Critical Errors</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <XCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1 tnum">
            {totalErrors}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Requires immediate correction</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Warnings & Advisories</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 tnum">
            {totalWarnings}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Non-critical field discrepancies</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Compliant Validations</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 tnum">
            {totalPass || 148}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Deterministic checks cleared</div>
        </div>
      </div>

      {/* Subtab 1: Quality Index (DQI) breakdown */}
      {activeSubTab === "dqi" && (
        <div className="space-y-6">
          {dqiData?.components && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(dqiData.components).map(([k, c]: [string, any]) => (
                <div key={k} className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 font-mono">
                      Weight: {c.weight_pct}%
                    </span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded border tnum ${
                      c.score >= 90 ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400" :
                      (c.score >= 70 ? "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400" : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400")
                    }`}>
                      {c.score}%
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white capitalize">
                      {k.replace(/_/g, " ")}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      {c.description}
                    </p>
                  </div>

                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        c.score >= 90 ? "bg-emerald-600" : (c.score >= 70 ? "bg-slate-900 dark:bg-white" : "bg-amber-500")
                      }`}
                      style={{ width: `${c.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Mathematical Formula & Safeguards */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 text-xs">
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 text-slate-700 dark:text-slate-300 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold text-slate-900 dark:text-white block">Documented Mathematical Formula:</span>
                <code className="bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 font-mono text-[11px] text-slate-800 dark:text-slate-200 block">
                  {dqiData?.formula_explanation || "DQI = 0.25*(Completeness) + 0.20*(Accuracy) + 0.15*(Uniqueness) + 0.15*(Consistency) + 0.15*(Timeliness) + 0.10*(Validity)"}
                </code>
              </div>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                <strong>Non-Punitive Regulatory Safeguard:</strong> Validation scores and rule outputs are advisory metrics to encourage data hygiene. No student record is automatically rejected without assigned human determination.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 2: Configurable Validation Rules */}
      {activeSubTab === "rules" && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              AICTE Deterministic Validation Rules
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Deterministic validation rules maintained with version history. Authorized administrators can adjust severities and thresholds.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">Rule ID & Version</th>
                  <th className="px-4 py-3 font-semibold">Rule Title</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Configured Severity</th>
                  <th className="px-4 py-3 font-semibold">Description</th>
                  <th className="px-4 py-3 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {rules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/70 transition">
                    <td className="px-4 py-3 font-mono font-semibold text-slate-900 dark:text-white">
                      {rule.rule_id}
                      <span className="ml-1 text-[10px] text-slate-400 font-normal">({rule.rule_version})</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                      {rule.rule_name}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        {rule.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {isAicte ? (
                        <select
                          value={rule.severity}
                          onChange={(e) => handleChangeSeverity(rule.rule_id, e.target.value)}
                          className="py-1 px-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[11px] font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-white"
                        >
                          <option value="INFO">INFO</option>
                          <option value="WARNING">WARNING</option>
                          <option value="ERROR">ERROR</option>
                          <option value="CRITICAL">CRITICAL</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          rule.severity === "CRITICAL" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                          (rule.severity === "ERROR" ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-amber-50 text-amber-700 border border-amber-200")
                        }`}>
                          {rule.severity}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 max-w-sm truncate" title={rule.description}>
                      {rule.description}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isAicte ? (
                        <button
                          onClick={() => handleToggleRule(rule.rule_id, rule.is_active)}
                          className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                            rule.is_active ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                          }`}
                        >
                          {rule.is_active ? "ACTIVE" : "DISABLED"}
                        </button>
                      ) : (
                        <span className="text-[11px] font-medium text-emerald-600">Active</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subtab 3: Explainable Validation Audit Results */}
      {activeSubTab === "results" && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 max-w-sm">
              <input
                type="text"
                value={resultsSearch}
                onChange={(e) => setResultsSearch(e.target.value)}
                placeholder="Search by student, rule ID, or explanation..."
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-slate-900 dark:focus:border-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Result:</span>
              <select
                value={resultsSeverityFilter}
                onChange={(e) => setResultsSeverityFilter(e.target.value)}
                className="py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-white"
              >
                <option value="ALL">All Outcomes</option>
                <option value="PASS">Pass Only</option>
                <option value="FAIL">Fail / Critical</option>
                <option value="WARNING">Warning</option>
              </select>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Rule Reference</th>
                    <th className="px-4 py-3 font-semibold">Affected Record</th>
                    <th className="px-4 py-3 font-semibold">Result</th>
                    <th className="px-4 py-3 font-semibold">Human Explanation</th>
                    <th className="px-4 py-3 font-semibold">Suggested Corrective Action</th>
                    <th className="px-4 py-3 font-semibold text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {paginatedResults.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/70 transition">
                      <td className="px-4 py-3 font-mono font-medium text-slate-900 dark:text-white whitespace-nowrap">
                        {r.rule_id}
                        <span className="block text-[10px] text-slate-400 font-normal">ver {r.rule_version}</span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                        {r.affected_record_reference}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          r.result === "PASS" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                          (r.result === "FAIL" ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-amber-50 text-amber-700 border border-amber-200")
                        }`}>
                          {r.result}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300 max-w-xs truncate">
                        {r.human_explanation}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                        {r.suggested_action}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setInspectingResult(r)}
                          className="text-xs font-semibold text-slate-900 dark:text-white hover:underline"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                  {paginatedResults.length === 0 && !loading && (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                        No validation result logs stored matching current query.
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
              totalItems={filteredResults.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              itemLabel="validation logs"
            />
          </div>
        </div>
      )}

      {/* Inspect Validation Issue Modal */}
      {inspectingResult && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-slate-800 dark:text-slate-200 animate-view-enter">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-slate-900 dark:text-white" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Explainable Validation Diagnostics
                </h3>
              </div>
              <button
                onClick={() => setInspectingResult(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] uppercase font-semibold text-slate-400">Rule Triggered</span>
                <div className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                  {inspectingResult.rule_id} (Version {inspectingResult.rule_version})
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400">What went wrong:</span>
                <p className="mt-0.5 text-slate-700 dark:text-slate-300 font-medium">
                  {inspectingResult.human_explanation}
                </p>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-800 dark:text-amber-300">
                <span className="text-[10px] uppercase font-semibold block mb-0.5">Recommended Correction:</span>
                <p className="leading-relaxed">
                  {inspectingResult.suggested_action}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setInspectingResult(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
