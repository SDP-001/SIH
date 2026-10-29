"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTheme, ThemeMode } from "@/lib/theme";
import { Sun, Moon, Laptop, Check } from "lucide-react";

interface ThemeSwitcherProps {
  variant?: "segmented" | "dropdown" | "compact";
  className?: string;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  variant = "compact",
  className = "",
}) => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click outside to close
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

  const options: { mode: ThemeMode; label: string; icon: typeof Sun; desc: string }[] = [
    { mode: "system", label: "System Default", icon: Laptop, desc: "Matches device settings" },
    { mode: "light", label: "White", icon: Sun, desc: "Pure white light theme" },
    { mode: "dark", label: "Dark", icon: Moon, desc: "Sleek dark theme" },
  ];

  // Segmented inline mode
  if (variant === "segmented") {
    return (
      <div
        className={`inline-flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 ${className}`}
        role="group"
        aria-label="Theme options"
      >
        {options.map((opt) => {
          const Icon = opt.icon;
          const isSelected = theme === opt.mode;
          return (
            <button
              key={opt.mode}
              onClick={() => setTheme(opt.mode)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                isSelected
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
              title={opt.label}
            >
              <Icon
                className={`w-3.5 h-3.5 ${
                  opt.mode === "light" && isSelected
                    ? "text-amber-500"
                    : opt.mode === "dark" && isSelected
                    ? "text-slate-300"
                    : "text-slate-400"
                }`}
              />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Compact / Dropdown menu with System Default, White, and Dark options
  const ActiveIcon = theme === "system" ? Laptop : theme === "dark" ? Moon : Sun;

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 hover:text-slate-900 dark:hover:text-white transition shadow-2xs focus:outline-none"
        title={`Theme: ${theme === "system" ? "System Default" : theme === "light" ? "White" : "Dark"}`}
        aria-label="Change theme"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <ActiveIcon
          className={`w-4 h-4 transition ${
            theme === "light"
              ? "text-amber-500"
              : theme === "dark"
              ? "text-slate-200"
              : "text-slate-600 dark:text-slate-300"
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-48 max-w-[calc(100vw-24px)] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 animate-fade-in text-slate-800 dark:text-slate-200">
          <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 mb-1">
            Theme Mode
          </div>

          <div className="px-1 space-y-0.5">
            {options.map((opt) => {
              const Icon = opt.icon;
              const isSelected = theme === opt.mode;
              return (
                <button
                  key={opt.mode}
                  type="button"
                  onClick={() => {
                    setTheme(opt.mode);
                    setTimeout(() => setIsOpen(false), 140);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition-all group ${
                    isSelected
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-white font-semibold shadow-2xs"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon
                      className={`w-3.5 h-3.5 ${
                        opt.mode === "light"
                          ? "text-amber-500"
                          : opt.mode === "dark"
                          ? "text-slate-300"
                          : "text-slate-500"
                      }`}
                    />
                    <div>
                      <span className="block font-medium group-hover:text-slate-950 dark:group-hover:text-white">{opt.label}</span>
                      <span className="block text-[10px] text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 font-normal">
                        {opt.desc}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
