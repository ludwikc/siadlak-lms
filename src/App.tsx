import { Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { AdminProvider } from "@/context/AdminContext";
import { ProgressProvider } from "@/context/ProgressContext";
import { PreferencesProvider } from "@/context/PreferencesContext";
import { AppStateProvider } from "@/context/AppStateContext";
import ErrorBoundary from "@/components/shared/ErrorBoundary";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { OfflineIndicator } from "@/components/ui/offline-indicator";
import { routes } from './routes';

// Loading fallback with better styling
const PageLoader = () => (
  <div className="flex h-full w-full items-center justify-center">
    <LoadingSpinner size="lg" label="Loading page..." />
  </div>
);

// Create query client with improved error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
      meta: {
        onError: (error) => {
          console.error("Query error:", error);
          // Only show toast for server errors, not for expected application behavior
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
                        {routes}
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
