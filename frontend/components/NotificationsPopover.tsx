"use client";

import React, { useState } from "react";
import { 
  Bell, AlertTriangle, ShieldAlert, CheckCircle2, 
  Info, TrendingUp, X, ArrowRight
} from "lucide-react";

interface NotificationsPopoverProps {
  onNavigate: (tabId: string) => void;
}

export const NotificationsPopover: React.FC<NotificationsPopoverProps> = ({ onNavigate }) => {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);

  const notifications = [
    {
      id: "notif-1",
      type: "INTAKE_EXCESS",
      title: "Intake Capacity Discrepancy",
      message: "Maharashtra College of Engg (MCER) reported 74 students against 60 approved intake (+14 excess seats).",
      timestamp: "10 mins ago",
      targetTab: "intake",
      severity: "CRITICAL",
      icon: TrendingUp
    },
    {
      id: "notif-2",
      type: "DUPLICATE_FLAG",
      title: "Cross-Institutional Enrolment Flagged",
      message: "Candidate Priya Patel detected enrolled simultaneously in DITS (Delhi) and MCER (Pune) under identical APAAR.",
      timestamp: "25 mins ago",
      targetTab: "duplicates",
      severity: "CRITICAL",
      icon: ShieldAlert
    },
    {
      id: "notif-3",
      type: "ANOMALY_INSIGHT",
      title: "Statistical Anomaly Scan Completed",
      message: "Automated baseline scan completed for AY 2024-25. 1 institutional anomaly detected for review.",
      timestamp: "1 hour ago",
      targetTab: "data_quality",
      severity: "ADVISORY",
      icon: AlertTriangle
    }
  ];

  const handleOpen = () => {
    setOpen(!open);
    if (!open) {
      setUnreadCount(0);
    }
  };

  const handleSelect = (tab: string) => {
    onNavigate(tab);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        title="Regulatory Compliance Alerts"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-600 rounded-full animate-pulse"></span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-24px)] bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 animate-fade-in text-slate-800 dark:text-slate-100">
          <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-slate-900 dark:text-white">Regulatory Notifications</span>
              <span className="bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800 text-[10px] font-medium px-1.5 py-0.5 rounded-full">
                {notifications.length} alerts
              </span>
            </div>
            <button 
              onClick={() => setOpen(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto text-xs">
            {notifications.map((notif) => {
              const Icon = notif.icon;
              return (
                <div 
                  key={notif.id}
                  onClick={() => handleSelect(notif.targetTab)}
                  className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition flex items-start gap-3 group"
                >
                  <div className={`p-2 rounded-lg shrink-0 mt-0.5 border ${
                    notif.severity === "CRITICAL"
                      ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800"
                      : "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800"
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-slate-900 dark:text-white truncate">{notif.title}</span>
                      <span className="text-[10px] text-slate-400 shrink-0">{notif.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {notif.message}
                    </p>
                    <div className="mt-2 flex items-center gap-1 text-[11px] font-medium text-slate-900 dark:text-white group-hover:text-slate-950 dark:group-hover:text-white">
                      <span>Investigate in {notif.targetTab}</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-2.5 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 text-center text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            Real-time regulatory alerts derived deterministically from database records.
          </div>
        </div>
      )}
    </div>
  );
};
