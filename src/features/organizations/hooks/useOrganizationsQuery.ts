import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationService } from '@/features/organizations/services/organizationService';
import type {
  Organization,
  OrganizationInput,
  Project,
  ProjectInput,
  Service,
} from '@/types/organization.types';

/**
 * Query keys are scoped by userId so a sign-in/sign-out swap never reuses another
 * user's cache and never needs a "defensive" refetch.
 */
export const organizationsKey = (userId: string | null) => ['organizations', userId] as const;
export const projectsKey = (userId: string | null) => ['projects', userId] as const;
export const servicesKey = (userId: string | null) => ['services', userId] as const;

/**
 * Freshness policy for workspace data (organizations / projects):
 * - fresh for 30s  -> page switches inside that window cost 0 requests
 * - polled every 30s while the tab is visible -> backend changes show up on
 *   their own, no manual refresh needed
 * - never polled in a hidden/background tab -> no wasted requests or rate-limit burn
 */
const WORKSPACE_FRESHNESS = {
  staleTime: 30 * 1000,
  gcTime: 60 * 1000,
  refetchInterval: 30 * 1000,
  refetchIntervalInBackground: false,
} as const;

export function useOrganizationsQuery(userId: string | null) {
  return useQuery<Organization[], Error>({
    queryKey: organizationsKey(userId),
    queryFn: () => organizationService.fetchOrganizations(),
    enabled: Boolean(userId),
    ...WORKSPACE_FRESHNESS,
  });
}

/** All projects for the user in one request; per-org views filter client-side. */
export function useProjectsQuery(userId: string | null) {
  return useQuery<Project[], Error>({
    queryKey: projectsKey(userId),
    queryFn: () => organizationService.fetchProjects(),
    enabled: Boolean(userId),
    ...WORKSPACE_FRESHNESS,
  });
}

/** Services are a near-static catalog, so they stay opt-in and cached longer. */
export function useServicesQuery(userId: string | null, enabled: boolean) {
  return useQuery<Service[], Error>({
    queryKey: servicesKey(userId),
    queryFn: () => organizationService.fetchServices(),
    enabled: Boolean(userId) && enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useCreateOrganizationMutation(userId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: OrganizationInput) => organizationService.createOrganization(input),
    onSuccess: (created) => {
      // Optimistic cache write for instant UI, then re-sync with the server.
      queryClient.setQueryData<Organization[]>(organizationsKey(userId), (prev) =>
        prev ? [...prev, created] : [created]
      );
      void queryClient.invalidateQueries({ queryKey: organizationsKey(userId) });
    },
  });
}

export function useCreateProjectMutation(userId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ProjectInput) => organizationService.createProject(input),
    onSuccess: (created) => {
      queryClient.setQueryData<Project[]>(projectsKey(userId), (prev) =>
        prev ? [...prev, created] : [created]
      );
      void queryClient.invalidateQueries({ queryKey: projectsKey(userId) });
    },
  });
}
