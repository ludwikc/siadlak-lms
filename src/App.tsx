import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
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
              {/* Add more admin routes as needed */}
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
