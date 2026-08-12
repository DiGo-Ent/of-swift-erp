import React, { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Loading } from '@/components/common/Loading';
import { useOrganization } from '@/context/useOrganization';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

// Code-Splitting with React.lazy for high performance bundle splitting
const AuthPage = lazy(() => import('@/features/auth/pages/AuthPage').then((m) => ({ default: m.AuthPage })));
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const OrganizationsPage = lazy(() => import('@/features/organizations/pages/OrganizationsPage').then((m) => ({ default: m.OrganizationsPage })));
const CreateOrganizationPage = lazy(() => import('@/features/organizations/pages/CreateOrganizationPage').then((m) => ({ default: m.CreateOrganizationPage })));
const OrgProjectsPage = lazy(() => import('@/features/organizations/pages/OrgProjectsPage').then((m) => ({ default: m.OrgProjectsPage })));

const Fallback: React.FC = () => <Loading variant="fullScreen" message="Loading section..." />;

const OrgProjectsRouteWrapper: React.FC<{
  userEmail: string;
  onLogout: () => void;
  activeOrganization: any;
  activeProject: any;
}> = ({ userEmail, onLogout, activeOrganization, activeProject }) => {
  const { orgId } = useParams<{ orgId: string }>();
  return (
    <OrgProjectsPage
      userEmail={userEmail}
      orgId={orgId || activeOrganization?.id || ''}
      onLogout={onLogout}
      activeOrganization={activeOrganization}
      activeProject={activeProject}
    />
  );
};

const DashboardRouteWrapper: React.FC<{
  user: any;
  onLogout: () => void;
  activeOrganization: any;
  activeProject: any;
}> = ({ user, onLogout, activeOrganization, activeProject }) => {
  const location = useLocation();
  return (
    <DashboardPage
      user={user}
      onLogout={onLogout}
      currentPath={location.pathname}
      activeOrganization={activeOrganization}
      activeProject={activeProject}
    />
  );
};

export const AppRoutes: React.FC = () => {
  const {
    user,
    isAuthenticated,
    isInitialLoading,
    error,
    mfaFactor,
    login,
    verifyMfa,
    cancelMfa,
    signup,
    forgotPassword,
    logout,
  } = useAuth();

  const {
    organizations,
    isLoading,
    activeOrganization,
    activeProject,
    resetSelection,
    refresh: refreshOrganizations,
  } = useOrganization();

  useEffect(() => {
    if (isAuthenticated && user && !mfaFactor) {
      if (organizations.length === 0 && !isLoading) {
        void refreshOrganizations();
      }
    }
  }, [isAuthenticated, user, mfaFactor, isLoading, organizations.length, refreshOrganizations]);

  if (isInitialLoading) {
    return <Loading variant="fullScreen" message="Initializing Secure Session..." />;
  }

  if (!isAuthenticated || !user || Boolean(mfaFactor)) {
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

  const handleLogout = () => {
    resetSelection();
    logout();
  };

  return (
    <ErrorBoundary fallbackMode="compact">
      <Suspense fallback={<Fallback />}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard/organizations" replace />} />
          <Route
            path="/dashboard/organizations"
            element={
              <OrganizationsPage
                userEmail={user.email}
                onLogout={handleLogout}
                activeOrganization={activeOrganization}
                activeProject={activeProject}
              />
            }
          />
          <Route
            path="/dashboard/new"
            element={
              <CreateOrganizationPage
                userEmail={user.email}
                onLogout={handleLogout}
                activeOrganization={activeOrganization}
                activeProject={activeProject}
              />
            }
          />
          <Route
            path="/dashboard/org/:orgId"
            element={
              <OrgProjectsRouteWrapper
                userEmail={user.email}
                onLogout={handleLogout}
                activeOrganization={activeOrganization}
                activeProject={activeProject}
              />
            }
          />
          <Route
            path="/dashboard/*"
            element={
              <DashboardRouteWrapper
                user={user}
                onLogout={handleLogout}
                activeOrganization={activeOrganization}
                activeProject={activeProject}
              />
            }
          />
          <Route
            path="/settings/*"
            element={
              <DashboardRouteWrapper
                user={user}
                onLogout={handleLogout}
                activeOrganization={activeOrganization}
                activeProject={activeProject}
              />
            }
          />
          <Route
            path="/overview"
            element={
              <DashboardRouteWrapper
                user={user}
                onLogout={handleLogout}
                activeOrganization={activeOrganization}
                activeProject={activeProject}
              />
            }
          />
          <Route path="*" element={<Navigate to="/dashboard/organizations" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};

