import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';

type Theme = 'light' | 'dark';

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
  isSystemTheme: boolean;
  setSystemTheme: (useSystem: boolean) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
  isSystemTheme: true,
  setSystemTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isSystemTheme, setIsSystemTheme] = useState(true);
  const [theme, setTheme] = useState<Theme>(Appearance.getColorScheme() || 'light');

  useEffect(() => {
    if (isSystemTheme) {
      // Set initial theme based on system
      setTheme(Appearance.getColorScheme() || 'light');

      // Listen for system theme changes
      const subscription = Appearance.addChangeListener(({ colorScheme }) => {
        // Use setTimeout to ensure this runs after the current render cycle
        setTimeout(() => {
          setTheme(colorScheme || 'light');
        }, 0);
      });

      return () => {
        subscription.remove();
      };
    }
  }, [isSystemTheme]);

  const toggleTheme = () => {
    if (isSystemTheme) {
      // If currently using system theme, switch to manual mode with opposite of current theme
      setIsSystemTheme(false);
      setTheme(theme === 'light' ? 'dark' : 'light');
    } else {
      // If in manual mode, just toggle the theme
      setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    }
  };

  const setSystemTheme = (useSystem: boolean) => {
    setIsSystemTheme(useSystem);
    if (useSystem) {
      // When switching back to system theme, update to current system theme
      // Use setTimeout to ensure this runs after the current render cycle
      setTimeout(() => {
        setTheme(Appearance.getColorScheme() || 'light');
      }, 0);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isSystemTheme, setSystemTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);