import { useCallback } from 'react';
import { authService } from '@/features/auth/services/authService';
import { useOrganization } from '@/context/OrganizationProvider';
import { navigateTo } from '@/config/navigationConfig';
import { notify } from '@/utils/notification';

/** Single sign-out implementation used by every screen (shell, org pages, auth hook). */
export function useLogout() {
  const { resetSelection } = useOrganization();

  return useCallback(async () => {
    resetSelection();
    notify.info('Signed Out', 'You have been logged out safely.');
    await authService.logout();
    navigateTo('/', { replace: true });
  }, [resetSelection]);
}
