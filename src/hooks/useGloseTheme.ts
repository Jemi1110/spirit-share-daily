import { useEffect, useMemo } from 'react';
import { gloseTheme, generateCSSCustomProperties, createGradient, ThemeConfig } from '../styles/theme';

export const useGloseTheme = () => {
  const cssProperties = useMemo(() => generateCSSCustomProperties(gloseTheme), []);

  // Apply CSS custom properties to the document root
  useEffect(() => {
    const root = document.documentElement;
    
    Object.entries(cssProperties).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });

    // Cleanup function to remove properties if needed
    return () => {
      Object.keys(cssProperties).forEach((property) => {
        root.style.removeProperty(property);
      });
    };
  }, [cssProperties]);

  // Utility functions for components
  const getGradient = (gradientKey: keyof ThemeConfig['colors']['gradients'], direction = '135deg') => {
    const colors = gloseTheme.colors.gradients[gradientKey];
    return createGradient(colors, direction);
  };

  const getGlassmorphismStyle = (variant: 'subtle' | 'normal' | 'strong' = 'normal') => {
    const variants = {
      subtle: {
        background: 'rgba(255, 255, 255, 0.6)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: gloseTheme.effects.borderRadius.xl,
        boxShadow: gloseTheme.effects.shadows.elevated,
      },
      normal: {
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: gloseTheme.effects.borderRadius['2xl'],
        boxShadow: gloseTheme.effects.shadows.floating,
      },
      strong: {
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        borderRadius: gloseTheme.effects.borderRadius['2xl'],
        boxShadow: gloseTheme.effects.shadows.floating,
      },
    };

    return variants[variant];
  };

  const getReadingTypographyStyle = () => ({
    fontFamily: gloseTheme.typography.fonts.serif,
    fontSize: gloseTheme.typography.sizes.content,
    lineHeight: gloseTheme.typography.lineHeights.content,
    color: gloseTheme.colors.text.primary,
    textAlign: 'justify' as const,
    hyphens: 'auto' as const,
    textRendering: 'optimizeLegibility' as const,
    fontFeatureSettings: '"liga", "kern"',
  });

  const getNavigationButtonStyle = (disabled = false) => ({
    width: '2.5rem',
    height: '2.5rem',
    borderRadius: gloseTheme.effects.borderRadius.full,
    border: `1px solid ${gloseTheme.colors.borders.medium}`,
    background: 'rgba(255, 255, 255, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: gloseTheme.effects.transitions.medium,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.3 : 1,
  });

  const getContentContainerStyle = () => ({
    background: gloseTheme.colors.backgrounds.content,
    borderRadius: gloseTheme.effects.borderRadius.xl,
    padding: gloseTheme.spacing.containers.padding,
    margin: gloseTheme.spacing.containers.margin,
    boxShadow: gloseTheme.effects.shadows.elevated,
    border: `1px solid ${gloseTheme.colors.borders.subtle}`,
  });

  const getLoadingSpinnerStyle = () => ({
    width: '3.75rem',
    height: '3.75rem',
    border: '4px solid rgba(255, 255, 255, 0.3)',
    borderTop: '4px solid white',
    borderRadius: gloseTheme.effects.borderRadius.full,
    animation: 'spin 1s linear infinite',
  });

  return {
    theme: gloseTheme,
    cssProperties,
    // Utility functions
    getGradient,
    getGlassmorphismStyle,
    getReadingTypographyStyle,
    getNavigationButtonStyle,
    getContentContainerStyle,
    getLoadingSpinnerStyle,
    // Direct access to theme values
    colors: gloseTheme.colors,
    typography: gloseTheme.typography,
    spacing: gloseTheme.spacing,
    effects: gloseTheme.effects,
  };
};

// CSS class name utilities
export const gloseClasses = {
  // Glassmorphism
  glassmorphism: 'glassmorphism',
  glassmorphismSubtle: 'glassmorphism-subtle',
  glassmorphismStrong: 'glassmorphism-strong',
  
  // Gradients
  gradientPrimary: 'gradient-primary',
  gradientSecondary: 'gradient-secondary',
  gradientAccent: 'gradient-accent',
  gradientLoading: 'gradient-loading',
  gradientSuccess: 'gradient-success',
  gradientSidebar: 'gradient-sidebar',
  
  // Content
  contentContainer: 'content-container',
  readingTypography: 'reading-typography',
  
  // Navigation
  navButton: 'nav-button',
  pageIndicator: 'page-indicator',
  
  // Sidebar
  sidebarHeader: 'sidebar-header',
  sidebarIcon: 'sidebar-icon',
  participantItem: 'participant-item',
  participantAvatar: 'participant-avatar',
  statusIndicator: 'status-indicator',
  statusOnline: 'status-online',
  statusOffline: 'status-offline',
  
  // Chapters
  chapterItem: 'chapter-item',
  chapterActive: 'chapter-active',
  chapterNumber: 'chapter-number',
  
  // Loading
  loadingContainer: 'loading-container',
  loadingSpinner: 'loading-spinner',
  progressBar: 'progress-bar',
  progressFill: 'progress-fill',
  
  // Chapter content
  chapterHeader: 'chapter-header',
  chapterFooter: 'chapter-footer',
  
  // Animations
  fadeIn: 'fade-in',
  slideIn: 'slide-in',
};