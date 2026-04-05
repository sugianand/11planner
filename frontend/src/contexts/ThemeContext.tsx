'use client';

import { ReactNode, createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
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

function ThemeAuthSync({
  setColorThemeState,
}: {
  setColorThemeState: (theme: ColorTheme) => void;
}) {
  const { setTheme: setNextTheme } = useNextTheme();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setColorThemeState('emerald');
        setNextTheme('light');
        return;
      }

      if (!session?.user?.id) {
        return;
      }

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('theme_preference, color_theme_preference')
          .eq('id', session.user.id)
          .maybeSingle();

        const profileColorTheme = profile?.color_theme_preference as ColorTheme | null;
        if (profileColorTheme && COLOR_THEMES.includes(profileColorTheme)) {
          setColorThemeState(profileColorTheme);
        }

        if (profile?.theme_preference) {
          const themeToSet = profile.theme_preference === 'auto' ? 'system' : profile.theme_preference;
          setNextTheme(themeToSet);
        }
      } catch {
        // Keep current local theme if profile fetch fails.
      }
    });

    return () => subscription.unsubscribe();
  }, [setColorThemeState, setNextTheme]);

  return null;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [colorTheme, setColorThemeState] = useState<ColorTheme>(() => {
    if (typeof window === 'undefined') {
      return 'emerald';
    }
    const stored = localStorage.getItem(COLOR_THEME_STORAGE_KEY) as ColorTheme | null;
    if (stored && COLOR_THEMES.includes(stored)) {
      return stored;
    }
    return 'emerald';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', colorTheme);
    if (typeof document !== 'undefined' && document.body) {
      document.body.setAttribute('data-theme', colorTheme);
    }
    localStorage.setItem(COLOR_THEME_STORAGE_KEY, colorTheme);
  }, [colorTheme]);

  const setColorTheme = useCallback((newColorTheme: ColorTheme) => {
    setColorThemeState(newColorTheme);

    void (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.id) {
          await supabase
            .from('profiles')
            .upsert({ id: user.id, color_theme_preference: newColorTheme }, { onConflict: 'id' });
        }
      } catch {
        // Preference still persists locally.
      }
    })();
  }, []);

  const contextValue = useMemo(
    () => ({ colorTheme, setColorTheme }),
    [colorTheme, setColorTheme]
  );

  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <ColorThemeContext.Provider value={contextValue}>
        <ThemeAuthSync setColorThemeState={setColorThemeState} />
        {children}
      </ColorThemeContext.Provider>
    </NextThemesProvider>
  );
}

export function useTheme(): ThemeContextType {
  const { theme, setTheme: setNextTheme, resolvedTheme } = useNextTheme();
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
      setNextTheme('system');
    } else {
      setNextTheme(newTheme);
    }

    void (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.id) {
          await supabase
            .from('profiles')
            .upsert({ id: user.id, theme_preference: newTheme }, { onConflict: 'id' });
        }
      } catch {
        // Theme still persists locally via next-themes.
      }
    })();
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
