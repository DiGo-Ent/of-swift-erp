import React, { useState, useRef, useEffect } from 'react';
import { ChevronsUpDown, Check } from 'lucide-react';
import { Loading } from './Loading';

export interface DropdownAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  color?: string;
}

export interface DropdownItem {
  id: string;
  name: string;
}

export interface HeaderDropdownProps {
  buttonTitle: string;
  headerTitle: string;
  buttonIcon: React.ReactNode;
  items: DropdownItem[];
  selectedId?: string;
  isLoading?: boolean;
  emptyMessage?: string;
  onSelect: (item: DropdownItem) => void;
  actions?: DropdownAction[];
  maxWidth?: string;
}

export const HeaderDropdown: React.FC<HeaderDropdownProps> = React.memo(({
  buttonTitle,
  headerTitle,
  buttonIcon,
  items,
  selectedId,
  isLoading = false,
  emptyMessage = 'No items found',
  onSelect,
  actions = [],
  maxWidth = '120px'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 48, left: 12 });
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({ top: rect.bottom + 4, left: Math.max(12, Math.min(rect.left, window.innerWidth - 260)) });
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative', flexShrink: 0 }}>
      <button ref={buttonRef} type="button" onClick={handleToggle} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: isOpen ? 'var(--blue-subtle)' : 'var(--bg-cream)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', transition: 'background-color 0.15s ease', whiteSpace: 'nowrap' }} title={buttonTitle}>
        {buttonIcon}
        <span style={{ maxWidth, overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block' }}>{buttonTitle}</span>
        <ChevronsUpDown size={12} color="var(--text-muted)" style={{ flexShrink: 0 }} />
      </button>

      {isOpen && (
        <div style={{ position: 'fixed', top: `${position.top}px`, left: `${position.left}px`, width: '250px', maxWidth: 'calc(100vw - 24px)', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', boxShadow: '0 10px 30px rgba(0,0,0,0.18)', zIndex: 9999, padding: '6px 0' }}>
          <div style={{ padding: '6px 12px', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{headerTitle}</div>
          {isLoading ? (
            <div style={{ padding: '12px 8px', overflow: 'hidden' }}><Loading variant="card" size="sm" message="Loading..." /></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '4px', maxHeight: '220px', overflowY: 'auto' }}>
              {items.length === 0 ? (
                <div style={{ padding: '8px', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>{emptyMessage}</div>
              ) : (
                items.map((item) => {
                  const isSelected = selectedId === item.id;
                  return (
                    <button key={item.id} type="button" onClick={() => { onSelect(item); setIsOpen(false); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', borderRadius: '4px', border: 'none', background: isSelected ? 'var(--blue-subtle)' : 'transparent', color: isSelected ? 'var(--blue-primary)' : 'var(--text-primary)', fontSize: '12px', fontWeight: isSelected ? 700 : 500, cursor: 'pointer', width: '100%', textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                        {buttonIcon}
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</span>
                      </div>
                      {isSelected && <Check size={13} color="var(--blue-primary)" />}
                    </button>
                  );
                })
              )}
            </div>
          )}
          {actions.length > 0 && (
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '4px', padding: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {actions.map((act, idx) => (
                <button key={idx} type="button" onClick={() => { setIsOpen(false); act.onClick(); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 8px', borderRadius: '4px', border: 'none', background: 'transparent', color: act.color || 'var(--blue-primary)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', width: '100%' }}>
                  {act.icon}
                  <span>{act.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
