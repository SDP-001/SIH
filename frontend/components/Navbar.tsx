"use client";

import React, { useState } from "react";
import { UserSession, clearStoredSession, api } from "@/lib/api";
import { 
  ShieldCheck, User, LogOut, RefreshCw, CheckCircle2, 
  Building2, GraduationCap, AlertTriangle, Search, ChevronDown,
  Layers, Users, ShieldAlert, Cpu, Sparkles
} from "lucide-react";

import { NotificationsPopover } from "@/components/NotificationsPopover";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

interface NavbarProps {
  currentRole: string;
  user: UserSession | null;
  onRoleSwitch: (email: string, pass: string) => void;
  onRefresh: () => void;
  onOpenSearch?: () => void;
  onNavigate?: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentRole, user, onRoleSwitch, onRefresh, onOpenSearch, onNavigate }) => {
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleSeedDemo = async () => {
    try {
      setSeeding(true);
      await api.seedDemo();
      setSeedSuccess(true);
      setTimeout(() => setSeedSuccess(false), 3000);
      onRefresh();
    } catch (err) {
      console.error("Seeding failed", err);
    } finally {
      setSeeding(false);
    }
  };

  const handleLogout = () => {
    clearStoredSession();
    window.location.reload();
  };

  const demoAccounts = [
    { label: "AICTE Regulator", role: "AICTE_ADMIN", email: "aicte.admin@aicte.gov.in", pass: "Aicte@12345", icon: ShieldCheck, color: "text-slate-300" },
    { label: "Super Admin", role: "SUPER_ADMIN", email: "superadmin@aicte.gov.in", pass: "Admin@12345", icon: ShieldAlert, color: "text-purple-400" },
    { label: "Inst Admin (Compliant)", role: "INSTITUTION_ADMIN", email: "principal@dits.ac.in", pass: "Inst@12345", icon: Building2, color: "text-emerald-400" },
    { label: "Inst Admin (Excess Intake)", role: "INSTITUTION_ADMIN", email: "dean@mcer.edu.in", pass: "Inst@12345", icon: AlertTriangle, color: "text-amber-400" },
    { label: "Dept Coordinator", role: "DEPT_COORDINATOR", email: "cse.hod@dits.ac.in", pass: "Coord@12345", icon: Layers, color: "text-teal-400" },
    { label: "Data Entry Operator", role: "DATA_ENTRY", email: "operator@dits.ac.in", pass: "Operator@12345", icon: Users, color: "text-cyan-400" },
    { label: "Student", role: "STUDENT", email: "rahul.sharma@student.dits.ac.in", pass: "Student@12345", icon: GraduationCap, color: "text-slate-300" },
    { label: "External Verifier", role: "EXTERNAL_VERIFIER", email: "verifier@tcs-background.com", pass: "Verifier@12345", icon: Search, color: "text-violet-400" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-xl text-white border-b border-slate-800 shadow-2xl">
      {/* Top Banner: Official Hackathon Notice & Non-negotiable Notice */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-1.5 text-xs text-white flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded font-mono font-bold tracking-wider uppercase text-[10px]">
            AICTE SIH 26263
          </span>
          <span className="font-semibold hidden sm:inline text-[11px] text-slate-300">
            Smart India Hackathon · Central Regulatory Intelligence Bureau
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="flex items-center gap-1.5 bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-semibold text-[10px]">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            Demonstration Mode Active (Synthetic Sandbox)
          </span>
          <button
            onClick={handleSeedDemo}
            disabled={seeding}
            className="flex items-center gap-1.5 hover:bg-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-700/80 transition text-cyan-300 text-[10px] font-semibold"
            title="Reset simulated institutions, students & alerts to pristine state"
          >
            <RefreshCw className={`w-3 h-3 ${seeding ? "animate-spin text-cyan-400" : ""}`} />
            {seedSuccess ? "Demo Sandbox Reset!" : "Reset Demo Data"}
          </button>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-10 px-2 rounded-xl bg-white/10 dark:bg-slate-900 flex items-center justify-center border border-slate-700 shadow-xs shrink-0">
            <img
              src="/apaar-logo.png"
              alt="Ministry of Education — APAAR"
              className="h-7 w-auto object-contain rounded"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                APAAR-Vault
                <span className="text-[9px] font-bold bg-cyan-500/15 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/30">
                  PS 26263
                </span>
              </h1>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block font-medium">
              One Academic Identity · Verified Records · AICTE Regulatory Oversight
            </p>
          </div>
        </div>

        {/* 7-Role Switcher Bar */}
        <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs overflow-x-auto shadow-inner">
          <span className="text-[10px] font-bold text-slate-400 uppercase px-2">Role:</span>
          
          <button
            onClick={() => onRoleSwitch("aicte.admin@aicte.gov.in", "Aicte@12345")}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 ${
              currentRole === "AICTE_ADMIN"
                ? "bg-slate-800 text-white shadow-sm ring-1 ring-slate-600"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-300" />
            AICTE
          </button>

          <button
            onClick={() => onRoleSwitch("principal@dits.ac.in", "Inst@12345")}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 ${
              currentRole === "INSTITUTION_ADMIN" && user?.email === "principal@dits.ac.in"
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400/40"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-emerald-300" />
            Inst (DITS)
          </button>

          <button
            onClick={() => onRoleSwitch("dean@mcer.edu.in", "Inst@12345")}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 ${
              currentRole === "INSTITUTION_ADMIN" && user?.email === "dean@mcer.edu.in"
                ? "bg-gradient-to-r from-amber-600 to-rose-600 text-white shadow-md shadow-amber-600/30 ring-1 ring-amber-400/40"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
            title="Maharashtra College of Engineering & Research (has 14 excess seats demo)"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
            Inst (MCER)
          </button>

          <button
            onClick={() => onRoleSwitch("cse.hod@dits.ac.in", "Coord@12345")}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 ${
              currentRole === "DEPT_COORDINATOR"
                ? "bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md shadow-teal-600/30 ring-1 ring-teal-400/40"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-teal-300" />
            Dept Coord
          </button>

          <button
            onClick={() => onRoleSwitch("rahul.sharma@student.dits.ac.in", "Student@12345")}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 ${
              currentRole === "STUDENT"
                ? "bg-slate-800 text-white shadow-sm ring-1 ring-slate-600"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-slate-200" />
            Student
          </button>

          <button
            onClick={() => onRoleSwitch("verifier@tcs-background.com", "Verifier@12345")}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 ${
              currentRole === "EXTERNAL_VERIFIER"
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-600/30 ring-1 ring-purple-400/40"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Search className="w-3.5 h-3.5 text-purple-300" />
            Verifier
          </button>

          {/* More Roles Dropdown (Super Admin, Operator) */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="px-2 py-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="More roles"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl py-2 z-50 text-xs backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Select Demo Identity
                </div>
                {demoAccounts.map((acc, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      onRoleSwitch(acc.email, acc.pass);
                      setDropdownOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-800/80 flex items-center justify-between text-slate-300 hover:text-white transition"
                  >
                    <span className="flex items-center gap-2">
                      <acc.icon className={`w-3.5 h-3.5 ${acc.color}`} />
                      <span className="font-medium">{acc.label}</span>
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono">{acc.role}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions: Search & Notifications */}
        <div className="flex items-center gap-2.5">
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-white transition shadow-sm"
              title="Global search (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden md:inline text-[11px] font-medium">Search Records...</span>
              <kbd className="hidden lg:inline text-[9px] font-mono bg-slate-950 border border-slate-700 px-1.5 py-0.2 rounded text-slate-400">Ctrl K</kbd>
            </button>
          )}

          {onNavigate && (
            <NotificationsPopover onNavigate={onNavigate} />
          )}

          <LanguageSwitcher variant="compact" />

          {/* User Info & Logout */}
          <div className="text-right hidden sm:block pl-2 border-l border-slate-800">
            <div className="text-xs font-bold text-white truncate max-w-[170px]">
              {user?.full_name || "Guest Officer"}
            </div>
            <div className="text-[10px] text-slate-400 font-medium">
              {user?.institution_name || currentRole}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition border border-transparent hover:border-slate-700"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
