import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'erp_pwa_install_dismissed';

const isIos = () =>
  typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);

export const PwaInstallPrompt: React.FC = React.memo(() => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    if (isStandalone) return;
    if (localStorage.getItem(DISMISS_KEY) === '1') return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', () => setIsVisible(false));

    // Show the notice immediately on every eligible device.
    // If beforeinstallprompt arrives later, the card upgrades to a 1-click install button.
    const showTimer = window.setTimeout(() => setIsVisible(true), 600);


    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      if (iosTimer) window.clearTimeout(iosTimer);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setIsVisible(false);
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsVisible(false);
    setDeferredPrompt(null);
  };

  if (!isVisible) return null;

  return (
    <div
      role="dialog"
      aria-label="Install app"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        width: '340px',
        maxWidth: 'calc(100vw - 32px)',
        zIndex: 9000,
        padding: '20px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: '14px',
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.18)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
        <span
          style={{
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            padding: '3px 10px',
            borderRadius: '999px',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)'
          }}
        >
          Notice
        </span>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px', display: 'flex' }}
        >
          <X size={16} />
        </button>
      </div>

      <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3, margin: 0 }}>
        Install the ERP app
      </h4>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
        {deferredPrompt
          ? 'Add ERP Solution to your device for faster launch, offline access and an app icon on your home screen.'
          : 'On iPhone/iPad: tap the Share button, then choose “Add to Home Screen” to install ERP Solution.'}
      </p>

      {deferredPrompt && (
        <button
          type="button"
          onClick={handleInstallClick}
          style={{
            marginTop: '4px',
            alignSelf: 'flex-start',
            padding: '8px 14px',
            fontSize: '12px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#FFFFFF',
            background: 'var(--blue-primary)',
            border: '1px solid var(--blue-primary)',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          <Download size={14} />
          <span>Install app</span>
        </button>
      )}
    </div>
  );
});
