import React from 'react';
import { 
  LayoutDashboard, 
  Settings,
  QrCode,
  KeyRound,
  Layers,
  Users,
  Blocks,
  BarChart3,
  CreditCard,
  Building,
  Plus,
  Home,
  X
} from 'lucide-react';

export interface SubNavItem {
  id: string;
  label: string;
  path?: string;
  icon: React.ReactNode;
}

export interface NavSection {
  id: string;
  path: string;
  label: string;
  icon: React.ReactNode;
  subItems: SubNavItem[];
}

export interface CustomNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
}

/** Dashboard Project-level ERP Modules */
export const dashboardNavigation: NavSection[] = [
  {
    id: 'overview',
    path: '/overview',
    label: 'Overview',
    icon: <LayoutDashboard size={18} />,
    subItems: [
      { id: 'project_overview', label: 'Project Overview', path: '/overview', icon: <LayoutDashboard size={14} /> },
    ]
  },
  {
    id: 'settings',
    path: '/settings',
    label: 'Settings',
    icon: <Settings size={18} />,
    subItems: [
      { id: 'mfa_security', label: '2FA Security (MFA)', path: '/settings/mfa', icon: <QrCode size={14} /> },
      { id: 'change_password', label: 'Change Password', path: '/settings/change-password', icon: <KeyRound size={14} /> },
    ]
  },
];

export const navigationConfig = dashboardNavigation;

/** Organization Workspace Menu Options */
export const orgMenuNavigation: CustomNavItem[] = [
  { id: 'Projects', label: 'Projects', icon: <Layers size={18} /> },
  { id: 'Team', label: 'Team', icon: <Users size={18} /> },
  { id: 'Integrations', label: 'Integrations', icon: <Blocks size={18} /> },
  { id: 'Usage', label: 'Usage', icon: <BarChart3 size={18} /> },
  { id: 'Billing', label: 'Billing', icon: <CreditCard size={18} /> },
  { id: 'Organization Settings', label: 'Organization Settings', icon: <Settings size={18} /> },
];

/** Organization Directory Menu Options */
export const orgListNavigation: CustomNavItem[] = [
  { id: 'All Organizations', label: 'All Organizations', icon: <Building size={18} />, path: '/dashboard/organizations' },
  { id: 'New Organization', label: 'New Organization', icon: <Plus size={18} />, path: '/dashboard/new' },
];

/** Mobile Navigation Bar Configuration Builder */
export function getMobileBottomBarConfig(
  pageType: 'dashboard' | 'org_projects' | 'org_list' | 'create_org',
  callbacks: { navigateTo: (path: string) => void; openLauncher: () => void; openNewModal?: () => void }
) {
  switch (pageType) {
    case 'org_projects':
      return {
        leftButton: { label: 'All Orgs', icon: <Building size={20} />, onClick: () => callbacks.navigateTo('/dashboard/organizations'), color: 'var(--blue-primary)' },
        rightButton: { label: 'New Project', icon: <Plus size={20} />, onClick: () => callbacks.openNewModal?.(), color: 'var(--green-success)' }
      };
    case 'org_list':
      return {
        leftButton: { label: 'All Orgs', icon: <Building size={20} />, onClick: () => callbacks.navigateTo('/dashboard/organizations'), color: 'var(--blue-primary)' },
        rightButton: { label: 'New Org', icon: <Plus size={20} />, onClick: () => callbacks.navigateTo('/dashboard/new'), color: 'var(--green-success)' }
      };
    case 'create_org':
      return {
        leftButton: { label: 'All Orgs', icon: <Building size={20} />, onClick: () => callbacks.navigateTo('/dashboard/organizations'), color: 'var(--blue-primary)' },
        rightButton: { label: 'Cancel', icon: <X size={20} />, onClick: () => callbacks.navigateTo('/dashboard/organizations'), color: 'var(--text-muted)' }
      };
    default:
      return {
        leftButton: { label: 'Overview', icon: <LayoutDashboard size={20} />, onClick: () => callbacks.navigateTo('/dashboard/overview'), color: 'var(--blue-primary)' },
        rightButton: { label: 'Settings', icon: <Settings size={20} />, onClick: () => callbacks.navigateTo('/settings/mfa'), color: 'var(--blue-primary)' }
      };
  }
}

/** Protected Routes Map */
export const VALID_PROTECTED_ROUTES: Record<string, string> = dashboardNavigation.reduce((acc, sec) => {
  acc[sec.path] = sec.id;
  if (sec.subItems) {
    sec.subItems.forEach((sub) => {
      if (sub.path) {
        acc[sub.path] = sec.id;
      }
    });
  }
  return acc;
}, {} as Record<string, string>);

export function isPathValid(pathname: string): boolean {
  if (Object.keys(VALID_PROTECTED_ROUTES).includes(pathname)) return true;
  if (
    pathname === '/dashboard/organizations' ||
    pathname === '/dashboard/new' ||
    pathname.startsWith('/dashboard/org/') ||
    pathname.startsWith('/dashboard/project/')
  ) {
    return true;
  }
  return false;
}

/** RBAC Role-Based Access Control Helpers */
const normalizeRole = (r: string) => r.toLowerCase().trim().replace(/\s+/g, '_');

export function hasAccessToRoleKey(roleKey: string | string[] | undefined, userRoles: string[]): boolean {
  if (!roleKey) return true;
  const normalizedUserRoles = userRoles.map(normalizeRole);
  if (Array.isArray(roleKey)) {
    return roleKey.some((rk) => normalizedUserRoles.includes(normalizeRole(rk)));
  }
  return normalizedUserRoles.includes(normalizeRole(roleKey));
}

export function filterMenuByRoles(sections: NavSection[], isAdmin: boolean, userRoles: string[]): NavSection[] {
  if (isAdmin) return sections;
  return sections.filter((sec) => {
    if (sec.subItems) {
      sec.subItems = sec.subItems.filter((sub) => hasAccessToRoleKey(sub.id, userRoles));
    }
    return hasAccessToRoleKey(sec.id, userRoles);
  });
}

export function checkRouteAccess(pathname: string, isAdmin: boolean, userRoles: string[]): boolean {
  if (isAdmin || pathname === '/dashboard/organizations' || pathname === '/dashboard/new') return true;
  if (!isPathValid(pathname)) return false;
  const sectionId = VALID_PROTECTED_ROUTES[pathname];
  if (!sectionId) return true;
  return hasAccessToRoleKey(sectionId, userRoles);
}

