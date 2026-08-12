import React, { useState } from 'react';
import { Header } from '@/components/common/Header';
import { LoginForm } from '../components/LoginForm';
import { SignupForm } from '../components/SignupForm';
import { ForgotPasswordForm } from '../components/ForgotPasswordForm';
import { MfaVerifyForm } from '../components/MfaVerifyForm';
import { LoginCredentials, SignupCredentials } from '@/types/auth.types';

interface AuthPageProps {
  onLogin: (credentials: LoginCredentials) => Promise<any>;
  onSignup: (credentials: SignupCredentials) => Promise<any>;
  onForgotPassword: (email: string, captchaToken?: string | null) => Promise<string>;
  onVerifyMfa?: (code: string) => Promise<any>;
  onCancelMfa?: () => void;
  mfaFactor?: { factorId: string } | null;
  error?: string | null;
}

type AuthMode = 'login' | 'signup' | 'forgot';

export const AuthPage: React.FC<AuthPageProps> = ({
  onLogin,
  onSignup,
  onForgotPassword,
  onVerifyMfa,
  onCancelMfa,
  mfaFactor,
  error
}) => {
  const [mode, setMode] = useState<AuthMode>('login');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-cream)' }}>
      {/* Top Header Bar */}
      <Header showUserInfo={false} />

      {/* Main Centered Container */}
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px'
      }}>
        <div style={{ width: '100%', maxWidth: '390px' }}>
          <div className="erp-card" style={{ padding: '24px' }}>
            
            {/* Dynamic Welcoming Header Copy (No Emojis, Clean Text) */}
            {!mfaFactor && (
              <div style={{ textAlign: 'left', marginBottom: '16px' }}>
                {mode === 'login' && (
                  <>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Welcome Back
                    </h2>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Sign in to access your ERP Solution workspace
                    </p>
                  </>
                )}
                {mode === 'signup' && (
                  <>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Create Your Account
                    </h2>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Get started with ERP Solution powered by DiGo
                    </p>
                  </>
                )}
                {mode === 'forgot' && (
                  <>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Reset Password
                    </h2>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Enter your email address to receive recovery instructions.
                    </p>
                  </>
                )}
              </div>
            )}

            {/* 2FA MFA Verification or Native Form */}
            {mfaFactor && onVerifyMfa ? (
              <MfaVerifyForm
                onVerify={onVerifyMfa}
                onCancel={onCancelMfa || (() => {})}
                error={error}
              />
            ) : (
              <>
                {mode === 'login' && (
                  <LoginForm
                    onSubmit={onLogin}
                    onSwitchToSignup={() => setMode('signup')}
                    onSwitchToForgot={() => setMode('forgot')}
                    error={error}
                  />
                )}

                {mode === 'signup' && (
                  <SignupForm
                    onSubmit={onSignup}
                    onSwitchToLogin={() => setMode('login')}
                    error={error}
                  />
                )}

                {mode === 'forgot' && (
                  <ForgotPasswordForm
                    onSubmit={onForgotPassword}
                    onSwitchToLogin={() => setMode('login')}
                  />
                )}
              </>
            )}
          </div>

          <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Protected by Cloudflare Turnstile • Supabase Native Auth • TLS Secured
          </div>
        </div>
      </main>
    </div>
  );
};
