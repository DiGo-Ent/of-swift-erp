import React, { useState, useRef, useEffect } from 'react';
import { LogOut, Wifi, User, Sun, Moon, Monitor, ChevronDown, RefreshCw } from 'lucide-react';
import { useTheme, ThemeMode } from '@/context/ThemeContext';

export interface ProfileDropdownProps {
  userEmail?: string;
  showUserInfo?: boolean;
  onOpenTenantSelector?: () => void;
  onRequestSignOut?: () => void;
}

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: React.ReactNode }[] = [
  { mode: 'system', label: 'System (Auto)', icon: <Monitor size={14} /> },
  { mode: 'light', label: 'Light', icon: <Sun size={14} color="#F59E0B" /> },
  { mode: 'dark', label: 'Dark', icon: <Moon size={14} color="#60A5FA" /> },
];

export const ProfileDropdown: React.FC<ProfileDropdownProps> = React.memo(({
  userEmail,
  showUserInfo = true,
  onOpenTenantSelector,
  onRequestSignOut,
}) => {
  const { themeMode, setThemeMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userInitial = userEmail ? userEmail.charAt(0).toUpperCase() : 'U';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} style={{ position: 'relative', flexShrink: 0 }}>
      <button type="button" onClick={() => setIsOpen(!isOpen)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '3px 8px 3px 4px', cursor: 'pointer', color: 'var(--text-primary)' }} title="Account & Settings">
        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--blue-primary)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>
          {showUserInfo && userEmail ? userInitial : <User size={14} />}
        </div>
        <ChevronDown size={12} color="var(--text-muted)" />
      </button>

      {isOpen && (
        <div style={{ position: 'absolute', right: 0, top: '40px', width: '240px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)', zIndex: 200, padding: '6px 0' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-color)' }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', wordBreak: 'break-all' }}>{userEmail || 'ERP Workspace'}</p>
            <span className="erp-badge erp-badge-green" style={{ fontSize: '10px', marginTop: '4px' }}><Wifi size={10} /> PWA Live</span>
          </div>

          {onOpenTenantSelector && (
            <div style={{ padding: '6px 8px', borderBottom: '1px solid var(--border-color)' }}>
              <button type="button" onClick={() => { setIsOpen(false); onOpenTenantSelector(); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', borderRadius: '4px', border: 'none', background: 'transparent', color: 'var(--blue-primary)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                <RefreshCw size={13} />
                <span>Switch Workspace</span>
              </button>
            </div>
          )}

          <div style={{ padding: '8px 14px', borderBottom: onRequestSignOut ? '1px solid var(--border-color)' : 'none' }}>
            <p style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Theme Mode</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {THEME_OPTIONS.map((opt) => (
                <button key={opt.mode} type="button" onClick={() => setThemeMode(opt.mode)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', borderRadius: '4px', border: 'none', background: themeMode === opt.mode ? 'var(--blue-subtle)' : 'transparent', color: themeMode === opt.mode ? 'var(--blue-primary)' : 'var(--text-primary)', fontSize: '12px', fontWeight: themeMode === opt.mode ? 700 : 500, cursor: 'pointer', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {opt.icon}
                    <span>{opt.label}</span>
                  </div>
                  {themeMode === opt.mode && <span style={{ fontSize: '10px', color: 'var(--blue-primary)', fontWeight: 800 }}>✓</span>}
                </button>
              ))}
            </div>
          </div>

          {onRequestSignOut && (
            <div style={{ padding: '6px' }}>
              <button type="button" onClick={() => { setIsOpen(false); onRequestSignOut(); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '4px', border: 'none', background: 'transparent', color: 'var(--red-danger)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
