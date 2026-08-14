import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Turnstile } from '@/components/common/Turnstile';
import { LoginCredentials } from '@/types/auth.types';
import { formatAuthError } from '@/features/auth/services/authService';

interface LoginFormProps {
  onSubmit: (credentials: LoginCredentials) => Promise<void>;
  onSwitchToSignup: () => void;
  onSwitchToForgot: () => void;
  error?: string | null;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  onSwitchToSignup,
  onSwitchToForgot,
  error
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const cleanEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) {
      setLocalError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setLocalError('Please enter your password.');
      return;
    }
    if (!captchaToken) {
      setLocalError('Please complete the security verification before signing in.');
      return;
    }

    setIsSubmitting(true);
    setLocalError(null);
    try {
      await onSubmit({ email: cleanEmail, password, captchaToken });
    } catch (err: any) {
      setLocalError(formatAuthError(err));
      setCaptchaResetKey((k) => k + 1);
      setCaptchaToken(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeError = localError ? formatAuthError(localError) : error ? formatAuthError(error) : null;

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <Input
        label="Work Email Address"
        type="email"
        placeholder="Enter your registered email"
        value={email}
        onChange={(e) => { setEmail(e.target.value); if (localError) setLocalError(null); }}
        icon={<Mail size={14} />}
        autoComplete="username"
        inputMode="email"
        spellCheck={false}
        autoCapitalize="none"
        maxLength={255}
        required
        autoFocus
      />

      <Input
        label="Password"
        type="password"
        placeholder="Enter password"
        value={password}
        onChange={(e) => { setPassword(e.target.value); if (localError) setLocalError(null); }}
        icon={<Lock size={14} />}
        autoComplete="current-password"
        maxLength={128}
        required
      />

      {/* Cloudflare Turnstile Captcha Widget */}
      <div>
        <label className="erp-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <ShieldCheck size={12} color="var(--blue-primary)" /> Security Verification
        </label>
        <Turnstile onToken={setCaptchaToken} resetKey={captchaResetKey} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '12px' }}>
        <button 
          type="button" 
          onClick={onSwitchToForgot} 
          style={{ background: 'none', border: 'none', color: 'var(--blue-primary)', fontWeight: 600, cursor: 'pointer' }}
        >
          Forgot password?
        </button>
      </div>

      {/* Sign In Submit Button */}
      <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting} style={{ width: '100%', marginTop: '4px' }}>
        <span>Sign In</span>
        <ArrowRight size={14} />
      </Button>


      {/* Compact User-Friendly Error Message DIRECTLY BELOW Sign In Button */}
      {activeError && (
        <div style={{
          marginTop: '6px',
          fontSize: '11px',
          fontWeight: 600,
          color: 'var(--red-danger)',
          background: 'var(--red-bg)',
          border: '1px solid #FECACA',
          borderRadius: 'var(--radius)',
          padding: '6px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          lineHeight: 1.35
        }}>
          <AlertCircle size={14} style={{ flexShrink: 0 }} />
          <span>{activeError}</span>
        </div>
      )}

      <div style={{ textAlign: 'left', marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
        Don't have an account?{' '}
        <button 
          type="button" 
          onClick={onSwitchToSignup} 
          style={{ background: 'none', border: 'none', color: 'var(--blue-primary)', fontWeight: 700, cursor: 'pointer' }}
        >
          Create New Account
        </button>
      </div>
    </form>
  );
};
