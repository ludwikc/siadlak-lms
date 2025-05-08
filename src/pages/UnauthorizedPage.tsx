
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft, RefreshCw, Bug } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ADMIN_DISCORD_IDS } from '@/types/auth';

const UnauthorizedPage: React.FC = () => {
  const { user, signIn, refreshSession } = useAuth();
  const navigate = useNavigate();
  
  // Debug information to better understand user data structure
  const userDebugInfo = {
    id: user?.id,
    email: user?.email,
    discord_id: user?.discord_id || user?.user_metadata?.discord_id || user?.user_metadata?.provider_id,
    discord_username: user?.discord_username || user?.user_metadata?.discord_username,
    is_admin: user?.is_admin || user?.user_metadata?.is_admin,
    is_admin_by_id: user?.discord_id ? ADMIN_DISCORD_IDS.includes(user.discord_id) : 
                   user?.user_metadata?.provider_id ? ADMIN_DISCORD_IDS.includes(user.user_metadata.provider_id) : false
  };
  
  // Log debug information in console for troubleshooting
  console.log('UnauthorizedPage - User Debug Info:', userDebugInfo);
  console.log('UnauthorizedPage - Full User Object:', user);
  console.log('UnauthorizedPage - Admin IDs:', ADMIN_DISCORD_IDS);
  
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
            <p className="text-discord-header-text font-medium">
              {user?.discord_username || user?.user_metadata?.discord_username || user?.email || "Unknown User"}
            </p>
            <div className="mt-2 pt-2 border-t border-discord-sidebar-bg">
              <details className="text-left">
                <summary className="text-xs text-discord-secondary-text cursor-pointer hover:text-discord-text">Debug information</summary>
                <div className="mt-2 p-2 bg-discord-sidebar-bg rounded text-xs font-mono whitespace-pre-wrap text-discord-text overflow-auto max-h-40">
                  {JSON.stringify(userDebugInfo, null, 2)}
                </div>
              </details>
            </div>
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
            onClick={refreshSession}
            className="flex items-center justify-center gap-2 rounded-md bg-discord-brand px-6 py-3 text-white transition-opacity hover:opacity-90"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Session
          </button>

          <button
            onClick={signIn}
            className="rounded-md bg-discord-brand px-6 py-3 text-white transition-opacity hover:opacity-90"
          >
            Sign In Again
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
