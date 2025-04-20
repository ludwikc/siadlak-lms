
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

  const isAuthenticated = !!user;

  // Handle auth state and fetch user data
  useEffect(() => {
    setIsLoading(true);

    // Auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange((event, newSession) => {
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
    setIsLoading(true);
    try {
      const { data: { session: refreshedSession } } = await supabase.auth.getSession();
      if (refreshedSession?.user) {
        setSession(refreshedSession);
        const basicUser = refreshedSession.user as ExtendedUser;
        const providerId = basicUser.user_metadata?.provider_id as string;
        const isBasicAdmin = providerId && ADMIN_DISCORD_IDS.includes(providerId);
        setUser({
          ...basicUser,
          is_admin: isBasicAdmin,
        });
        await fetchUserData(refreshedSession.user.id, basicUser, setUser, setIsAdmin);
      }
    } catch (error) {
      console.error("Error refreshing session:", error);
    } finally {
      setIsLoading(false);
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
