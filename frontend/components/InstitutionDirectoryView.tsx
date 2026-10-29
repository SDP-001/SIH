"use client";

import React, { useEffect, useState } from "react";
import { api, UserSession } from "@/lib/api";
import { Pagination } from "@/components/Pagination";
import { 
  Building2, Search, Filter, MapPin, Mail, Phone, 
  CheckCircle2, ArrowRight, ShieldCheck, RefreshCw, 
  ExternalLink, Layers, GraduationCap, X, ChevronRight
} from "lucide-react";

interface InstitutionDirectoryProps {
  user: UserSession;
  onSelectInstitution?: (institutionId: string) => void;
}

export const InstitutionDirectoryView: React.FC<InstitutionDirectoryProps> = ({ user, onSelectInstitution }) => {
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedState, setSelectedState] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedInst, setSelectedInst] = useState<any | null>(null);
  const [instCourses, setInstCourses] = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;

  useEffect(() => {
    fetchInstitutions();
  }, [search]);

  const fetchInstitutions = async () => {
    try {
      setLoading(true);
      const res = await api.getInstitutions(search || undefined);
      setInstitutions(res);
      setCurrentPage(1);
    } catch (err) {
      console.error("Failed to load institutions", err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (inst: any) => {
    setSelectedInst(inst);
    try {
      setLoadingCourses(true);
      const courses = await api.getCourses(inst.id);
      setInstCourses(courses);
    } catch (err) {
      console.error("Failed to load courses", err);
      setInstCourses([]);
    } finally {
      setLoadingCourses(false);
    }
  };

  const states = Array.from(new Set(institutions.map(i => i.state).filter(Boolean)));
  const types = Array.from(new Set(institutions.map(i => i.institution_type).filter(Boolean)));

  const filtered = institutions.filter(i => {
    const matchesState = selectedState === "ALL" || i.state === selectedState;
    const matchesType = selectedType === "ALL" || i.institution_type === selectedType;
    return matchesState && matchesType;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 uppercase tracking-wider">
              National Registry
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 tnum">
              {institutions.length} Accredited Campuses
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-slate-900 dark:text-white shrink-0" />
            <span>AICTE-Approved Technical Institutions Directory</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-2xl leading-relaxed">
            National registry of technical colleges, autonomous engineering institutes, and universities with official AICTE approval references and regional state jurisdictions.
          </p>
        </div>

        <button
          onClick={fetchInstitutions}
          className="p-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 rounded-lg transition shadow-xs"
          title="Refresh Directory"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-slate-700" : ""}`} />
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, code, approval ref..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-slate-900 dark:focus:border-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span className="font-semibold text-[10px] uppercase tracking-wider">State:</span>
          </div>
          <select
            value={selectedState}
            onChange={(e) => { setSelectedState(e.target.value); setCurrentPage(1); }}
            className="py-1.5 px-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-slate-900 dark:focus:border-white"
          >
            <option value="ALL">All States ({states.length})</option>
            {states.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <div className="flex items-center gap-1.5 text-slate-500 pl-1">
            <span className="font-semibold text-[10px] uppercase tracking-wider">Type:</span>
          </div>
          <select
            value={selectedType}
            onChange={(e) => { setSelectedType(e.target.value); setCurrentPage(1); }}
            className="py-1.5 px-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-slate-900 dark:focus:border-white"
          >
            <option value="ALL">All Types</option>
            {types.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Institutions Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-44 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 skeleton" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginated.map((inst) => (
              <div
                key={inst.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-sm transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-mono text-[10px] font-semibold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700 tnum">
                      {inst.institution_code}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {inst.institution_type}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-2">
                    {inst.name}
                  </h3>

                  <div className="space-y-1.5 mt-3 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{inst.district}, {inst.state}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-mono text-[11px] truncate tnum">Ref: {inst.aicte_approval_ref}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Approved
                  </span>

                  <button
                    onClick={() => handleViewDetails(inst)}
                    className="text-xs font-semibold text-slate-900 dark:text-white hover:underline flex items-center gap-1"
                  >
                    <span>View Profile</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs">No institutions matched your query.</p>
              </div>
            )}
          </div>

          {/* Dedicated Previous & Next Pagination */}
          <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filtered.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              itemLabel="institutions"
            />
          </div>
        </div>
      )}

      {/* Institution Details Modal */}
      {selectedInst && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-700 dark:text-slate-200 animate-view-enter">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300 tnum">
                  {selectedInst.institution_code}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                  {selectedInst.name}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedInst(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 text-[10px] font-semibold uppercase block">AICTE Order Ref</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white mt-0.5 block">{selectedInst.aicte_approval_ref}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 text-[10px] font-semibold uppercase block">State & District</span>
                  <span className="font-semibold text-slate-900 dark:text-white mt-0.5 block">{selectedInst.district}, {selectedInst.state}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 text-[10px] font-semibold uppercase block">Institution Type</span>
                  <span className="font-semibold text-slate-900 dark:text-white mt-0.5 block">{selectedInst.institution_type}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs mb-2 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-slate-900 dark:text-white" />
                  Sanctioned Courses & Degree Programs
                </h4>

                {loadingCourses ? (
                  <div className="p-4 text-center text-slate-400">Loading courses...</div>
                ) : instCourses.length > 0 ? (
                  <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-medium">
                        <tr>
                          <th className="px-3.5 py-2">Course Code</th>
                          <th className="px-3.5 py-2">Program Name</th>
                          <th className="px-3.5 py-2">Level</th>
                          <th className="px-3.5 py-2 text-center">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {instCourses.map(c => (
                          <tr key={c.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/70 transition">
                            <td className="px-3.5 py-2 font-mono font-semibold text-slate-900 dark:text-white tnum">{c.course_code}</td>
                            <td className="px-3.5 py-2 font-medium text-slate-900 dark:text-white">{c.course_name}</td>
                            <td className="px-3.5 py-2 text-slate-600 dark:text-slate-300">{c.degree_level}</td>
                            <td className="px-3.5 py-2 text-center text-slate-600 dark:text-slate-300 font-mono tnum">{c.duration_years} Years</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-slate-400 text-xs italic">No specific courses registered under this profile.</p>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end">
              <button
                onClick={() => setSelectedInst(null)}
                className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-medium text-xs rounded-lg transition"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
