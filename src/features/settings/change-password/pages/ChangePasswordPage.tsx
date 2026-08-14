import React from 'react';
import { KeyRound, Lock, Eye, EyeOff, Check, X, AlertCircle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Turnstile } from '@/components/common/Turnstile';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { PageContainer } from '@/components/common/PageContainer';
import { useChangePassword } from '../hooks/useChangePassword';

const ChangePasswordContent: React.FC = () => {
  const {
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    captchaResetKey,
    setCaptchaToken,
    isCurrentVerified,
    isVerifying,
    isSubmitting,
    showCurrent,
    setShowCurrent,
    showNew,
    setShowNew,
    showConfirm,
    setShowConfirm,
    error,
    successMsg,
    validReqs,
    strengthLabel,
    strengthColor,
    strengthScore,
    isMatch,
    isMismatch,
    isFormValid,
    handleVerifyCurrentPassword,
    handleUpdatePassword,
    handleReset,
  } = useChangePassword();

  return (
    <PageContainer maxWidth="960px">
      
      {/* Overview Status Banner */}
      <div className="erp-card" style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: isCurrentVerified ? 'var(--green-bg)' : 'var(--blue-subtle)',
            color: isCurrentVerified ? 'var(--green-success)' : 'var(--blue-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <KeyRound size={20} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                Change Account Password
              </h3>
              <span className={isCurrentVerified ? 'erp-badge erp-badge-green' : 'erp-badge erp-badge-blue'} style={{ fontSize: '10px', padding: '1px 6px', flexShrink: 0 }}>
                {isCurrentVerified ? 'Step 2: New Password' : 'Step 1: Verification Required'}
              </span>
            </div>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.4, marginTop: '2px' }}>
              Verify your active current password first before creating your new password.
            </p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--red-danger)', background: 'var(--red-bg)', border: '1px solid #FECACA', borderRadius: 'var(--radius)', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AlertCircle size={14} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--green-success)', background: 'var(--green-bg)', border: '1px solid #BBF7D0', borderRadius: 'var(--radius)', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Check size={14} style={{ flexShrink: 0 }} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* STEP 1: Verify Current Password */}
      {!isCurrentVerified && (
        <form onSubmit={handleVerifyCurrentPassword} className="erp-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '500px' }}>
          <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--blue-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lock size={14} /> Step 1: Verify Current Password
            </h4>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Please enter your current active password and complete security verification.
            </p>
          </div>

          <div className="erp-input-group">
            <label className="erp-label">Current Active Password *</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type={showCurrent ? 'text' : 'password'}
                className="erp-input"
                placeholder="Enter your current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                autoFocus
                disabled={isVerifying}
                style={{ paddingRight: '36px' }}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
              >
                {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div>
            <label className="erp-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={12} color="var(--blue-primary)" /> Security Verification
            </label>
            <Turnstile onToken={setCaptchaToken} resetKey={captchaResetKey} />
          </div>

          <Button type="submit" variant="primary" isLoading={isVerifying} disabled={!currentPassword.trim()} style={{ width: '100%', padding: '9px 12px', fontSize: '12px' }}>
            <ShieldCheck size={14} />
            <span>Verify Password & Continue</span>
          </Button>
        </form>
      )}

      {/* STEP 2: Set New Password & Strength Indicators */}
      {isCurrentVerified && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
          
          <form onSubmit={handleUpdatePassword} className="erp-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--green-success)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={15} /> Step 2: Set New Password
                </h4>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Current password verified. Type your new password below.
                </p>
              </div>
              <button type="button" onClick={handleReset} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '10px', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
                Change Current
              </button>
            </div>

            <div className="erp-input-group">
              <label className="erp-label">New Password *</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showNew ? 'text' : 'password'}
                  className="erp-input"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  autoFocus
                  style={{ paddingRight: '36px' }}
                />
                <button type="button" onClick={() => setShowNew(!showNew)} style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
                  {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div className="erp-input-group">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label className="erp-label">Confirm New Password *</label>
                {isMatch && <span className="erp-badge erp-badge-green" style={{ fontSize: '9px', padding: '1px 5px' }}>✓ Match</span>}
                {isMismatch && <span className="erp-badge erp-badge-red" style={{ fontSize: '9px', padding: '1px 5px' }}>✕ Mismatch</span>}
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  className="erp-input"
                  placeholder="Re-type new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  style={{ paddingRight: '36px', borderColor: isMatch ? 'var(--green-success)' : isMismatch ? 'var(--red-danger)' : undefined }}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
                  {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 'auto', paddingTop: '8px', flexWrap: 'wrap' }}>
              <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={!isFormValid} style={{ flex: 1, minWidth: '140px', padding: '9px 12px', fontSize: '12px' }}>
                <ShieldCheck size={14} />
                <span>Update Password</span>
              </Button>
              <Button type="button" variant="secondary" onClick={handleReset} style={{ flex: 1, minWidth: '90px', padding: '9px 12px', fontSize: '11px' }}>
                Cancel
              </Button>
            </div>
          </form>

          {/* Password Strength Panel */}
          <div className="erp-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--bg-cream)' }}>
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--blue-primary)' }}>
                Password Strength Indicator
              </h4>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Follow indicators below to build a strong secure password.
              </p>
            </div>

            <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)' }}>Overall Strength:</span>
                <span style={{ fontSize: '11px', fontWeight: 800, color: strengthColor }}>{newPassword ? strengthLabel : 'Not Entered'}</span>
              </div>
              
              <div style={{ width: '100%', height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${newPassword ? strengthScore : 0}%`, height: '100%', backgroundColor: strengthColor, transition: 'width 0.25s ease, background-color 0.25s ease' }} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Security Requirements:</span>

              {validReqs.map((req) => (
                <div key={req.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', borderRadius: '6px', background: req.isValid ? 'var(--green-bg)' : 'var(--bg-surface)', border: req.isValid ? '1px solid #BBF7D0' : '1px solid var(--border-color)', color: req.isValid ? 'var(--green-success)' : 'var(--text-muted)', fontSize: '11px', fontWeight: req.isValid ? 700 : 500 }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: req.isValid ? 'var(--green-success)' : 'var(--border-color)', color: req.isValid ? '#FFFFFF' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {req.isValid ? <Check size={10} /> : <X size={10} />}
                  </div>
                  <span>{req.label}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </PageContainer>
  );
};

export const ChangePasswordPage: React.FC = () => {
  return (
    <ErrorBoundary>
      <ChangePasswordContent />
    </ErrorBoundary>
  );
};
