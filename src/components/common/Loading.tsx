import React from 'react';
import digoLogo from '@/assets/digo-logo.png';

export interface LoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'fullScreen' | 'card' | 'inline';
  color?: string;
}

const DOT_SIZES = {
  sm: { size: '4px', gap: '3px' },
  md: { size: '5px', gap: '4px' },
  lg: { size: '7px', gap: '5px' },
};

export const Loading: React.FC<LoadingProps> = ({
  message = 'Processing',
  size = 'md',
  variant = 'inline',
  color = 'var(--blue-primary)',
}) => {
  const cleanMessage = message.replace(/\.+$/, '');
  const { size: dSize, gap: dGap } = DOT_SIZES[size];

  const animatedDots = (
    <span className="erp-dot-pulse" style={{ gap: dGap, color: 'currentColor' }}>
      <span style={{ width: dSize, height: dSize, backgroundColor: 'currentColor' }} />
      <span style={{ width: dSize, height: dSize, backgroundColor: 'currentColor' }} />
      <span style={{ width: dSize, height: dSize, backgroundColor: 'currentColor' }} />
    </span>
  );

  // 1. Full-Screen Viewport Overlay Variant
  if (variant === 'fullScreen') {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--bg-cream)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: 'var(--font-main)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '20px',
          animation: 'pulse 1.8s ease-in-out infinite'
        }}>
          <img src={digoLogo} alt="DiGo Logo" style={{ width: '42px', height: '42px', objectFit: 'contain' }} />
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--blue-primary)', lineHeight: 1.1 }}>
              ERP Solution
            </h2>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Powered by DiGo
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', color }}>
          <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {cleanMessage}
          </span>
          {animatedDots}
        </div>
      </div>
    );
  }

  // 2. Card / Container Content Variant
  if (variant === 'card') {
    return (
      <div className="erp-card" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        background: 'var(--bg-surface)'
      }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 700, color, display: 'inline-flex', alignItems: 'center' }}>
          <span>{cleanMessage}</span>
          {animatedDots}
        </span>
      </div>
    );
  }

  // 3. Compact Inline Widget / Button Text Variant
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', color: 'currentColor' }}>
      <span>{cleanMessage}</span>
      {animatedDots}
    </span>
  );
};
