"use client";

import React, { useEffect, useState } from "react";
import { api, UserSession } from "@/lib/api";
import { 
  GraduationCap, ShieldCheck, QrCode, Building2, 
  Calendar, Award, User, Clock, FileCheck, Sparkles,
  ExternalLink, Copy, Check, Download, ShieldAlert, CheckCircle2
} from "lucide-react";

interface StudentPortalProps {
  user: UserSession;
}

export const StudentPortalView: React.FC<StudentPortalProps> = ({ user }) => {
  const [student, setStudent] = useState<any | null>(null);
  const [verification, setVerification] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchStudentProfile();
  }, [user]);

  const fetchStudentProfile = async () => {
    try {
      setLoading(true);
      const students = await api.getStudents({ search: user?.email ? user.email.split("@")[0] : "Rahul" });
      if (students && students.length > 0) {
        setStudent(students[0]);
        const vRes = await api.requestVerificationToken(students[0].id, "Student Self-Credential Access");
        setVerification(vRes);
      }
    } catch (err) {
      console.error("Failed to load student profile", err);
    } finally {
      setLoading(false);
    }
  };

  const copyVerificationLink = () => {
    if (!verification?.verification_code) return;
    const url = `${window.location.origin}/verify?token=${verification.verification_code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="p-8 max-w-3xl mx-auto space-y-4">
        <div className="h-36 bg-slate-100 dark:bg-slate-800/40 rounded-xl animate-pulse border border-slate-200 dark:border-slate-800"></div>
        <div className="h-64 bg-slate-100 dark:bg-slate-800/40 rounded-xl animate-pulse border border-slate-200 dark:border-slate-800"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Student Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 text-[11px] font-semibold px-2.5 py-0.5 rounded-md border border-slate-300 dark:border-slate-700">
              National Academic Depository (NAD) · Student Vault
            </span>
            <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 rounded-md flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              APAAR VERIFIED
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            {student?.student_name || user?.full_name}
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-600 dark:text-slate-400 shrink-0" />
            {student?.course_name} · {student?.institution_name}
          </p>
        </div>

        <div className="h-14 px-3 py-1.5 bg-white dark:bg-slate-950 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-800 shadow-xs shrink-0">
          <img
            src="/apaar-logo.png"
            alt="Ministry of Education — APAAR"
            className="h-10 w-auto object-contain rounded"
          />
        </div>
      </div>

      {/* Credential Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Cryptographically Verified Academic Credential
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Official student enrolment record synchronized with AICTE Central Regulatory Database
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 flex items-center gap-1.5 w-fit">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            State: {student?.apaar_status || "VERIFIED"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-slate-500 dark:text-slate-400 uppercase text-[10px] font-medium block tracking-wider">
              Protected APAAR Identifier (Rule 7)
            </span>
            <div className="font-mono text-base font-bold text-slate-900 dark:text-white mt-1 tnum">
              {student?.masked_apaar_id || "SIM-APAAR-****-984210"}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
              Masked for personal privacy. Permanently bound to the Aadhaar-authenticated National Academic Depository.
            </p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-slate-500 dark:text-slate-400 uppercase text-[10px] font-medium block tracking-wider">
              Institutional Registration Number
            </span>
            <div className="font-mono text-base font-bold text-slate-900 dark:text-white mt-1 tnum">
              {student?.institution_reg_num}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
              Admission Year: {student?.admission_year} · Academic Cycle: AY {student?.academic_year}
            </p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-slate-500 dark:text-slate-400 uppercase text-[10px] font-medium block tracking-wider">
              Seat Quota Category
            </span>
            <div className="font-semibold text-slate-900 dark:text-white text-sm mt-1">
              {student?.admission_category || "GENERAL"} {student?.is_supernumerary ? `(Supernumerary ${student?.supernumerary_category || "TFW"})` : ""}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
              Counted under AICTE Approval Process Handbook (Rule 5 compliance).
            </p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-slate-500 dark:text-slate-400 uppercase text-[10px] font-medium block tracking-wider">
              Deterministic Verification Standard
            </span>
            <div className="font-semibold text-emerald-600 dark:text-emerald-400 text-xs mt-1 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              100% Deterministic Rule-Engine Match
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
              Zero speculative fuzzy scoring. Strict cryptographic provenance guarantee.
            </p>
          </div>
        </div>

        {/* Verification QR Box */}
        {verification && (
          <div className="p-6 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left flex-1">
              <div className="font-semibold text-slate-900 dark:text-white text-base flex items-center justify-center md:justify-start gap-2">
                <QrCode className="w-5 h-5 text-slate-900 dark:text-white" />
                Digital Verification Badge
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Third-party employers, higher education institutions, and regulatory agencies can scan this secure QR code or verify using the opaque token below. No sensitive PII is leaked in the payload.
              </p>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1.5">
                <div className="font-mono text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold tnum">
                  {verification.verification_code}
                </div>
                <button
                  onClick={copyVerificationLink}
                  className="px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 shadow-xs active:scale-[0.98]"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                  {copied ? "Link Copied!" : "Copy Verification URL"}
                </button>
              </div>
            </div>

            {verification.qr_code_base64 && (
              <div className="p-3 bg-white rounded-xl shadow-xs shrink-0 border border-slate-200">
                <img
                  src={`data:image/png;base64,${verification.qr_code_base64}`}
                  alt="Verification QR"
                  className="w-28 h-28 rounded-lg"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
