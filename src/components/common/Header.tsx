import React, { useState } from 'react';
import digoLogo from '@/assets/digo-logo.png';
import { LogOut, AlertTriangle, Building, Layers } from 'lucide-react';
import { useOrganization, Organization, Project } from '@/context/useOrganization';
import { Button } from './Button';
import { Modal } from './Modal';
import { HeaderDropdown, DropdownItem } from './HeaderDropdown';
import { ProfileDropdown } from './ProfileDropdown';
import { navigateTo } from '@/features/dashboard/components/PrimaryRailSidebar';

export interface HeaderProps {
  userEmail?: string;
  onLogout?: () => void;
  showUserInfo?: boolean;
  activeOrganization?: Organization | null;
  activeProject?: Project | null;
  onOpenTenantSelector?: () => void;
  showTenantSwitchers?: boolean;
}

export const Header: React.FC<HeaderProps> = React.memo(({
  userEmail,
  onLogout,
  showUserInfo = true,
  activeOrganization: propActiveOrg,
  activeProject: propActiveProj,
  onOpenTenantSelector,
  showTenantSwitchers: propShowTenantSwitchers,
}) => {
  const orgContext = useOrganization();
  const currentOrg = propActiveOrg !== undefined ? propActiveOrg : orgContext.activeOrganization;
  const currentProj = propActiveProj !== undefined ? propActiveProj : orgContext.activeProject;
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleSelectOrg = (item: DropdownItem) => {
    orgContext.selectOrganization(item.id);
    navigateTo(`/dashboard/org/${item.id}`);
  };

  const handleSelectProj = (item: DropdownItem) => {
    orgContext.selectProject(item.id);
    navigateTo(`/dashboard/project/${item.id}/overview`);
  };

  const orgProjectsList = currentOrg ? orgContext.getProjectsForOrg(currentOrg.id) : [];
  const pathname = window.location.pathname;
  const isOrgListPage = pathname === '/dashboard/organizations' || pathname === '/dashboard/new';
  const isOrgProjectsPage = (pathname.startsWith('/dashboard/organizations/') && !pathname.includes('/projects/')) || pathname.startsWith('/dashboard/org/');

  const shouldShowOrgSwitcher = propShowTenantSwitchers ?? (showUserInfo && Boolean(userEmail) && !isOrgListPage);
  const shouldShowProjectSwitcher = propShowTenantSwitchers ?? (showUserInfo && Boolean(userEmail) && !isOrgListPage && !isOrgProjectsPage);

  return (
    <>
      <header style={{
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-color)',
        padding: '8px 12px',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0, overflowX: 'auto', whiteSpace: 'nowrap', scrollbarWidth: 'none', msOverflowStyle: 'none', paddingBottom: '2px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'default', userSelect: 'none', flexShrink: 0 }}>
              <img src={digoLogo} alt="DiGo Logo" draggable={false} style={{ width: '28px', height: '28px', objectFit: 'contain', userSelect: 'none', pointerEvents: 'none' }} />
              <div style={{ whiteSpace: 'nowrap', userSelect: 'none' }}>
                <h1 style={{ fontSize: '0.90rem', fontWeight: 800, color: 'var(--blue-primary)', lineHeight: 1.1, userSelect: 'none' }}>ERP Solution</h1>
                <span style={{ fontSize: '0.60rem', fontWeight: 600, color: 'var(--text-muted)', userSelect: 'none' }}>Powered by DiGo</span>
              </div>
            </div>

            {shouldShowOrgSwitcher && (
              <>
                <span style={{ color: 'var(--text-muted)', fontSize: '13px', flexShrink: 0 }}>/</span>
                <HeaderDropdown
                  buttonTitle={currentOrg ? currentOrg.name : 'Select Organization'}
                  headerTitle="Select Organization"
                  buttonIcon={<Building size={13} color="var(--blue-primary)" style={{ flexShrink: 0 }} />}
                  items={orgContext.organizations}
                  selectedId={currentOrg?.id}
                  isLoading={orgContext.isLoading}
                  emptyMessage="No organizations found"
                  onSelect={handleSelectOrg}
                  maxWidth="120px"
                  actions={[{ label: 'All Organizations', icon: <Building size={13} />, color: 'var(--blue-primary)', onClick: () => navigateTo('/dashboard/organizations') }]}
                />
              </>
            )}

            {shouldShowProjectSwitcher && (
              <>
                <span style={{ color: 'var(--text-muted)', fontSize: '13px', flexShrink: 0 }}>/</span>
                <HeaderDropdown
                  buttonTitle={currentProj ? currentProj.name : 'Select Project'}
                  headerTitle={`Select Project (${currentOrg?.name || 'Org'})`}
                  buttonIcon={<Layers size={13} color="var(--blue-primary)" style={{ flexShrink: 0 }} />}
                  items={orgProjectsList}
                  selectedId={currentProj?.id}
                  isLoading={orgContext.isLoading}
                  emptyMessage="No projects found"
                  onSelect={handleSelectProj}
                  maxWidth="130px"
                  actions={currentOrg ? [{ label: 'All Projects', icon: <Layers size={13} />, color: 'var(--blue-primary)', onClick: () => navigateTo(`/dashboard/org/${currentOrg.id}`) }] : []}
                />
              </>
            )}
          </div>

          <ProfileDropdown
            userEmail={userEmail}
            showUserInfo={showUserInfo}
            onOpenTenantSelector={onOpenTenantSelector}
            onRequestSignOut={onLogout ? () => setShowConfirmModal(true) : undefined}
          />
        </div>
      </header>

      <Modal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} title="Confirm Sign Out" icon={<AlertTriangle size={18} color="var(--red-danger)" />} maxWidth="360px">
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.45 }}>
          Are you sure you want to sign out of your account?
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button type="button" variant="secondary" onClick={() => setShowConfirmModal(false)}>Cancel</Button>
          <Button type="button" onClick={() => { setShowConfirmModal(false); if (onLogout) onLogout(); }} style={{ background: 'var(--red-danger)', color: '#FFFFFF', border: 'none' }}>
            <LogOut size={14} />
            <span>Sign Out</span>
          </Button>
        </div>
      </Modal>
    </>
  );
});
