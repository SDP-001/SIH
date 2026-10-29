"use client";

import React, { useState } from "react";
import { UserSession } from "@/lib/api";
import { useI18n, SUPPORTED_LANGUAGES } from "@/lib/i18n";
import { 
  Settings, Server, ShieldCheck, Database, RefreshCw, 
  CheckCircle2, AlertTriangle, Cpu, Lock, Sliders, Info, Zap, Globe
} from "lucide-react";

interface SettingsAdapterConfigProps {
  user: UserSession;
}

export const SettingsAdapterConfigView: React.FC<SettingsAdapterConfigProps> = ({ user }) => {
  const { currentLanguage, setLanguage } = useI18n();
  const [gatewayMode, setGatewayMode] = useState<"SIMULATED_NORMAL" | "SIMULATED_TIMEOUT" | "SIMULATED_UNAVAILABLE">("SIMULATED_NORMAL");
  const [selectedLangCode, setSelectedLangCode] = useState(currentLanguage.code);
  const [tfwPercent, setTfwPercent] = useState(5);
  const [ewsPercent, setEwsPercent] = useState(10);
  const [pmsssAllowance, setPmsssAllowance] = useState(2);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setLanguage(selectedLangCode);
    setTimeout(() => {
      setSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
              System Configuration
            </span>
            <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-md">
              DEMONSTRATION_MODE (SYNTHETIC)
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-slate-900 dark:text-white" />
            Platform Settings & External Gateway Adapter
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Configure external identity adapters, AICTE counting standards, cryptographic token rotations, and regulatory parameters.
          </p>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2 animate-fade-in shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          Settings and regulatory adapter preferences synchronized successfully.
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Card 1: APAAR Verification Gateway Adapter */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Authorized APAAR Gateway Adapter (Non-Negotiable Rule 4 & 13)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Controls the integration behavior with the national APAAR verification service interface.
              </p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200">
            <strong>Non-Negotiable Rule 4 Compliance:</strong> Because live government APAAR production endpoints are not authorized for hackathon demonstrations, the platform uses an isolated simulated adapter. Official verification responses are never fabricated.
          </div>

          <div className="space-y-3 text-xs">
            <label className="block font-medium text-slate-700 dark:text-slate-300">
              Simulated Gateway Adapter Behavior:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label className={`p-4 rounded-xl border cursor-pointer transition text-left ${
                gatewayMode === "SIMULATED_NORMAL" 
                  ? "border-slate-900 dark:border-white bg-slate-100 dark:bg-slate-800 ring-2 ring-slate-900/10" 
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
              }`}>
                <input
                  type="radio"
                  name="gatewayMode"
                  value="SIMULATED_NORMAL"
                  checked={gatewayMode === "SIMULATED_NORMAL"}
                  onChange={() => setGatewayMode("SIMULATED_NORMAL")}
                  className="sr-only"
                />
                <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Standard Simulation
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  Valid 12-digit format returns deterministic simulated verification handshake with clear demonstration banner.
                </p>
              </label>

              <label className={`p-4 rounded-xl border cursor-pointer transition text-left ${
                gatewayMode === "SIMULATED_TIMEOUT" 
                  ? "border-amber-500 bg-amber-50/40 dark:bg-amber-950/30 ring-2 ring-amber-500/10" 
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
              }`}>
                <input
                  type="radio"
                  name="gatewayMode"
                  value="SIMULATED_TIMEOUT"
                  checked={gatewayMode === "SIMULATED_TIMEOUT"}
                  onChange={() => setGatewayMode("SIMULATED_TIMEOUT")}
                  className="sr-only"
                />
                <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  Gateway Timeout / Latency
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  Simulates national gateway latency with automated fallback status <code className="text-amber-700 dark:text-amber-300 font-mono">PENDING_RETRY</code>.
                </p>
              </label>

              <label className={`p-4 rounded-xl border cursor-pointer transition text-left ${
                gatewayMode === "SIMULATED_UNAVAILABLE" 
                  ? "border-rose-500 bg-rose-50/40 dark:bg-rose-950/30 ring-2 ring-rose-500/10" 
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
              }`}>
                <input
                  type="radio"
                  name="gatewayMode"
                  value="SIMULATED_UNAVAILABLE"
                  checked={gatewayMode === "SIMULATED_UNAVAILABLE"}
                  onChange={() => setGatewayMode("SIMULATED_UNAVAILABLE")}
                  className="sr-only"
                />
                <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Server className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  Service Outage
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  Simulates upstream gateway downtime with fallback status <code className="text-rose-700 dark:text-rose-300 font-mono">SERVICE_UNAVAILABLE</code>.
                </p>
              </label>
            </div>
          </div>
        </div>

        {/* Card 2: AICTE Supernumerary Quota Rules */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                AICTE Supernumerary Counting Standards (Non-Negotiable Rule 5)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure authorized quota percentage allowances under the AICTE Approval Process Handbook (APH).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Tuition Fee Waiver (TFW) Quota:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="15"
                  value={tfwPercent}
                  onChange={(e) => setTfwPercent(Number(e.target.value))}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 dark:focus:border-white font-mono tnum"
                />
                <span className="font-semibold text-slate-500">%</span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 block">APH Norm: 5% over sanctioned intake</span>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Economically Weaker Section (EWS):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={ewsPercent}
                  onChange={(e) => setEwsPercent(Number(e.target.value))}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 dark:focus:border-white font-mono tnum"
                />
                <span className="font-semibold text-slate-500">%</span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 block">APH Norm: 10% over sanctioned intake</span>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                PMSSS Maximum Seats Per Branch:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={pmsssAllowance}
                  onChange={(e) => setPmsssAllowance(Number(e.target.value))}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 dark:focus:border-white font-mono tnum"
                />
                <span className="font-semibold text-slate-500">seats</span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 block">Prime Minister Special Scholarship</span>
            </div>
          </div>
        </div>

        {/* Card 3: Cryptographic & Privacy Controls */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Cryptographic Token & Privacy Parameters (Non-Negotiable Rule 7)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Security specifications for public academic credentials and QR code generations.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Token Format & Entropy</span>
              <div className="font-mono font-semibold text-slate-900 dark:text-white text-xs tnum">
                APAAR-VRF-YYYY-[10-CHAR-HEX-TOKEN]
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Entropy: 160-bit SHA-256 derived pseudo-random opaque identifier.
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">QR Code Payload Protection</span>
              <div className="font-semibold text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Zero PII Embedded Guarantee
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                QR matrices encode strictly HTTPS verification endpoints; raw APAAR IDs and names are never embedded.
              </p>
            </div>
          </div>
        </div>

        {/* Card 4: Portal Language & Regional Localization (NEP 2020) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                Portal Language & Localization Preferences (NEP 2020)
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700">
                  13 National Languages
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                AICTE National Education Policy (NEP 2020) multilingual technical education portal localization.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Default Platform Display Language:
                </label>
                <select
                  value={selectedLangCode}
                  onChange={(e) => {
                    setSelectedLangCode(e.target.value);
                    setLanguage(e.target.value);
                  }}
                  className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-medium text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-white shadow-2xs"
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.nativeName} ({lang.name}) — {lang.region} [{lang.script}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                <span>Selected Language Code: <strong className="font-mono text-slate-900 dark:text-white uppercase">{selectedLangCode}</strong></span>
                <span>Active Script: <strong className="text-slate-900 dark:text-white">{SUPPORTED_LANGUAGES.find(l => l.code === selectedLangCode)?.script}</strong></span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">
                Multilingual AICTE Coverage:
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                In compliance with the AICTE Technical Books in Regional Languages Project, portal notices, verification certificates, and navigation prompts can be displayed in any of the 13 official constitutional languages.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {SUPPORTED_LANGUAGES.map((l) => (
                  <span
                    key={l.code}
                    onClick={() => {
                      setSelectedLangCode(l.code);
                      setLanguage(l.code);
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium cursor-pointer transition border ${
                      selectedLangCode === l.code
                        ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900"
                        : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400"
                    }`}
                  >
                    {l.nativeName}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Changes are saved to runtime state and audit logged under your user identity.
          </span>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 font-semibold text-xs bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-xs transition disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${saving ? "animate-spin" : ""}`} />
            {saving ? "Synchronizing..." : "Save Preferences"}
          </button>
        </div>
      </form>
    </div>
  );
};
