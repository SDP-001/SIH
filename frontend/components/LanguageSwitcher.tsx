"use client";

import React, { useState, useRef, useEffect } from "react";
import { useI18n, SUPPORTED_LANGUAGES, LanguageOption } from "@/lib/i18n";
import { Globe, Check, ChevronDown, Search, Sparkles } from "lucide-react";

interface LanguageSwitcherProps {
  variant?: "default" | "compact" | "minimal";
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = "default",
  className = "",
}) => {
  const { currentLanguage, setLanguage, t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const filteredLanguages = SUPPORTED_LANGUAGES.filter(
    (lang) =>
      lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.script.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (lang: LanguageOption) => {
    setLanguage(lang.code);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      {variant === "compact" ? (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-semibold transition shadow-2xs"
          title={`Language: ${currentLanguage.name} (${currentLanguage.nativeName})`}
          aria-label="Select language"
        >
          <Globe className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300 shrink-0" />
          <span className="font-medium text-[11px] truncate max-w-[64px]">
            {currentLanguage.nativeName}
          </span>
          <ChevronDown
            className={`w-3 h-3 text-slate-400 transition-transform duration-150 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      ) : variant === "minimal" ? (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 transition shadow-2xs"
          title={`Language: ${currentLanguage.name}`}
          aria-label="Select language"
        >
          <Globe className="w-4 h-4 text-slate-700 dark:text-slate-300" />
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-900 dark:text-white text-xs font-semibold transition shadow-2xs"
          aria-label="Select language dropdown"
        >
          <div className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
            <Globe className="w-3.5 h-3.5 text-slate-800 dark:text-slate-200" />
          </div>
          <div className="text-left leading-tight hidden sm:block">
            <div className="font-bold text-slate-900 dark:text-white text-xs">
              {currentLanguage.nativeName}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">
              {currentLanguage.name}
            </div>
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-72 sm:w-80 max-w-[calc(100vw-24px)] bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-fade-in text-slate-800 dark:text-slate-200">
          {/* Header */}
          <div className="px-3.5 pb-2.5 pt-1 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-900 dark:text-white" />
                <span>Portal Language</span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                AICTE NEP 2020 Multilingual Initiative
              </div>
            </div>
            <span className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
              13 Languages
            </span>
          </div>

          {/* Search Box */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-800">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search language or script..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-slate-900 dark:focus:border-white"
              />
            </div>
          </div>

          {/* Language Options List */}
          <div className="max-h-64 overflow-y-auto p-1.5 space-y-0.5">
            {filteredLanguages.map((lang) => {
              const isSelected = lang.code === currentLanguage.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => handleSelect(lang)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs transition-all group ${
                    isSelected
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-white font-bold border-l-2 border-slate-900 dark:border-white shadow-2xs"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-7 text-[11px] font-mono text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 font-semibold uppercase shrink-0">
                      {lang.code}
                    </span>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span className="truncate">{lang.nativeName}</span>
                        {lang.nativeName !== lang.name && (
                          <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200">
                            ({lang.name})
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 truncate">
                        {lang.region} · {lang.script}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-slate-900 dark:bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Check className="w-3 h-3 stroke-[2.5]" />
                    </div>
                  )}
                </button>
              );
            })}

            {filteredLanguages.length === 0 && (
              <div className="py-6 text-center text-xs text-slate-400">
                No languages found matching &quot;{searchQuery}&quot;
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="px-3 pt-2 pb-1 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Preserves standard AICTE terminology</span>
            <span className="font-mono">8th Schedule</span>
          </div>
        </div>
      )}
    </div>
  );
};
