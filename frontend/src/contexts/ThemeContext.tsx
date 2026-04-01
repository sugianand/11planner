'use client';

import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from 'next-themes';

type Theme = 'light' | 'dark' | 'auto';
type ColorTheme = 'emerald' | 'ocean' | 'rose' | 'slate';

const COLOR_THEME_STORAGE_KEY = 'colorTheme';
const COLOR_THEMES: ColorTheme[] = ['emerald', 'ocean', 'rose', 'slate'];

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

  useEffect(() => {
    const stored = localStorage.getItem(COLOR_THEME_STORAGE_KEY) as ColorTheme | null;
    if (stored && COLOR_THEMES.includes(stored)) {
      setColorTheme(stored);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', colorTheme);
    localStorage.setItem(COLOR_THEME_STORAGE_KEY, colorTheme);
  }, [colorTheme]);

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
