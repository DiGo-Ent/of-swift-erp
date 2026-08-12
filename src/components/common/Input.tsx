import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = React.memo(({
  label,
  error,
  icon,
  className = '',
  id,
  style,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="erp-input-group">
      {label && (
        <label htmlFor={inputId} className="erp-label">
          {label}
        </label>
      )}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {icon && (
          <div style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={`erp-input ${className}`}
          style={{ paddingLeft: icon ? '38px' : '12px', ...style }}
          {...props}
        />
      </div>
      {error && (
        <span style={{ fontSize: '11px', color: 'var(--red-danger)', fontWeight: 600, marginTop: '2px' }}>
          {error}
        </span>
      )}
    </div>
  );
});
