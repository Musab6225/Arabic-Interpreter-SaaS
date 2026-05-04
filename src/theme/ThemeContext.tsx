import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme, StyleSheet } from 'react-native';

const darkColors = {
  background: '#0A0E17',
  surface: '#111827',
  surfaceElevated: '#1A2236',
  surfaceGlass: 'rgba(17, 24, 39, 0.85)',
  primary: '#3B82F6',
  primaryMuted: '#1E40AF',
  accent: '#10B981',
  accentMuted: '#059669',
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  tabBar: '#0F172A',
  tabBarActive: '#3B82F6',
  tabBarInactive: '#475569',
  divider: 'rgba(148, 163, 184, 0.12)',
  inputBackground: '#1E293B',
  card: '#111827',
  cardBorder: 'rgba(148, 163, 184, 0.08)',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  overlay: 'rgba(0, 0, 0, 0.7)',
  gradientStart: '#1E3A5F',
  gradientEnd: '#0F172A',
};

const lightColors = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceElevated: '#F1F5F9',
  surfaceGlass: 'rgba(255, 255, 255, 0.85)',
  primary: '#1D4ED8',
  primaryMuted: '#1E40AF',
  accent: '#059669',
  accentMuted: '#047857',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  tabBar: '#FFFFFF',
  tabBarActive: '#1D4ED8',
  tabBarInactive: '#94A3B8',
  divider: 'rgba(148, 163, 184, 0.15)',
  inputBackground: '#F1F5F9',
  card: '#FFFFFF',
  cardBorder: 'rgba(148, 163, 184, 0.12)',
  success: '#059669',
  warning: '#D97706',
  error: '#DC2626',
  overlay: 'rgba(0, 0, 0, 0.5)',
  gradientStart: '#DBEAFE',
  gradientEnd: '#EFF6FF',
};

const ThemeContext = createContext(undefined);

export function ThemeProvider({ children }) {
  const systemColorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemColorScheme === 'dark');

  useEffect(() => {
    setIsDark(systemColorScheme === 'dark');
  }, [systemColorScheme]);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  const theme = {
    colors: isDark ? darkColors : lightColors,
    typography: {
      fontFamily: 'System',
      fontFamilyBold: 'System',
      sizes: {
        xs: 11,
        sm: 13,
        md: 15,
        lg: 18,
        xl: 22,
        '2xl': 28,
        '3xl': 34,
      },
    },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
    borderRadius: { sm: 8, md: 12, lg: 16, xl: 20, full: 9999 },
    shadows: {
      sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
      md: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
      lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 8 },
    },
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}