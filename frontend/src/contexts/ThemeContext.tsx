import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSettingsStore } from '@/store/settingsStore';

type Theme = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  theme: Theme;
  currentTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { settings, updateSettings } = useSettingsStore();
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light');

  // Get system preference
  const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  };

  // Apply theme to document
  const applyTheme = (theme: 'light' | 'dark') => {
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
    
    setCurrentTheme(theme);
  };

  // Set theme and save to settings
  const setTheme = (theme: Theme) => {
    updateSettings('display', { theme });
    
    let actualTheme: 'light' | 'dark';
    if (theme === 'auto') {
      actualTheme = getSystemTheme();
    } else {
      actualTheme = theme;
    }
    
    applyTheme(actualTheme);
  };

  // Initialize theme
  useEffect(() => {
    const savedTheme = settings.display.theme;
    let actualTheme: 'light' | 'dark';
    
    if (savedTheme === 'auto') {
      actualTheme = getSystemTheme();
    } else {
      actualTheme = savedTheme;
    }
    
    applyTheme(actualTheme);
  }, []);

  // Listen for system theme changes when auto is selected
  useEffect(() => {
    if (settings.display.theme !== 'auto') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const newTheme = mediaQuery.matches ? 'dark' : 'light';
      applyTheme(newTheme);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [settings.display.theme]);

  // Update theme when settings change
  useEffect(() => {
    const savedTheme = settings.display.theme;
    let actualTheme: 'light' | 'dark';
    
    if (savedTheme === 'auto') {
      actualTheme = getSystemTheme();
    } else {
      actualTheme = savedTheme;
    }
    
    applyTheme(actualTheme);
  }, [settings.display.theme]);

  const value: ThemeContextType = {
    theme: settings.display.theme,
    currentTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
