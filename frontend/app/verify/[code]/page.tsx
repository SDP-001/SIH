"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { 
  ShieldCheck, CheckCircle2, AlertTriangle, Building2, 
  GraduationCap, ArrowLeft, Ban, Clock, XCircle
} from "lucide-react";
import Link from "next/link";

function VerifyContent() {
  const params = useParams();
  const code = params?.code as string;
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (code) {
      fetchVerification(code);
    }
  }, [code]);

  const fetchVerification = async (c: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.verifyPublicCredential(c);
      setResult(res);
    } catch (err: any) {
      setError(err.message || "Invalid or expired verification token.");
    } finally {
      setLoading(false);
    }
  };

  const isExpired = result?.status === "EXPIRED" || (result?.expires_at && new Date(result.expires_at) < new Date());
  const isRevoked = result?.status === "REVOKED" || Boolean(result?.revoked_at);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3 pb-1 border-b border-slate-200">
        <Link 
          href="/" 
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-900 hover:text-slate-700 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to APAAR-Vault Portal
        </Link>
        <img
          src="/apaar-logo.png"
          alt="Ministry of Education — APAAR"
          className="h-7 w-auto object-contain rounded"
        />
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3 shadow-sm">
          <div className="w-8 h-8 border-3 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold text-slate-600">
            Validating cryptographic academic credential token...
          </p>
        </div>
      ) : error ? (
        <div className="bg-white p-8 rounded-2xl border border-rose-200 text-center space-y-3 shadow-sm">
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Verification Failed</h2>
          <p className="text-xs text-rose-600 font-medium">{error}</p>
        </div>
      ) : result && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
          {/* Status Header */}
          <div className={`p-6 flex items-center justify-between ${
            isRevoked
              ? "bg-gradient-to-r from-rose-700 to-red-800 text-white"
              : isExpired
              ? "bg-gradient-to-r from-slate-600 to-slate-700 text-white"
              : result.status === "VERIFIED"
              ? "bg-gradient-to-r from-emerald-600 to-teal-700 text-white"
              : "bg-gradient-to-r from-amber-600 to-orange-700 text-white"
          }`}>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/20 rounded-xl">
                {isRevoked ? (
                  <Ban className="w-7 h-7 text-white" />
                ) : isExpired ? (
                  <Clock className="w-7 h-7 text-white" />
                ) : result.status === "VERIFIED" ? (
                  <CheckCircle2 className="w-7 h-7 text-white" />
                ) : (
                  <AlertTriangle className="w-7 h-7 text-white" />
                )}
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/80 block">
                  AICTE APAAR Academic Verification
                </span>
                <h1 className="text-xl font-extrabold tracking-tight">
                  Credential Status: {isRevoked ? "REVOKED" : isExpired ? "EXPIRED" : result.status}
                </h1>
              </div>
            </div>

            <div className="text-right">
              <span className="bg-black/20 text-white/90 px-3 py-1 rounded-full text-xs font-mono font-medium border border-white/20">
                {result.verification_code}
              </span>
            </div>
          </div>

          {/* Revoked Notice */}
          {isRevoked && (
            <div className="bg-rose-50 border-b border-rose-200 p-4 text-xs text-rose-800 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                This credential was officially revoked
              </div>
              <p className="text-[11px] text-rose-700">
                Reason: {result.revocation_reason || "Revoked by authorized regulatory authority."}
              </p>
            </div>
          )}

          {/* Tripartite Claim Distinction Card */}
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Tripartite Status Breakdown (Section 8 Requirement)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-[9px] font-bold text-slate-400 uppercase block">1. Token Validity</span>
                <div className={`font-bold text-[11px] ${isRevoked ? "text-rose-600" : isExpired ? "text-slate-600" : "text-emerald-700"}`}>
                  {result.claim_details?.token_validity || (isRevoked ? "REVOKED" : "ACTIVE")}
                </div>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-[9px] font-bold text-slate-400 uppercase block">2. Academic Record</span>
                <div className="font-bold text-slate-900 text-[11px]">
                  {result.claim_details?.academic_claim || "VERIFIED_RECORD"}
                </div>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-amber-200 bg-amber-50/30">
                <span className="text-[9px] font-bold text-amber-700 uppercase block">3. Official APAAR Status</span>
                <div className="font-bold text-amber-900 text-[10px] leading-tight">
                  Demonstration Mode — Official Not Connected
                </div>
              </div>
            </div>
          </div>

          {/* Credential Content */}
          <div className="p-6 space-y-6 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-100">
              <div>
                <span className="text-slate-400 uppercase text-[10px] font-bold block">
                  Verified Student Name
                </span>
                <div className="text-lg font-bold text-slate-900 mt-0.5">
                  {result.student_name}
                </div>
                <div className="text-slate-500 font-mono text-[11px] mt-0.5">
                  Registration No: {result.institution_reg_num}
                </div>
              </div>

              <div>
                <span className="text-slate-400 uppercase text-[10px] font-bold block">
                  Protected APAAR Identifier
                </span>
                <div className="font-mono text-base font-bold text-slate-900 mt-0.5">
                  {result.masked_apaar_id || "—"}
                </div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Format & Record Integrity Checked
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <Building2 className="w-5 h-5 text-slate-800 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase block">
                    Sanctioned Technical Institution
                  </span>
                  <div className="font-bold text-slate-900 mt-0.5">
                    {result.institution_name}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <GraduationCap className="w-5 h-5 text-slate-800 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase block">
                    Degree Program & Academic Cycle
                  </span>
                  <div className="font-bold text-slate-900 mt-0.5">
                    {result.course_name}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Admission Year: {result.admission_year} · AY {result.academic_year}
                  </div>
                </div>
              </div>
            </div>

            {/* Security Seal */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-4">
              <div>
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-slate-900" />
                  AICTE Tamper-Evident Verification Seal
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Verified on {new Date(result.verification_date).toLocaleString()}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Demonstration Mode — Simulated Academic Record for SIH 26263. Rule 7: Zero raw PII in QR code.
                </p>
              </div>

              {result.qr_code_base64 && (
                <img
                  src={`data:image/png;base64,${result.qr_code_base64}`}
                  alt="QR"
                  className="w-16 h-16 rounded border border-slate-300 shadow-xs shrink-0"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyCodePage() {
  return (
    <div className="min-h-screen bg-white py-12 px-4 font-sans">
      <Suspense fallback={
        <div className="p-12 text-center text-xs text-slate-500">
          Loading verification token...
        </div>
      }>
        <VerifyContent />
      </Suspense>
    </div>
  );
}
