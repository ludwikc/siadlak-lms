
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { discordApi } from '@/lib/discord/api';
import { CONTACT_URL } from '@/lib/discord/constants';

interface GuildMemberGuardProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

const GuildMemberGuard: React.FC<GuildMemberGuardProps> = ({ 
  children, 
  requiredRoles = [] 
}) => {
  const { user, session, isLoading } = useAuth();
  const [isCheckingMembership, setIsCheckingMembership] = useState(true);
  const [hasMembership, setHasMembership] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkGuildMembership = async () => {
      if (!session?.provider_token || !user) {
        setIsCheckingMembership(false);
        return;
      }

      try {
        const member = await discordApi.checkGuildMembership(session.provider_token);
        
        if (!member) {
          setError("You need to be a member of our Discord server to access this content.");
          setHasMembership(false);
        } else {
          // Check if user has required roles if any are specified
          if (requiredRoles.length > 0) {
            const hasRequiredRole = member.roles.some(role => requiredRoles.includes(role));
            
            if (!hasRequiredRole) {
              setError("You don't have the required Discord roles to access this content.");
              setHasMembership(false);
            } else {
              setHasMembership(true);
            }
          } else {
            setHasMembership(true);
          }
        }
      } catch (err) {
        console.error("Error checking guild membership:", err);
        setError("Failed to verify your Discord server membership. Please try again later.");
        setHasMembership(false);
      } finally {
        setIsCheckingMembership(false);
      }
    };

    if (!isLoading && user) {
      checkGuildMembership();
    } else if (!isLoading && !user) {
      setIsCheckingMembership(false);
    }
  }, [isLoading, session, user, requiredRoles]);

  if (isLoading || isCheckingMembership) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-discord-brand border-t-transparent mx-auto"></div>
          <p className="text-discord-secondary-text">Verifying your Discord membership...</p>
        </div>
      </div>
    );
  }

  if (!user) {
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
              onClick={() => window.location.reload()}
              className="discord-button-primary block w-full"
            >
              Try Again
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
