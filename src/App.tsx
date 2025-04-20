import { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { AdminProvider } from "@/context/AdminContext";
import { ProgressProvider } from "@/context/ProgressContext";
import { PreferencesProvider } from "@/context/PreferencesContext";
import { AppStateProvider } from "@/context/AppStateContext";
import MainLayout from "@/components/layout/MainLayout";
import ErrorBoundary from "@/components/shared/ErrorBoundary";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { OfflineIndicator } from "@/components/ui/offline-indicator";
import { ErrorState } from "@/components/ui/error-state";
import { PasswordProtectedRoute } from "@/components/dev/PasswordProtectedRoute";

const HomePage = lazy(() => import("./pages/HomePage"));
const CoursesPage = lazy(() => import("./pages/CoursesPage"));
const CourseDetailsPage = lazy(() => import("./pages/CourseDetailsPage"));
const ModulePage = lazy(() => import("./pages/ModulePage"));
const LessonPage = lazy(() => import("./pages/LessonPage"));
const AdminDashboardPage = lazy(() => import("./pages/AdminDashboardPage"));
const AuthCallbackPage = lazy(() => import("./pages/AuthCallbackPage"));
const SignedOutPage = lazy(() => import("./pages/SignedOutPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const UnauthorizedPage = lazy(() => import("./pages/UnauthorizedPage"));
const AdminCourseListPage = lazy(() => import("./pages/admin/AdminCourseListPage"));
const AdminCourseEditPage = lazy(() => import("./pages/admin/AdminCourseEditPage"));
const AdminModuleEditPage = lazy(() => import("./pages/admin/AdminModuleEditPage"));
const AdminLessonEditPage = lazy(() => import("./pages/admin/AdminLessonEditPage"));
const AdminRolesPage = lazy(() => import("./pages/admin/AdminRolesPage"));

const PageLoader = () => (
  <div className="flex h-full w-full items-center justify-center">
    <LoadingSpinner size="lg" label="Loading page..." />
  </div>
);

const SuspenseErrorFallback = () => (
  <div className="flex h-full w-full items-center justify-center p-4">
    <ErrorState
      title="Failed to load component"
      message="There was a problem loading this part of the application. Please try refreshing the page."
      severity="error"
      retryLabel="Refresh Page"
      onRetry={() => window.location.reload()}
    />
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
      retry: 2,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      meta: {
        onError: (error) => {
          console.error("Query error:", error);
          if (error instanceof Error && !error.message.includes('not found')) {
            // toast.error(`Query failed: ${error.message}`);
          }
        }
      }
    },
    mutations: {
      retry: 1,
      meta: {
        onError: (error) => {
          console.error("Mutation error:", error);
          // toast.error(`Operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AdminProvider>
          <ProgressProvider>
            <PreferencesProvider>
              <AppStateProvider>
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  <OfflineIndicator />
                  <BrowserRouter>
                    <Suspense fallback={<PageLoader />}>
                      <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/auth/callback" element={
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
                        } />
                        <Route path="/unauthorized" element={<UnauthorizedPage />} />
                        <Route path="/signed-out" element={<SignedOutPage />} />
                        
                        <Route path="/dev/courses" element={
                          <PasswordProtectedRoute requiredPassword="Lifehackerzy-dev">
                            <MainLayout requireAuth={false}>
                              <CoursesPage />
                            </MainLayout>
                          </PasswordProtectedRoute>
                        } />
                        <Route path="/dev/admin" element={
                          <PasswordProtectedRoute requiredPassword="Lifehackerzy-adm">
                            <MainLayout requireAuth={false} adminOnly={false}>
                              <AdminDashboardPage />
                            </MainLayout>
                          </PasswordProtectedRoute>
                        } />

                        <Route element={<MainLayout requireAuth={true} />}>
                          <Route path="/courses" element={
                            <ErrorBoundary>
                              <CoursesPage />
                            </ErrorBoundary>
                          } />
                          <Route path="/courses/:courseSlug" element={
                            <ErrorBoundary>
                              <CourseDetailsPage />
                            </ErrorBoundary>
                          } />
                          <Route path="/courses/:courseSlug/:moduleSlug" element={
                            <ErrorBoundary>
                              <ModulePage />
                            </ErrorBoundary>
                          } />
                          <Route 
                            path="/courses/:courseSlug/:moduleSlug/:lessonSlug" 
                            element={
                              <ErrorBoundary>
                                <LessonPage />
                              </ErrorBoundary>
                            } 
                          />
                        </Route>
                        
                        <Route element={<MainLayout requireAuth={true} adminOnly={true} />}>
                          <Route path="/admin" element={
                            <ErrorBoundary>
                              <AdminDashboardPage />
                            </ErrorBoundary>
                          } />
                          <Route path="/admin/courses" element={
                            <ErrorBoundary>
                              <AdminCourseListPage />
                            </ErrorBoundary>
                          } />
                          <Route path="/admin/courses/new" element={
                            <ErrorBoundary>
                              <AdminCourseEditPage />
                            </ErrorBoundary>
                          } />
                          <Route path="/admin/courses/:courseId" element={
                            <ErrorBoundary>
                              <AdminCourseEditPage />
                            </ErrorBoundary>
                          } />
                          <Route path="/admin/courses/:courseId/modules/new" element={
                            <ErrorBoundary>
                              <AdminModuleEditPage />
                            </ErrorBoundary>
                          } />
                          <Route path="/admin/courses/:courseId/modules/:moduleId" element={
                            <ErrorBoundary>
                              <AdminModuleEditPage />
                            </ErrorBoundary>
                          } />
                          <Route path="/admin/courses/:courseId/modules/:moduleId/lessons/new" element={
                            <ErrorBoundary>
                              <AdminLessonEditPage />
                            </ErrorBoundary>
                          } />
                          <Route path="/admin/courses/:courseId/modules/:moduleId/lessons/:lessonId" element={
                            <ErrorBoundary>
                              <AdminLessonEditPage />
                            </ErrorBoundary>
                          } />
                          <Route path="/admin/roles" element={
                            <ErrorBoundary>
                              <AdminRolesPage />
                            </ErrorBoundary>
                          } />
                        </Route>
                        
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </BrowserRouter>
                </TooltipProvider>
              </AppStateProvider>
            </PreferencesProvider>
          </ProgressProvider>
        </AdminProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
