import React, { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  /** Show/hide toggle. Defaults to true for password inputs. */
  showPasswordToggle?: boolean;
}

export const Input: React.FC<InputProps> = React.memo(({
  label,
  error,
  icon,
  className = '',
  id,
  style,
  type = 'text',
  showPasswordToggle,
  ...props
}) => {
  const reactId = useId();
  const inputId = id || `${(label ? label.toLowerCase().replace(/\s+/g, '-') : 'input')}-${reactId}`;

  const isPassword = type === 'password';
  const withToggle = isPassword && (showPasswordToggle ?? true);
  const [revealed, setRevealed] = useState(false);
  const resolvedType = withToggle && revealed ? 'text' : type;

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
          type={resolvedType}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={`erp-input ${className}`}
          style={{ paddingLeft: icon ? '38px' : '12px', paddingRight: withToggle ? '38px' : undefined, ...style }}
          {...props}
        />
        {withToggle && (
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            aria-label={revealed ? 'Hide password' : 'Show password'}
            aria-pressed={revealed}
            tabIndex={-1}
            style={{
              position: 'absolute',
              right: '8px',
              background: 'none',
              border: 'none',
              padding: '4px',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {revealed ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
      {error && (
        <span id={`${inputId}-error`} style={{ fontSize: '11px', color: 'var(--red-danger)', fontWeight: 600, marginTop: '2px' }}>
          {error}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';
