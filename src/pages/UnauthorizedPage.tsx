
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const UnauthorizedPage: React.FC = () => {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-discord-bg p-4 text-center">
      <div className="max-w-md">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-discord-brand p-4">
            <Shield className="h-12 w-12 text-white" />
          </div>
        </div>
        
        <h1 className="mb-4 text-3xl font-bold text-discord-header-text">
          Access Denied
        </h1>
        
        <p className="mb-8 text-discord-secondary-text">
          You don't have permission to access this area. This section is restricted to administrators only.
        </p>
        
        {user && (
          <div className="mb-6 p-3 bg-discord-deep-bg rounded-md">
            <p className="text-discord-secondary-text mb-1">Signed in as:</p>
            <p className="text-discord-header-text font-medium">{user?.discord_username || user?.user_metadata?.discord_username || user?.email || "Unknown User"}</p>
          </div>
        )}
        
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 rounded-md bg-discord-sidebar-bg px-6 py-3 text-discord-header-text transition-colors hover:bg-discord-deep-bg"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
          
          <Link
            to="/courses"
            className="rounded-md bg-discord-sidebar-bg px-6 py-3 text-discord-header-text transition-colors hover:bg-discord-deep-bg"
          >
            View Courses
          </Link>
          
          <button
            onClick={() => {
              // Sign out and sign back in to refresh session
              signIn();
            }}
            className="rounded-md bg-discord-brand px-6 py-3 text-white transition-opacity hover:opacity-90"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
