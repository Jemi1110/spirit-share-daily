import React from 'react';
import { useGloseTheme } from '../hooks/useGloseTheme';

export interface GlassmorphismContainerProps {
  children: React.ReactNode;
  variant?: 'subtle' | 'medium' | 'strong';
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  role?: string;
  'aria-label'?: string;
  'data-testid'?: string;
}

/**
 * GlassmorphismContainer - A reusable container component with glassmorphism effects
 * 
 * Features:
 * - Backdrop blur effects with semi-transparent backgrounds
 * - Subtle borders and elevated shadows for depth
 * - Rounded corner styling with proper border radius
 * - Three variants: subtle, medium (default), and strong
 * - Responsive design with proper fallbacks
 */
export const GlassmorphismContainer: React.FC<GlassmorphismContainerProps> = ({
  children,
  variant = 'medium',
  className = '',
  style = {},
  onClick,
  onMouseEnter,
  onMouseLeave,
  role,
  'aria-label': ariaLabel,
  'data-testid': dataTestId,
}) => {
  const theme = useGloseTheme();

  // Define variant-specific styles
  const variantStyles = {
    subtle: {
      background: 'rgba(255, 255, 255, 0.6)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      borderRadius: theme.effects.borderRadius.xl,
      boxShadow: theme.effects.shadows.elevated,
    },
    medium: {
      background: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: theme.effects.borderRadius['2xl'],
      boxShadow: theme.effects.shadows.floating,
    },
    strong: {
      background: 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      borderRadius: theme.effects.borderRadius['2xl'],
      boxShadow: theme.effects.shadows.floating,
    },
  };

  const containerStyle: React.CSSProperties = {
    ...variantStyles[variant],
    transition: theme.effects.transitions.medium,
    position: 'relative',
    overflow: 'hidden',
    ...style,
  };

  // Add hover effects if onClick is provided
  const interactiveStyles = onClick ? {
    cursor: 'pointer',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: theme.effects.shadows.glow,
    }
  } : {};

  return (
    <div
      className={`glassmorphism-container ${className}`}
      style={containerStyle}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role={role}
      aria-label={ariaLabel}
      data-testid={dataTestId}
    >
      {children}
    </div>
  );
};

export default GlassmorphismContainer;