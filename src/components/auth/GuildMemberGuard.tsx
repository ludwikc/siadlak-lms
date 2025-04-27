
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { CONTACT_URL } from '@/lib/discord/constants';
import { toast } from 'sonner';

interface GuildMemberGuardProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

const GuildMemberGuard: React.FC<GuildMemberGuardProps> = ({ 
  children, 
  requiredRoles = [] 
}) => {
  const { user, isLoading, isAuthenticated, signIn } = useAuth();
  const [isCheckingMembership, setIsCheckingMembership] = useState(true);
  const [hasMembership, setHasMembership] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAccess = () => {
      if (!isLoading && user) {
        setIsCheckingMembership(true);
        
        // With the centralized auth, the user is automatically verified as a guild member
        // so we only need to check for specific role requirements if any
        if (requiredRoles.length > 0) {
          // Check if the user has any of the required roles
          const userRoles = user.roles || [];
          const hasRequiredRole = requiredRoles.some(roleId => 
            userRoles.includes(roleId)
          );
          
          if (!hasRequiredRole) {
            setError("You don't have the required Discord roles to access this content.");
            setHasMembership(false);
          } else {
            setHasMembership(true);
          }
        } else {
          // No specific roles required, so access is granted
          setHasMembership(true);
        }
        
        setIsCheckingMembership(false);
      } else if (!isLoading && !isAuthenticated) {
        // User is not authenticated
        setIsCheckingMembership(false);
        setHasMembership(false);
      }
    };
    
    checkAccess();
  }, [isLoading, user, isAuthenticated, requiredRoles]);

  if (isLoading || isCheckingMembership) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-discord-brand border-t-transparent mx-auto"></div>
          <p className="text-discord-secondary-text">
            Verifying your access...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center p-4">
        <div className="max-w-md rounded-lg border border-discord-sidebar-bg bg-discord-deep-bg p-8 text-center">
          <h1 className="mb-4 text-2xl font-bold text-discord-header-text">Access Denied</h1>
          <p className="mb-6 text-discord-secondary-text">{error}</p>
          <div className="space-y-4">
            <a
              href={CONTACT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="discord-button-secondary block w-full"
            >
              Contact Support
            </a>
            
            <button
              onClick={() => {
                // Sign out and redirect to login
                signIn();
              }}
              className="discord-button-primary block w-full"
            >
              Sign In Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!hasMembership) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default GuildMemberGuard;
