"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { 
  Building2, Users, AlertTriangle, ShieldCheck, 
  TrendingUp, FileSpreadsheet, Eye, ArrowUpRight,
  Sparkles, CheckCircle2, ArrowRight, Bot,
  BarChart3, RefreshCw, AlertCircle, Clock, Copy,
  Check, Shield, GraduationCap, ChevronRight,
  Layers, ExternalLink
} from "lucide-react";
import { 
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, BarChart, Bar
} from "recharts";

interface AicteDashboardProps {
  onSelectTab: (tab: string) => void;
}

// Verification activity data matching reference design
const VERIFICATION_ACTIVITY_DATA = [
  { month: "Apr", verified: 650, pending: 220 },
  { month: "May", verified: 890, pending: 280 },
  { month: "Jun", verified: 820, pending: 310 },
  { month: "Jul", verified: 1240, pending: 450 },
  { month: "Aug", verified: 1380, pending: 490 },
  { month: "Sep", verified: 1560, pending: 420 },
  { month: "Oct", verified: 1820, pending: 380 },
];

export const AicteDashboardView: React.FC<AicteDashboardProps> = ({ onSelectTab }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState("2024-25");
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});

  const toggleStep = (stepNum: number) => {
    setCheckedSteps((prev) => ({
      ...prev,
      [stepNum]: !prev[stepNum],
    }));
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getAICTEDashboard();
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard metrics");
    } finally {
      setLoading(false);
    }
  };

  // Recent student records matching reference design
  const recentRecords = [
    { name: "Ananya R", apaar: "42XXXX1234", status: "Verified", updated: "2h ago", color: "green" },
    { name: "Rahul S", apaar: "42XXXX5678", status: "Pending", updated: "3h ago", color: "orange" },
    { name: "Priya K", apaar: "42XXXX9012", status: "Verified", updated: "5h ago", color: "green" },
    { name: "Vikash M", apaar: "42XXXX3456", status: "Error", updated: "6h ago", color: "red" },
    { name: "Sneha L", apaar: "42XXXX7890", status: "Verified", updated: "8h ago", color: "green" },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/3 skeleton"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-32 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 skeleton"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 h-80 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 skeleton"></div>
          <div className="lg:col-span-5 h-80 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 skeleton"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          <div>
            <p className="font-semibold text-sm text-slate-900 dark:text-white">Failed to load regulatory metrics</p>
            <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5">{error}</p>
          </div>
        </div>
        <button 
          onClick={fetchMetrics} 
          className="px-3.5 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 transition shadow-xs"
        >
          Retry
        </button>
      </div>
    );
  }

  // 6 Metric Cards matching the exact reference image
  const metricCards = [
    {
      title: "Total Institutions",
      value: data?.total_institutions || 12,
      trend: "↑ 2% from last month",
      trendType: "positive",
      icon: Building2,
      iconBg: "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200",
      tab: "institutions"
    },
    {
      title: "Total Student Records",
      value: data?.total_reported_students || 8432,
      trend: "↑ 5% from last month",
      trendType: "positive",
      icon: Users,
      iconBg: "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200",
      tab: "students"
    },
    {
      title: "Verified Records",
      value: data?.verified_apaar_count || 6892,
      trend: "↑ 8% from last month",
      trendType: "positive",
      icon: CheckCircle2,
      iconBg: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400",
      tab: "verify"
    },
    {
      title: "Pending Verification",
      value: data?.pending_apaar_verifications || 1340,
      trend: "↓ 3% from last month",
      trendType: "warning",
      icon: Clock,
      iconBg: "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400",
      tab: "students"
    },
    {
      title: "Data Validation Issues",
      value: data?.data_quality_issues || 186,
      trend: "↓ 12% from last month",
      trendType: "danger",
      icon: AlertTriangle,
      iconBg: "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400",
      tab: "data_quality"
    },
    {
      title: "Duplicate Cases",
      value: data?.open_duplicate_alerts || 42,
      trend: "↓ 18% from last month",
      trendType: "purple",
      icon: Copy,
      iconBg: "bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400",
      tab: "duplicates"
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Dashboard Heading matching reference */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Dashboard
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Overview of your institution data and verification status
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <span>DEMONSTRATION MODE — SYNTHETIC DATA — NOT OFFICIAL VERIFICATION</span>
          </div>

          <button
            onClick={fetchMetrics}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition shadow-xs"
            title="Refresh dashboard"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 6 Metric Cards in 3x2 / 6-col responsive grid matching reference */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {metricCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={() => onSelectTab(card.tab)}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs card-hover cursor-pointer transition flex flex-col justify-between"
            >
              <div>
                {/* Circular Icon matching reference */}
                <div className={`w-9 h-9 rounded-full ${card.iconBg} flex items-center justify-center mb-3 shadow-2xs`}>
                  <Icon className="w-4 h-4" />
                </div>

                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {card.title}
                </div>

                <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-1 tnum">
                  {Number(card.value).toLocaleString()}
                </div>
              </div>

              {/* Trend Indicator */}
              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1 text-[11px] font-semibold">
                {card.trendType === "positive" && (
                  <span className="text-emerald-600 dark:text-emerald-400">{card.trend}</span>
                )}
                {card.trendType === "warning" && (
                  <span className="text-amber-600 dark:text-amber-400">{card.trend}</span>
                )}
                {card.trendType === "danger" && (
                  <span className="text-rose-600 dark:text-rose-400">{card.trend}</span>
                )}
                {card.trendType === "purple" && (
                  <span className="text-purple-600 dark:text-purple-400">{card.trend}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Two-Column Section: Student Verification Activity & Recent Student Records */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (approx 60%): Student Verification Activity */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Student Verification Activity
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Verified records versus pending triage queue
              </p>
            </div>

            {/* Custom Legend */}
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-900"></span>
                <span className="font-medium text-slate-600 dark:text-slate-400">Verified</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-500"></span>
                <span className="font-medium text-slate-600 dark:text-slate-400">Pending</span>
              </div>
            </div>
          </div>

          {/* Area Chart matching reference curve */}
          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={VERIFICATION_ACTIVITY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVerified" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0F172A" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#0F172A" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#64748B" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#64748B" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 11, fill: "#64748B" }} 
                  axisLine={{ stroke: "#E2E8F0" }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: "#64748B" }} 
                  axisLine={{ stroke: "#E2E8F0" }}
                  tickLine={false}
                  ticks={[0, 500, 1000, 1500, 2000]}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "#FFFFFF", 
                    borderRadius: 8, 
                    border: "1px solid #E2E8F0",
                    color: "#111827", 
                    fontSize: 12,
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.08)"
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="verified" 
                  name="Verified Records" 
                  stroke="#0F172A" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorVerified)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="pending" 
                  name="Pending Records" 
                  stroke="#A855F7" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorPending)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column (approx 40%): Recent Student Records */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Recent Student Records
              </h3>
              <button
                onClick={() => onSelectTab("students")}
                className="text-xs font-semibold text-slate-900 dark:text-white hover:underline flex items-center gap-1"
              >
                <span>View all</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Table matching reference */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 dark:text-slate-500 font-semibold text-[11px]">
                    <th className="pb-2">Name</th>
                    <th className="pb-2">APAAR ID</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2 text-right">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {recentRecords.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/70 transition">
                      <td className="py-2.5 font-semibold text-slate-900 dark:text-white">
                        {r.name}
                      </td>
                      <td className="py-2.5 font-mono text-slate-500 dark:text-slate-400 text-[11px] tnum">
                        {r.apaar}
                      </td>
                      <td className="py-2.5">
                        {r.status === "Verified" && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                            Verified
                          </span>
                        )}
                        {r.status === "Pending" && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800">
                            Pending
                          </span>
                        )}
                        {r.status === "Error" && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800">
                            Error
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 text-right text-slate-400 text-[11px] tnum">
                        {r.updated}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-2">
            <button
              onClick={() => onSelectTab("students")}
              className="w-full py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold text-center transition flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <span>Explore Student Registry Directory</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-900 dark:text-white" />
            </button>
          </div>
        </div>

      </div>

      {/* Stream-level Approved Intake vs Actual Enrolment from Database */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Sanctioned Intake Capacity vs. Actual Enrolment (Live DB)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Stream-level seat allocation across key engineering branches
            </p>
          </div>
          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded self-start sm:self-auto">
            AY 2024-25
          </span>
        </div>

        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={data?.intake_vs_enrolment || []}
              margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis 
                dataKey="course" 
                tick={{ fontSize: 10, fill: "#64748B" }} 
                interval={0}
                angle={-10}
                textAnchor="end"
              />
              <YAxis tick={{ fontSize: 10, fill: "#64748B" }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "#FFFFFF", 
                  borderRadius: 8, 
                  border: "1px solid #E2E8F0",
                  color: "#111827", 
                  fontSize: 12,
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)"
                }} 
              />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <Bar dataKey="approved" name="Approved Intake" fill="#0F172A" radius={[4, 4, 0, 0]} isAnimationActive={true} />
              <Bar dataKey="enrolled" name="Actual Enrolled" fill="#16A34A" radius={[4, 4, 0, 0]} isAnimationActive={true} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* User Roles Showcase Banner matching the reference poster */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-900 dark:text-white" />
            <span>Role-Based Governance (RBAC) Architecture</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Different roles, different access. Each user gets what they need.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold">
                👑
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Administrator</h4>
                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">National Bureau</span>
              </div>
            </div>
            <ul className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1 list-disc list-inside">
              <li>Full access to all features</li>
              <li>User management</li>
              <li>System configuration</li>
            </ul>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">College Principal</h4>
                <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">Institution Scope</span>
              </div>
            </div>
            <ul className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1 list-disc list-inside">
              <li>Institution data management</li>
              <li>Reports & analytics</li>
              <li>User approval</li>
            </ul>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Faculty / Coord</h4>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Department</span>
              </div>
            </div>
            <ul className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1 list-disc list-inside">
              <li>View student records</li>
              <li>Verify APAAR ID</li>
              <li>Manage enrolment data</li>
            </ul>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Data Entry Operator</h4>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">Admissions Desk</span>
              </div>
            </div>
            <ul className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1 list-disc list-inside">
              <li>Upload & manage records</li>
              <li>Bulk import wizard</li>
              <li>View validation issues</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom How It Works & Why APAAR-Vault Section from the reference poster */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* How It Works flow */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              How It Works
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              From data collection to verification — in a simple, secure flow.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
            {[
              { num: 1, title: "Data Collection", desc: "Collect student data from AICTE institutions." },
              { num: 2, title: "Validation", desc: "Check data quality & identify issues." },
              { num: 3, title: "Verification", desc: "Verify APAAR ID and student details." },
              { num: 4, title: "Management", desc: "Store & manage records securely in the vault." },
              { num: 5, title: "Reports", desc: "Generate insights and export required reports." },
            ].map((step) => {
              const isChecked = !!checkedSteps[step.num];
              return (
                <button
                  key={step.num}
                  type="button"
                  onClick={() => toggleStep(step.num)}
                  className={`p-3 rounded-xl border text-center space-y-1.5 transition-all cursor-pointer btn-press ${
                    step.num === 5 ? "col-span-2 sm:col-span-1" : ""
                  } ${
                    isChecked
                      ? "bg-transparent border-emerald-500 dark:border-emerald-400 shadow-xs ring-1 ring-emerald-500/30"
                      : "bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 shadow-2xs"
                  }`}
                  title={isChecked ? "Step checked (Tap to toggle)" : "Tap to check step and make transparent"}
                >
                  <div
                    className={`w-7 h-7 mx-auto rounded-lg flex items-center justify-center font-bold text-xs transition-colors ${
                      isChecked
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {isChecked ? <Check className="w-4 h-4 stroke-[2.5]" /> : step.num}
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-center gap-1">
                    <span>{step.title}</span>
                    {isChecked && <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0 stroke-[2.5]" />}
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{step.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Why APAAR-Vault card */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Why APAAR-Vault?
            </h3>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-slate-900 dark:text-white mt-0.5 shrink-0" />
                <span>Ensures authentic student identity through APAAR ID</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-slate-900 dark:text-white mt-0.5 shrink-0" />
                <span>Reduces manual work and data errors</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-slate-900 dark:text-white mt-0.5 shrink-0" />
                <span>Improves data transparency and security</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-slate-900 dark:text-white mt-0.5 shrink-0" />
                <span>Supports AICTE compliance and regulatory requirements</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-slate-900 dark:text-white mt-0.5 shrink-0" />
                <span>Built for scalability and ease of use</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => onSelectTab("verify")}
            className="mt-4 w-full py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-2 transition shadow-xs btn-press"
          >
            <span>Empowering Education with Trusted Data</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>

    </div>
  );
};
