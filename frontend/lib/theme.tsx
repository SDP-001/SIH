"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeMode = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeMode) => void;
  cycleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "system",
  resolvedTheme: "light",
  setTheme: () => {},
  cycleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");
  const [mounted, setMounted] = useState(false);

  // Apply theme to document
  const applyTheme = (targetTheme: ThemeMode) => {
    let effectiveTheme: ResolvedTheme = "light";

    if (targetTheme === "system") {
      const prefersDark = typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
      effectiveTheme = prefersDark ? "dark" : "light";
    } else {
      effectiveTheme = targetTheme;
    }

    setResolvedTheme(effectiveTheme);

    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", effectiveTheme);
      document.documentElement.style.colorScheme = effectiveTheme;
      document.body?.setAttribute("data-theme", effectiveTheme);

      if (effectiveTheme === "dark") {
        document.documentElement.classList.add("dark");
        document.body?.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
        document.body?.classList.remove("dark");
      }
    }
  };

  useEffect(() => {
    setMounted(true);
    // Retrieve stored preference or default to pure White
    try {
      const v3Reset = localStorage.getItem("apaar_theme_white_v3");
      let initial: ThemeMode = "light";
      if (!v3Reset) {
        // One-time default to pure White as requested
        localStorage.setItem("apaar_theme_white_v3", "1");
        localStorage.setItem("apaar_vault_theme", "light");
        initial = "light";
      } else {
        const stored = localStorage.getItem("apaar_vault_theme") as ThemeMode | null;
        initial = stored && ["system", "light", "dark"].includes(stored) ? stored : "light";
      }
      setThemeState(initial);
      applyTheme(initial);
    } catch {
      applyTheme("light");
    }

    // Media query listener for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = (e: MediaQueryListEvent) => {
      const currentStored = localStorage.getItem("apaar_vault_theme");
      if (currentStored === "system") {
        applyTheme("system");
      }
    };

    mediaQuery.addEventListener("change", handleSystemChange);
    return () => mediaQuery.removeEventListener("change", handleSystemChange);
  }, []);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem("apaar_vault_theme", newTheme);
    } catch {
      // Ignore localStorage errors
    }
    applyTheme(newTheme);
  };

  const cycleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
