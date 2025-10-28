export interface ThemeConfig {
  colors: {
    gradients: {
      primary: string[];
      secondary: string[];
      accent: string[];
      loading: string[];
      success: string[];
      sidebar: string[];
    };
    backgrounds: {
      main: string;
      sidebar: string;
      content: string;
      card: string;
    };
    text: {
      primary: string;
      secondary: string;
      muted: string;
      inverse: string;
    };
    borders: {
      subtle: string;
      medium: string;
      strong: string;
    };
  };
  typography: {
    fonts: {
      serif: string;
      sansSerif: string;
    };
    sizes: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      '2xl': string;
      content: string;
      ui: string;
    };
    lineHeights: {
      tight: number;
      normal: number;
      relaxed: number;
      content: number;
      ui: number;
    };
    weights: {
      normal: number;
      medium: number;
      semibold: number;
      bold: number;
    };
  };
  spacing: {
    grid: number;
    containers: {
      padding: string;
      margin: string;
    };
    components: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      '2xl': string;
    };
  };
  effects: {
    borderRadius: {
      sm: string;
      md: string;
      lg: string;
      xl: string;
      '2xl': string;
      full: string;
    };
    shadows: {
      subtle: string;
      elevated: string;
      floating: string;
      glow: string;
    };
    transitions: {
      fast: string;
      medium: string;
      slow: string;
    };
    blur: {
      sm: string;
      md: string;
      lg: string;
    };
  };
}

export const gloseTheme: ThemeConfig = {
  colors: {
    gradients: {
      primary: ['#667eea', '#764ba2'],
      secondary: ['#f093fb', '#f5576c'],
      accent: ['#4facfe', '#00f2fe'],
      loading: ['#667eea', '#764ba2'],
      success: ['#11998e', '#38ef7d'],
      sidebar: ['#a8edea', '#fed6e3'],
    },
    backgrounds: {
      main: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      sidebar: 'rgba(255, 255, 255, 0.8)',
      content: 'linear-gradient(to bottom, #ffffff, #fafafa)',
      card: 'rgba(255, 255, 255, 0.9)',
    },
    text: {
      primary: '#111827', // Darker for better contrast (AAA compliant)
      secondary: '#374151', // Improved contrast
      muted: '#6b7280',
      inverse: '#ffffff',
    },
    borders: {
      subtle: 'rgba(255, 255, 255, 0.2)',
      medium: 'rgba(0, 0, 0, 0.1)',
      strong: 'rgba(0, 0, 0, 0.2)',
    },
  },
  typography: {
    fonts: {
      serif: 'ui-serif, "Iowan Old Style", "Palatino Linotype", "URW Palladio L", P052, serif, Georgia, Cambria, "Times New Roman", Times, serif',
      sansSerif: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
    },
    sizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      content: '1.125rem',
      ui: '0.875rem',
    },
    lineHeights: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.625,
      content: 1.8,
      ui: 1.5,
    },
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  spacing: {
    grid: 8,
    containers: {
      padding: '2rem',
      margin: '1rem',
    },
    components: {
      xs: '0.5rem',
      sm: '0.75rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
      '2xl': '3rem',
    },
  },
  effects: {
    borderRadius: {
      sm: '0.375rem',
      md: '0.5rem',
      lg: '0.75rem',
      xl: '1rem',
      '2xl': '1.5rem',
      full: '9999px',
    },
    shadows: {
      subtle: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      elevated: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      floating: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      glow: '0 0 20px rgba(102, 126, 234, 0.3)',
    },
    transitions: {
      fast: 'all 0.15s ease-in-out',
      medium: 'all 0.3s ease-in-out',
      slow: 'all 0.5s ease-in-out',
    },
    blur: {
      sm: 'blur(4px)',
      md: 'blur(8px)',
      lg: 'blur(16px)',
    },
  },
};

// Utility functions for creating gradients
export const createGradient = (colors: string[], direction = '135deg'): string => {
  return `linear-gradient(${direction}, ${colors.join(', ')})`;
};

export const createRadialGradient = (colors: string[]): string => {
  return `radial-gradient(circle, ${colors.join(', ')})`;
};

// CSS custom properties generator
export const generateCSSCustomProperties = (theme: ThemeConfig): Record<string, string> => {
  const properties: Record<string, string> = {};
  
  // Colors
  Object.entries(theme.colors.gradients).forEach(([key, colors]) => {
    properties[`--gradient-${key}`] = createGradient(colors);
  });
  
  Object.entries(theme.colors.backgrounds).forEach(([key, value]) => {
    properties[`--bg-${key}`] = value;
  });
  
  Object.entries(theme.colors.text).forEach(([key, value]) => {
    properties[`--text-${key}`] = value;
  });
  
  Object.entries(theme.colors.borders).forEach(([key, value]) => {
    properties[`--border-${key}`] = value;
  });
  
  // Typography
  Object.entries(theme.typography.fonts).forEach(([key, value]) => {
    properties[`--font-${key}`] = value;
  });
  
  Object.entries(theme.typography.sizes).forEach(([key, value]) => {
    properties[`--text-${key}`] = value;
  });
  
  Object.entries(theme.typography.lineHeights).forEach(([key, value]) => {
    properties[`--leading-${key}`] = value.toString();
  });
  
  Object.entries(theme.typography.weights).forEach(([key, value]) => {
    properties[`--font-${key}`] = value.toString();
  });
  
  // Spacing
  Object.entries(theme.spacing.components).forEach(([key, value]) => {
    properties[`--space-${key}`] = value;
  });
  
  // Effects
  Object.entries(theme.effects.borderRadius).forEach(([key, value]) => {
    properties[`--radius-${key}`] = value;
  });
  
  Object.entries(theme.effects.shadows).forEach(([key, value]) => {
    properties[`--shadow-${key}`] = value;
  });
  
  Object.entries(theme.effects.transitions).forEach(([key, value]) => {
    properties[`--transition-${key}`] = value;
  });
  
  Object.entries(theme.effects.blur).forEach(([key, value]) => {
    properties[`--blur-${key}`] = value;
  });
  
  return properties;
};