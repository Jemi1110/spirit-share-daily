import React from 'react';
import { GlassmorphismContainer } from '../GlassmorphismContainer';

/**
 * Example component demonstrating the usage of GlassmorphismContainer
 * This shows all three variants and different use cases
 */
export const GlassmorphismExample: React.FC = () => {
  return (
    <div style={{
      padding: '2rem',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      minHeight: '100vh'
    }}>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem', color: '#374151' }}>
        Glassmorphism Container Examples
      </h1>

      <div style={{
        display: 'grid',
        gap: '2rem',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>

        {/* Subtle Variant */}
        <GlassmorphismContainer
          variant="subtle"
          style={{ padding: '1.5rem' }}
        >
          <h3 style={{ margin: '0 0 1rem 0', color: '#111827' }}>Subtle Glassmorphism</h3>
          <p style={{ margin: 0, color: '#374151', lineHeight: 1.6 }}>
            This variant uses a lighter background with less blur, perfect for subtle overlays
            and secondary content areas. Great for tooltips and floating panels.
          </p>
        </GlassmorphismContainer>

        {/* Medium Variant (Default) */}
        <GlassmorphismContainer
          variant="medium"
          style={{ padding: '1.5rem' }}
        >
          <h3 style={{ margin: '0 0 1rem 0', color: '#111827' }}>Medium Glassmorphism</h3>
          <p style={{ margin: 0, color: '#374151', lineHeight: 1.6 }}>
            The default variant provides balanced transparency and blur effects.
            Ideal for main content containers, sidebars, and modal dialogs.
          </p>
        </GlassmorphismContainer>

        {/* Strong Variant */}
        <GlassmorphismContainer
          variant="strong"
          style={{ padding: '1.5rem' }}
        >
          <h3 style={{ margin: '0 0 1rem 0', color: '#111827' }}>Strong Glassmorphism</h3>
          <p style={{ margin: 0, color: '#374151', lineHeight: 1.6 }}>
            This variant offers maximum opacity and blur for important content that needs
            to stand out. Perfect for navigation bars and critical information panels.
          </p>
        </GlassmorphismContainer>

        {/* Interactive Example */}
        <GlassmorphismContainer
          variant="medium"
          style={{ padding: '1.5rem' }}
          onClick={() => alert('Glassmorphism container clicked!')}
          role="button"
          aria-label="Interactive glassmorphism example"
        >
          <h3 style={{ margin: '0 0 1rem 0', color: '#111827' }}>Interactive Container</h3>
          <p style={{ margin: 0, color: '#374151', lineHeight: 1.6 }}>
            Click me! This container demonstrates interactive capabilities with hover effects
            and proper accessibility attributes.
          </p>
        </GlassmorphismContainer>

        {/* Custom Styled Example */}
        <GlassmorphismContainer
          variant="subtle"
          style={{
            padding: '1.5rem',
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))',
          }}
        >
          <h3 style={{ margin: '0 0 1rem 0', color: '#111827' }}>Custom Background</h3>
          <p style={{ margin: 0, color: '#374151', lineHeight: 1.6 }}>
            You can customize the background while maintaining the glassmorphism effect.
            This example uses a subtle gradient overlay.
          </p>
        </GlassmorphismContainer>

        {/* Content with Icons Example */}
        <GlassmorphismContainer
          variant="medium"
          style={{ padding: '1.5rem' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{
              width: '3rem',
              height: '3rem',
              borderRadius: '1rem',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '1.25rem'
            }}>
              ✨
            </div>
            <h3 style={{ margin: 0, color: '#111827' }}>With Icon Content</h3>
          </div>
          <p style={{ margin: 0, color: '#374151', lineHeight: 1.6 }}>
            Glassmorphism containers work beautifully with icons and structured content,
            creating elegant user interface elements.
          </p>
        </GlassmorphismContainer>

      </div>
    </div>
  );
};

export default GlassmorphismExample;