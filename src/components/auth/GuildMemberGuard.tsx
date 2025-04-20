
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
  const [lastCheckTime, setLastCheckTime] = useState(0);
  const MAX_RETRIES = 2; // Reduce max retries to avoid hitting rate limits
  const CHECK_COOLDOWN = 5000; // 5 seconds between checks

  // Function to handle token refresh and retry
  const handleRefreshAndRetry = async () => {
    try {
      setIsRefreshing(true);
      await refreshSession();
      setRetryCount(0); // Reset retry count after refresh
      setError(null);
      
      // Add a slight delay before retry to ensure the new token is properly set
      setTimeout(() => {
        checkGuildMembership();
        setIsRefreshing(false);
      }, 1000);
    } catch (err) {
      console.error("Failed to refresh token:", err);
      toast.error("Failed to refresh your Discord token. Please sign out and sign in again.");
      setIsRefreshing(false);
    }
  };

  const checkGuildMembership = async () => {
    // Add cooldown check to prevent rapid API calls
    const now = Date.now();
    if (now - lastCheckTime < CHECK_COOLDOWN) {
      console.log(`Check attempted too soon. Cooldown: ${(CHECK_COOLDOWN - (now - lastCheckTime))/1000}s`);
      return;
    }
    
    setLastCheckTime(now);
    
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
      const errorMsg = err instanceof Error ? err.message : String(err);
      
      if (errorMsg.includes('401') || errorMsg.includes('invalid token')) {
        console.log("Discord token appears to be invalid, will try refreshing");
        setError("Your Discord authentication has expired. Please refresh your token.");
        setHasMembership(false);
        setIsCheckingMembership(false);
        return;
      }
      
      // Handle rate limiting
      if (errorMsg.includes('rate limit exceeded')) {
        const secondsMatch = errorMsg.match(/(\d+) seconds/);
        const waitSeconds = secondsMatch ? parseInt(secondsMatch[1], 10) : 60;
        
        setError(`Discord API rate limit exceeded. Please try again in ${waitSeconds} seconds.`);
        setHasMembership(false);
        setIsCheckingMembership(false);
        
        // Don't retry automatically if rate limited - force user to try again manually
        console.log(`Rate limited. Wait ${waitSeconds} seconds before trying again.`);
        return;
      }
      
      // For other errors, retry with backoff if we haven't hit max retries
      if (retryCount < MAX_RETRIES) {
        console.log(`Retry attempt ${retryCount + 1}/${MAX_RETRIES}`);
        setRetryCount(prev => prev + 1);
        
        // Exponential backoff: wait longer between each retry
        const backoffTime = Math.pow(2, retryCount) * 1000;
        
        // Wait for a short delay before retrying
        setTimeout(() => {
          checkGuildMembership();
        }, backoffTime);
        return;
      }
      
      // For other errors, or if max retries exceeded
      setError("Failed to verify your Discord server membership. Please try again later.");
      setHasMembership(false);
      setIsCheckingMembership(false);
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
            
            {error.includes("rate limit exceeded") && (
              <div className="bg-discord-sidebar-bg p-4 rounded mb-4 text-sm">
                <p>Discord API rate limit is active. Please wait before trying again.</p>
                <p className="mt-2">You can try signing out and then signing back in after a few minutes.</p>
              </div>
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
                // Only allow retrying if not rate limited or if refreshing token
                if (!error.includes("rate limit exceeded") || isRefreshing) {
                  setError(null);
                  setRetryCount(0);
                  window.location.reload();
                } else {
                  toast.warning("Please wait for the rate limit to expire before trying again");
                }
              }}
              className="discord-button-primary block w-full"
              disabled={error.includes("rate limit exceeded") && !isRefreshing}
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
