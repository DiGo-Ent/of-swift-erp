import React, { useState, useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import { navigationConfig, NavSection } from '@/config/navigationConfig';

export { navigationConfig };
export type { NavSection as PrimaryNavSection };

export interface PrimaryNavItem {
  id: string;
  label: string;
  path?: string;
  icon: React.ReactNode;
}

interface PrimaryRailSidebarProps {
  activeSection?: string;
  onSelectSection?: (id: string, path: string) => void;
  customItems?: PrimaryNavItem[];
  activeItemId?: string;
  onSelectItem?: (id: string) => void;
}

export function navigateTo(path: string) {
  if (window.location.pathname !== path) {
    window.history.pushState(null, '', path);
    window.dispatchEvent(new Event('popstate'));
  }
}

export const PrimaryRailSidebar: React.FC<PrimaryRailSidebarProps> = React.memo(({
  activeSection,
  onSelectSection,
  customItems,
  activeItemId,
  onSelectItem,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const itemsToRender: PrimaryNavItem[] = useMemo(() => {
    if (customItems) return customItems;
    return navigationConfig.map((item) => ({
      id: item.id,
      label: item.label,
      path: item.path,
      icon: item.icon,
    }));
  }, [customItems]);

  return (
    <div
      style={{
        width: '56px',
        height: '100%',
        position: 'relative',
        zIndex: 50,
        flexShrink: 0
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Overlapping Hover Flyout Panel with 60fps Low-End GPU Hardware Acceleration */}
      <aside style={{
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        width: isHovered ? '210px' : '56px',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-color)',
        boxShadow: isHovered ? '4px 0 20px rgba(0,0,0,0.12)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        padding: '12px 8px',
        gap: '6px',
        transition: 'width 0.18s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.18s ease',
        willChange: 'width, box-shadow',
        overflowX: 'hidden',
        overflowY: 'auto'
      }}>
        {itemsToRender.map((item) => {
          const isActive = customItems
            ? activeItemId === item.id
            : activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (onSelectItem) {
                  onSelectItem(item.id);
                }
                if (item.path && onSelectSection) {
                  onSelectSection(item.id, item.path);
                } else if (item.path) {
                  navigateTo(item.path);
                }
              }}
              style={{
                width: '100%',
                height: '40px',
                borderRadius: 'var(--radius)',
                border: 'none',
                background: isActive ? 'var(--blue-primary)' : 'transparent',
                color: isActive ? '#FFFFFF' : 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                padding: 0,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'background-color 0.15s ease, color 0.15s ease'
              }}
              title={!isHovered ? item.label : undefined}
            >
              {/* Fixed Icon Box (40px x 40px) */}
              <div style={{
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {item.icon}
              </div>

              {/* Text Label revealed on hover */}
              {isHovered && (
                <div style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingRight: '10px',
                  overflow: 'hidden'
                }}>
                  <span style={{ fontSize: '13px', fontWeight: isActive ? 700 : 500 }}>
                    {item.label}
                  </span>
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
