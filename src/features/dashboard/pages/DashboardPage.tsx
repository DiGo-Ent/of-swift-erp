import React, { useState, useEffect } from 'react';
import { Header } from '@/components/common/Header';
import { PrimaryRailSidebar, navigateTo } from '../components/PrimaryRailSidebar';
import { SecondaryNavSidebar } from '../components/SecondaryNavSidebar';
import { MobileBottomBar } from '../components/MobileBottomBar';
import { MobileLauncherSheet } from '../components/MobileLauncherSheet';
import { MetricsOverview } from '../components/MetricsOverview';
import { RecentActivityTable } from '../components/RecentActivityTable';
import { PageContainer } from '@/components/common/PageContainer';
import { MfaSettingsPage } from '@/features/settings/2MFA/pages/MfaSettingsPage';
import { ChangePasswordPage } from '@/features/settings/ChangePassword/pages/ChangePasswordPage';
import { useDashboard } from '../hooks/useDashboard';
import { User } from '@/types/auth.types';
import { Organization, Project } from '@/context/useOrganization';

interface DashboardPageProps {
  user: User;
  onLogout: () => void;
  currentPath?: string;
  activeOrganization?: Organization | null;
  activeProject?: Project | null;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  user,
  onLogout,
  currentPath,
  activeOrganization,
  activeProject,
}) => {
  const {
    metrics,
    transactions,
  } = useDashboard();

  const [isLauncherOpen, setIsLauncherOpen] = useState(false);

  const activePath = currentPath || window.location.pathname;

  // Extract relative sub-path inside project if URL starts with /dashboard/project/<projId>
  const relativePath = activeProject
    ? activePath.replace(new RegExp(`^/dashboard/project/${activeProject.id}`), '')
    : activePath;

  const cleanPath = relativePath.length > 0 ? relativePath : '/overview';

  // Determine activeSection from cleanPath
  const activeSection = cleanPath.startsWith('/settings') ? 'settings' : 'overview';

  // Auto-correct double `/dashboard` or generic `/dashboard` or `/settings` under project URL to `/overview`
  useEffect(() => {
    if (activeProject) {
      if (cleanPath === '/dashboard' || cleanPath === '/dashboard/' || cleanPath === '') {
        const targetUrl = `/dashboard/project/${activeProject.id}/overview`;
        window.history.replaceState(null, '', targetUrl);
        window.dispatchEvent(new Event('popstate'));
      } else if (cleanPath === '/settings' || cleanPath === '/settings/') {
        const targetUrl = `/dashboard/project/${activeProject.id}/settings/mfa`;
        window.history.replaceState(null, '', targetUrl);
        window.dispatchEvent(new Event('popstate'));
      }
    } else if (!activeProject && activePath === '/settings') {
      window.history.replaceState(null, '', '/settings/mfa');
      window.dispatchEvent(new Event('popstate'));
    }
  }, [cleanPath, activePath, activeProject]);

  const [activeSubItem, setActiveSubItem] = useState<string>('2FA Security (MFA)');

  // Sync activeSubItem with cleanPath
  useEffect(() => {
    if (cleanPath.includes('/settings/change-password')) {
      setActiveSubItem('Change Password');
    } else if (cleanPath.includes('/settings/mfa')) {
      setActiveSubItem('2FA Security (MFA)');
    } else if (cleanPath.includes('/overview')) {
      setActiveSubItem('Project Overview');
    }
  }, [cleanPath]);

  const handleSelectSection = (_id: string, path: string) => {
    const rawPath = path === '/dashboard' ? '/overview' : path;
    if (activeProject) {
      if (rawPath === '/settings') {
        navigateTo(`/dashboard/project/${activeProject.id}/settings/mfa`);
      } else {
        navigateTo(`/dashboard/project/${activeProject.id}${rawPath}`);
      }
    } else {
      if (rawPath === '/settings') {
        navigateTo('/settings/mfa');
      } else {
        navigateTo(rawPath);
      }
    }
  };

  const handleSelectSubItem = (subItem: string) => {
    setActiveSubItem(subItem);
  };

  const handleOpenTenantSelector = () => {
    navigateTo('/dashboard/organizations');
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-cream)', overflow: 'hidden' }}>
      {/* Top Header with Multi-Tenant Organization & Project Switcher */}
      <Header
        userEmail={user.email}
        onLogout={onLogout}
        activeOrganization={activeOrganization}
        activeProject={activeProject}
        onOpenTenantSelector={handleOpenTenantSelector}
      />

      {/* Main Layout Container */}
      <div style={{ display: 'flex', flex: 1, height: 'calc(100vh - 53px)', overflow: 'hidden' }}>

        {/* Desktop Dual Sidebars Container (Hidden on Mobile <768px) */}
        <div className="erp-desktop-sidebar" style={{ display: 'flex', height: '100%', flexShrink: 0 }}>
          {/* Sidebar 1: Primary Slim Icon Rail */}
          <PrimaryRailSidebar
            activeSection={activeSection}
            onSelectSection={handleSelectSection}
          />

          {/* Sidebar 2: Secondary Navigation Panel */}
          <SecondaryNavSidebar
            activeSection={activeSection}
            activeSubItem={activeSubItem}
            onSelectSubItem={handleSelectSubItem}
            projectId={activeProject?.id}
          />
        </div>

        {/* Main Workspace Area (Scrollable, Full width on Mobile) */}
        <main className="erp-main-content" style={{ flex: 1, height: '100%', overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column' }}>

          {/* Render Settings View when in Settings */}
          {activeSection === 'settings' ? (
            <PageContainer maxWidth="960px">
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Settings & System Configuration
              </div>

              {/* Independent Fault-Tolerant Settings Pages */}
              {activePath === '/settings/change-password' || activeSubItem === 'Change Password' ? (
                <ChangePasswordPage />
              ) : (
                <MfaSettingsPage />
              )}
            </PageContainer>
          ) : (
            <PageContainer maxWidth="1200px">
              {/* Metric Cards */}
              <MetricsOverview metrics={metrics} />

              {/* Recent Activity Table */}
              <RecentActivityTable
                transactions={transactions}
              />
            </PageContainer>
          )}

          {/* Footer INSIDE Main Workspace Container ONLY */}
          <footer style={{
            marginTop: 'auto',
            paddingTop: '20px',
            paddingBottom: '12px',
            borderTop: '1px solid var(--border-color)',
            textAlign: 'center',
            fontSize: '0.72rem',
            color: 'var(--text-muted)'
          }}>
            ERP Solution • Powered by <strong style={{ color: 'var(--blue-primary)' }}>DiGo</strong>
          </footer>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Visible only on Mobile <768px) */}
      <MobileBottomBar
        onOpenLauncher={() => setIsLauncherOpen(true)}
        activeSection={activeSection}
      />

      {/* Mobile ERP Launcher Bottom Sheet Modal (2-Level Drilldown) */}
      <MobileLauncherSheet
        isOpen={isLauncherOpen}
        onClose={() => setIsLauncherOpen(false)}
        activeSection={activeSection}
      />
    </div>
  );
};
