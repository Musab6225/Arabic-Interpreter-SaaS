import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme, StyleSheet } from 'react-native';

const darkColors = {
  background: '#0D1117',
  surface: '#161B22',
  primary: '#58A6B0',
  text: '#E6EDF3',
  textMuted: '#8B949E',
  tabBar: '#161B22',
  tabBarActive: '#58A6B0',
  tabBarInactive: '#8B949E',
  divider: '#30363D',
  inputBackground: '#21262D',
  card: '#161B22',
};

const lightColors = {
  background: '#F8F9FA',
  surface: '#FFFFFF',
  primary: '#1A5F7A',
  text: '#1C1C1E',
  textMuted: '#8E8E93',
  tabBar: '#FFFFFF',
  tabBarActive: '#1A5F7A',
  tabBarInactive: '#8E8E93',
  divider: '#E5E5EA',
  inputBackground: '#F2F2F7',
  card: '#FFFFFF',
};

const ThemeContext = createContext(undefined);

export function ThemeProvider({ children }) {
  const systemColorScheme = useColorScheme();
  
  // 1. Add state to track manual selection
  // We initialize it based on the phone's system setting
  const [isDark, setIsDark] = useState(systemColorScheme === 'dark');

  // 2. Sync with system if the user hasn't manually toggled yet (Optional)
  useEffect(() => {
    setIsDark(systemColorScheme === 'dark');
  }, [systemColorScheme]);

  // 3. Define the toggle function your SettingsScreen is looking for[cite: 1]
  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  const theme = {
    colors: isDark ? darkColors : lightColors,
    typography: { 
      fontFamily: 'System', 
      fontFamilyBold: 'System' 
    },
    spacing: { md: 16, lg: 24 },
    borderRadius: { md: 8, lg: 12 },
    shadows: {
      sm: { shadowOpacity: 0.1, elevation: 2 },
    }
  };

  return (
    // 4. Add toggleTheme to the Provider value[cite: 1]
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