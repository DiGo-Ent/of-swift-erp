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
} from 'lucide-react';

/* --- Programmatic Navigation Helpers --- */
type NavigateOptions = { replace?: boolean };
type NavigateFn = (path: string, options?: NavigateOptions) => void;

let routerNavigate: NavigateFn | null = null;

export const setAppNavigator = (fn: NavigateFn | null) => { routerNavigate = fn; };

export function navigateTo(path: string, options?: NavigateOptions) {
  if (window.location.pathname === path && !options?.replace) return;
  if (routerNavigate) return routerNavigate(path, options);
  if (options?.replace) window.history.replaceState(null, '', path);
  else window.history.pushState(null, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

/* --- Workspace Storage Helpers --- */
const ORG_KEY = 'workspace.active_org_id';
const PROJ_KEY = 'workspace.active_project_id';

const getItem = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const setItem = (key: string, val: string | null) => { try { val ? localStorage.setItem(key, val) : localStorage.removeItem(key); } catch {} };

export const workspaceStorage = {
  getOrgId: () => getItem(ORG_KEY),
  getProjectId: () => getItem(PROJ_KEY),
  setOrgId: (id: string | null) => setItem(ORG_KEY, id),
  setProjectId: (id: string | null) => setItem(PROJ_KEY, id),
  clear: () => { setItem(ORG_KEY, null); setItem(PROJ_KEY, null); },
};

/* --- Navigation UI Structure Configurations --- */
export interface SubNavItem {
  id: string;
  label: string;
  path: string;
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

export const dashboardNavigation: NavSection[] = [
  {
    id: 'overview',
    path: '/overview',
    label: 'Overview',
    icon: <LayoutDashboard size={18} />,
    subItems: [
      { id: 'project_overview', label: 'Project Overview', path: '/overview', icon: <LayoutDashboard size={14} /> },
    ],
  },
  {
    id: 'settings',
    path: '/settings',
    label: 'Settings',
    icon: <Settings size={18} />,
    subItems: [
      { id: 'mfa_security', label: '2FA Security (MFA)', path: '/settings/mfa', icon: <QrCode size={14} /> },
      { id: 'change_password', label: 'Change Password', path: '/settings/change-password', icon: <KeyRound size={14} /> },
    ],
  },
];

export const sectionTarget = (section: NavSection): string => section.subItems[0]?.path ?? section.path;

export const orgMenuNavigation: CustomNavItem[] = [
  { id: 'Projects', label: 'Projects', icon: <Layers size={18} /> },
  { id: 'Team', label: 'Team', icon: <Users size={18} /> },
  { id: 'Integrations', label: 'Integrations', icon: <Blocks size={18} /> },
  { id: 'Usage', label: 'Usage', icon: <BarChart3 size={18} /> },
  { id: 'Billing', label: 'Billing', icon: <CreditCard size={18} /> },
  { id: 'Organization Settings', label: 'Organization Settings', icon: <Settings size={18} /> },
];

export const orgListNavigation: CustomNavItem[] = [
  { id: 'All Organizations', label: 'All Organizations', icon: <Building size={18} />, path: '/dashboard/organizations' },
  { id: 'New Organization', label: 'New Organization', icon: <Plus size={18} />, path: '/dashboard/new' },
];
