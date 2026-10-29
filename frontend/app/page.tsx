"use client";

import React, { useEffect, useState } from "react";
import { api, getStoredUser, clearStoredSession, getStoredToken, isTokenExpired, UserSession } from "@/lib/api";
import { useTheme } from "@/lib/theme";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { AicteDashboardView } from "@/components/AicteDashboardView";
import { InstitutionDashboardView } from "@/components/InstitutionDashboardView";
import { IntakeMonitoringView } from "@/components/IntakeMonitoringView";
import { StudentDirectoryView } from "@/components/StudentDirectoryView";
import { BulkUploadView } from "@/components/BulkUploadView";
import { DuplicateInvestigationView } from "@/components/DuplicateInvestigationView";
import { PublicVerificationView } from "@/components/PublicVerificationView";
import { StudentPortalView } from "@/components/StudentPortalView";
import { DataQualityView } from "@/components/DataQualityView";
import { RegulatoryReportsView } from "@/components/RegulatoryReportsView";
import { AuditLogView } from "@/components/AuditLogView";
import { CorrectionRequestsView } from "@/components/CorrectionRequestsView";
import { SettingsAdapterConfigView } from "@/components/SettingsAdapterConfigView";
import { AicteAssistantView } from "@/components/AicteAssistantView";
import { InstitutionDirectoryView } from "@/components/InstitutionDirectoryView";
import { UserManagementView } from "@/components/UserManagementView";
import { NotificationsView } from "@/components/NotificationsView";
import { CommandPalette } from "@/components/CommandPalette";
import { NotificationsPopover } from "@/components/NotificationsPopover";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useI18n } from "@/lib/i18n";
import { 
  LayoutDashboard, Users, UploadCloud, AlertTriangle, 
  ShieldCheck, TrendingUp, GraduationCap, Building2, Search,
  Award, FileSpreadsheet, ScrollText, ClipboardList,
  Settings, PanelLeftClose, PanelLeftOpen, ChevronDown, ChevronRight,
  RefreshCw, LogOut, Layers, ShieldAlert, CheckCircle2,
  Menu, X, Sparkles, UserCheck, Bell, Zap, Check, CheckSquare,
  Lock, ArrowRight, Shield, Globe
} from "lucide-react";

export default function Home() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [loadingRole, setLoadingRole] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(3);

  const { theme } = useTheme();
  const { t, currentLanguage } = useI18n();

  // Initialize session: default to AICTE Admin for national regulator view
  useEffect(() => {
    const stored = getStoredUser();
    const token = getStoredToken();
    if (stored && token && !isTokenExpired(token)) {
      setUser(stored);
    } else {
      clearStoredSession();
      handleRoleSwitch("aicte.admin@aicte.gov.in", "Aicte@12345");
    }

    const handleSessionRefreshed = (e: Event) => {
      const customEvent = e as CustomEvent<UserSession>;
      if (customEvent.detail) {
        setUser(customEvent.detail);
      }
    };

    const handleSessionExpired = () => {
      clearStoredSession();
      handleRoleSwitch("aicte.admin@aicte.gov.in", "Aicte@12345");
    };

    window.addEventListener("session-refreshed", handleSessionRefreshed);
    window.addEventListener("session-expired", handleSessionExpired);

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("session-refreshed", handleSessionRefreshed);
      window.removeEventListener("session-expired", handleSessionExpired);
    };
  }, []);

  const handleRoleSwitch = async (email: string, pass: string) => {
    try {
      setLoadingRole(true);
      setIsProfileDropdownOpen(false);
      setIsMobileMenuOpen(false);
      const session = await api.login(email, pass);
      setUser(session);
      // Adjust default tab based on role
      if (session.roles.includes("STUDENT")) {
        setActiveTab("student_portal");
      } else if (session.roles.includes("EXTERNAL_VERIFIER")) {
        setActiveTab("verify");
      } else {
        setActiveTab("overview");
      }
      setRefreshKey((prev) => prev + 1);
    } catch (err: any) {
      console.error("Failed to switch role", err);
    } finally {
      setLoadingRole(false);
    }
  };

  const handleSeedDemo = async () => {
    try {
      setSeeding(true);
      await api.seedDemo();
      setSeedSuccess(true);
      setTimeout(() => setSeedSuccess(false), 3000);
      setRefreshKey((prev) => prev + 1);
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

  const primaryRole = user?.roles?.[0] || "AICTE_ADMIN";
  const isAicteAdmin = primaryRole === "AICTE_ADMIN" || primaryRole === "SUPER_ADMIN";
  const isStudent = primaryRole === "STUDENT";
  const isVerifier = primaryRole === "EXTERNAL_VERIFIER";

  const demoAccounts = [
    { label: "Administrator", role: "AICTE_ADMIN", name: "Dr. Priya Sharma", email: "aicte.admin@aicte.gov.in", pass: "Aicte@12345", icon: ShieldCheck, desc: "National oversight, user & duplicate triage" },
    { label: "Super Admin", role: "SUPER_ADMIN", name: "System Administrator", email: "superadmin@aicte.gov.in", pass: "Admin@12345", icon: ShieldAlert, desc: "Global admin & immutable audit ledger" },
    { label: "College Principal", role: "INSTITUTION_ADMIN", name: "Dr. Arvind Mehta", email: "principal@dits.ac.in", pass: "Inst@12345", icon: Building2, desc: "Compliant institution profile (DITS Delhi)" },
    { label: "College Principal (MCER)", role: "INSTITUTION_ADMIN", name: "Dr. Rajesh Kulkarni", email: "dean@mcer.edu.in", pass: "Inst@12345", icon: AlertTriangle, desc: "+14 excess seats scenario (MCER Pune)" },
    { label: "Faculty / Coord", role: "DEPT_COORDINATOR", name: "Prof. Sunita Rao", email: "cse.hod@dits.ac.in", pass: "Coord@12345", icon: Layers, desc: "Department student register validation" },
    { label: "Data Entry Operator", role: "DATA_ENTRY", name: "Amit Verma", email: "operator@dits.ac.in", pass: "Operator@12345", icon: Users, desc: "Bulk spreadsheet import wizard" },
    { label: "Student", role: "STUDENT", name: "Rahul Sharma", email: "rahul.sharma@student.dits.ac.in", pass: "Student@12345", icon: GraduationCap, desc: "Academic credentials & QR verification" },
    { label: "External Verifier", role: "EXTERNAL_VERIFIER", name: "TCS Background Desk", email: "verifier@tcs-background.com", pass: "Verifier@12345", icon: Search, desc: "Third-party background verification" },
  ];

  const currentAccount = demoAccounts.find(a => a.email === user?.email) || demoAccounts[0];

  // Exactly matching the 13 items from Section 3 of the prompt:
  // 1. Dashboard, 2. Institutions, 3. Student Records, 4. Enrolment & Intake,
  // 5. Data Validation, 6. Duplicate Investigation, 7. APAAR Verification,
  // 8. Bulk Data Import, 9. Reports & Analytics, 10. Notifications,
  // 11. User Management, 12. Audit Logs, 13. Settings
  const sidebarNavItems = [
    { id: "overview", label: "Dashboard", icon: LayoutDashboard, show: !isStudent && !isVerifier },
    { id: "institutions", label: "Institutions", icon: Building2, show: isAicteAdmin },
    { id: "students", label: "Student Records", icon: Users, show: !isStudent && !isVerifier },
    { id: "intake", label: "Enrolment & Intake", icon: TrendingUp, show: !isStudent && !isVerifier },
    { id: "data_quality", label: "Data Validation", icon: Award, show: !isStudent && !isVerifier },
    { id: "duplicates", label: "Duplicate Investigation", icon: AlertTriangle, show: !isStudent && !isVerifier },
    { id: "verify", label: "APAAR Verification", icon: ShieldCheck, show: true },
    { id: "upload", label: "Bulk Data Import", icon: UploadCloud, show: !isAicteAdmin && !isStudent && !isVerifier },
    { id: "reports", label: "Reports & Analytics", icon: FileSpreadsheet, show: !isStudent && !isVerifier },
    { id: "notifications", label: "Notifications", icon: Bell, show: true, badge: "3", badgeColor: "bg-rose-500 text-white" },
    { id: "users", label: "User Management", icon: UserCheck, show: isAicteAdmin || primaryRole === "INSTITUTION_ADMIN" },
    { id: "audit", label: "Audit Logs", icon: ScrollText, show: !isStudent && !isVerifier },
    { id: "settings", label: "Settings", icon: Settings, show: !isStudent && !isVerifier },
    
    // Auxiliary specialized views
    { id: "assistant", label: "AI Officer Assistant", icon: Sparkles, show: isAicteAdmin, badge: "AI" },
    { id: "corrections", label: "Correction Requests", icon: ClipboardList, show: !isStudent && !isVerifier },
    { id: "student_portal", label: "Academic Credentials", icon: GraduationCap, show: isStudent },
  ];

  const visibleNavItems = sidebarNavItems.filter(i => i.show);
  const activeNavItem = visibleNavItems.find(i => i.id === activeTab) || visibleNavItems[0];

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col font-sans antialiased bg-white dark:bg-slate-950 text-[#111827] dark:text-slate-100 transition-colors duration-150">
      
      {/* Global Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={setActiveTab}
      />

      {/* TOP HEADER SHOWCASE BANNER (HIDDEN on mobile devices, shown on desktop) */}
      <header className="hidden md:block bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 z-40 px-4 md:px-6 py-2.5 transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Left Brand block with official APAAR logo */}
          <div className="flex items-center gap-3">
            <div className="h-11 px-2.5 py-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-center shrink-0">
              <img
                src="/apaar-logo.png"
                alt="Ministry of Education — APAAR"
                className="h-8 w-auto object-contain rounded"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base md:text-lg tracking-tight text-slate-900 dark:text-white">
                  APAAR-Vault
                </span>
                <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-300 dark:border-slate-700">
                  AICTE Platform
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium line-clamp-1">
                APAAR ID-Based Student Data Management and Verification Platform for AICTE-Approved Institutions
              </p>
            </div>
          </div>

          {/* Center Vision Text (Hidden on small mobile screens) */}
          <div className="hidden xl:block max-w-xl text-center">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Smarter Student Data. Safer Verification.
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
              APAAR-Vault helps AICTE-approved institutions securely manage, validate and verify student data using APAAR ID.
            </p>
          </div>

          {/* Right 4 Circular Feature Badges matching reference */}
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto pb-1 lg:pb-0 shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-semibold hidden sm:inline">Secure Data</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-semibold hidden sm:inline">AICTE Compliant</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-semibold hidden sm:inline">Efficient Verification</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="w-7 h-7 rounded-full bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center shrink-0">
                <GraduationCap className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-semibold hidden sm:inline">Better Education</span>
            </div>
          </div>

        </div>
      </header>

      {/* MOBILE TOP BAR - The ONLY header displayed on mobile devices */}
      <div className="md:hidden flex items-center justify-between px-3 py-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 z-30">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
          <div className="flex items-center gap-1.5 min-w-0">
            <img
              src="/apaar-logo.png"
              alt="APAAR"
              className="h-6 w-auto object-contain rounded bg-white dark:bg-slate-900 px-1 py-0.5 border border-slate-200 dark:border-slate-800"
            />
            <span className="font-extrabold text-xs text-slate-900 dark:text-white shrink-0">
              APAAR
            </span>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <span className="font-bold text-xs text-slate-700 dark:text-slate-200 truncate max-w-[95px]">
              {t(`nav.${activeNavItem.id}`, activeNavItem.label)}
            </span>
          </div>
        </div>

        {/* Right side controls ordered: Language, Theme (system/white/dark), Notifications, Profile Avatar */}
        <div className="flex items-center gap-1 shrink-0">
          <LanguageSwitcher variant="minimal" />
          <ThemeSwitcher variant="compact" />
          <NotificationsPopover onNavigate={(t) => { setActiveTab(t); setIsMobileMenuOpen(false); }} />
          
          <div className="relative">
            <button
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="w-7 h-7 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-300 dark:border-slate-700 ml-0.5"
              aria-label="User profile persona"
            >
              {currentAccount.name[0]}
            </button>
            {isProfileDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsProfileDropdownOpen(false)}></div>
                <div className="absolute right-0 top-full mt-1.5 w-72 max-w-[calc(100vw-24px)] bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 animate-fade-in">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">{currentAccount.name}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</div>
                  </div>

                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Switch Role Persona
                  </div>

                  <div className="max-h-60 overflow-y-auto px-1 space-y-0.5">
                    {demoAccounts.map((acc, i) => {
                      const Icon = acc.icon;
                      const isSelected = user?.email === acc.email;
                      return (
                        <button
                          key={i}
                          onClick={() => handleRoleSwitch(acc.email, acc.pass)}
                          className={`w-full flex items-start gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs transition group ${
                            isSelected
                              ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                              : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white"
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="truncate">{acc.label}</span>
                              {isSelected && <CheckCircle2 className="w-3 h-3 text-slate-900 dark:text-white shrink-0" />}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">{acc.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="p-2 border-t border-slate-100 dark:border-slate-800 mt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{t("btn.logout", "Sign out")}</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Workspace: Sidebar + Content */}
      <div className="flex-1 overflow-hidden flex flex-row min-h-0">
        
        {/* Mobile Backdrop */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* LEFT SIDEBAR NAVIGATION matching the 13 items from reference */}
        <aside
          className={`
            fixed md:static inset-y-0 left-0 z-40
            ${isSidebarCollapsed ? "w-18" : "w-64"}
            ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
            h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800
            flex flex-col shrink-0 transition-all duration-200 ease-in-out shadow-xs
          `}
        >
          {/* Sidebar Top / Title */}
          <div className="h-14 px-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-lg bg-white dark:bg-slate-950 flex items-center justify-center p-0.5 border border-slate-200 dark:border-slate-700 shrink-0 shadow-xs overflow-hidden">
                <img
                  src="/apaar-logo.png"
                  alt="APAAR"
                  className="w-full h-full object-cover rounded"
                />
              </div>
              {!isSidebarCollapsed && (
                <div className="min-w-0">
                  <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                    APAAR-Vault
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    Enterprise Portal
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition hidden md:block shrink-0"
              title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isSidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
          </div>

          {/* 13 Sidebar Navigation Items with outline icons & active indicator */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            {!isSidebarCollapsed && (
              <div className="px-2 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Sidebar Navigation
              </div>
            )}

            <nav className="space-y-0.5">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    title={isSidebarCollapsed ? t(`nav.${item.id}`, item.label) : undefined}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors text-left btn-press ${
                      isActive
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-white font-bold border-l-3 border-slate-900 dark:border-white shadow-2xs"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white font-medium"
                    }`}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-slate-900 dark:text-white" : "text-slate-400"}`} />
                      {!isSidebarCollapsed && <span className="truncate">{t(`nav.${item.id}`, item.label)}</span>}
                    </span>

                    {!isSidebarCollapsed && item.badge && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold shrink-0 ${
                        item.badgeColor || (isActive ? "bg-slate-200 text-slate-900" : "bg-slate-100 text-slate-500")
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer: Reset Demo & User quick bar */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0 space-y-2">
            {!isSidebarCollapsed && (
              <button
                onClick={handleSeedDemo}
                disabled={seeding}
                className="w-full flex items-center justify-center gap-2 py-1.5 px-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 transition shadow-xs"
                title="Reset synthetic database to demonstration state"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-slate-700 dark:text-slate-300 ${seeding ? "animate-spin" : ""}`} />
                <span>{seedSuccess ? "Data Reset Complete!" : t("btn.reset", "Reset Demo Data")}</span>
              </button>
            )}

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-300 dark:border-slate-700">
                  {currentAccount.name[0]}
                </div>
                {!isSidebarCollapsed && (
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {currentAccount.name}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {currentAccount.label}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleLogout}
                className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition shrink-0"
                title={t("btn.logout", "Sign out")}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 h-full overflow-hidden flex flex-col min-w-0">
          
          {/* COMPACT TOP NAVIGATION BAR (Desktop only, HIDDEN on mobile devices) */}
          <header className="hidden md:flex h-14 px-4 md:px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 items-center justify-between shrink-0 z-30 gap-4 shadow-2xs">
            
            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 min-w-0 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-medium text-slate-500 hidden sm:inline shrink-0">APAAR-Vault</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 hidden sm:inline shrink-0" />
              <span className="font-semibold text-slate-900 dark:text-white truncate">
                {t(`nav.${activeNavItem.id}`, activeNavItem.label)}
              </span>
            </div>

            {/* Central Search field matching reference: "Search students, institutions, APAAR ID..." */}
            <div className="relative flex-1 max-w-md hidden md:block">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t("search.placeholder", "Search students, institutions, APAAR ID...")}
                onClick={() => setIsCommandPaletteOpen(true)}
                readOnly
                className="w-full pl-9 pr-12 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-slate-900 dark:focus:border-white cursor-pointer shadow-2xs"
              />
              <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded font-mono text-slate-400 border border-slate-200 dark:border-slate-700">
                ⌘K
              </kbd>
            </div>

            {/* Right Header Controls: Notification, Language, Theme, User Avatar */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              
              {/* Notification Bell with unread count */}
              <NotificationsPopover onNavigate={(t) => setActiveTab(t)} />

              {/* Language Switcher Dropdown */}
              <LanguageSwitcher variant="compact" />

              {/* Theme Toggle */}
              <ThemeSwitcher variant="compact" />

              <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-0.5"></div>

              {/* Profile Dropdown & Persona Switcher */}
              <div className="relative">
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 hover:text-slate-950 dark:hover:text-white transition text-xs shadow-2xs"
                >
                  <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {currentAccount.name[0]}
                  </div>
                  <div className="hidden sm:block text-left min-w-0 max-w-[130px]">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {currentAccount.name}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {currentAccount.label}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>

                {isProfileDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsProfileDropdownOpen(false)}></div>
                    <div className="absolute right-0 top-full mt-1.5 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 animate-fade-in">
                      <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                        <div className="text-xs font-bold text-slate-900 dark:text-white">{currentAccount.name}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</div>
                      </div>

                      <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Switch Role Persona
                      </div>

                      <div className="max-h-60 overflow-y-auto px-1 space-y-0.5">
                        {demoAccounts.map((acc, i) => {
                          const Icon = acc.icon;
                          const isSelected = user?.email === acc.email;
                          return (
                            <button
                              key={i}
                              onClick={() => handleRoleSwitch(acc.email, acc.pass)}
                              className={`w-full flex items-start gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs transition group ${
                                isSelected
                                  ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white"
                              }`}
                            >
                              <Icon className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="truncate">{acc.label}</span>
                                  {isSelected && <CheckCircle2 className="w-3 h-3 text-slate-900 dark:text-white shrink-0" />}
                                </div>
                                <div className="text-[10px] text-slate-400 truncate">{acc.desc}</div>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-1 pt-1 border-t border-slate-100 dark:border-slate-800 px-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition font-medium"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          {/* VIEWPORT SCROLLABLE CONTENT */}
          <main className="flex-1 overflow-y-auto w-full p-4 md:p-6 lg:p-8 space-y-6">
            {loadingRole ? (
              <div className="h-full flex items-center justify-center">
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 text-center text-slate-500 space-y-3 max-w-sm w-full">
                  <div className="w-7 h-7 border-2 border-slate-900 dark:border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Switching persona...</p>
                  <p className="text-xs text-slate-400">Loading authorized role permissions</p>
                </div>
              </div>
            ) : (
              <div key={`${activeTab}-${refreshKey}`} className="animate-view-enter w-full max-w-none">
                {activeTab === "overview" && (
                  isAicteAdmin ? (
                    <AicteDashboardView onSelectTab={setActiveTab} />
                  ) : (
                    user && <InstitutionDashboardView user={user} onSelectTab={setActiveTab} />
                  )
                )}

                {activeTab === "institutions" && user && (
                  <InstitutionDirectoryView user={user} onSelectInstitution={() => setActiveTab("intake")} />
                )}

                {activeTab === "students" && user && (
                  <StudentDirectoryView user={user} />
                )}

                {activeTab === "intake" && user && (
                  <IntakeMonitoringView user={user} />
                )}

                {activeTab === "data_quality" && user && (
                  <DataQualityView user={user} />
                )}

                {activeTab === "duplicates" && (
                  <DuplicateInvestigationView />
                )}

                {activeTab === "verify" && (
                  <PublicVerificationView />
                )}

                {activeTab === "upload" && user && (
                  <BulkUploadView user={user} onUploadSuccess={() => setRefreshKey((k) => k + 1)} />
                )}

                {activeTab === "reports" && user && (
                  <RegulatoryReportsView user={user} />
                )}

                {activeTab === "notifications" && (
                  <NotificationsView onNavigate={setActiveTab} />
                )}

                {activeTab === "users" && user && (
                  <UserManagementView user={user} />
                )}

                {activeTab === "audit" && user && (
                  <AuditLogView user={user} />
                )}

                {activeTab === "settings" && user && (
                  <SettingsAdapterConfigView user={user} />
                )}

                {activeTab === "assistant" && user && (
                  <AicteAssistantView user={user} onNavigateTab={setActiveTab} />
                )}

                {activeTab === "corrections" && user && (
                  <CorrectionRequestsView user={user} />
                )}

                {activeTab === "student_portal" && user && (
                  <StudentPortalView user={user} />
                )}
              </div>
            )}
          </main>
        </div>

      </div>

    </div>
  );
}
