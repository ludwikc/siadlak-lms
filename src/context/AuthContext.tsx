
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, auth } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { ExtendedUser } from '@/types/auth';
import { fetchUserData, isAdminUser, ADMIN_DISCORD_IDS } from './auth.utils';

// Types for context
type AuthContextType = {
  user: ExtendedUser | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: true,
  isAdmin: false,
  signIn: async () => {},
  signOut: async () => {},
  refreshSession: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastRefreshAttempt, setLastRefreshAttempt] = useState<number>(0);
  const REFRESH_COOLDOWN = 10000; // 10 seconds cooldown between refresh attempts

  const isAuthenticated = !!user;

  // Handle auth state and fetch user data
  useEffect(() => {
    setIsLoading(true);

    // Auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log("Auth state changed:", event);
      setSession(newSession);

      if (newSession?.user) {
        const basicUser = newSession.user as ExtendedUser;

        // Temporary admin check from metadata
        const providerId = basicUser.user_metadata?.provider_id as string;
        const isBasicAdmin = providerId && ADMIN_DISCORD_IDS.includes(providerId);
        setIsAdmin(isBasicAdmin);
        setUser({
          ...basicUser,
          is_admin: isBasicAdmin,
        });

        // Fetch extended user data - use setTimeout to avoid blocking auth state change
        setTimeout(() => {
          fetchUserData(newSession.user.id, basicUser, setUser, setIsAdmin)
            .catch(error => {
              console.error("Error fetching extended user data:", error);
              // Don't reset user here, just log the error
            });
        }, 0);
      } else {
        setUser(null);
        setIsAdmin(false);
      }
    });

    // Initial session check
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);

      if (initialSession?.user) {
        const basicUser = initialSession.user as ExtendedUser;
        const providerId = basicUser.user_metadata?.provider_id as string;
        const isBasicAdmin = providerId && ADMIN_DISCORD_IDS.includes(providerId);
        setIsAdmin(isBasicAdmin);
        setUser({
          ...basicUser,
          is_admin: isBasicAdmin,
        });

        fetchUserData(initialSession.user.id, basicUser, setUser, setIsAdmin)
          .catch(error => {
            console.error("Error fetching extended user data:", error);
          })
          .finally(() => {
            setIsLoading(false);
          });
      } else {
        setIsLoading(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Session refresh handler with rate limit protection
  const refreshSession = async () => {
    // Prevent rapid refresh attempts
    const now = Date.now();
    if (now - lastRefreshAttempt < REFRESH_COOLDOWN) {
      console.log(`Refresh attempt too soon. Please wait ${(REFRESH_COOLDOWN - (now - lastRefreshAttempt))/1000} seconds.`);
      toast.warning("Please wait a moment before refreshing your session again.");
      return;
    }
    
    if (isRefreshing) {
      console.log("Session refresh already in progress");
      return;
    }
    
    try {
      setIsRefreshing(true);
      setLastRefreshAttempt(now);
      console.log("Attempting to refresh session...");
      
      // Force a re-authentication with Discord to get a fresh token
      if (isAuthenticated) {
        // First try the built-in refresh method
        const { data, error } = await supabase.auth.refreshSession();
        
        if (error) {
          console.error("Error refreshing session:", error);
          throw error;
        }
        
        if (data.session) {
          console.log("Session refreshed successfully");
          setSession(data.session);
          const basicUser = data.session.user as ExtendedUser;
          const providerId = basicUser.user_metadata?.provider_id as string;
          const isBasicAdmin = providerId && ADMIN_DISCORD_IDS.includes(providerId);
          setUser({
            ...basicUser,
            is_admin: isBasicAdmin,
          });
          
          await fetchUserData(data.session.user.id, basicUser, setUser, setIsAdmin);
          toast.success("Session refreshed successfully");
          return;
        } else {
          console.warn("No session returned from refresh attempt");
          toast.warning("Could not refresh your session. Please sign out and sign in again.");
        }
      }
    } catch (error) {
      console.error("Failed to refresh session:", error);
      
      // Handle rate limit errors specifically
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (errorMsg.includes("rate limit exceeded")) {
        toast.error(errorMsg, { duration: 8000 });
      } else {
        toast.error("Failed to refresh your session. Please sign out and sign in again.");
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auth handlers
  const signIn = async () => {
    try {
      await auth.signInWithDiscord();
    } catch (error) {
      console.error("Sign in error:", error);
      // Check specifically for rate limit errors
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (errorMsg.includes("rate limit exceeded")) {
        toast.error(errorMsg, { duration: 8000 });
      } else {
        toast.error("Failed to sign in with Discord");
      }
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await auth.signOut();
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      toast.success('You have been signed out successfully.');
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Failed to sign out");
    }
  };

  // Provide context value
  const value = {
    user,
    session,
    isAuthenticated,
    isLoading,
    isAdmin,
    signIn,
    signOut,
    refreshSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
