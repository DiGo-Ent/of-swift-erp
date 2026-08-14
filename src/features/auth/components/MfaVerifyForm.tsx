import React, { useState } from 'react';
import { ShieldAlert, ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { OtpInput } from '@/components/common/OtpInput';
import { formatAuthError } from '@/features/auth/services/authService';

interface MfaVerifyFormProps {
  onVerify: (code: string) => Promise<any>;
  onCancel: () => void;
  error?: string | null;
}

export const MfaVerifyForm: React.FC<MfaVerifyFormProps> = ({
  onVerify,
  onCancel,
  error
}) => {
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const executeVerify = async (otpToVerify: string) => {
    if (otpToVerify.length < 6 || isSubmitting) return;
    setIsSubmitting(true);
    setLocalError(null);
    try {
      await onVerify(otpToVerify.trim());
    } catch (err: any) {
      setLocalError(formatAuthError(err));
      // Mark first attempt as completed so next retries require manual button click
      setHasAttempted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpChange = (newCode: string) => {
    setCode(newCode);
    // Auto-submit on 6th digit ONLY for the first attempt
    if (newCode.length === 6 && !hasAttempted && !isSubmitting) {
      executeVerify(newCode);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeVerify(code);
  };

  const activeError = localError ? formatAuthError(localError) : error ? formatAuthError(error) : null;

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ textAlign: 'center', padding: '10px', background: 'var(--blue-subtle)', borderRadius: 'var(--radius)' }}>
        <ShieldAlert size={28} color="var(--blue-primary)" style={{ margin: '0 auto 6px' }} />
        <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--blue-primary)' }}>
          Two-Factor Authentication
        </h3>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
          Enter the 6-digit verification code from your authenticator app.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)' }}>
          6-Digit Security Code
        </label>
        <OtpInput
          length={6}
          value={code}
          onChange={handleOtpChange}
          disabled={isSubmitting}
        />
      </div>

      <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={code.length < 6} style={{ width: '100%', marginTop: '4px' }}>
        <span>Verify Code</span>
      </Button>

      {/* User-Friendly Error Message */}
      {activeError && (
        <div style={{
          marginTop: '2px',
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

      <div style={{ textAlign: 'center', marginTop: '2px' }}>
        <button 
          type="button" 
          onClick={onCancel} 
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
        >
          <ArrowLeft size={12} /> Cancel & Back to Login
        </button>
      </div>
    </form>
  );
};
