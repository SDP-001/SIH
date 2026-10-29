"use client";

import React, { useEffect, useState } from "react";
import { 
  Search, ShieldCheck, Users, TrendingUp, AlertTriangle, 
  FileSpreadsheet, Award, ScrollText, Bot, Building2, 
  Settings, X, ArrowRight
} from "lucide-react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tabId: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const navigationCommands = [
    { id: "overview", label: "Executive Overview Dashboard", category: "Navigation", icon: Building2, shortcut: "G O" },
    { id: "institutions", label: "Institutions Directory (25 Campuses)", category: "Navigation", icon: Building2, shortcut: "G N" },
    { id: "assistant", label: "AI Officer Assistant (SQL Lineage)", category: "Intelligence", icon: Bot, shortcut: "G A" },
    { id: "intake", label: "Sanctioned Intake & Capacity Monitoring (Rule 9)", category: "Compliance", icon: TrendingUp, shortcut: "G I" },
    { id: "students", label: "Student Identity Records Vault", category: "Student Data", icon: Users, shortcut: "G S" },
    { id: "upload", label: "4-Step Bulk Student Import Wizard", category: "Ingestion", icon: FileSpreadsheet, shortcut: "G U" },
    { id: "duplicates", label: "Duplicate Investigation Centre (5-Match Engine)", category: "Integrity", icon: AlertTriangle, shortcut: "G D" },
    { id: "data_quality", label: "Data Quality Index & Explainable Rule Center", category: "Quality", icon: Award, shortcut: "G Q" },
    { id: "reports", label: "Regulatory Report Generator & Exports", category: "Reports", icon: FileSpreadsheet, shortcut: "G R" },
    { id: "audit", label: "Tamper-Evident Regulatory Audit Ledger", category: "Security", icon: ScrollText, shortcut: "G L" },
    { id: "verify", label: "Public Academic Credential Verification (QR)", category: "Verification", icon: ShieldCheck, shortcut: "G V" },
    { id: "settings", label: "Platform Settings & APAAR Gateway Adapter", category: "Configuration", icon: Settings, shortcut: "G C" }
  ];

  const quickEntities = [
    { label: "Rahul Sharma (Roll: DITS-2024-CSE-001) - Verified Record", tab: "students" },
    { label: "Priya Patel (Roll: MCER-2024-MECH-042) - Duplicate Enrolment Flag", tab: "duplicates" },
    { label: "Maharashtra College of Engg (MCER) - 14 Excess Intake Flag", tab: "intake" },
    { label: "Delhi Institute of Technology & Science (DITS) - Compliant Campus", tab: "overview" },
  ];

  const filteredCommands = navigationCommands.filter(c => 
    c.label.toLowerCase().includes(query.toLowerCase()) || 
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  const filteredEntities = quickEntities.filter(e => 
    e.label.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (tabId: string) => {
    onNavigate(tabId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-start justify-center pt-20 p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Search Input Bar */}
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 bg-white dark:bg-slate-900">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands, institutions, student records, or regulatory modules..."
            className="w-full bg-transparent text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none font-medium"
          />
          <button 
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-3 text-xs">
          {/* Quick Entities */}
          {filteredEntities.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Institutional Records & Flags
              </div>
              <div className="space-y-0.5">
                {filteredEntities.map((ent, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelect(ent.tab)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white flex items-center justify-between transition group"
                  >
                    <span className="font-medium truncate">{ent.label}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Commands */}
          <div>
            <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Regulatory Navigation & Modules
            </div>
            <div className="space-y-0.5">
              {filteredCommands.map((cmd) => {
                const Icon = cmd.icon;
                return (
                  <button
                    key={cmd.id}
                    onClick={() => handleSelect(cmd.id)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white flex items-center justify-between transition group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">{cmd.label}</div>
                        <div className="text-[10px] text-slate-400">{cmd.category}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                      {cmd.shortcut}
                    </span>
                  </button>
                );
              })}
              {filteredCommands.length === 0 && filteredEntities.length === 0 && (
                <div className="p-6 text-center text-slate-400 text-xs">
                  No matching commands or regulatory records found.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-2.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>Navigate: <kbd className="px-1 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-mono text-slate-600 dark:text-slate-300">↑</kbd> <kbd className="px-1 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-mono text-slate-600 dark:text-slate-300">↓</kbd></span>
            <span>Select: <kbd className="px-1 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-mono text-slate-600 dark:text-slate-300">↵</kbd></span>
          </div>
          <div>
            Press <kbd className="px-1 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-mono text-slate-600 dark:text-slate-300">ESC</kbd> to exit
          </div>
        </div>
      </div>
    </div>
  );
};
