
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
import { Skeleton } from "@/components/ui/skeleton";

// Lazy-loaded pages
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

// Loading fallback
const PageLoader = () => (
  <div className="flex h-full w-full items-center justify-center">
    <div className="flex flex-col items-center">
      <Skeleton className="h-32 w-32 rounded" />
      <Skeleton className="mt-4 h-6 w-48" />
    </div>
  </div>
);

// Create query client with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
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
                  <BrowserRouter>
                    <Suspense fallback={<PageLoader />}>
                      <Routes>
                        {/* Public routes */}
                        <Route path="/" element={<HomePage />} />
                        <Route path="/auth/callback" element={<AuthCallbackPage />} />
                        <Route path="/unauthorized" element={<UnauthorizedPage />} />
                        <Route path="/signed-out" element={<SignedOutPage />} />
                        
                        {/* Auth required routes */}
                        <Route element={<MainLayout requireAuth={true} />}>
                          {/* Course listing */}
                          <Route path="/courses" element={<CoursesPage />} />
                          
                          {/* Course details */}
                          <Route path="/courses/:courseSlug" element={<CourseDetailsPage />} />
                          
                          {/* Module view */}
                          <Route path="/courses/:courseSlug/:moduleSlug" element={<ModulePage />} />
                          
                          {/* Lesson view */}
                          <Route 
                            path="/courses/:courseSlug/:moduleSlug/:lessonSlug" 
                            element={<LessonPage />} 
                          />
                        </Route>
                        
                        {/* Admin routes */}
                        <Route element={<MainLayout requireAuth={true} adminOnly={true} />}>
                          <Route path="/admin" element={<AdminDashboardPage />} />
                          <Route path="/admin/courses" element={<AdminCourseListPage />} />
                          <Route path="/admin/courses/new" element={<AdminCourseEditPage />} />
                          <Route path="/admin/courses/:courseId" element={<AdminCourseEditPage />} />
                          <Route path="/admin/courses/:courseId/modules/new" element={<AdminModuleEditPage />} />
                          <Route path="/admin/courses/:courseId/modules/:moduleId" element={<AdminModuleEditPage />} />
                          <Route path="/admin/courses/:courseId/modules/:moduleId/lessons/new" element={<AdminLessonEditPage />} />
                          <Route path="/admin/courses/:courseId/modules/:moduleId/lessons/:lessonId" element={<AdminLessonEditPage />} />
                          <Route path="/admin/roles" element={<AdminRolesPage />} />
                        </Route>
                        
                        {/* Catch-all route */}
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
