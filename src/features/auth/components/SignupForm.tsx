import React, { useState } from 'react';
import { Mail, Lock, UserCheck, ShieldCheck, AlertCircle } from 'lucide-react';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Turnstile } from '@/components/common/Turnstile';
import { SignupCredentials } from '@/types/auth.types';
import { formatAuthError } from '@/features/auth/services/authService';

interface SignupFormProps {
  onSubmit: (credentials: SignupCredentials) => Promise<any>;
  onSwitchToLogin: () => void;
  error?: string | null;
}

export const SignupForm: React.FC<SignupFormProps> = ({
  onSubmit,
  onSwitchToLogin,
  error
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
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
    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters long.');
      return;
    }
    if (!captchaToken) {
      setLocalError('Please complete the security verification before continuing.');
      return;
    }

    setIsSubmitting(true);
    setLocalError(null);
    setSuccessMsg(null);
    try {
      const res = await onSubmit({
        email: cleanEmail,
        password,
        captchaToken
      });
      if (res?.requiresEmailConfirmation) {
        setSuccessMsg('Account created! Check your email to confirm registration.');
      }
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
        label="Email"
        type="email"
        placeholder="e.g. name@company.com"
        value={email}
        onChange={(e) => { setEmail(e.target.value); if (localError) setLocalError(null); }}
        icon={<Mail size={14} />}
        autoComplete="email"
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
        placeholder="Minimum 8 characters"
        value={password}
        onChange={(e) => { setPassword(e.target.value); if (localError) setLocalError(null); }}
        icon={<Lock size={14} />}
        autoComplete="new-password"
        minLength={8}
        maxLength={128}
        required
      />

      <div>
        <label className="erp-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <ShieldCheck size={12} color="var(--blue-primary)" /> Security Verification
        </label>
        <Turnstile onToken={setCaptchaToken} resetKey={captchaResetKey} />
      </div>

      {/* Create Account Submit Button */}
      <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting} style={{ width: '100%', marginTop: '4px' }}>
        <UserCheck size={14} />
        <span>Create Account</span>
      </Button>


      {/* Compact User-Friendly Error Message DIRECTLY BELOW Register Button */}
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

      {/* Success Notification */}
      {successMsg && (
        <div style={{
          marginTop: '6px',
          fontSize: '11px',
          fontWeight: 600,
          color: 'var(--green-success)',
          background: 'var(--green-bg)',
          border: '1px solid #BBF7D0',
          borderRadius: 'var(--radius)',
          padding: '6px 10px',
          textAlign: 'left'
        }}>
          {successMsg}
        </div>
      )}

      <div style={{ textAlign: 'left', marginTop: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
        Already registered?{' '}
        <button 
          type="button" 
          onClick={onSwitchToLogin} 
          style={{ background: 'none', border: 'none', color: 'var(--blue-primary)', fontWeight: 700, cursor: 'pointer' }}
        >
          Sign In
        </button>
      </div>
    </form>
  );
};
