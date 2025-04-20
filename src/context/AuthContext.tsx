
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

        // Fetch extended user data
        setTimeout(() => {
          fetchUserData(newSession.user.id, basicUser, setUser, setIsAdmin);
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

        fetchUserData(initialSession.user.id, basicUser, setUser, setIsAdmin).finally(() => {
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

  // Session refresh handler
  const refreshSession = async () => {
    if (isRefreshing) {
      console.log("Session refresh already in progress");
      return;
    }
    
    try {
      setIsRefreshing(true);
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
          return;
        } else {
          console.warn("No session returned from refresh attempt");
        }
      }
    } catch (error) {
      console.error("Failed to refresh session:", error);
      toast.error("Failed to refresh your session. Please sign out and sign in again.");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auth handlers
  const signIn = async () => {
    try {
      await auth.signInWithDiscord();
    } catch (error) {
      toast.error("Failed to sign in with Discord");
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
