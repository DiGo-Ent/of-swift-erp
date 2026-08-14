import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';

interface RefreshButtonProps {
  /** True while any workspace query is fetching (background poll, focus refetch or manual). */
  isSyncing: boolean;
  /** Timestamp (ms) of the last successful sync, used for the tooltip. */
  lastSyncedAt: number | null;
  onRefresh: () => void;
}

const MIN_SPIN_MS = 500;
const JUST_SYNCED_MS = 1200;

function relativeTime(ts: number | null): string {
  if (!ts) return 'Not synced yet';
  const seconds = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (seconds < 5) return 'Last synced: just now';
  if (seconds < 60) return `Last synced: ${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  return `Last synced: ${minutes}m ago`;
}

/**
 * Supabase-style sync indicator: spins on its own whenever data is being
 * re-fetched in the background, flashes green right after a sync completes,
 * and triggers a manual refresh on click. It never creates extra requests of
 * its own beyond the explicit click.
 */
export const RefreshButton: React.FC<RefreshButtonProps> = ({ isSyncing, lastSyncedAt, onRefresh }) => {
  // Keeps the spin visible long enough to be noticed even on very fast fetches.
  const [isSpinning, setIsSpinning] = useState(isSyncing);
  const [justSynced, setJustSynced] = useState(false);
  const spinStartedAt = useRef<number>(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    if (isSyncing) {
      spinStartedAt.current = Date.now();
      setJustSynced(false);
      setIsSpinning(true);
    } else if (isSpinning) {
      const elapsed = Date.now() - spinStartedAt.current;
      const wait = Math.max(0, MIN_SPIN_MS - elapsed);
      timer = setTimeout(() => {
        setIsSpinning(false);
        setJustSynced(true);
      }, wait);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isSyncing, isSpinning]);

  useEffect(() => {
    if (!justSynced) return;
    const timer = setTimeout(() => setJustSynced(false), JUST_SYNCED_MS);
    return () => clearTimeout(timer);
  }, [justSynced]);

  const color = isSpinning
    ? 'var(--blue-primary)'
    : justSynced
      ? 'var(--green-success, #16A34A)'
      : 'var(--text-muted)';

  return (
    <button
      type="button"
      onClick={onRefresh}
      disabled={isSpinning}
      aria-label="Refresh data"
      aria-busy={isSpinning}
      title={isSpinning ? 'Syncing...' : relativeTime(lastSyncedAt)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '28px',
        height: '28px',
        flexShrink: 0,
        borderRadius: 'var(--radius, 6px)',
        border: '1px solid var(--border-color)',
        background: 'var(--bg-surface)',
        color,
        cursor: isSpinning ? 'default' : 'pointer',
        transition: 'color 0.2s ease, border-color 0.2s ease',
      }}
    >
      <RefreshCw size={14} className={isSpinning ? 'spin-animation' : undefined} />
    </button>
  );
};
