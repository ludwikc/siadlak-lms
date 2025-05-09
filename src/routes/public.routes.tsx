
import { lazy } from 'react';
import { Route } from 'react-router-dom';
import ErrorBoundary from '@/components/shared/ErrorBoundary';
import { ErrorState } from '@/components/ui/error-state';
import { ENABLE_DEV_LOGIN } from '@/config/dev-auth.config';

// Lazy-loaded components
const HomePage = lazy(() => import("@/pages/HomePage"));
const AuthCallbackPage = lazy(() => import("@/pages/AuthCallbackPage"));
const SignedOutPage = lazy(() => import("@/pages/SignedOutPage"));
const UnauthorizedPage = lazy(() => import("@/pages/UnauthorizedPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const UserProfileTestPage = lazy(() => import("@/pages/UserProfileTestPage"));

// DEV-ONLY: Import the development login page
const DevLoginPage = ENABLE_DEV_LOGIN ? lazy(() => import("@/pages/DevLoginPage")) : null;

// Create the routes array
const routes = [
  <Route key="home" path="/" element={<HomePage />} />,
  <Route 
    key="auth-callback"
    path="/auth/callback" 
    element={
      <ErrorBoundary fallback={
        <ErrorState 
          title="Authentication Error"
          message="There was a problem with the authentication process. Please try signing in again."
          actionLabel="Back to Login"
          onAction={() => window.location.href = '/'}
        />
      }>
        <AuthCallbackPage />
      </ErrorBoundary>
    } 
  />,
  <Route key="unauthorized" path="/unauthorized" element={<UnauthorizedPage />} />,
  <Route key="signed-out" path="/signed-out" element={<SignedOutPage />} />,
  <Route 
    key="user-profile-test"
    path="/test/user-profile" 
    element={
      <ErrorBoundary>
        <UserProfileTestPage />
      </ErrorBoundary>
    } 
  />,
  <Route key="not-found" path="*" element={<NotFound />} />
];

// DEV-ONLY: Add the development login route if enabled
if (ENABLE_DEV_LOGIN && DevLoginPage) {
  routes.push(
    <Route key="dev-login" path="/dev-login" element={<DevLoginPage />} />
  );
}

export const publicRoutes = routes;
