import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationService } from '@/features/organizations/services/organizationService';
import type { Organization, OrganizationInput, Project, ProjectInput } from '@/types/organization.types';

export const ORGANIZATIONS_QUERY_KEY = ['organizations'];
export const PROJECTS_QUERY_KEY = (orgId?: string) => ['projects', orgId || 'all'];

export function useOrganizationsQuery(enabled: boolean = true) {
  return useQuery<Organization[], Error>({
    queryKey: ORGANIZATIONS_QUERY_KEY,
    queryFn: () => organizationService.fetchOrganizations(),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useProjectsQuery(orgId?: string, enabled: boolean = true) {
  return useQuery<Project[], Error>({
    queryKey: PROJECTS_QUERY_KEY(orgId),
    queryFn: () => organizationService.fetchProjects(orgId),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateOrganizationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: OrganizationInput) => organizationService.createOrganization(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ORGANIZATIONS_QUERY_KEY });
    },
  });
}

export function useCreateProjectMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ProjectInput) => organizationService.createProject(input),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY(variables.orgId) });
    },
  });
}
