"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "auto";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setThemeState] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load saved theme
    const savedTheme = (localStorage.getItem("theme") as Theme) || "light";
    setThemeState(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  };

  const applyTheme = (currentTheme: Theme) => {
    if (currentTheme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
      document.body.style.backgroundColor = "#0f172a";
      document.body.style.color = "#f1f5f9";
    } else if (currentTheme === "light") {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
      document.body.style.backgroundColor = "#ffffff";
      document.body.style.color = "#000000";
    } else {
      // auto mode
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      if (prefersDark) {
        document.documentElement.classList.add("dark");
        document.documentElement.style.colorScheme = "dark";
        document.body.style.backgroundColor = "#0f172a";
        document.body.style.color = "#f1f5f9";
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.style.colorScheme = "light";
        document.body.style.backgroundColor = "#ffffff";
        document.body.style.color = "#000000";
      }
    }
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
