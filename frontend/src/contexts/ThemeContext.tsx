'use client';

import { ReactNode, useEffect, useState } from 'react';
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from 'next-themes';

type Theme = 'light' | 'dark' | 'auto';

// Interface expected by consumers (SettingsPage)
interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  effectiveTheme: 'light' | 'dark';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </NextThemesProvider>
  );
}

export function useTheme(): ThemeContextType {
  const { theme, setTheme, resolvedTheme } = useNextTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Map next-themes 'system' to our 'auto'
  // When next-themes says 'system', we report 'auto' to the app
  const currentTheme: Theme = (theme === 'system' ? 'auto' : theme) as Theme || 'auto';

  const updateTheme = (newTheme: Theme) => {
    // When app asks for 'auto', we tell next-themes 'system'
    if (newTheme === 'auto') {
      setTheme('system');
    } else {
      setTheme(newTheme);
    }
  };

  if (!mounted) {
    return {
      theme: 'auto',
      setTheme: () => { },
      effectiveTheme: 'light',
    };
  }

  return {
    theme: currentTheme,
    setTheme: updateTheme,
    effectiveTheme: (resolvedTheme as 'light' | 'dark') || 'light',
  };
}
