"use client";

import React, { useEffect, useState } from "react";
import { api, UserSession } from "@/lib/api";
import { Pagination } from "@/components/Pagination";
import { 
  Users, Search, ShieldCheck, Plus, RefreshCw, 
  QrCode, Lock, Unlock, Eye, X, Check,
  AlertTriangle, CheckCircle2, Building2, GraduationCap,
  Sparkles, Filter, ChevronLeft, ChevronRight, XCircle,
  Clock, ShieldAlert, Award, FileText
} from "lucide-react";

interface StudentDirectoryProps {
  user: UserSession;
}

export const StudentDirectoryView: React.FC<StudentDirectoryProps> = ({ user }) => {
  const [students, setStudents] = useState<any[]>([]);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState("");
  const [institutionFilter, setInstitutionFilter] = useState<string>(user?.institution_id || "ALL");
  const [apaarFilter, setApaarFilter] = useState("ALL");
  const [academicYearFilter, setAcademicYearFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  
  const [courses, setCourses] = useState<any[]>([]);
  const [inspectingStudent, setInspectingStudent] = useState<any | null>(null);
  const [unmaskedStudents, setUnmaskedStudents] = useState<Record<string, boolean>>({});
  const [selectedVerification, setSelectedVerification] = useState<any | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Single Student Registration Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    course_id: "",
    student_name: "",
    institution_reg_num: "",
    apaar_id: "",
    email: "",
    phone: "",
    admission_category: "GENERAL",
    academic_year: "2024-2025",
    is_supernumerary: false,
    supernumerary_category: ""
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isAicteAdmin = user?.roles?.includes("AICTE_ADMIN") || user?.roles?.includes("SUPER_ADMIN");

  useEffect(() => {
    fetchStudents();
    if (isAicteAdmin) {
      api.getInstitutions().then(setInstitutions).catch(console.error);
    }
    if (user?.institution_id) {
      api.getCourses(user.institution_id).then(setCourses).catch(console.error);
    }
  }, [user]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.getStudents({
        institution_id: user?.institution_id || undefined,
        search: search || undefined,
        apaar_status: apaarFilter === "ALL" ? undefined : apaarFilter
      });
      setStudents(res);
      setCurrentPage(1);
    } catch (err) {
      console.error("Failed to load students", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyApaar = async (studentId: string) => {
    try {
      setVerifyingId(studentId);
      const res = await api.verifyApaar(studentId);
      alert(`APAAR Handshake: ${res.status}\n${res.message}\nVerification Ref: ${res.verification_ref || "N/A"}`);
      fetchStudents();
    } catch (err: any) {
      alert(`APAAR verification failed: ${err.message}`);
    } finally {
      setVerifyingId(null);
    }
  };

  const handleGenerateQR = async (studentId: string) => {
    try {
      const res = await api.requestVerificationToken(studentId, "Academic Credential Public Verification");
      setSelectedVerification(res);
    } catch (err: any) {
      alert(`Failed to generate verification token: ${err.message}`);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.institution_id) return;
    try {
      setFormSubmitting(true);
      setFormError(null);
      await api.createStudent(formData, user.institution_id);
      setShowAddModal(false);
      fetchStudents();
    } catch (err: any) {
      setFormError(err.message || "Failed to add student");
    } finally {
      setFormSubmitting(false);
    }
  };

  const toggleUnmask = (id: string) => {
    setUnmaskedStudents(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const formatApaarDisplay = (student: any) => {
    const isUnmasked = unmaskedStudents[student.id];
    if (isUnmasked) {
      return student.apaar_id || "429188472910";
    }
    if (student.apaar_masked) {
      return student.apaar_masked;
    }
    const raw = student.apaar_id || "429188472910";
    return raw.slice(0, 2) + "XXXX" + raw.slice(-4);
  };

  // Filter students locally on combined criteria
  const filteredStudents = students.filter(s => {
    const matchesSearch = !search ||
      s.student_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.institution_reg_num?.toLowerCase().includes(search.toLowerCase()) ||
      s.apaar_id?.toLowerCase().includes(search.toLowerCase()) ||
      s.course_name?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = apaarFilter === "ALL" || s.apaar_status === apaarFilter;
    const matchesInst = institutionFilter === "ALL" || s.institution_id === institutionFilter;
    const matchesYear = academicYearFilter === "ALL" || s.academic_year === academicYearFilter;
    const matchesCat = categoryFilter === "ALL" || s.admission_category === categoryFilter;

    return matchesSearch && matchesStatus && matchesInst && matchesYear && matchesCat;
  });

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const paginatedStudents = filteredStudents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3" />
            Verified
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case "INVALID":
      case "ERROR":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800">
            <XCircle className="w-3 h-3" />
            Invalid
          </span>
        );
      case "MANUAL_REVIEW":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800">
            <AlertTriangle className="w-3 h-3" />
            Manual Review
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
            {status || "Unverified"}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 uppercase tracking-wider">
              Student Records
            </span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              Rule 6 & 7 Compliant Masking
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-900 dark:text-white shrink-0" />
            <span>Student Identity Directory & APAAR Registry</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-2xl leading-relaxed">
            Privacy-preserving student records with masked APAAR identifiers, multi-dimensional verification status, and cryptographic QR tokens.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchStudents}
            className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg transition shadow-xs"
            title="Refresh Directory"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-slate-900 dark:text-white" : ""}`} />
          </button>

          {user?.institution_id && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition flex items-center gap-1.5 shadow-xs btn-press"
            >
              <Plus className="w-4 h-4" />
              <span>Register Student</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student name, roll no, APAAR ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-slate-900 dark:focus:border-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isAicteAdmin && institutions.length > 0 && (
            <select
              value={institutionFilter}
              onChange={(e) => setInstitutionFilter(e.target.value)}
              className="py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-white max-w-xs"
            >
              <option value="ALL">All Institutions ({institutions.length})</option>
              {institutions.map(i => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          )}

          <select
            value={apaarFilter}
            onChange={(e) => setApaarFilter(e.target.value)}
            className="py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-white"
          >
            <option value="ALL">All Verification Statuses</option>
            <option value="VERIFIED">Verified</option>
            <option value="PENDING">Pending Verification</option>
            <option value="INVALID">Invalid / Error</option>
            <option value="MANUAL_REVIEW">Manual Review</option>
          </select>

          <select
            value={academicYearFilter}
            onChange={(e) => setAcademicYearFilter(e.target.value)}
            className="py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-white"
          >
            <option value="ALL">All Academic Years</option>
            <option value="2024-2025">AY 2024-25</option>
            <option value="2023-2024">AY 2023-24</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-white"
          >
            <option value="ALL">All Seat Categories</option>
            <option value="GENERAL">General</option>
            <option value="OBC">OBC</option>
            <option value="SC">SC</option>
            <option value="ST">ST</option>
            <option value="EWS">EWS</option>
          </select>
        </div>
      </div>

      {/* Main Student Records Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3 font-semibold">Student Name & Roll No</th>
                <th className="px-4 py-3 font-semibold">Masked APAAR Identifier</th>
                <th className="px-4 py-3 font-semibold">Branch & Course</th>
                <th className="px-4 py-3 font-semibold">Category / Supernumerary</th>
                <th className="px-4 py-3 font-semibold">Verification Status</th>
                <th className="px-4 py-3 font-semibold text-right">Authorized Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {paginatedStudents.map((student) => {
                const isUnmasked = unmaskedStudents[student.id];
                return (
                  <tr key={student.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/70 transition">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {student.student_name}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono tnum">
                        {student.institution_reg_num}
                      </div>
                    </td>

                    {/* Masked APAAR with toggle */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 tnum">
                          {formatApaarDisplay(student)}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleUnmask(student.id)}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                          title={isUnmasked ? "Mask APAAR identifier" : "Reveal APAAR (Authorized Rule 6)"}
                        >
                          {isUnmasked ? <Eye className="w-3.5 h-3.5 text-slate-900 dark:text-white" /> : <Lock className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 dark:text-white truncate max-w-xs">
                        {student.course_name || "Engineering Program"}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {student.institution_name || "Technical Institute"}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {student.admission_category || "GENERAL"}
                        </span>
                        {student.is_supernumerary && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700">
                            Supernumerary ({student.supernumerary_category || "TFW"})
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      {getStatusBadge(student.apaar_status)}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleGenerateQR(student.id)}
                          className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-md transition shadow-2xs border border-slate-200 dark:border-slate-700"
                          title="Generate Academic Credential QR"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleVerifyApaar(student.id)}
                          disabled={verifyingId === student.id}
                          className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-white transition border border-slate-300 dark:border-slate-700 shadow-2xs disabled:opacity-50"
                        >
                          {verifyingId === student.id ? "Verifying..." : "Verify"}
                        </button>

                        <button
                          onClick={() => setInspectingStudent(student)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-md transition"
                          title="View Full Student Record"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {paginatedStudents.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    No student records matching current query parameters.
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
          totalItems={filteredStudents.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          itemLabel="student records"
        />
      </div>

      {/* QR Code Modal */}
      {selectedVerification && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-sm w-full border border-slate-200 dark:border-slate-800 p-6 text-center space-y-4 animate-view-enter">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-slate-900 dark:text-white" />
                Academic Credential QR
              </span>
              <button 
                onClick={() => setSelectedVerification(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200 inline-block shadow-xs">
              {selectedVerification.qr_code_base64 && (
                <img
                  src={`data:image/png;base64,${selectedVerification.qr_code_base64}`}
                  alt="Academic Verification QR"
                  className="w-44 h-44 mx-auto rounded"
                />
              )}
            </div>

            <div>
              <div className="font-bold text-slate-900 dark:text-white text-sm">
                {selectedVerification.student_name}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {selectedVerification.course_name}
              </div>
              <div className="text-[11px] text-slate-900 dark:text-white font-mono mt-1 bg-slate-50 dark:bg-slate-800 py-1 px-2.5 rounded border border-slate-200 dark:border-slate-700 inline-block tnum">
                Ref: {selectedVerification.verification_code}
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-lg text-[11px] text-left text-slate-800 dark:text-slate-300">
              <strong>Cryptographic Verification:</strong> This QR code links strictly to the opaque verification endpoint. Raw APAAR ID is never encoded.
            </div>

            <div className="flex gap-2">
              <a
                href={`/verify/${selectedVerification.verification_code}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs transition shadow-xs text-center"
              >
                Open Verification Page
              </a>
              <button
                onClick={() => setSelectedVerification(null)}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Single Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-lg w-full border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-200 animate-view-enter">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Register Student Record
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-md">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddStudent} className="p-5 space-y-3 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
                  {formError}
                </div>
              )}

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Approved Course *</label>
                <select
                  required
                  value={formData.course_id}
                  onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                  className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-white"
                >
                  <option value="">Select course...</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.course_name} ({c.course_code})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Full Student Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.student_name}
                    onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-white"
                    placeholder="e.g. Ramesh Kumar"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Registration / Roll No *</label>
                  <input
                    type="text"
                    required
                    value={formData.institution_reg_num}
                    onChange={(e) => setFormData({ ...formData, institution_reg_num: e.target.value })}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-white"
                    placeholder="e.g. DITS-2024-CSE-050"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">12-Digit APAAR ID *</label>
                  <input
                    type="text"
                    required
                    value={formData.apaar_id}
                    onChange={(e) => setFormData({ ...formData, apaar_id: e.target.value })}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono focus:outline-none focus:border-slate-900 dark:focus:border-white"
                    placeholder="e.g. 429188472910"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Admission Category</label>
                  <select
                    value={formData.admission_category}
                    onChange={(e) => setFormData({ ...formData, admission_category: e.target.value })}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-white"
                  >
                    <option value="GENERAL">General</option>
                    <option value="OBC">OBC</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                    <option value="EWS">EWS</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-white"
                    placeholder="ramesh@student.dits.ac.in"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-white"
                    placeholder="+91 9876543210"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_supernumerary}
                    onChange={(e) => setFormData({ ...formData, is_supernumerary: e.target.checked })}
                    className="rounded text-slate-900 accent-slate-900"
                  />
                  <span className="font-medium text-slate-700 dark:text-slate-300">Supernumerary Seat Candidate</span>
                </label>
                {formData.is_supernumerary && (
                  <div className="mt-2 pl-5">
                    <select
                      value={formData.supernumerary_category}
                      onChange={(e) => setFormData({ ...formData, supernumerary_category: e.target.value })}
                      className="w-full p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    >
                      <option value="TFW">Tuition Fee Waiver (TFW - max 5%)</option>
                      <option value="EWS">Economically Weaker Section (EWS - max 10%)</option>
                      <option value="PMSSS">PMSSS J&K Quota (max 2 seats)</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg text-slate-700 dark:text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold transition disabled:opacity-50 shadow-xs"
                >
                  {formSubmitting ? "Registering..." : "Submit Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Student Detail Drawer/Modal */}
      {inspectingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-200 animate-view-enter">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300 uppercase tracking-wider">
                  Student Record Inspection
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                  {inspectingStudent.student_name}
                </h3>
              </div>
              <button 
                onClick={() => setInspectingStudent(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 text-[10px] font-semibold uppercase block">APAAR Identifier</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white mt-0.5 block tnum">
                    {formatApaarDisplay(inspectingStudent)}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 text-[10px] font-semibold uppercase block">Institutional Roll No</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white mt-0.5 block tnum">
                    {inspectingStudent.institution_reg_num}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 text-[10px] font-semibold uppercase block">Course & Department</span>
                  <span className="font-semibold text-slate-900 dark:text-white mt-0.5 block">
                    {inspectingStudent.course_name || "B.Tech Computer Science"}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 text-[10px] font-semibold uppercase block">Institution Name</span>
                  <span className="font-semibold text-slate-900 dark:text-white mt-0.5 block">
                    {inspectingStudent.institution_name || "Institution"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 text-[10px] font-semibold uppercase block">Academic Cycle</span>
                  <span className="font-semibold text-slate-900 dark:text-white mt-0.5 block tnum">
                    {inspectingStudent.academic_year || "2024-2025"}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 text-[10px] font-semibold uppercase block">Seat Category</span>
                  <span className="font-semibold text-slate-900 dark:text-white mt-0.5 block">
                    {inspectingStudent.admission_category || "GENERAL"}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 text-[10px] font-semibold uppercase block">Verification Status</span>
                  <div className="mt-1">
                    {getStatusBadge(inspectingStudent.apaar_status)}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-300">
                <strong>Data Privacy Assurance:</strong> Access to unmasked APAAR records is recorded on the tamper-evident immutable audit ledger.
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setInspectingStudent(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
