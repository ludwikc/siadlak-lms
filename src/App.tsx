
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { AdminProvider } from "@/context/AdminContext";
import MainLayout from "@/components/layout/MainLayout";

// Pages
import HomePage from "./pages/HomePage";
import CoursesPage from "./pages/CoursesPage";
import CourseDetailsPage from "./pages/CourseDetailsPage";
import ModulePage from "./pages/ModulePage";
import LessonPage from "./pages/LessonPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import NotFound from "./pages/NotFound";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import AdminCourseListPage from "./pages/admin/AdminCourseListPage";
import AdminCourseEditPage from "./pages/admin/AdminCourseEditPage";
import AdminModuleEditPage from "./pages/admin/AdminModuleEditPage";
import AdminLessonEditPage from "./pages/admin/AdminLessonEditPage";
import AdminRolesPage from "./pages/admin/AdminRolesPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            
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
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
