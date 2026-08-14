import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, ChevronDown } from 'lucide-react';
import { useTheme, ThemeMode } from '@/context/ThemeContext';

const OPTIONS: { mode: ThemeMode; label: string; icon: React.ReactNode }[] = [
  { mode: 'light', label: 'Light', icon: <Sun size={14} color="#F59E0B" /> },
  { mode: 'dark', label: 'Dark', icon: <Moon size={14} color="#6366F1" /> },
  { mode: 'system', label: 'System (Auto)', icon: <Monitor size={14} color="var(--text-muted)" /> },
];

export const ThemeToggle: React.FC = () => {
  const { themeMode, resolvedTheme, setThemeMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentOption = OPTIONS.find((o) => o.mode === themeMode) || OPTIONS[2];

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        className="erp-btn erp-btn-secondary"
        onClick={() => setIsOpen(!isOpen)}
        style={{ padding: '5px 10px', fontSize: '12px', gap: '6px', height: '32px' }}
        title={`Theme: ${currentOption.label}`}
      >
        {resolvedTheme === 'dark' ? <Moon size={14} color="#60A5FA" /> : <Sun size={14} color="#F59E0B" />}
        <span style={{ fontSize: '11px', fontWeight: 600 }}>{currentOption.label}</span>
        <ChevronDown size={12} />
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          right: 0,
          top: '36px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 100,
          minWidth: '130px',
          padding: '4px'
        }}>
          {OPTIONS.map((opt) => (
            <button
              key={opt.mode}
              type="button"
              onClick={() => {
                setThemeMode(opt.mode);
                setIsOpen(false);
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 10px',
                fontSize: '12px',
                fontWeight: themeMode === opt.mode ? 700 : 500,
                background: themeMode === opt.mode ? 'var(--blue-subtle)' : 'transparent',
                color: themeMode === opt.mode ? 'var(--blue-primary)' : 'var(--text-primary)',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {opt.icon}
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
