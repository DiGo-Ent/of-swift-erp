// Guarded PWA Service Worker registration.
// Never registers in dev, iframes, or Lovable preview hosts.

const SW_URL = '/sw.js';

function isBlockedContext(): boolean {
  if (!import.meta.env.PROD) return true;
  if (window.self !== window.top) return true;
  const host = window.location.hostname;
  if (host.startsWith('id-preview--') || host.startsWith('preview--')) return true;
  if (host === 'lovableproject.com' || host.endsWith('.lovableproject.com')) return true;
  if (host === 'lovableproject-dev.com' || host.endsWith('.lovableproject-dev.com')) return true;
  if (host === 'beta.lovable.dev' || host.endsWith('.beta.lovable.dev')) return true;
  if (new URLSearchParams(window.location.search).get('sw') === 'off') return true;
  return false;
}

async function unregisterAppServiceWorkers() {
  if (!('serviceWorker' in navigator)) return;
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.allSettled(
    registrations
      .filter((r) => (r.active?.scriptURL || r.installing?.scriptURL || '').endsWith(SW_URL))
      .map((r) => r.unregister())
  );
}

export function registerServiceWorker(onUpdateFound?: () => void) {
  if (!('serviceWorker' in navigator)) return;

  if (isBlockedContext()) {
    void unregisterAppServiceWorkers();
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(SW_URL)
      .then((registration) => {
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              onUpdateFound?.();
            }
          };
        };
      })
      .catch(() => {
        /* registration failures must never break the app */
      });
  });
}

export function reloadAppForUpdate() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) registration.update();
    });
  }
  window.location.reload();
}
