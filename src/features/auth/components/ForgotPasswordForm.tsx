import React, { useState } from 'react';
import { Mail, Send, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { formatAuthError } from '@/features/auth/services/authService';

interface ForgotPasswordFormProps {
  onSubmit: (email: string) => Promise<string>;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const msg = await onSubmit(email);
      setSuccessMessage(msg);
    } catch (err: any) {
      setError(formatAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail size={14} />}
            required
            autoFocus
          />

          <Button type="submit" variant="primary" isLoading={isSubmitting} style={{ width: '100%' }}>
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
