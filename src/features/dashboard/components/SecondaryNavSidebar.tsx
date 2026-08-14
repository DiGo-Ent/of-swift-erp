import React from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronRight, ShieldCheck, Database, Layers } from 'lucide-react';
import { dashboardNavigation, navigateTo } from '@/config/navigationConfig';

interface SecondaryNavSidebarProps {
  activeSection: string;
  /** Base path of the dashboard (project-scoped or project-less). */
  basePath: string;
}

export const SecondaryNavSidebar: React.FC<SecondaryNavSidebarProps> = React.memo(({
  activeSection,
  basePath,
}) => {
  const { pathname } = useLocation();
  const currentSection = dashboardNavigation.find((s) => s.id === activeSection) ?? dashboardNavigation[0];
  const subItems = currentSection.subItems;

  return (
    <aside className="erp-section-sidebar">
      {/* Active module title */}
      <div className="erp-section-head">
        <div className="erp-section-head-icon">{currentSection.icon}</div>
        <div style={{ minWidth: 0, overflow: 'hidden' }}>
          <h3 className="erp-section-head-title">{currentSection.label}</h3>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>ERP Module</span>
        </div>
      </div>

      {/* Sub navigation */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
        <p className="erp-section-label">Navigation</p>

        {subItems.map((sub) => {
          const target = `${basePath}${sub.path}`;
          const isSelected = pathname === target;
          return (
            <button
              key={sub.id}
              type="button"
              onClick={() => navigateTo(target)}
              className="erp-section-item"
              style={{
                background: isSelected ? 'var(--bg-surface)' : 'transparent',
                color: isSelected ? 'var(--blue-primary)' : 'var(--text-primary)',
                boxShadow: isSelected ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
                fontWeight: isSelected ? 700 : 500,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, overflow: 'hidden' }}>
                <span style={{ color: isSelected ? 'var(--blue-primary)' : 'var(--text-muted)', display: 'inline-flex', flexShrink: 0 }}>
                  {sub.icon || <Layers size={14} />}
                </span>
                <span className="erp-truncate">{sub.label}</span>
              </div>
              <ChevronRight size={12} color="var(--text-muted)" style={{ flexShrink: 0 }} />
            </button>
          );
        })}
      </div>

      {/* Session status */}
      <div className="erp-section-status">
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
