
import { lazy } from 'react';
import { Route } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import ErrorBoundary from '@/components/shared/ErrorBoundary';

// Lazy-loaded components
const CoursesPage = lazy(() => import("@/pages/CoursesPage"));
const CourseDetailsPage = lazy(() => import("@/pages/CourseDetailsPage"));
const ModulePage = lazy(() => import("@/pages/ModulePage"));
const LessonPage = lazy(() => import("@/pages/LessonPage"));

export const authenticatedRoutes = [
  <Route key="auth-routes" element={<MainLayout requireAuth={true} />}>
    <Route 
      key="courses"
      path="/courses" 
      element={
        <ErrorBoundary>
          <CoursesPage />
        </ErrorBoundary>
      } 
    />
    <Route 
      key="course-details"
      path="/courses/:courseSlug" 
      element={
        <ErrorBoundary>
          <CourseDetailsPage />
        </ErrorBoundary>
      } 
    />
    <Route 
      key="module"
      path="/courses/:courseSlug/:moduleSlug" 
      element={
        <ErrorBoundary>
          <ModulePage />
        </ErrorBoundary>
      } 
    />
    <Route 
      key="lesson"
      path="/courses/:courseSlug/:moduleSlug/:lessonSlug" 
      element={
        <ErrorBoundary>
          <LessonPage />
        </ErrorBoundary>
      } 
    />
  </Route>
];
