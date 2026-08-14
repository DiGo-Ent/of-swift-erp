import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      remove: (id: string) => void;
      reset: (id?: string) => void;
    };
  }
}

const SITE_KEY =
  (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined) || '0x4AAAAAAEICLQuDhvqObBW0';
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

let scriptPromise: Promise<void> | null = null;

/** Loads the Turnstile script exactly once per page-life, never during first paint. */
function loadScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    if (window.turnstile) return resolve();

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('turnstile-load-failed')), { once: true });
      return;
    }

    const s = document.createElement('script');
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => {
      scriptPromise = null;
      reject(new Error('turnstile-load-failed'));
    };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

/** Runs a callback when the browser is idle (low-end device friendly). */
function onIdle(fn: () => void): () => void {
  const ric = (window as any).requestIdleCallback as undefined | ((cb: () => void, o?: any) => number);
  if (ric) {
    const id = ric(fn, { timeout: 1500 });
    return () => (window as any).cancelIdleCallback?.(id);
  }
  const id = window.setTimeout(fn, 250);
  return () => window.clearTimeout(id);
}

interface TurnstileProps {
  onToken: (token: string | null) => void;
  /** Change this value to reset the widget without re-mounting it. */
  resetKey: number;
}

export function Turnstile({ onToken, resetKey }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | undefined>(undefined);
  const lastResetKey = useRef(resetKey);
  const cb = useRef(onToken);
  cb.current = onToken;

  const [failed, setFailed] = useState(false);

  // Mount the widget once — lazily, only when it is actually on screen and the
  // main thread is idle. Never re-created on re-renders (that was the slow path).
  useEffect(() => {
    let cancelled = false;
    let cancelIdle: (() => void) | undefined;
    const el = containerRef.current;
    if (!el) return;

    const start = () => {
      cancelIdle = onIdle(() => {
        if (cancelled) return;
        loadScript()
          .then(() => {
            if (cancelled || !containerRef.current || !window.turnstile) return;
            if (widgetIdRef.current) return;
            try {
              widgetIdRef.current = window.turnstile.render(containerRef.current, {
                sitekey: SITE_KEY,
                theme: 'light',
                size: 'normal',
                retry: 'auto',
                'retry-interval': 4000,
                'refresh-expired': 'auto',
                callback: (token: string) => cb.current(token),
                'expired-callback': () => cb.current(null),
                'timeout-callback': () => cb.current(null),
                'error-callback': () => {
                  cb.current(null);
                  return true; // let Turnstile handle/retry internally
                },
              });
            } catch {
              setFailed(true);
            }
          })
          .catch(() => {
            if (cancelled) return;
            setFailed(true);
            cb.current(null);
          });
      });
    };

    if (typeof IntersectionObserver === 'undefined') {
      start();
      return () => {
        cancelled = true;
        cancelIdle?.();
      };
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          start();
        }
      },
      { rootMargin: '200px' }
    );
    io.observe(el);

    return () => {
      cancelled = true;
      io.disconnect();
      cancelIdle?.();
      const id = widgetIdRef.current;
      widgetIdRef.current = undefined;
      if (id && window.turnstile) {
        try {
          window.turnstile.remove(id);
        } catch {
          /* widget already gone */
        }
      }
    };
  }, []);

  // Reset in place instead of destroying/recreating the iframe.
  useEffect(() => {
    if (lastResetKey.current === resetKey) return;
    lastResetKey.current = resetKey;
    const id = widgetIdRef.current;
    if (id && window.turnstile) {
      try {
        window.turnstile.reset(id);
      } catch {
        /* ignore */
      }
    }
  }, [resetKey]);

  return (
    <div style={{ minHeight: '65px', margin: '8px 0', display: 'flex', justifyContent: 'center' }}>
      <div ref={containerRef} style={{ width: '100%', display: 'flex', justifyContent: 'center' }} />
      {failed && (
        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--red-danger)', alignSelf: 'center' }}>
          Security check could not load. Please check your connection and refresh.
        </span>
      )}
    </div>
  );
}
