
import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAdmin } from '@/context/AdminContext';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { ADMIN_DISCORD_IDS } from '@/types/auth';

type MainLayoutProps = {
  requireAuth?: boolean;
  adminOnly?: boolean;
};

const MainLayout: React.FC<MainLayoutProps> = ({
  requireAuth = true,
  adminOnly = false,
}) => {
  const { isAuthenticated, isLoading: authLoading, user, isAdmin } = useAuth();
  const { isUserAdmin } = useAdmin();
  const location = useLocation();

  // Get all possible Discord IDs from user object
  const discordId = user?.discord_id || 
                   user?.user_metadata?.discord_id || 
                   user?.user_metadata?.provider_id || 
                   '';
  
  // Check if the Discord ID is in the admin list
  const isDiscordIdAdmin = ADMIN_DISCORD_IDS.includes(discordId);

  // Show loading state
  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-discord-bg">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-discord-brand border-t-transparent"></div>
          <p className="mt-4 text-discord-text">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect if authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    console.log("User not authenticated, redirecting to login");
    return <Navigate to="/" replace />;
  }

  // Check admin access from all possible sources
  const hasAdminAccess = isAdmin || 
                        isUserAdmin || 
                        !!user?.is_admin || 
                        !!user?.user_metadata?.is_admin ||
                        isDiscordIdAdmin;
  
  // Debug logs for admin access with more detailed information
  useEffect(() => {
    if (adminOnly) {
      console.log('Admin access check in MainLayout:', {
        path: location.pathname,
        adminOnly,
        authIsAdmin: isAdmin,
        contextIsAdmin: isUserAdmin,
        userIsAdmin: user?.is_admin,
        userMetadataIsAdmin: user?.user_metadata?.is_admin,
        discordId,
        isDiscordIdAdmin,
        adminDiscordIds: ADMIN_DISCORD_IDS,
        hasAdminAccess,
        fullUserObject: user
      });
    }
  }, [location.pathname, adminOnly, isAdmin, isUserAdmin, user, discordId, isDiscordIdAdmin, hasAdminAccess]);

  // Redirect if admin access is required but user is not an admin
  if (adminOnly && !hasAdminAccess) {
    console.log("User not admin, redirecting to unauthorized");
    // Show a toast notification
    toast.error("You don't have admin access to this section");
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-discord-bg">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <div className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
