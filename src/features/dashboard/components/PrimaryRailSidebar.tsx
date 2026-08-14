import React, { useState, useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import { dashboardNavigation, sectionTarget, navigateTo } from '@/config/navigationConfig';

export interface PrimaryNavItem {
  id: string;
  label: string;
  path?: string;
  icon: React.ReactNode;
}

interface PrimaryRailSidebarProps {
  /** Section mode: active section id + base path of the dashboard (project-scoped or not). */
  activeSection?: string;
  basePath?: string;
  /** Custom mode: caller supplies its own items (organization workspace tabs). */
  customItems?: PrimaryNavItem[];
  activeItemId?: string;
  onSelectItem?: (id: string) => void;
}

export const PrimaryRailSidebar: React.FC<PrimaryRailSidebarProps> = React.memo(({
  activeSection,
  basePath = '/dashboard',
  customItems,
  activeItemId,
  onSelectItem,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const itemsToRender: PrimaryNavItem[] = useMemo(() => {
    if (customItems) return customItems;
    return dashboardNavigation.map((section) => ({
      id: section.id,
      label: section.label,
      path: `${basePath}${sectionTarget(section)}`,
      icon: section.icon,
    }));
  }, [customItems, basePath]);

  return (
    <div
      className="erp-rail-shell"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Overlapping hover flyout panel (GPU-friendly width transition) */}
      <aside
        className="erp-rail-panel"
        style={{ width: isHovered ? '210px' : '56px', boxShadow: isHovered ? '4px 0 20px rgba(0,0,0,0.12)' : 'none' }}
      >
        {itemsToRender.map((item) => {
          const isActive = customItems ? activeItemId === item.id : activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (onSelectItem) onSelectItem(item.id);
                if (item.path) navigateTo(item.path);
              }}
              className="erp-rail-item"
              style={{
                background: isActive ? 'var(--blue-primary)' : 'transparent',
                color: isActive ? '#FFFFFF' : 'var(--text-primary)',
              }}
              title={!isHovered ? item.label : undefined}
            >
              <div className="erp-rail-icon">{item.icon}</div>

              {isHovered && (
                <div className="erp-rail-label">
                  <span style={{ fontSize: '13px', fontWeight: isActive ? 700 : 500 }}>{item.label}</span>
                  {isActive && <ChevronRight size={12} color="#FFFFFF" />}
                </div>
              )}
            </button>
          );
        })}
      </aside>
    </div>
  );
});
