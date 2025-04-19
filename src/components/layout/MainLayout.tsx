
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { Outlet, Navigate } from 'react-router-dom';
import { BYPASS_DISCORD_AUTH } from '@/lib/discord/constants';
import { ExtendedUser } from '@/types/auth';

type MainLayoutProps = {
  requireAuth?: boolean;
  adminOnly?: boolean;
};

const MainLayout: React.FC<MainLayoutProps> = ({
  requireAuth = true,
  adminOnly = false,
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Show loading state
  if (isLoading && !BYPASS_DISCORD_AUTH) {
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
  if (requireAuth && !isAuthenticated && !BYPASS_DISCORD_AUTH) {
    return <Navigate to="/" replace />;
  }

  // Redirect if admin access is required but user is not an admin
  if (adminOnly && (!user || !user.is_admin) && !BYPASS_DISCORD_AUTH) {
    return <Navigate to="/courses" replace />;
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
