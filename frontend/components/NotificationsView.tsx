"use client";

import React, { useState } from "react";
import { Pagination } from "@/components/Pagination";
import { 
  Bell, Check, AlertTriangle, ShieldAlert, CheckCircle2, 
  Info, ArrowRight, Search, Filter, Trash2, Clock, Sparkles
} from "lucide-react";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: "warning" | "alert" | "info" | "success";
  tab: string;
  read: boolean;
  category: "Intake" | "Duplicate" | "Verification" | "System";
}

interface NotificationsViewProps {
  onNavigate: (tab: string) => void;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    title: "Excess Intake Capacity Detected",
    message: "MCER Pune exceeded approved intake capacity in Computer Science (+14 unapproved seats).",
    timestamp: "10 minutes ago",
    type: "warning",
    tab: "intake",
    read: false,
    category: "Intake"
  },
  {
    id: "notif-2",
    title: "Cross-Institutional Duplicate Alert",
    message: "Active APAAR candidate concurrently enrolled at DITS Delhi and MCER Pune.",
    timestamp: "45 minutes ago",
    type: "alert",
    tab: "duplicates",
    read: false,
    category: "Duplicate"
  },
  {
    id: "notif-3",
    title: "APAAR Verification Gateway Pulse",
    message: "National APAAR sandbox verification gateway running at optimal 99.8% responsiveness.",
    timestamp: "2 hours ago",
    type: "success",
    tab: "verify",
    read: false,
    category: "Verification"
  },
  {
    id: "notif-4",
    title: "Data Quality Advisory Score Updated",
    message: "Delhi Institute of Technology scored 92.4% on Multi-Dimensional Quality Index (DQI).",
    timestamp: "4 hours ago",
    type: "info",
    tab: "data_quality",
    read: true,
    category: "System"
  },
  {
    id: "notif-5",
    title: "Bulk CSV Ingestion Completed",
    message: "Institution Admin successfully ingested 120 student records for AY 2024-25 with 0 critical formatting errors.",
    timestamp: "Yesterday",
    type: "success",
    tab: "upload",
    read: true,
    category: "System"
  },
  {
    id: "notif-6",
    title: "Supernumerary TFW Quota Advisory",
    message: "Tuition Fee Waiver allocation is within the 5% AICTE ceiling across all compliant engineering branches.",
    timestamp: "Yesterday",
    type: "info",
    tab: "intake",
    read: true,
    category: "Intake"
  },
  {
    id: "notif-7",
    title: "Immutable Ledger Sync Check",
    message: "Audit ledger cryptographic integrity check passed successfully with SHA-256 block consistency.",
    timestamp: "2 days ago",
    type: "success",
    tab: "audit",
    read: true,
    category: "System"
  }
];

export const NotificationsView: React.FC<NotificationsViewProps> = ({ onNavigate }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const filtered = notifications.filter(n => {
    const matchesCategory = categoryFilter === "ALL" || n.category === categoryFilter;
    const matchesUnread = !showOnlyUnread || !n.read;
    const matchesSearch = !search || 
      n.title.toLowerCase().includes(search.toLowerCase()) || 
      n.message.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesUnread && matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 uppercase tracking-wider">
              Alerts & Notifications
            </span>
            {unreadCount > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Bell className="w-5 h-5 text-slate-900 dark:text-white shrink-0" />
            <span>Regulatory Alerts & Notifications Center</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-2xl leading-relaxed">
            Real-time regulatory alerts, concurrent enrolment warnings, sanctioned intake alerts, and student verification updates.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 hover:text-slate-950 dark:hover:text-white transition disabled:opacity-40 flex items-center gap-1.5 shadow-xs"
          >
            <Check className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
            <span>Mark All as Read</span>
          </button>
          <button
            onClick={clearAll}
            disabled={notifications.length === 0}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700 rounded-lg transition disabled:opacity-40"
            title="Clear all notifications"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search alerts by title or description..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-slate-900 dark:focus:border-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {["ALL", "Intake", "Duplicate", "Verification", "System"].map((cat) => (
            <button
              key={cat}
              onClick={() => { setCategoryFilter(cat); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                categoryFilter === cat
                  ? "bg-slate-900 text-white font-semibold shadow-xs"
                  : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700"
              }`}
            >
              {cat === "ALL" ? "All Categories" : cat}
            </button>
          ))}

          <button
            onClick={() => setShowOnlyUnread(!showOnlyUnread)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
              showOnlyUnread
                ? "bg-rose-50 text-rose-700 border-rose-200 font-semibold"
                : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
            }`}
          >
            Unread Only
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {paginated.map((notif) => {
            const isUnread = !notif.read;
            return (
              <div
                key={notif.id}
                className={`p-4 md:p-5 flex items-start justify-between gap-4 transition ${
                  isUnread
                    ? "bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-100/70 dark:hover:bg-slate-800"
                    : "hover:bg-slate-50/70 dark:hover:bg-slate-800/70"
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div className="mt-0.5 shrink-0">
                    {notif.type === "warning" && (
                      <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                    )}
                    {notif.type === "alert" && (
                      <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 flex items-center justify-center border border-rose-200 dark:border-rose-800">
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                    )}
                    {notif.type === "success" && (
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    )}
                    {notif.type === "info" && (
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 flex items-center justify-center border border-slate-300 dark:border-slate-700">
                        <Info className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-xs md:text-sm text-slate-900 dark:text-white">
                        {notif.title}
                      </span>
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-slate-900 dark:bg-white shrink-0"></span>
                      )}
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {notif.category}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {notif.message}
                    </p>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1 font-medium">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{notif.timestamp}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      markAsRead(notif.id);
                      onNavigate(notif.tab);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-semibold flex items-center gap-1 transition"
                  >
                    <span>Investigate</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>

                  {isUnread && (
                    <button
                      onClick={() => markAsRead(notif.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="Mark as read"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {paginated.length === 0 && (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <Bell className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-medium">No notifications in current view.</p>
            </div>
          )}
        </div>

        {/* Dedicated Previous & Next Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          itemLabel="alerts"
        />
      </div>

    </div>
  );
};
