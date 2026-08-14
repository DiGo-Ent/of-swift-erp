import React from 'react';

export interface PageContainerProps {
  children: React.ReactNode;
  maxWidth?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  maxWidth = '1200px',
  className = '',
  style = {},
}) => {
  return (
    <div
      className={`erp-page-view ${className}`}
      style={{ maxWidth, ...style }}
    >
      {children}
    </div>
  );
};

export interface PageBannerProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  badgeText?: string;
  badgeVariant?: 'blue' | 'green' | 'amber' | 'red';
  actions?: React.ReactNode;
  className?: string;
}

export const PageBanner: React.FC<PageBannerProps> = ({
  icon,
  title,
  description,
  badgeText,
  badgeVariant = 'blue',
  actions,
  className = '',
}) => {
  return (
    <div className={`erp-banner-card ${className}`}>
      <div className="erp-banner-body">
        {icon && (
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'var(--blue-subtle)',
            color: 'var(--blue-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            {icon}
          </div>
        )}
        <div className="erp-banner-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '2px' }}>
            <h2 style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {title}
            </h2>
            {badgeText && (
              <span className={`erp-badge erp-badge-${badgeVariant}`} style={{ fontSize: '10px', padding: '1px 6px', flexShrink: 0 }}>
                {badgeText}
              </span>
            )}
          </div>
          {description && (
            <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              {description}
            </p>
          )}
        </div>
      </div>

      {actions && (
        <div className="erp-banner-actions">
          {actions}
        </div>
      )}
    </div>
  );
};
