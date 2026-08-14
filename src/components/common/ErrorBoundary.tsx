import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ShieldCheck } from 'lucide-react';
import digoLogo from '@/assets/digo-logo.png';

interface Props {
  children: ReactNode;
  fallbackMode?: 'full' | 'compact';
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, error: null };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('React ErrorBoundary caught runtime error:', error, errorInfo);
  }

  private handleRefresh = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || 'An unexpected application runtime issue occurred.';

      return (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          background: 'var(--bg-cream)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          boxSizing: 'border-box'
        }}>
          <div className="erp-card" style={{
            width: '100%',
            maxWidth: '420px',
            padding: '24px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
            boxSizing: 'border-box'
          }}>
            {/* Header Branding */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', flexShrink: 0 }}>
              <img src={digoLogo} alt="DiGo Logo" style={{ width: '30px', height: '30px', objectFit: 'contain' }} />
              <div style={{ textAlign: 'left', minWidth: 0 }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--blue-primary)', lineHeight: 1.1, margin: 0 }}>
                  ERP Solution
                </h2>
                <span style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Powered by DiGo
                </span>
              </div>
            </div>

            {/* Icon */}
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'var(--red-bg)',
              color: 'var(--red-danger)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px',
              flexShrink: 0
            }}>
              <AlertTriangle size={20} />
            </div>

            {/* Title */}
            <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px', lineHeight: 1.25 }}>
              System Exception Safely Intercepted
            </h3>

            {/* Reassurance Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: 'var(--green-bg)',
              color: 'var(--green-success)',
              borderRadius: '16px',
              fontSize: '0.72rem',
              fontWeight: 700,
              lineHeight: 1.35,
              marginBottom: '14px',
              width: '100%',
              boxSizing: 'border-box',
              textAlign: 'center',
              wordBreak: 'break-word'
            }}>
              <ShieldCheck size={14} style={{ flexShrink: 0 }} />
              <span>Rest assured, your workspace state & data remain completely secure.</span>
            </div>

            {/* Reason Box */}
            <div style={{
              width: '100%',
              background: 'var(--bg-cream)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '8px 10px',
              marginBottom: '16px',
              textAlign: 'left',
              boxSizing: 'border-box',
              overflow: 'hidden'
            }}>
              <span style={{ fontSize: '0.64rem', fontWeight: 800, color: 'var(--red-danger)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '3px' }}>
                Technical Cause:
              </span>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-primary)', wordBreak: 'break-word', overflowWrap: 'anywhere', fontFamily: 'monospace', lineHeight: 1.35 }}>
                {errorMessage}
              </div>
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={this.handleRefresh}
              className="erp-btn erp-btn-primary"
              style={{
                width: '100%',
                padding: '9px 14px',
                fontSize: '12px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                background: 'var(--blue-primary)',
                borderColor: 'var(--blue-primary)',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={14} />
              <span>Refresh Page & Retry</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
