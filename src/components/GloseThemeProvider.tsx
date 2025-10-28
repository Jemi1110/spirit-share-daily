import React, { createContext, useContext, ReactNode } from 'react';
import { useGloseTheme } from '../hooks/useGloseTheme';
import { ThemeConfig } from '../styles/theme';

interface GloseThemeContextType {
  theme: ThemeConfig;
  getGradient: (gradientKey: keyof ThemeConfig['colors']['gradients'], direction?: string) => string;
  getGlassmorphismStyle: (variant?: 'subtle' | 'normal' | 'strong') => React.CSSProperties;
  getReadingTypographyStyle: () => React.CSSProperties;
  getNavigationButtonStyle: (disabled?: boolean) => React.CSSProperties;
  getContentContainerStyle: () => React.CSSProperties;
  getLoadingSpinnerStyle: () => React.CSSProperties;
}

const GloseThemeContext = createContext<GloseThemeContextType | undefined>(undefined);

interface GloseThemeProviderProps {
  children: ReactNode;
}

export const GloseThemeProvider: React.FC<GloseThemeProviderProps> = ({ children }) => {
  const themeUtils = useGloseTheme();

  return (
    <GloseThemeContext.Provider value={themeUtils}>
      {children}
    </GloseThemeContext.Provider>
  );
};

export const useGloseThemeContext = () => {
  const context = useContext(GloseThemeContext);
  if (context === undefined) {
    throw new Error('useGloseThemeContext must be used within a GloseThemeProvider');
  }
  return context;
};

// Higher-order component for easy theme access
export const withGloseTheme = <P extends object>(
  Component: React.ComponentType<P & { theme: GloseThemeContextType }>
) => {
  return (props: P) => {
    const theme = useGloseThemeContext();
    return <Component {...props} theme={theme} />;
  };
};