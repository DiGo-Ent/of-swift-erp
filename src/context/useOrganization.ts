import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { notify } from '@/utils/notification';
import { supabase } from '@/lib/supabaseClient';
import { organizationService } from '@/features/organizations/services/organizationService';
import type {
  Organization,
  OrganizationInput,
  Project,
  ProjectInput,
  Service,
} from '@/types/organization.types';

export type { Organization, Project, Service };

const ORG_KEY = 'workspace.active_org';
const PROJECT_KEY = 'workspace.active_project';

interface OrganizationContextValue {
  organizations: Organization[];
  projects: Project[];
  services: Service[];
  isLoading: boolean;
  activeOrganization: Organization | null;
  activeProject: Project | null;
  isSelectionComplete: boolean;
  selectOrganization: (orgId: string) => void;
  createOrganization: (input: OrganizationInput) => Promise<Organization>;
  selectProject: (projectId: string) => void;
  createProject: (input: ProjectInput) => Promise<Project>;
  resetSelection: () => void;
  refresh: () => Promise<void>;
  getProjectsForOrg: (orgId: string) => Project[];
  getAvailableServices: (orgId: string) => Service[];
}

const OrganizationContext = createContext<OrganizationContextValue | undefined>(undefined);

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activeOrganization, setActiveOrganization] = useState<Organization | null>(() => {
    try {
      const saved = localStorage.getItem(ORG_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeProject, setActiveProject] = useState<Project | null>(() => {
    try {
      const saved = localStorage.getItem(PROJECT_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const refresh = useCallback(async (forceLoading = false) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setOrganizations([]);
        setProjects([]);
        setServices([]);
        setIsLoading(false);
        return;
      }

      if (forceLoading) {
        setIsLoading(true);
      }

      const [orgs, projs, svcs] = await Promise.all([
        organizationService.fetchOrganizations(),
        organizationService.fetchProjects(),
        organizationService.fetchServices(),
      ]);

      setOrganizations(orgs);
      setProjects(projs);
      setServices(svcs);
    } catch {
      // Keep existing cached state on transient background error.
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const checkAndRefresh = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && isMounted) {
        void refresh(true);
      } else if (isMounted) {
        setIsLoading(false);
      }
    };

    void checkAndRefresh();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        if (session) void refresh(true);
      } else if (event === 'SIGNED_OUT' || !session) {
        setOrganizations([]);
        setProjects([]);
        setServices([]);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [refresh]);

  // Keep the active selection in sync with fresh server data or current URL on page refresh
  useEffect(() => {
    if (organizations.length === 0 && projects.length === 0) return;

    const pathname = window.location.pathname;

    if (pathname.startsWith('/dashboard/project/')) {
      const match = pathname.match(/^\/dashboard\/project\/([^\/]+)/);
      const urlProjectId = match ? match[1] : null;
      if (urlProjectId) {
        const foundProj = projects.find((p) => p.id === urlProjectId);
        if (foundProj) {
          if (activeProject?.id !== foundProj.id) {
            setActiveProject(foundProj);
          }
          const parentOrg = organizations.find((o) => o.id === foundProj.orgId);
          if (parentOrg && activeOrganization?.id !== parentOrg.id) {
            setActiveOrganization(parentOrg);
          }
          return;
        }
      }
    } else if (pathname.startsWith('/dashboard/org/')) {
      const match = pathname.match(/^\/dashboard\/org\/([^\/]+)/);
      const urlOrgId = match ? match[1] : null;
      if (urlOrgId) {
        const foundOrg = organizations.find((o) => o.id === urlOrgId);
        if (foundOrg && activeOrganization?.id !== foundOrg.id) {
          setActiveOrganization(foundOrg);
          setActiveProject(null);
          return;
        }
      }
    }

    // Fallback sync with previous selection
    setActiveOrganization((prev) =>
      prev ? organizations.find((o) => o.id === prev.id) ?? null : prev
    );
    setActiveProject((prev) =>
      prev ? projects.find((p) => p.id === prev.id) ?? null : prev
    );
  }, [organizations, projects]);

  useEffect(() => {
    try {
      if (activeOrganization) {
        localStorage.setItem(ORG_KEY, JSON.stringify(activeOrganization));
      } else {
        localStorage.removeItem(ORG_KEY);
      }
    } catch {
      // ignore
    }
  }, [activeOrganization]);

  useEffect(() => {
    try {
      if (activeProject) {
        localStorage.setItem(PROJECT_KEY, JSON.stringify(activeProject));
      } else {
        localStorage.removeItem(PROJECT_KEY);
      }
    } catch {
      // ignore
    }
  }, [activeProject]);

  const selectOrganization = (orgId: string) => {
    setActiveOrganization(organizations.find((o) => o.id === orgId) || null);
    setActiveProject(null);
  };

  const createOrganization = async (input: OrganizationInput): Promise<Organization> => {
    try {
      const newOrg = await organizationService.createOrganization(input);
      setOrganizations((prev) => [...prev, newOrg]);
      setActiveOrganization(newOrg);
      setActiveProject(null);
      notify.success('Organization Created', `Organization "${newOrg.name}" has been created successfully.`);
      void notify.native('New Organization Created', { body: `Created ${newOrg.name} (${newOrg.code})` });
      return newOrg;
    } catch (err: any) {
      notify.error('Failed to Create Organization', err.message || 'Error occurred.');
      throw err;
    }
  };

  const selectProject = (projectId: string) => {
    const proj = projects.find((p) => p.id === projectId) || null;
    setActiveProject(proj);
    if (proj) {
      const parentOrg = organizations.find((o) => o.id === proj.orgId);
      if (parentOrg) setActiveOrganization(parentOrg);
    }
  };

  const createProject = async (input: ProjectInput): Promise<Project> => {
    try {
      const newProj = await organizationService.createProject(input);
      setProjects((prev) => [...prev, newProj]);
      setActiveProject(newProj);
      notify.success('Project Created', `Project "${newProj.name}" has been initialized.`);
      void notify.native('New Project Active', { body: `Project ${newProj.name} (${newProj.code}) initialized.` });
      return newProj;
    } catch (err: any) {
      notify.error('Failed to Create Project', err.message || 'Error occurred.');
      throw err;
    }
  };

  const resetSelection = () => {
    setActiveOrganization(null);
    setActiveProject(null);
    setOrganizations([]);
    setProjects([]);
  };

  const getProjectsForOrg = (orgId: string) => projects.filter((p) => p.orgId === orgId);

  /** Services that still have no project inside the given organization. */
  const getAvailableServices = (orgId: string) => {
    const used = new Set(projects.filter((p) => p.orgId === orgId).map((p) => p.serviceId));
    return services.filter((s) => !used.has(s.id));
  };

  const value: OrganizationContextValue = {
    organizations,
    projects,
    services,
    isLoading,
    activeOrganization,
    activeProject,
    isSelectionComplete: Boolean(activeOrganization && activeProject),
    selectOrganization,
    createOrganization,
    selectProject,
    createProject,
    resetSelection,
    refresh,
    getProjectsForOrg,
    getAvailableServices,
  };

  return React.createElement(OrganizationContext.Provider, { value }, children);
};

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}

