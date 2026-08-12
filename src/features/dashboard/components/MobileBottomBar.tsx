import React from 'react';
import { LayoutGrid, Home, PlusCircle } from 'lucide-react';
import { navigateTo } from './PrimaryRailSidebar';

export interface MobileBottomBarButton {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  isActive?: boolean;
  color?: string;
}

interface MobileBottomBarProps {
  onOpenLauncher: () => void;
  activeSection?: string;
  leftButton?: MobileBottomBarButton;
  rightButton?: MobileBottomBarButton;
}

export const MobileBottomBar: React.FC<MobileBottomBarProps> = ({
  onOpenLauncher,
  activeSection = 'overview',
  leftButton,
  rightButton
}) => {
  const defaultLeft: MobileBottomBarButton = {
    label: 'Overview',
    icon: <Home size={20} />,
    onClick: () => {
      const pathname = window.location.pathname;
      const match = pathname.match(/^\/dashboard\/project\/([^\/]+)/);
      if (match) {
        navigateTo(`/dashboard/project/${match[1]}/overview`);
      } else {
        navigateTo('/dashboard/overview');
      }
    },
    isActive: activeSection === 'overview',
    color: activeSection === 'overview' ? 'var(--blue-primary)' : 'var(--text-muted)'
  };

  const defaultRight: MobileBottomBarButton = {
    label: 'Settings',
    icon: <PlusCircle size={20} />,
    onClick: () => {
      const pathname = window.location.pathname;
      const match = pathname.match(/^\/dashboard\/project\/([^\/]+)/);
      if (match) {
        navigateTo(`/dashboard/project/${match[1]}/settings/mfa`);
      } else {
        navigateTo('/dashboard/settings/mfa');
      }
    },
    color: activeSection === 'settings' ? 'var(--blue-primary)' : 'var(--text-muted)'
  };

  const left = leftButton || defaultLeft;
  const right = rightButton || defaultRight;

  return (
    <nav className="erp-mobile-bottom-bar" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: '60px', background: 'var(--bg-surface)', borderTop: '1px solid var(--border-color)', zIndex: 250, display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '0 16px', boxShadow: '0 -4px 14px rgba(0,0,0,0.08)', userSelect: 'none' }}>
      <button type="button" onClick={left.onClick} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', background: 'none', border: 'none', color: left.color || (left.isActive ? 'var(--blue-primary)' : 'var(--text-muted)'), cursor: 'pointer', padding: '6px', flex: 1, userSelect: 'none' }}>
        {left.icon}
        <span style={{ fontSize: '10px', fontWeight: left.isActive ? 800 : 600 }}>{left.label}</span>
      </button>

      <button type="button" onClick={onOpenLauncher} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', background: 'none', border: 'none', cursor: 'pointer', padding: '0 12px', marginTop: '-14px', flex: 1, userSelect: 'none' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--blue-primary)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(30, 64, 175, 0.35)', border: '3px solid var(--bg-surface)' }}>
          <LayoutGrid size={22} />
        </div>
        <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--blue-primary)' }}>Launcher</span>
      </button>

      <button type="button" onClick={right.onClick} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', background: 'none', border: 'none', color: right.color || 'var(--green-success)', cursor: 'pointer', padding: '6px', flex: 1, userSelect: 'none' }}>
        {right.icon}
        <span style={{ fontSize: '10px', fontWeight: 800 }}>{right.label}</span>
      </button>
    </nav>
  );
};
