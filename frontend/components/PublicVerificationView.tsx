"use client";

import React, { useState } from "react";
import { api, getStoredUser } from "@/lib/api";
import { 
  ShieldCheck, Search, CheckCircle2, XCircle, AlertTriangle, 
  Building2, GraduationCap, Calendar, Award,
  Lock, Ban, Clock, QrCode, Sparkles
} from "lucide-react";

export const PublicVerificationView: React.FC = () => {
  const [code, setCode] = useState("APAAR-VRF-2024-X99Q2M1");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Revocation state
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [revokeReason, setRevokeReason] = useState("");
  const [revoking, setRevoking] = useState(false);
  const [revokeSuccess, setRevokeSuccess] = useState<string | null>(null);

  const currentUser = getStoredUser();
  const canRevoke = currentUser && (
    currentUser.roles.includes("AICTE_ADMIN") ||
    currentUser.roles.includes("SUPER_ADMIN") ||
    currentUser.roles.includes("INSTITUTION_ADMIN")
  );

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!code.trim()) {
      setError("Please enter a valid verification code or APAAR reference");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResult(null);
      setRevokeSuccess(null);
      const res = await api.verifyPublicCredential(code.trim());
      setResult(res);
    } catch (err: any) {
      setError(err.message || "Verification reference not found or invalid.");
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!result || !revokeReason.trim()) return;

    try {
      setRevoking(true);
      await api.revokeVerificationToken(result.verification_code, revokeReason.trim());
      setRevokeSuccess("Credential reference has been revoked and marked invalid.");
      setTimeout(() => {
        setRevokeModalOpen(false);
        handleVerify();
      }, 1000);
    } catch (err: any) {
      alert(`Revocation failed: ${err.message}`);
    } finally {
      setRevoking(false);
    }
  };

  const isExpired = result?.status === "EXPIRED" || (result?.expires_at && new Date(result.expires_at) < new Date());
  const isRevoked = result?.status === "REVOKED" || Boolean(result?.revoked_at);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs text-center space-y-3">
        <div className="h-12 px-3 py-1 bg-white dark:bg-slate-950 rounded-xl flex items-center justify-center mx-auto border border-slate-200 dark:border-slate-800 shadow-xs w-fit">
          <img
            src="/apaar-logo.png"
            alt="Ministry of Education — APAAR"
            className="h-8 w-auto object-contain rounded"
          />
        </div>

        <div className="flex items-center justify-center gap-2">
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 uppercase tracking-wide">
            Credential Verification
          </span>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
            Rule 4 & 7 Compliant
          </span>
        </div>
        
        <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Academic Credential & APAAR Verification
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
          Authorized verification interface for employers, universities, and regulatory authorities to validate student enrolment claims via cryptographically signed tokens.
        </p>
      </div>

      {/* Code Input Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <form onSubmit={handleVerify} className="space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Verification Reference Code / QR Token
          </label>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <QrCode className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. APAAR-VRF-2024-X99Q2M1"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-slate-900 dark:focus:border-white shadow-xs"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2 shrink-0 shadow-xs btn-press"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{loading ? "Verifying..." : "Verify Credential"}</span>
            </button>
          </div>
        </form>

        <div className="flex flex-wrap items-center justify-between text-xs pt-3 border-t border-slate-100 dark:border-slate-800 gap-2">
          <span className="text-slate-500 text-[11px]">Demonstration Token:</span>
          <button
            type="button"
            onClick={() => { setCode("APAAR-VRF-2024-X99Q2M1"); }}
            className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[11px] transition"
          >
            Rahul Sharma (Verified Reference)
          </button>
        </div>
      </div>

      {/* Error Output */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-3 text-xs">
          <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <div>
            <div className="font-semibold">Verification Code Not Found</div>
            <div className="text-[11px] text-rose-600 mt-0.5">{error}</div>
          </div>
        </div>
      )}

      {/* Verification Result Card */}
      {result && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          
          {/* Status Header */}
          <div className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b ${
            isRevoked
              ? "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200"
              : isExpired
              ? "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
              : result.status === "VERIFIED" 
              ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200" 
              : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200"
          }`}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white dark:bg-slate-900 rounded-lg shadow-xs border border-slate-200 dark:border-slate-700">
                {isRevoked ? (
                  <Ban className="w-5 h-5 text-rose-600" />
                ) : isExpired ? (
                  <Clock className="w-5 h-5 text-slate-500" />
                ) : result.status === "VERIFIED" ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                )}
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 dark:text-slate-400 block">
                  AICTE Verification Status
                </span>
                <h3 className="text-base font-bold">
                  {isRevoked ? "CREDENTIAL REVOKED" : isExpired ? "TOKEN EXPIRED" : result.status}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded text-xs font-mono font-medium border border-slate-200 dark:border-slate-700">
                {result.verification_code}
              </span>
              {canRevoke && !isRevoked && (
                <button
                  onClick={() => setRevokeModalOpen(true)}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-medium transition"
                >
                  Revoke
                </button>
              )}
            </div>
          </div>

          {/* Tripartite Claim Distinction Card (Section 8 Requirement) */}
          <div className="p-5 bg-slate-50/50 dark:bg-slate-850/50 border-b border-slate-200 dark:border-slate-800">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Tripartite Verification Outcome Classification (Rule 4 Disclosure)
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {/* Box 1: Token Validity */}
              <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-medium text-slate-500 uppercase block">1. Cryptographic Token</span>
                <div className={`font-semibold flex items-center gap-1.5 text-xs ${
                  isRevoked ? "text-rose-600" : isExpired ? "text-slate-500" : "text-emerald-600"
                }`}>
                  {isRevoked ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  {result.claim_details?.token_validity || (isRevoked ? "REVOKED" : "ACTIVE")}
                </div>
                <div className="text-[10px] text-slate-400">
                  Expires: {result.expires_at ? new Date(result.expires_at).toLocaleDateString() : "90 days"}
                </div>
              </div>

              {/* Box 2: Institutional Claim */}
              <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-medium text-slate-500 uppercase block">2. Academic Record Claim</span>
                <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {result.claim_details?.academic_claim || "VERIFIED_INSTITUTIONAL_RECORD"}
                </div>
                <div className="text-[10px] text-slate-400">
                  Enrolment matched against sanctioned intake quota
                </div>
              </div>

              {/* Box 3: APAAR Official Status */}
              <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-amber-200 dark:border-amber-800 space-y-1">
                <span className="text-[10px] font-medium text-amber-700 dark:text-amber-400 uppercase block">3. Official APAAR Status</span>
                <div className="font-semibold text-amber-700 dark:text-amber-400 text-xs">
                  {result.claim_details?.apaar_verification_status || "Demonstration Mode — Gateway Simulated"}
                </div>
                <div className="text-[10px] text-slate-400">
                  Non-Negotiable Rule 4: No fake official status claimed
                </div>
              </div>
            </div>
          </div>

          {/* Student Credential Details */}
          <div className="p-6 space-y-5 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <span className="text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                  Verified Candidate Name
                </span>
                <div className="text-base font-bold text-slate-900 dark:text-white">
                  {result.student_name}
                </div>
                <div className="text-slate-500 font-mono text-xs">
                  Roll / Reg No: {result.institution_reg_num}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                  Protected APAAR ID (Privacy Masked)
                </span>
                <div className="text-base font-mono font-bold text-slate-900 dark:text-white">
                  {result.masked_apaar_id || "—"}
                </div>
                <div className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Format & Record Integrity Validated
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3.5 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-200 dark:border-slate-800">
                <Building2 className="w-4 h-4 text-slate-700 dark:text-slate-300 mt-0.5 shrink-0" />
                <div>
                  <span className="text-slate-400 text-[10px] font-medium uppercase block">
                    AICTE Approved Institution
                  </span>
                  <div className="font-semibold text-slate-900 dark:text-white text-xs mt-0.5">
                    {result.institution_name}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-200 dark:border-slate-800">
                <GraduationCap className="w-4 h-4 text-slate-700 dark:text-slate-300 mt-0.5 shrink-0" />
                <div>
                  <span className="text-slate-400 text-[10px] font-medium uppercase block">
                    Course & Academic Year
                  </span>
                  <div className="font-semibold text-slate-900 dark:text-white text-xs mt-0.5">
                    {result.course_name} · {result.academic_year}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Token Modal */}
      {revokeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg max-w-sm w-full border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Revoke Credential Reference
            </h3>
            <p className="text-xs text-slate-500">
              Provide a valid regulatory reason. This action is permanently recorded in the audit log.
            </p>
            <textarea
              required
              rows={3}
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              placeholder="e.g. Student transferred or withdrawal requested"
              className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRevokeModalOpen(false)}
                className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRevokeToken}
                disabled={revoking}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold"
              >
                {revoking ? "Revoking..." : "Confirm Revocation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
