import React, { useState } from 'react';
import { Header } from '@/components/common/Header';
import { PrimaryRailSidebar } from '@/features/dashboard/components/PrimaryRailSidebar';
import { navigateTo, orgMenuNavigation } from '@/config/navigationConfig';
import { MobileBottomBar } from '@/features/dashboard/components/MobileBottomBar';
import { MobileLauncherSheet } from '@/features/dashboard/components/MobileLauncherSheet';
import { CreateProjectModal } from '../components/CreateProjectModal';
import { useOrganizationsPage } from '../hooks/useOrganizationsPage';
import { Organization, Project } from '@/context/OrganizationProvider';
import { Plus, Search, MoreVertical, ChevronLeft, Building, PlusCircle } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Loading } from '@/components/common/Loading';

interface OrgProjectsPageProps {
  userEmail?: string;
  orgId?: string;
  onLogout?: () => void;
  activeOrganization?: Organization | null;
  activeProject?: Project | null;
}

export const OrgProjectsPage: React.FC<OrgProjectsPageProps> = ({
  userEmail,
  orgId,
  onLogout,
  activeOrganization,
  activeProject,
}) => {
  const {
    organizations, activeOrganization: contextActiveOrg, projects, projSearch, setProjSearch,
    showCreateProjectModal, setShowCreateProjectModal, projName, setProjName, projCode, setProjCode,
    projDescription, setProjDescription, availableServices, projServiceId, setProjServiceId,
    projEnvironment, setProjEnvironment, formError, isSubmittingProj, isLoading, handleSelectProj, handleCreateProjSubmit,
  } = useOrganizationsPage();

  const [activeTab, setActiveTab] = useState('Projects');
  const [isLauncherOpen, setIsLauncherOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name_asc');

  const currentOrg = (orgId && organizations.find((o: Organization) => o.id === orgId)) || contextActiveOrg || activeOrganization || organizations[0];
  const currentOrgId = currentOrg?.id || '';

  const orgProjects = projects
    .filter((p: Project) => p.orgId === currentOrgId && (p.name.toLowerCase().includes(projSearch.toLowerCase()) || p.code.toLowerCase().includes(projSearch.toLowerCase())))
    .filter((p: Project) => statusFilter === 'all' || (p.environment || 'production').toLowerCase() === statusFilter.toLowerCase())
    .sort((a: Project, b: Project) => sortBy === 'name_asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-cream)', overflow: 'hidden' }}>
      <Header userEmail={userEmail} onLogout={onLogout} activeOrganization={activeOrganization || currentOrg} activeProject={activeProject} onOpenTenantSelector={() => navigateTo('/dashboard/organizations')} />

      <div style={{ display: 'flex', flex: 1, height: 'calc(100vh - 53px)', overflow: 'hidden' }}>
        <div className="erp-desktop-sidebar" style={{ display: 'flex', height: '100%', flexShrink: 0 }}>
          <PrimaryRailSidebar customItems={orgMenuNavigation} activeItemId={activeTab} onSelectItem={(tabId) => setActiveTab(tabId)} />
        </div>

        <main className="erp-main-content" style={{ flex: 1, height: '100%', overflowY: 'auto', padding: '36px 32px 80px' }}>
          <div style={{ maxWidth: '1100px', width: '100%', margin: '0 auto' }}>
            <button type="button" onClick={() => navigateTo('/dashboard/organizations')} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', marginBottom: '16px', padding: 0 }}>
              <ChevronLeft size={14} />
              <span>All Organizations</span>
            </button>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '20px' }}>{activeTab}</h2>

            {activeTab === 'Projects' ? (
              <div style={{ display: 'flex', gap: '28px', alignItems: 'start', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
                      <div style={{ position: 'relative', width: '200px', flexShrink: 0 }}>
                        <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                        <input type="text" className="erp-input" placeholder="Search for a project" value={projSearch} onChange={(e) => setProjSearch(e.target.value)} style={{ paddingLeft: '30px', paddingRight: '8px', fontSize: '12px', background: 'var(--bg-surface)', height: '34px', width: '100%' }} />
                      </div>

                      <select className="erp-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: '130px', flexShrink: 0, fontSize: '11px', padding: '4px 8px', background: 'var(--bg-surface)', cursor: 'pointer', height: '34px' }}>
                        <option value="all">All Statuses</option>
                        <option value="production">Production</option>
                        <option value="staging">Staging</option>
                        <option value="development">Development</option>
                      </select>

                      <select className="erp-input" value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ width: '150px', flexShrink: 0, fontSize: '11px', padding: '4px 8px', background: 'var(--bg-surface)', cursor: 'pointer', height: '34px' }}>
                        <option value="name_asc">Sorted by name (A-Z)</option>
                        <option value="name_desc">Sorted by name (Z-A)</option>
                      </select>
                    </div>

                    <Button variant="primary" onClick={() => setShowCreateProjectModal(true)} style={{ background: 'var(--green-success)', borderColor: 'var(--green-success)', fontSize: '12px', padding: '7px 14px', whiteSpace: 'nowrap', height: '34px', flexShrink: 0 }}>
                      <Plus size={14} />
                      <span>New project</span>
                    </Button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '14px' }}>
                    {isLoading && projects.length === 0 ? (
                      <div className="erp-card" style={{ padding: '36px 20px', gridColumn: '1 / -1', display: 'flex', justifyContent: 'center' }}>
                        <Loading variant="card" size="md" message="Loading Projects..." />
                      </div>
                    ) : orgProjects.length === 0 ? (
                      <div className="erp-card" style={{ padding: '28px', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
                        No projects found in this organization. Click "+ New project" to create one.
                      </div>
                    ) : (
                      orgProjects.map((proj: Project) => (
                        <div key={proj.id} onClick={() => handleSelectProj(proj.id)} className="erp-card" style={{ padding: '16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '10px', transition: 'border-color 0.15s ease, box-shadow 0.15s ease' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)', wordBreak: 'break-word', lineHeight: 1.25 }}>{proj.name} ®</h3>
                              <p style={{ fontSize: '0.70rem', color: 'var(--text-muted)', marginTop: '4px' }}>AWS | ap-northeast-1</p>
                            </div>
                            <MoreVertical size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                          </div>
                          <span className="erp-badge erp-badge-blue" style={{ fontSize: '9px', padding: '1px 6px', alignSelf: 'flex-start' }}>NANO</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="erp-card" style={{ width: '320px', flexShrink: 0, padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px', background: 'var(--bg-surface)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <div>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>Free plan usage</h4>
                      <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Current billing cycle</p>
                    </div>
                    <Button variant="secondary" style={{ fontSize: '10px', padding: '4px 8px', color: 'var(--green-success)', borderColor: 'var(--green-success)' }}>Upgrade to Pro</Button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '11px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', gap: '8px' }}>
                      <span>◯ EGRESS</span>
                      <strong style={{ color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>2 MB / 5 GB</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', gap: '8px' }}>
                      <span>◯ DATABASE SIZE</span>
                      <strong style={{ color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>27 MB / 500 MB</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', gap: '8px' }}>
                      <span>◯ MONTHLY ACTIVE USERS</span>
                      <strong style={{ color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>5 / 50,000</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', gap: '8px' }}>
                      <span>◯ FILE STORAGE</span>
                      <strong style={{ color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>0 MB / 1 GB</strong>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="erp-card" style={{ padding: '24px', color: 'var(--text-muted)' }}>
                <p>{activeTab} view settings for {currentOrg?.name}.</p>
              </div>
            )}
          </div>
        </main>
      </div>

      <CreateProjectModal
        isOpen={showCreateProjectModal}
        onClose={() => setShowCreateProjectModal(false)}
        orgName={currentOrg?.name}
        projName={projName}
        setProjName={setProjName}
        projCode={projCode}
        setProjCode={setProjCode}
        projDescription={projDescription}
        setProjDescription={setProjDescription}
        services={availableServices}
        projServiceId={projServiceId}
        setProjServiceId={setProjServiceId}
        projEnvironment={projEnvironment}
        setProjEnvironment={setProjEnvironment}
        errorMessage={formError}
        isSubmitting={isSubmittingProj}
        onSubmit={handleCreateProjSubmit}
      />

      <MobileLauncherSheet isOpen={isLauncherOpen} onClose={() => setIsLauncherOpen(false)} activeSection={activeTab} customItems={orgMenuNavigation} onSelectItem={(tabId) => setActiveTab(tabId)} title={`${currentOrg?.name || 'Organization'} Menu`} />
      <MobileBottomBar
        onOpenLauncher={() => setIsLauncherOpen(true)}
        leftButton={{ label: 'All Orgs', icon: <Building size={20} />, onClick: () => navigateTo('/dashboard/organizations'), color: 'var(--blue-primary)' }}
        rightButton={{ label: 'New Project', icon: <PlusCircle size={20} />, onClick: () => setShowCreateProjectModal(true), color: 'var(--green-success)' }}
      />
    </div>
  );
};
