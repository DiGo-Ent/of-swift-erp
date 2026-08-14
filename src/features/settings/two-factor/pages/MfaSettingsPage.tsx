import React from 'react';
import { ShieldCheck, ShieldAlert, QrCode, Copy, Check, Lock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Loading } from '@/components/common/Loading';
import { OtpInput } from '@/components/common/OtpInput';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { PageContainer } from '@/components/common/PageContainer';
import { useMfaSettings } from '../hooks/useMfaSettings';

const MfaSettingsContent: React.FC = () => {
  const {
    loading,
    isEnrolling,
    verifiedFactor,
    enrollData,
    setEnrollData,
    verificationCode,
    setVerificationCode,
    isVerifying,
    error,
    successMsg,
    copiedSecret,
    handleStartEnrollment,
    handleActivate2FA,
    handleDisable2FA,
    handleCopySecret,
  } = useMfaSettings();

  if (loading) {
    return <Loading variant="card" size="md" message="Checking 2FA Security Status..." />;
  }

  return (
    <PageContainer maxWidth="960px">
      
      {/* Overview Status Banner */}
      <div className="erp-card" style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 220px', minWidth: 0 }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: verifiedFactor ? 'var(--green-bg)' : 'var(--amber-bg)',
              color: verifiedFactor ? 'var(--green-success)' : 'var(--amber-warning)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {verifiedFactor ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
            </div>

            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                  Two-Factor Authentication (2MFA)
                </h3>
                <span className={verifiedFactor ? 'erp-badge erp-badge-green' : 'erp-badge erp-badge-amber'} style={{ fontSize: '10px', padding: '1px 6px', flexShrink: 0 }}>
                  {verifiedFactor ? 'Active' : 'Disabled'}
                </span>
              </div>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                Secure your ERP workspace using TOTP Authenticator apps (Google Authenticator, Authy).
              </p>
            </div>
          </div>

          {verifiedFactor ? (
            <Button variant="secondary" onClick={handleDisable2FA} isLoading={isEnrolling} style={{ color: 'var(--red-danger)', borderColor: 'var(--red-danger)', fontSize: '12px', padding: '6px 12px', flexShrink: 0, marginLeft: 'auto' }}>
              Disable 2FA
            </Button>
          ) : !enrollData ? (
            <Button variant="primary" onClick={handleStartEnrollment} isLoading={isEnrolling} style={{ fontSize: '12px', padding: '8px 14px', flexShrink: 0, marginLeft: 'auto' }}>
              <QrCode size={14} />
              <span>Enable 2FA Security</span>
            </Button>
          ) : null}
        </div>
      </div>

      {/* Alert Notifications */}
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

      {/* 2-Column Enrollment Layout */}
      {enrollData && !verifiedFactor && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
          
          {/* Step 1: Scan QR Code */}
          <div className="erp-card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--blue-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <QrCode size={14} /> Step 1: Scan QR Code
              </h4>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Open Google Authenticator or Authy app and scan code below.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '12px 8px', background: 'var(--bg-cream)', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)' }}>
              <div style={{ background: '#FFFFFF', padding: '8px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {enrollData.qrCodeSvg.startsWith('data:') ? (
                  <img src={enrollData.qrCodeSvg} alt="2FA QR Code" style={{ width: '150px', height: '150px', display: 'block', objectFit: 'contain' }} />
                ) : (
                  <div style={{ width: '150px', height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} dangerouslySetInnerHTML={{ __html: enrollData.qrCodeSvg }} />
                )}
              </div>

              <div style={{ width: '100%', marginTop: '10px', textAlign: 'center' }}>
                <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Or Enter Key Manually
                </span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                  <code style={{ padding: '5px 8px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-primary)', wordBreak: 'break-all', maxWidth: '100%' }}>
                    {enrollData.secret}
                  </code>
                  <Button variant="secondary" onClick={handleCopySecret} style={{ padding: '4px 8px', fontSize: '10px', flexShrink: 0 }}>
                    {copiedSecret ? <Check size={11} color="var(--green-success)" /> : <Copy size={11} />}
                    <span>{copiedSecret ? 'Copied' : 'Copy'}</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Confirm 6-Digit Code */}
          <div className="erp-card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--blue-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lock size={14} /> Step 2: Confirm 6-Digit Code
              </h4>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Enter the 6-digit code generated by your app to complete setup.
              </p>
            </div>

            <form onSubmit={handleActivate2FA} style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
              <div style={{ padding: '14px 10px', background: 'var(--bg-cream)', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '8px', textAlign: 'center' }}>
                  6-Digit Verification Pin
                </label>
                <OtpInput length={6} value={verificationCode} onChange={setVerificationCode} disabled={isVerifying} />
                <span style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block', marginTop: '8px', textAlign: 'center' }}>
                  Code refreshes every 30 seconds in your app.
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 'auto', paddingTop: '6px', flexWrap: 'wrap' }}>
                <Button type="submit" variant="primary" isLoading={isVerifying} disabled={verificationCode.length < 6} style={{ flex: 1, minWidth: '140px', padding: '9px 12px', fontSize: '12px' }}>
                  <ShieldCheck size={14} />
                  <span>Activate 2FA Security</span>
                </Button>
                <Button type="button" variant="secondary" onClick={() => setEnrollData(null)} style={{ flex: 1, minWidth: '100px', padding: '9px 12px', fontSize: '11px' }}>
                  Cancel Setup
                </Button>
              </div>
            </form>
          </div>

        </div>
      )}
    </PageContainer>
  );
};

export const MfaSettingsPage: React.FC = () => {
  return (
    <ErrorBoundary>
      <MfaSettingsContent />
    </ErrorBoundary>
  );
};
