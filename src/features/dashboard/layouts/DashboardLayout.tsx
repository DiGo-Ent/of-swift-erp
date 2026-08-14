import React, { Suspense, useState } from 'react';
import { Outlet, useLocation, useParams } from 'react-router-dom';
import { Header } from '@/components/common/Header';
import { Loading } from '@/components/common/Loading';
import { PrimaryRailSidebar } from '../components/PrimaryRailSidebar';
import { SecondaryNavSidebar } from '../components/SecondaryNavSidebar';
import { MobileBottomBar } from '../components/MobileBottomBar';
import { MobileLauncherSheet } from '../components/MobileLauncherSheet';
import { navigateTo } from '@/config/navigationConfig';
import { useSession } from '@/context/SessionContext';
import { useLogout } from '@/features/auth/hooks/useLogout';

/**
 * The single dashboard shell. Only <Outlet /> re-renders on page switches, so
 * navigating between modules never re-mounts the header/sidebars.
 */
export const DashboardLayout: React.FC = () => {
  const { projectId } = useParams<{ projectId?: string }>();
  const { pathname } = useLocation();
  const { session } = useSession();
  const logout = useLogout();
  const [isLauncherOpen, setIsLauncherOpen] = useState(false);

  const basePath = projectId ? `/dashboard/project/${projectId}` : '/dashboard';
  const activeSection = pathname.includes('/settings') ? 'settings' : 'overview';

  return (
    <div className="erp-shell">
      <Header
        userEmail={session?.user?.email}
        onLogout={logout}
        onOpenTenantSelector={() => navigateTo('/dashboard/organizations')}
      />

      <div className="erp-shell-body">
        {/* Desktop dual sidebars (hidden under 768px) */}
        <div className="erp-desktop-sidebar">
          <PrimaryRailSidebar activeSection={activeSection} basePath={basePath} />
          <SecondaryNavSidebar activeSection={activeSection} basePath={basePath} />
        </div>

        <main className="erp-main-content">
          <Suspense fallback={<Loading variant="card" size="md" message="Loading page..." />}>
            <Outlet />
          </Suspense>

          <footer className="erp-footer">
            ERP Solution • Powered by <strong style={{ color: 'var(--blue-primary)' }}>DiGo</strong>
          </footer>
        </main>
      </div>

      <MobileBottomBar
        onOpenLauncher={() => setIsLauncherOpen(true)}
        activeSection={activeSection}
        basePath={basePath}
      />

      <MobileLauncherSheet
        isOpen={isLauncherOpen}
        onClose={() => setIsLauncherOpen(false)}
        activeSection={activeSection}
        basePath={basePath}
      />
    </div>
  );
};
