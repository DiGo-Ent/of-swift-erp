import React, { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/context/SessionContext';
import { workspaceStorage } from '@/config/navigationConfig';
import {
  useOrganizationsQuery,
  useProjectsQuery,
  useServicesQuery,
  organizationsKey,
  projectsKey,
} from '@/features/organizations/hooks/useOrganizationsQuery';
import { useWorkspaceMutations } from '@/features/organizations/hooks/useWorkspaceMutations';
import type {
  Organization,
  OrganizationInput,
  Project,
  ProjectInput,
  Service,
} from '@/types/organization.types';

export type { Organization, Project, Service };

interface OrganizationContextValue {
  organizations: Organization[];
  projects: Project[];
  services: Service[];
  isLoading: boolean;
  isOrganizationsLoading: boolean;
  isProjectsLoading: boolean;
  isServicesLoading: boolean;
  /** True while workspace data is being re-fetched (background poll, focus refetch or manual). */
  isSyncing: boolean;
  /** Timestamp (ms) of the most recent successful workspace sync. */
  lastSyncedAt: number | null;
  error: Error | null;
  activeOrganization: Organization | null;
  activeProject: Project | null;
  isSelectionComplete: boolean;
  selectOrganization: (orgId: string) => void;
  createOrganization: (input: OrganizationInput) => Promise<Organization>;
  selectProject: (projectId: string) => void;
  createProject: (input: ProjectInput) => Promise<Project>;
  resetSelection: () => void;
  refresh: () => Promise<void>;
  /** Opt-in loader: services are only fetched when a create-project form needs them. */
  loadServices: () => void;
  getProjectsForOrg: (orgId: string) => Project[];
  getAvailableServices: (orgId: string) => Service[];
}

const OrganizationContext = createContext<OrganizationContextValue | undefined>(undefined);

const matchId = (pathname: string, prefix: string): string | null => {
  const m = pathname.match(new RegExp(`^${prefix}/([^/]+)`));
  return m ? m[1] : null;
};

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userId } = useSession();
  const queryClient = useQueryClient();
  const { pathname } = useLocation();

  const [servicesEnabled, setServicesEnabled] = useState(false);
  const [manualOrgId, setManualOrgId] = useState<string | null>(() => workspaceStorage.getOrgId());
  const [manualProjectId, setManualProjectId] = useState<string | null>(() => workspaceStorage.getProjectId());

  const orgsQuery = useOrganizationsQuery(userId);
  const projectsQuery = useProjectsQuery(userId);
  const servicesQuery = useServicesQuery(userId, servicesEnabled);

  const organizations = orgsQuery.data ?? [];
  const projects = projectsQuery.data ?? [];
  const services = servicesQuery.data ?? [];

  // Selection is DERIVED from the URL first, then explicit selection / last-used.
  const urlProjectId = matchId(pathname, '/dashboard/project');
  const urlOrgId = matchId(pathname, '/dashboard/org');

  const activeProject = useMemo<Project | null>(() => {
    const wanted = urlProjectId ?? (urlOrgId ? null : manualProjectId);
    if (!wanted) return null;
    return projects.find((p) => p.id === wanted) ?? null;
  }, [projects, urlProjectId, urlOrgId, manualProjectId]);

  const activeOrganization = useMemo<Organization | null>(() => {
    const wanted = urlOrgId ?? activeProject?.orgId ?? manualOrgId;
    if (!wanted) return null;
    return organizations.find((o) => o.id === wanted) ?? null;
  }, [organizations, urlOrgId, activeProject, manualOrgId]);

  useEffect(() => {
    if (activeOrganization) workspaceStorage.setOrgId(activeOrganization.id);
  }, [activeOrganization]);

  useEffect(() => {
    if (activeProject) workspaceStorage.setProjectId(activeProject.id);
  }, [activeProject]);

  const selectOrganization = useCallback((orgId: string) => {
    setManualOrgId(orgId);
    setManualProjectId(null);
    workspaceStorage.setProjectId(null);
  }, []);

  const selectProject = useCallback(
    (projectId: string) => {
      setManualProjectId(projectId);
      const proj = projects.find((p) => p.id === projectId);
      if (proj) setManualOrgId(proj.orgId);
    },
    [projects]
  );

  const { createOrganization, createProject } = useWorkspaceMutations(userId, {
    onOrganizationCreated: (org) => {
      setManualOrgId(org.id);
      setManualProjectId(null);
    },
    onProjectCreated: (proj) => {
      setManualProjectId(proj.id);
      setManualOrgId(proj.orgId);
    },
  });

  const resetSelection = useCallback(() => {
    setManualOrgId(null);
    setManualProjectId(null);
    workspaceStorage.clear();
  }, []);

  /** Explicit user-driven refetch only (no automatic/background triggers). */
  const refresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: organizationsKey(userId) }),
      queryClient.invalidateQueries({ queryKey: projectsKey(userId) }),
    ]);
  }, [queryClient, userId]);

  const loadServices = useCallback(() => setServicesEnabled(true), []);

  const getProjectsForOrg = useCallback(
    (orgId: string) => projects.filter((p) => p.orgId === orgId),
    [projects]
  );

  const getAvailableServices = useCallback(
    (orgId: string) => {
      const used = new Set(projects.filter((p) => p.orgId === orgId).map((p) => p.serviceId));
      return services.filter((s) => !used.has(s.id));
    },
    [projects, services]
  );

  const value = useMemo<OrganizationContextValue>(
    () => ({
      organizations,
      projects,
      services,
      isLoading: orgsQuery.isLoading || projectsQuery.isLoading,
      isOrganizationsLoading: orgsQuery.isLoading,
      isProjectsLoading: projectsQuery.isLoading,
      isServicesLoading: servicesQuery.isLoading && servicesEnabled,
      isSyncing: orgsQuery.isFetching || projectsQuery.isFetching,
      lastSyncedAt:
        Math.max(orgsQuery.dataUpdatedAt ?? 0, projectsQuery.dataUpdatedAt ?? 0) || null,
      error: orgsQuery.error ?? projectsQuery.error ?? null,
      activeOrganization,
      activeProject,
      isSelectionComplete: Boolean(activeOrganization && activeProject),
      selectOrganization,
      createOrganization,
      selectProject,
      createProject,
      resetSelection,
      refresh,
      loadServices,
      getProjectsForOrg,
      getAvailableServices,
    }),
    [
      organizations,
      projects,
      services,
      orgsQuery.isLoading,
      orgsQuery.isFetching,
      orgsQuery.dataUpdatedAt,
      orgsQuery.error,
      projectsQuery.isLoading,
      projectsQuery.isFetching,
      projectsQuery.dataUpdatedAt,
      projectsQuery.error,
      servicesQuery.isLoading,
      servicesEnabled,
      activeOrganization,
      activeProject,
      selectOrganization,
      createOrganization,
      selectProject,
      createProject,
      resetSelection,
      refresh,
      loadServices,
      getProjectsForOrg,
      getAvailableServices,
    ]
  );

  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>;
};

export function useOrganization(): OrganizationContextValue {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}
