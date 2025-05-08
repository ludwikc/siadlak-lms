
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface AdminGuardProps {
  children: React.ReactNode;
}

export const AdminGuard: React.FC<AdminGuardProps> = ({ children }) => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  // While we're checking auth status, show nothing
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-discord-brand border-t-transparent"></div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/sign-in" />;
  }

  // If authenticated but not admin, redirect to unauthorized page
  if (!isAdmin) {
    return <Navigate to="/unauthorized" />;
  }

  // If authenticated and admin, render children
  return <>{children}</>;
};
