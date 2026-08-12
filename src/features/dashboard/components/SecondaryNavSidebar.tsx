import React from 'react';
import { ChevronRight, ShieldCheck, Database, Layers } from 'lucide-react';
import { navigationConfig } from '@/config/navigationConfig';
import { navigateTo } from './PrimaryRailSidebar';

interface SecondaryNavSidebarProps {
  activeSection: string;
  activeSubItem?: string;
  onSelectSubItem?: (item: string) => void;
  projectId?: string;
}

export const SecondaryNavSidebar: React.FC<SecondaryNavSidebarProps> = React.memo(({
  activeSection,
  activeSubItem,
  onSelectSubItem,
  projectId,
}) => {
  const currentSection = navigationConfig.find((s) => s.id === activeSection) || navigationConfig[0];
  const subItems = currentSection.subItems || [];
  const currentUrl = typeof window !== 'undefined' ? window.location.pathname : '';

  return (
    <aside style={{
      width: 'clamp(170px, 18vw, 210px)',
      height: '100%',
      background: 'var(--bg-cream)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      padding: '16px 10px',
      flexShrink: 0,
      overflowY: 'auto'
    }}>
      {/* Active Module Title Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '16px',
        paddingBottom: '10px',
        borderBottom: '1px solid var(--border-color)',
        minWidth: 0
      }}>
        <div style={{
          width: '28px',
          height: '28px',
          borderRadius: '4px',
          background: 'var(--blue-subtle)',
          color: 'var(--blue-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          {currentSection.icon}
        </div>
        <div style={{ minWidth: 0, overflow: 'hidden' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {currentSection.label}
          </h3>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            ERP Module
          </span>
        </div>
      </div>

      {/* Sub Navigation Items List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
        <p style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', paddingLeft: '6px' }}>
          Navigation
        </p>

        {subItems.map((sub, idx) => {
          const isSelected = activeSubItem 
            ? (activeSubItem === sub.label || (sub.path && currentUrl.endsWith(sub.path))) 
            : idx === 0;
          return (
            <button
              key={sub.id}
              type="button"
              onClick={() => {
                if (sub.path) {
                  if (projectId) {
                    navigateTo(`/dashboard/project/${projectId}${sub.path}`);
                  } else {
                    navigateTo(`/dashboard${sub.path}`);
                  }
                }
                if (onSelectSubItem) onSelectSubItem(sub.label);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                borderRadius: 'var(--radius)',
                border: 'none',
                background: isSelected ? 'var(--bg-surface)' : 'transparent',
                color: isSelected ? 'var(--blue-primary)' : 'var(--text-primary)',
                boxShadow: isSelected ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
                fontSize: '12px',
                fontWeight: isSelected ? 700 : 500,
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'background-color 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, overflow: 'hidden' }}>
                <span style={{ color: isSelected ? 'var(--blue-primary)' : 'var(--text-muted)', display: 'inline-flex', flexShrink: 0 }}>
                  {sub.icon || <Layers size={14} />}
                </span>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub.label}</span>
              </div>
              <ChevronRight size={12} color="var(--text-muted)" style={{ flexShrink: 0 }} />
            </button>
          );
        })}
      </div>

      {/* Bottom Status Panel */}
      <div style={{
        marginTop: 'auto',
        padding: '10px',
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: 'var(--green-success)' }}>
          <ShieldCheck size={12} />
          <span>Active Session</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: 'var(--text-muted)' }}>
          <Database size={10} />
          <span>Supabase Auth</span>
        </div>
      </div>
    </aside>
  );
});
