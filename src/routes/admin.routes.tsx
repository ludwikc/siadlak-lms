
import { lazy } from 'react';
import { Route } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import ErrorBoundary from '@/components/shared/ErrorBoundary';

// Lazy-loaded components
const AdminDashboardPage = lazy(() => import("@/pages/AdminDashboardPage"));
const AdminCourseListPage = lazy(() => import("@/pages/admin/AdminCourseListPage"));
const AdminCourseEditPage = lazy(() => import("@/pages/admin/AdminCourseEditPage"));
const AdminModuleEditPage = lazy(() => import("@/pages/admin/AdminModuleEditPage"));
const AdminLessonEditPage = lazy(() => import("@/pages/admin/AdminLessonEditPage"));
const AdminRolesPage = lazy(() => import("@/pages/admin/AdminRolesPage"));

export const adminRoutes = [
  <Route key="admin-routes" element={<MainLayout requireAuth={true} adminOnly={true} />}>
    <Route 
      key="admin-dashboard"
      path="/admin" 
      element={
        <ErrorBoundary>
          <AdminDashboardPage />
        </ErrorBoundary>
      } 
    />
    <Route 
      key="admin-courses"
      path="/admin/courses" 
      element={
        <ErrorBoundary>
          <AdminCourseListPage />
        </ErrorBoundary>
      } 
    />
    <Route 
      key="admin-course-new"
      path="/admin/courses/new" 
      element={
        <ErrorBoundary>
          <AdminCourseEditPage />
        </ErrorBoundary>
      } 
    />
    <Route 
      key="admin-course-edit"
      path="/admin/courses/:courseId" 
      element={
        <ErrorBoundary>
          <AdminCourseEditPage />
        </ErrorBoundary>
      } 
    />
    <Route 
      key="admin-module-new"
      path="/admin/courses/:courseId/modules/new" 
      element={
        <ErrorBoundary>
          <AdminModuleEditPage />
        </ErrorBoundary>
      } 
    />
    <Route 
      key="admin-module-edit"
      path="/admin/courses/:courseId/modules/:moduleId" 
      element={
        <ErrorBoundary>
          <AdminModuleEditPage />
        </ErrorBoundary>
      } 
    />
    <Route 
      key="admin-lesson-new"
      path="/admin/courses/:courseId/modules/:moduleId/lessons/new" 
      element={
        <ErrorBoundary>
          <AdminLessonEditPage />
        </ErrorBoundary>
      } 
    />
    <Route 
      key="admin-lesson-edit"
      path="/admin/courses/:courseId/modules/:moduleId/lessons/:lessonId" 
      element={
        <ErrorBoundary>
          <AdminLessonEditPage />
        </ErrorBoundary>
      } 
    />
    <Route 
      key="admin-roles"
      path="/admin/roles" 
      element={
        <ErrorBoundary>
          <AdminRolesPage />
        </ErrorBoundary>
      } 
    />
  </Route>
];
