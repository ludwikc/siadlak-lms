
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { discordApi } from '@/lib/discord/api';
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
  const { user, session, isLoading, refreshSession } = useAuth();
  const [isCheckingMembership, setIsCheckingMembership] = useState(true);
  const [hasMembership, setHasMembership] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const MAX_RETRIES = 3;

  // Function to handle token refresh and retry
  const handleRefreshAndRetry = async () => {
    try {
      setIsRefreshing(true);
      await refreshSession();
      setRetryCount(0); // Reset retry count after refresh
      setError(null);
      checkGuildMembership(); // Retry the check with new token
    } catch (err) {
      console.error("Failed to refresh token:", err);
      toast.error("Failed to refresh your Discord token. Please sign out and sign in again.");
    } finally {
      setIsRefreshing(false);
    }
  };

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
      setIsCheckingMembership(false);
    } catch (err) {
      console.error("Error checking guild membership:", err);
      
      // Handle token expired errors specially
      if (err instanceof Error && 
          (err.message.includes('401') || 
           err.message.includes('invalid token'))) {
        console.log("Discord token appears to be invalid, will try refreshing");
        setError("Your Discord authentication has expired. Please refresh your token.");
        setHasMembership(false);
        setIsCheckingMembership(false);
        return;
      }
      
      // Handle rate limiting
      if (err instanceof Error && err.message.includes('rate limit exceeded') && retryCount < MAX_RETRIES) {
        console.log(`Rate limited, retry attempt ${retryCount + 1}/${MAX_RETRIES}`);
        setRetryCount(prev => prev + 1);
        
        // Wait for a short delay before retrying
        setTimeout(() => {
          checkGuildMembership();
        }, 2000); // Wait 2 seconds between retries
        return;
      }
      
      // For other errors, or if max retries exceeded
      setError("Failed to verify your Discord server membership. Please try again later.");
      setHasMembership(false);
      setIsCheckingMembership(false);
      
      // Show toast for rate limiting
      if (err instanceof Error && err.message.includes('rate limit exceeded')) {
        toast.error("Discord API rate limit exceeded. Please try again in a few moments.");
      }
    }
  };

  useEffect(() => {
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
          <p className="text-discord-secondary-text">
            {retryCount > 0 
              ? `Retrying Discord API request (${retryCount}/${MAX_RETRIES})...` 
              : 'Verifying your Discord membership...'}
          </p>
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
            {error.includes("Discord authentication has expired") && (
              <button
                onClick={handleRefreshAndRetry}
                disabled={isRefreshing}
                className="discord-button-primary block w-full"
              >
                {isRefreshing ? (
                  <>
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></span>
                    Refreshing Token...
                  </>
                ) : (
                  "Refresh Discord Token"
                )}
              </button>
            )}
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
                setError(null);
                setRetryCount(0);
                window.location.reload();
              }}
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
