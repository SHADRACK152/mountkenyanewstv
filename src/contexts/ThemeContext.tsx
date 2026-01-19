import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemeColor = 'blue' | 'red' | 'green' | 'purple' | 'orange' | 'teal';
export type FontSize = 'small' | 'medium' | 'large';

interface ThemeSettings {
  mode: ThemeMode;
  color: ThemeColor;
  fontSize: FontSize;
  reducedMotion: boolean;
  highContrast: boolean;
}

interface ThemeContextType {
  theme: ThemeSettings;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  setThemeColor: (color: ThemeColor) => void;
  setFontSize: (size: FontSize) => void;
  setReducedMotion: (reduced: boolean) => void;
  setHighContrast: (high: boolean) => void;
  resetTheme: () => void;
}

const defaultTheme: ThemeSettings = {
  mode: 'light',
  color: 'blue',
  fontSize: 'medium',
  reducedMotion: false,
  highContrast: false,
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const colorSchemes: Record<ThemeColor, { primary: string; primaryDark: string; accent: string }> = {
  blue: { primary: '#1e40af', primaryDark: '#1e3a8a', accent: '#dc2626' },
  red: { primary: '#dc2626', primaryDark: '#b91c1c', accent: '#1e40af' },
  green: { primary: '#059669', primaryDark: '#047857', accent: '#dc2626' },
  purple: { primary: '#7c3aed', primaryDark: '#6d28d9', accent: '#f59e0b' },
  orange: { primary: '#ea580c', primaryDark: '#c2410c', accent: '#1e40af' },
  teal: { primary: '#0d9488', primaryDark: '#0f766e', accent: '#dc2626' },
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeSettings>(() => {
    const saved = localStorage.getItem('theme_settings');
    return saved ? JSON.parse(saved) : defaultTheme;
  });

  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Save to localStorage
    localStorage.setItem('theme_settings', JSON.stringify(theme));

    // Determine if dark mode
    let dark = false;
    if (theme.mode === 'dark') {
      dark = true;
    } else if (theme.mode === 'system') {
      dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    setIsDark(dark);

    // Apply dark mode class
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Apply font size
    const fontSizes = { small: '14px', medium: '16px', large: '18px' };
    document.documentElement.style.setProperty('--base-font-size', fontSizes[theme.fontSize]);

    // Apply color scheme CSS variables
    const colors = colorSchemes[theme.color];
    document.documentElement.style.setProperty('--color-primary', colors.primary);
    document.documentElement.style.setProperty('--color-primary-dark', colors.primaryDark);
    document.documentElement.style.setProperty('--color-accent', colors.accent);

    // Apply reduced motion
    if (theme.reducedMotion) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }

    // Apply high contrast
    if (theme.highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme.mode !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [theme.mode]);

  const setThemeMode = (mode: ThemeMode) => setTheme(t => ({ ...t, mode }));
  const setThemeColor = (color: ThemeColor) => setTheme(t => ({ ...t, color }));
  const setFontSize = (fontSize: FontSize) => setTheme(t => ({ ...t, fontSize }));
  const setReducedMotion = (reducedMotion: boolean) => setTheme(t => ({ ...t, reducedMotion }));
  const setHighContrast = (highContrast: boolean) => setTheme(t => ({ ...t, highContrast }));
  const resetTheme = () => setTheme(defaultTheme);

  return (
    <ThemeContext.Provider value={{
      theme,
      isDark,
      setThemeMode,
      setThemeColor,
      setFontSize,
      setReducedMotion,
      setHighContrast,
      resetTheme,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
