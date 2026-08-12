import React, { useState, useEffect } from 'react';
import { Download, X, Sparkles } from 'lucide-react';
import digoLogo from '@/assets/digo-logo.png';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PwaInstallPrompt: React.FC = React.memo(() => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if already running as installed standalone PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  if (!isVisible || isDismissed || !deferredPrompt) return null;

  return (
    <div
      className="erp-card"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        width: '320px',
        maxWidth: 'calc(100vw - 32px)',
        zIndex: 9000,
        padding: '16px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}
    >
      {/* Top Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          className="erp-badge erp-badge-blue"
          style={{ fontSize: '10px', padding: '2px 8px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <Sparkles size={11} />
          <span>INSTALL APP</span>
        </span>
        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px', display: 'flex', alignItems: 'center' }}
          title="Dismiss"
        >
          <X size={16} />
        </button>
      </div>

      {/* Main Body */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <img src={digoLogo} alt="DiGo Logo" style={{ width: '40px', height: '40px', objectFit: 'contain', flexShrink: 0, borderRadius: '8px' }} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.25, marginBottom: '4px' }}>
            Install ERP Solution App
          </h4>
          <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.35, margin: 0 }}>
            Get instant desktop & mobile access with offline capability and faster load times.
          </p>
        </div>
      </div>

      {/* Action Button */}
      <button
        type="button"
        onClick={handleInstallClick}
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
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        <Download size={14} />
        <span>Install App Now</span>
      </button>
    </div>
  );
});
