
import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider } from './context/AuthContext';
import { AdminProvider } from './context/AdminContext';
import { ProgressProvider } from './context/ProgressContext';
import './index.css';
import './App.css';

import MainLayout from './components/layout/MainLayout';
import GuildMemberGuard from './components/auth/GuildMemberGuard';
import { AdminGuard } from './components/auth/AdminGuard';

// Lazily loaded pages
const HomePage = lazy(() => import('./pages/HomePage'));
const CoursesPage = lazy(() => import('./pages/CoursesPage'));
const NotFoundPage = lazy(() => import('./pages/NotFound'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminCourseListPage = lazy(() => import('./pages/admin/AdminCourseListPage'));
const AdminCourseEditPage = lazy(() => import('./pages/admin/AdminCourseEditPage'));
const AdminModuleEditPage = lazy(() => import('./pages/admin/AdminModuleEditPage'));
const AdminLessonEditPage = lazy(() => import('./pages/admin/AdminLessonEditPage'));
const AdminFailedLoginsPage = lazy(() => import('./pages/admin/AdminFailedLoginsPage'));
const AdminRolesPage = lazy(() => import('./pages/admin/AdminRolesPage'));

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AdminProvider>
          <ProgressProvider>
            <BrowserRouter>
              <Suspense
                fallback={
                  <div className="h-screen w-screen flex items-center justify-center bg-discord-dark">
                    <div className="h-8 w-8 rounded-full border-4 border-discord-brand border-t-transparent animate-spin"></div>
                  </div>
                }
              >
                <Routes>
                  {/* Using existing routes that have valid imports */}
                  <Route path="/" element={<Navigate to="/courses" replace />} />
                  
                  <Route element={<MainLayout />}>
                    <Route element={<GuildMemberGuard />}>
                      <Route path="/courses" element={<CoursesPage />} />
                    </Route>
                    
                    {/* Admin routes */}
                    <Route path="/admin" element={<AdminGuard><Navigate to="/admin/dashboard" replace /></AdminGuard>} />
                    <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                    <Route path="/admin/courses" element={<AdminCourseListPage />} />
                    <Route path="/admin/courses/new" element={<AdminCourseEditPage />} />
                    <Route path="/admin/courses/:courseId" element={<AdminCourseEditPage />} />
                    <Route path="/admin/courses/:courseId/modules/new" element={<AdminModuleEditPage />} />
                    <Route path="/admin/courses/:courseId/modules/:moduleId" element={<AdminModuleEditPage />} />
                    <Route path="/admin/courses/:courseId/modules/:moduleId/lessons/new" element={<AdminLessonEditPage />} />
                    <Route path="/admin/courses/:courseId/modules/:moduleId/lessons/:lessonId" element={<AdminLessonEditPage />} />
                    <Route path="/admin/failed-logins" element={<AdminFailedLoginsPage />} />
                    <Route path="/admin/roles" element={<AdminRolesPage />} />
                  </Route>
                  
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
            <Toaster position="top-center" richColors />
          </ProgressProvider>
        </AdminProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
