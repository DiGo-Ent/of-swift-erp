import React, { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Loading } from '@/components/common/Loading';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { setAppNavigator } from '@/config/navigationConfig';

// Code-splitting: every page is its own chunk, loaded on first visit only.
const AuthPage = lazy(() => import('@/features/auth/pages/AuthPage').then((m) => ({ default: m.AuthPage })));
const OrganizationsPage = lazy(() => import('@/features/organizations/pages/OrganizationsPage').then((m) => ({ default: m.OrganizationsPage })));
const CreateOrganizationPage = lazy(() => import('@/features/organizations/pages/CreateOrganizationPage').then((m) => ({ default: m.CreateOrganizationPage })));
const OrgProjectsPage = lazy(() => import('@/features/organizations/pages/OrgProjectsPage').then((m) => ({ default: m.OrgProjectsPage })));
const DashboardLayout = lazy(() => import('@/features/dashboard/layouts/DashboardLayout').then((m) => ({ default: m.DashboardLayout })));
const OverviewPage = lazy(() => import('@/features/dashboard/pages/OverviewPage').then((m) => ({ default: m.OverviewPage })));
const MfaSettingsPage = lazy(() => import('@/features/settings/two-factor/pages/MfaSettingsPage').then((m) => ({ default: m.MfaSettingsPage })));
const ChangePasswordPage = lazy(() => import('@/features/settings/change-password/pages/ChangePasswordPage').then((m) => ({ default: m.ChangePasswordPage })));

const Fallback: React.FC = () => <Loading variant="fullScreen" message="Loading section..." />;

/** Pages inside the dashboard shell — shared by project-scoped and project-less URLs. */
const dashboardChildren = (
  <>
    <Route index element={<Navigate to="overview" replace />} />
    <Route path="overview" element={<OverviewPage />} />
    <Route path="settings" element={<Navigate to="mfa" replace />} />
    <Route path="settings/mfa" element={<MfaSettingsPage />} />
    <Route path="settings/change-password" element={<ChangePasswordPage />} />
    <Route path="*" element={<Navigate to="overview" replace />} />
  </>
);

export const AppRoutes: React.FC = () => {
  const navigate = useNavigate();
  const {
    isAuthenticated,
    isInitialLoading,
    error,
    mfaFactor,
    login,
    verifyMfa,
    cancelMfa,
    signup,
    forgotPassword,
  } = useAuth();

  useEffect(() => {
    setAppNavigator((path, options) => navigate(path, { replace: options?.replace }));
    return () => setAppNavigator(null);
  }, [navigate]);

  if (isInitialLoading) {
    return <Loading variant="fullScreen" message="Initializing Secure Session..." />;
  }

  if (!isAuthenticated || Boolean(mfaFactor)) {
    return (
      <ErrorBoundary fallbackMode="compact">
        <Suspense fallback={<Fallback />}>
          <AuthPage
            onLogin={login}
            onSignup={signup}
            onForgotPassword={forgotPassword}
            onVerifyMfa={verifyMfa}
            onCancelMfa={cancelMfa}
            mfaFactor={mfaFactor}
            error={error}
          />
        </Suspense>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary fallbackMode="compact">
      <Suspense fallback={<Fallback />}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard/organizations" replace />} />

          {/* Workspace selection */}
          <Route path="/dashboard/organizations" element={<OrganizationsPage />} />
          <Route path="/dashboard/new" element={<CreateOrganizationPage />} />
          <Route path="/dashboard/org/:orgId" element={<OrgProjectsPage />} />

          {/* Project-scoped dashboard */}
          <Route path="/dashboard/project/:projectId" element={<DashboardLayout />}>
            {dashboardChildren}
          </Route>

          {/* Project-less dashboard (account-level settings) */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            {dashboardChildren}
          </Route>

          {/* Legacy URLs */}
          <Route path="/overview" element={<Navigate to="/dashboard/overview" replace />} />
          <Route path="/settings" element={<Navigate to="/dashboard/settings/mfa" replace />} />
          <Route path="/settings/mfa" element={<Navigate to="/dashboard/settings/mfa" replace />} />
          <Route path="/settings/change-password" element={<Navigate to="/dashboard/settings/change-password" replace />} />

          <Route path="*" element={<Navigate to="/dashboard/organizations" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};
