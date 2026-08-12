import React, { useState } from 'react';
import { Header } from '@/components/common/Header';
import { useOrganizationsPage } from '../hooks/useOrganizationsPage';
import { Organization, Project } from '@/context/useOrganization';
import { Plus, Search, Building } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Loading } from '@/components/common/Loading';
import { MobileBottomBar } from '@/features/dashboard/components/MobileBottomBar';
import { MobileLauncherSheet } from '@/features/dashboard/components/MobileLauncherSheet';
import { navigateTo } from '@/features/dashboard/components/PrimaryRailSidebar';
import { orgListNavigation } from '@/config/navigationConfig';
import { PageContainer } from '@/components/common/PageContainer';

interface OrganizationsPageProps {
  userEmail?: string;
  onLogout?: () => void;
  activeOrganization?: Organization | null;
  activeProject?: Project | null;
}

export const OrganizationsPage: React.FC<OrganizationsPageProps> = ({
  userEmail,
  onLogout,
  activeOrganization,
  activeProject,
}) => {
  const { organizations, filteredOrgs, orgSearch, setOrgSearch, getProjectsForOrg, handleSelectOrg, isLoading } = useOrganizationsPage();
  const [isLauncherOpen, setIsLauncherOpen] = useState(false);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-cream)', display: 'flex', flexDirection: 'column' }}>
      <Header userEmail={userEmail} onLogout={onLogout} showTenantSwitchers={false} activeOrganization={activeOrganization} activeProject={activeProject} onOpenTenantSelector={() => navigateTo('/dashboard/organizations')} />

      <main style={{ flex: 1, width: '100%', padding: '24px 16px 80px' }}>
        <PageContainer maxWidth="960px">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>Your Organizations</h2>
          <Button variant="primary" onClick={() => navigateTo('/dashboard/new')} style={{ background: 'var(--green-success)', borderColor: 'var(--green-success)', fontSize: '12px', padding: '8px 14px' }}>
            <Plus size={14} />
            <span>New organization</span>
          </Button>
        </div>

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', maxWidth: '320px', marginBottom: '20px' }}>
          <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '12px' }} />
          <input type="text" className="erp-input" placeholder="Search for an organization..." value={orgSearch} onChange={(e) => setOrgSearch(e.target.value)} style={{ paddingLeft: '34px', background: 'var(--bg-surface)' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
          {isLoading && organizations.length === 0 ? (
            <div className="erp-card" style={{ padding: '36px 20px', gridColumn: '1 / -1', display: 'flex', justifyContent: 'center' }}>
              <Loading variant="card" size="md" message="Loading Organizations..." />
            </div>
          ) : filteredOrgs.length === 0 ? (
            <div className="erp-card" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
              No organizations found. Click "+ New organization" above to create one.
            </div>
          ) : (
            filteredOrgs.map((org: Organization) => {
              const projCount = getProjectsForOrg(org.id).length;
              return (
                <div key={org.id} onClick={() => handleSelectOrg(org.id)} className="erp-card" style={{ padding: '16px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px', transition: 'border-color 0.15s ease, box-shadow 0.15s ease' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'var(--bg-cream)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', flexShrink: 0 }}>
                    <Building size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>{org.name}</h3>
                    <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>Free Plan • {projCount} {projCount === 1 ? 'project' : 'projects'}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
        </PageContainer>
      </main>

      <MobileLauncherSheet isOpen={isLauncherOpen} onClose={() => setIsLauncherOpen(false)} activeSection="All Organizations" customItems={orgListNavigation} title="Organizations Menu" />
      <MobileBottomBar
        onOpenLauncher={() => setIsLauncherOpen(true)}
        leftButton={{ label: 'All Orgs', icon: <Building size={20} />, onClick: () => navigateTo('/dashboard/organizations'), color: 'var(--blue-primary)' }}
        rightButton={{ label: 'New Org', icon: <Plus size={20} />, onClick: () => navigateTo('/dashboard/new'), color: 'var(--green-success)' }}
      />
    </div>
  );
};
