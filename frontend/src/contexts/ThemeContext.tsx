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

type UserSettingsThemeRow = {
  theme_mode?: Theme | null;
  color_theme?: ColorTheme | null;
};

type ProfileThemeFallbackRow = {
  theme_preference?: Theme | null;
  color_theme_preference?: ColorTheme | null;
};

function ThemeAuthSync({
  setColorThemeState,
}: {
  setColorThemeState: (theme: ColorTheme) => void;
}) {
  const { setTheme: setNextTheme } = useNextTheme();

  useEffect(() => {
    // Loads persisted theme preferences from user_settings, with legacy profile fallback.
    const syncThemeFromProfile = async (allowResetOnMissingUser: boolean) => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user?.id) {
          if (allowResetOnMissingUser) {
            setColorThemeState('emerald');
            setNextTheme('light');
          }
          return;
        }

        const { data: cloudTheme } = await supabase
          .from('user_settings')
          .select('theme_mode, color_theme')
          .eq('user_id', user.id)
          .maybeSingle<UserSettingsThemeRow>();

        const cloudColorTheme = cloudTheme?.color_theme ?? null;
        if (cloudColorTheme && COLOR_THEMES.includes(cloudColorTheme)) {
          setColorThemeState(cloudColorTheme);
        }

        if (cloudTheme?.theme_mode) {
          const themeToSet = cloudTheme.theme_mode === 'auto' ? 'system' : cloudTheme.theme_mode;
          setNextTheme(themeToSet);
          return;
        }

        const { data: profileFallback } = await supabase
          .from('profiles')
          .select('theme_preference, color_theme_preference')
          .eq('id', user.id)
          .maybeSingle<ProfileThemeFallbackRow>();

        const profileColorTheme = profileFallback?.color_theme_preference ?? null;
        if (profileColorTheme && COLOR_THEMES.includes(profileColorTheme)) {
          setColorThemeState(profileColorTheme);
        }

        if (profileFallback?.theme_preference) {
          const themeToSet = profileFallback.theme_preference === 'auto' ? 'system' : profileFallback.theme_preference;
          setNextTheme(themeToSet);
        }
      } catch {
        // Keep current local theme if profile fetch fails.
      }
    };

    void syncThemeFromProfile(false);

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

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') {
        void syncThemeFromProfile(false);
      }
    });

    // Re-syncs profile theme values when the tab is visible/active again.
    const handleVisibilityOrFocus = () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return;
      }
      void syncThemeFromProfile(false);
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [setColorThemeState, setNextTheme]);

  return null;
}

// Provides theme + accent state and persists updates to local/cloud storage.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [colorTheme, setColorThemeState] = useState<ColorTheme>('emerald');

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      const stored = localStorage.getItem(COLOR_THEME_STORAGE_KEY) as ColorTheme | null;
      if (stored && COLOR_THEMES.includes(stored)) {
        setColorThemeState(stored);
      }
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', colorTheme);
    if (typeof document !== 'undefined' && document.body) {
      document.body.setAttribute('data-theme', colorTheme);
    }
    localStorage.setItem(COLOR_THEME_STORAGE_KEY, colorTheme);
  }, [colorTheme]);

  // Persists accent color changes both locally and to cloud settings.
  const setColorTheme = useCallback((newColorTheme: ColorTheme) => {
    setColorThemeState(newColorTheme);

    void (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.id) {
          await supabase
            .from('user_settings')
            .upsert({ user_id: user.id, color_theme: newColorTheme }, { onConflict: 'user_id' });
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

// Exposes normalized theme state and update actions to UI components.
export function useTheme(): ThemeContextType {
  const { theme, setTheme: setNextTheme, resolvedTheme } = useNextTheme();
  const colorThemeContext = useContext(ColorThemeContext);

  if (!colorThemeContext) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  // Map next-themes 'system' to our 'auto'
  // When next-themes says 'system', we report 'auto' to the app
  const currentTheme: Theme = (theme === 'system' ? 'auto' : theme) as Theme || 'auto';

  // Maps app-level theme values to next-themes and persists selection.
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
            .from('user_settings')
            .upsert({ user_id: user.id, theme_mode: newTheme }, { onConflict: 'user_id' });
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
