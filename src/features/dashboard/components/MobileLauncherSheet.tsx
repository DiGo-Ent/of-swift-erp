import React, { useState, useEffect } from 'react';
import { X, ArrowLeft, ChevronRight, LayoutGrid, Layers } from 'lucide-react';
import { dashboardNavigation, navigateTo, type NavSection } from '@/config/navigationConfig';


export interface CustomNavMenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
}

interface MobileLauncherSheetProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection: string;
  /** Base path of the dashboard, used for section sub-item links. */
  basePath?: string;
  customItems?: CustomNavMenuItem[];
  onSelectItem?: (id: string) => void;
  title?: string;
}


export const MobileLauncherSheet: React.FC<MobileLauncherSheetProps> = React.memo(({
  isOpen,
  onClose,
  activeSection,
  basePath = '/dashboard',
  customItems,
  onSelectItem,
  title = 'ERP Launcher'

}) => {
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [isRendered, setIsRendered] = useState(false);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      const timer = setTimeout(() => setIsAnimatingIn(true), 25);
      return () => clearTimeout(timer);
    } else {
      setIsAnimatingIn(false);
      const timer = setTimeout(() => {
        setIsRendered(false);
        setSelectedSectionId(null);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isRendered) return null;

  const handleSelectCustomItem = (item: CustomNavMenuItem) => {
    if (onSelectItem) onSelectItem(item.id);
    if (item.path) navigateTo(item.path);
    onClose();
  };

  const handleNavigateSubItem = (path: string) => {
    navigateTo(`${basePath}${path}`);
    onClose();
  };


  const currentSection = dashboardNavigation.find((s) => s.id === (selectedSectionId || activeSection)) || dashboardNavigation[0];
  const subItems = currentSection.subItems || [];

  return (
    <div className="erp-mobile-launcher-overlay" onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: isAnimatingIn ? 'rgba(0, 0, 0, 0.55)' : 'rgba(0, 0, 0, 0)', zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', transition: 'background-color 0.35s ease' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxHeight: '85vh', background: 'var(--bg-surface)', borderTopLeftRadius: '18px', borderTopRightRadius: '18px', display: 'flex', flexDirection: 'column', boxShadow: '0 -10px 30px rgba(0,0,0,0.25)', overflow: 'hidden', transform: isAnimatingIn ? 'translateY(0)' : 'translateY(100%)', opacity: isAnimatingIn ? 1 : 0, transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-cream)' }}>
          {selectedSectionId && !customItems ? (
            <button type="button" onClick={() => setSelectedSectionId(null)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'var(--blue-primary)', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
              <ArrowLeft size={16} />
              <span>Back to Modules</span>
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <LayoutGrid size={18} color="var(--blue-primary)" />
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{title}</h3>
            </div>
          )}
          <button type="button" onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-primary)' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
          {customItems ? (
            /* Custom Page Items (e.g. OrgProjectsPage sidebar items: Projects, Team, Usage, Billing, Settings) */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
              {customItems.map((item) => {
                const isActive = activeSection.toLowerCase() === item.id.toLowerCase();
                return (
                  <button key={item.id} type="button" onClick={() => handleSelectCustomItem(item)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'space-between', padding: '12px', borderRadius: 'var(--radius)', border: isActive ? '2px solid var(--blue-primary)' : '1px solid var(--border-color)', background: isActive ? 'var(--blue-subtle)' : 'var(--bg-surface)', cursor: 'pointer', minHeight: '84px', textAlign: 'left' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: isActive ? 'var(--blue-primary)' : 'var(--bg-cream)', color: isActive ? '#FFFFFF' : 'var(--blue-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                      {item.icon}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>{item.label}</span>
                      <ChevronRight size={12} color="var(--text-muted)" />
                    </div>
                  </button>
                );
              })}
            </div>
          ) : selectedSectionId ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'var(--blue-subtle)', color: 'var(--blue-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {currentSection.icon}
                </div>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>{currentSection.label}</h4>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Sub Navigation Options</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
                {subItems.map((sub, idx) => (
                  <button key={sub.id} type="button" onClick={() => handleNavigateSubItem(sub.path || currentSection.path)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'space-between', padding: '12px', borderRadius: 'var(--radius)', border: idx === 0 ? '2px solid var(--blue-primary)' : '1px solid var(--border-color)', background: idx === 0 ? 'var(--blue-subtle)' : 'var(--bg-surface)', cursor: 'pointer', minHeight: '84px', textAlign: 'left' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: idx === 0 ? 'var(--blue-primary)' : 'var(--bg-cream)', color: idx === 0 ? '#FFFFFF' : 'var(--blue-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                      {sub.icon || <Layers size={16} />}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>{sub.label}</span>
                      <ChevronRight size={12} color="var(--text-muted)" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
              {dashboardNavigation.map((item: NavSection) => {
                const isActive = activeSection === item.id;
                return (
                  <button key={item.id} type="button" onClick={() => setSelectedSectionId(item.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'space-between', padding: '12px', borderRadius: 'var(--radius)', border: isActive ? '2px solid var(--blue-primary)' : '1px solid var(--border-color)', background: isActive ? 'var(--blue-subtle)' : 'var(--bg-surface)', cursor: 'pointer', minHeight: '84px', textAlign: 'left' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: isActive ? 'var(--blue-primary)' : 'var(--bg-cream)', color: isActive ? '#FFFFFF' : 'var(--blue-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                      {item.icon}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>{item.label}</span>
                      <ChevronRight size={12} color="var(--text-muted)" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
