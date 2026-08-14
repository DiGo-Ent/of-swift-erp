import React, { useState } from 'react';
import { Mail, Send, ArrowLeft, CheckCircle, AlertCircle, ShieldCheck } from 'lucide-react';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Turnstile } from '@/components/common/Turnstile';
import { formatAuthError } from '@/features/auth/services/authService';

interface ForgotPasswordFormProps {
  onSubmit: (email: string, captchaToken?: string | null) => Promise<string>;
  onSwitchToLogin: () => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onSubmit,
  onSwitchToLogin
}) => {
  const [email, setEmail] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const cleanEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!captchaToken) {
      setError('Please complete the security verification before continuing.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const msg = await onSubmit(cleanEmail, captchaToken);
      setSuccessMessage(msg);
    } catch (err: any) {
      setError(formatAuthError(err));
      setCaptchaResetKey((k) => k + 1);
      setCaptchaToken(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {successMessage ? (
        <div style={{
          padding: '12px',
          background: 'var(--green-bg)',
          border: '1px solid #BBF7D0',
          borderRadius: 'var(--radius)',
          color: 'var(--green-success)',
          textAlign: 'left',
          fontSize: '12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '6px'
        }}>
          <CheckCircle size={20} />
          <span>{successMessage}</span>
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="erp-btn erp-btn-secondary"
            style={{ marginTop: '8px', fontSize: '11px', padding: '4px 10px' }}
          >
            Back to Sign In
          </button>
        </div>
      ) : (
        <>
          <Input
            label="Email Address"
            type="email"
            placeholder="e.g. name@company.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (error) setError(null); }}
            icon={<Mail size={14} />}
            autoComplete="email"
            inputMode="email"
            spellCheck={false}
            autoCapitalize="none"
            maxLength={255}
            required
            autoFocus
          />

          <div>
            <label className="erp-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={12} color="var(--blue-primary)" /> Security Verification
            </label>
            <Turnstile onToken={setCaptchaToken} resetKey={captchaResetKey} />
          </div>

          <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting} style={{ width: '100%' }}>
            <Send size={14} />
            <span>Send Reset Link</span>
          </Button>

          {/* Compact User-Friendly Error Message DIRECTLY BELOW Reset Button */}
          {error && (
            <div style={{
              marginTop: '4px',
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
              <span>{error}</span>
            </div>
          )}

          <div style={{ textAlign: 'left', marginTop: '4px' }}>
            <button 
              type="button" 
              onClick={onSwitchToLogin} 
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
            >
              <ArrowLeft size={12} /> Back to Sign In
            </button>
          </div>
        </>
      )}
    </form>
  );
};
