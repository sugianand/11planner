'use client';

import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from 'next-themes';
import { supabase } from '@/lib/supabaseClient';

type Theme = 'light' | 'dark' | 'auto';
type ColorTheme = 'emerald' | 'ocean' | 'rose' | 'slate' | 'amber' | 'violet';

const COLOR_THEME_STORAGE_KEY = 'colorTheme';
const COLOR_THEMES: ColorTheme[] = ['emerald', 'ocean', 'rose', 'slate', 'amber', 'violet'];

interface ColorThemeContextType {
  colorTheme: ColorTheme;
  setColorTheme: (theme: ColorTheme) => void;
}

const ColorThemeContext = createContext<ColorThemeContextType | null>(null);

// Interface expected by consumers (SettingsPage)
interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  effectiveTheme: 'light' | 'dark';
  colorTheme: ColorTheme;
  setColorTheme: (theme: ColorTheme) => void;
  colorThemes: ColorTheme[];
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [colorTheme, setColorTheme] = useState<ColorTheme>('emerald');
  const [themeStorageKey, setThemeStorageKey] = useState<string>(`${COLOR_THEME_STORAGE_KEY}:guest`);

  useEffect(() => {
    const applyThemeForUser = (userId: string | null) => {
      const isGuest = !userId;

      if (isGuest) {
        // Logged-out users should always start from green defaults.
        setThemeStorageKey(`${COLOR_THEME_STORAGE_KEY}:guest`);
        setColorTheme('emerald');
        return;
      }

      const key = `${COLOR_THEME_STORAGE_KEY}:${userId}`;
      const stored = localStorage.getItem(key) as ColorTheme | null;
      setThemeStorageKey(key);
      setColorTheme(stored && COLOR_THEMES.includes(stored) ? stored : 'emerald');
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      applyThemeForUser(session?.user?.id ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      applyThemeForUser(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', colorTheme);
    if (themeStorageKey.endsWith(':guest')) {
      localStorage.removeItem(themeStorageKey);
      return;
    }
    localStorage.setItem(themeStorageKey, colorTheme);
  }, [colorTheme, themeStorageKey]);

  const contextValue = useMemo(
    () => ({ colorTheme, setColorTheme }),
    [colorTheme]
  );

  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <ColorThemeContext.Provider value={contextValue}>{children}</ColorThemeContext.Provider>
    </NextThemesProvider>
  );
}

export function useTheme(): ThemeContextType {
  const { theme, setTheme, resolvedTheme } = useNextTheme();
  const colorThemeContext = useContext(ColorThemeContext);

  if (!colorThemeContext) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

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

  return {
    theme: currentTheme,
    setTheme: updateTheme,
    effectiveTheme: (resolvedTheme as 'light' | 'dark') || 'light',
    colorTheme: colorThemeContext.colorTheme,
    setColorTheme: colorThemeContext.setColorTheme,
    colorThemes: COLOR_THEMES,
  };
}
