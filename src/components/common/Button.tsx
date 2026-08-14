import React from 'react';
import { Loading } from './Loading';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'icon';
  isLoading?: boolean;
  children: React.ReactNode;
}

const VARIANT_CLASSES: Record<string, string> = {
  primary: 'erp-btn-primary',
  secondary: 'erp-btn-secondary',
  outline: 'erp-btn-outline',
  icon: 'erp-btn-icon',
};

export const Button: React.FC<ButtonProps> = React.memo(({
  variant = 'primary',
  isLoading = false,
  children,
  className = '',
  disabled,
  ...props
}) => (
  <button
    className={`erp-btn ${VARIANT_CLASSES[variant]} ${className}`}
    disabled={disabled || isLoading}
    {...props}
  >
    {isLoading ? (
      <Loading size="sm" variant="inline" message="Processing" color="currentColor" />
    ) : (
      children
    )}
  </button>
));
