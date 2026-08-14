import { useCallback } from 'react';
import { notify } from '@/utils/notification';
import {
  useCreateOrganizationMutation,
  useCreateProjectMutation,
} from '@/features/organizations/hooks/useOrganizationsQuery';
import type {
  Organization,
  OrganizationInput,
  Project,
  ProjectInput,
} from '@/types/organization.types';

interface Callbacks {
  onOrganizationCreated?: (org: Organization) => void;
  onProjectCreated?: (project: Project) => void;
}

/** Workspace write operations + user feedback, kept out of the context provider. */
export function useWorkspaceMutations(userId: string | null, callbacks: Callbacks = {}) {
  const createOrgMutation = useCreateOrganizationMutation(userId);
  const createProjectMutation = useCreateProjectMutation(userId);
  const { onOrganizationCreated, onProjectCreated } = callbacks;

  const createOrganization = useCallback(
    async (input: OrganizationInput): Promise<Organization> => {
      try {
        const newOrg = await createOrgMutation.mutateAsync(input);
        onOrganizationCreated?.(newOrg);
        notify.success('Organization Created', `Organization "${newOrg.name}" has been created successfully.`);
        void notify.native('New Organization Created', { body: `Created ${newOrg.name} (${newOrg.code})` });
        return newOrg;
      } catch (err) {
        notify.error('Failed to Create Organization', err instanceof Error ? err.message : 'Error occurred.');
        throw err;
      }
    },
    [createOrgMutation, onOrganizationCreated]
  );

  const createProject = useCallback(
    async (input: ProjectInput): Promise<Project> => {
      try {
        const newProj = await createProjectMutation.mutateAsync(input);
        onProjectCreated?.(newProj);
        notify.success('Project Created', `Project "${newProj.name}" has been initialized.`);
        void notify.native('New Project Active', { body: `Project ${newProj.name} (${newProj.code}) initialized.` });
        return newProj;
      } catch (err) {
        notify.error('Failed to Create Project', err instanceof Error ? err.message : 'Error occurred.');
        throw err;
      }
    },
    [createProjectMutation, onProjectCreated]
  );

  return { createOrganization, createProject };
}
