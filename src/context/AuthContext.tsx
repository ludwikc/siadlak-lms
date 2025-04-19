
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, supabase } from '@/lib/supabase/client';
import { userService } from '@/lib/supabase/services';
import type { User } from '@/lib/supabase/types';

type AuthContextType = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  discordRoles: string[];
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const [discordRoles, setDiscordRoles] = useState<string[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        
        // Check if user is authenticated
        const { data: { session } } = await auth.getSession();
        
        if (!session) {
          setIsAuthenticated(false);
          setUser(null);
          setDiscordRoles([]);
          setIsLoading(false);
          return;
        }
        
        setIsAuthenticated(true);
        
        // Get Discord user info from session
        const { user: authUser } = session;
        const identities = authUser?.identities || [];
        const discordIdentity = identities.find(
          (identity) => identity.provider === 'discord'
        );
        
        if (!discordIdentity) {
          console.error('No Discord identity found');
          setIsLoading(false);
          return;
        }
        
        const discordId = discordIdentity.id;
        
        // Get or create user in our database
        const { data: dbUser } = await userService.getUserByDiscordId(discordId);
        
        if (dbUser) {
          setUser(dbUser);
          
          // Get user's Discord roles
          const { data: userRoles } = await userService.getUserRoles(dbUser.id);
          if (userRoles) {
            setDiscordRoles(userRoles.map(role => role.discord_role_id));
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial auth check
    checkAuth();

    // Listen for auth changes
    const { data: authListener } = auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        checkAuth();
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setUser(null);
        setDiscordRoles([]);
      }
    });

    // Cleanup subscription
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const signIn = async () => {
    try {
      await auth.signInWithDiscord();
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await auth.signOut();
      setIsAuthenticated(false);
      setUser(null);
      setDiscordRoles([]);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        discordRoles,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook to check if user has a specific Discord role
export function useHasRole(roleId: string) {
  const { discordRoles } = useAuth();
  return discordRoles.includes(roleId);
}

// Hook to check if user has access to a course
export function useHasCourseAccess(courseRoleIds: string[]) {
  const { discordRoles } = useAuth();
  return courseRoleIds.some(roleId => discordRoles.includes(roleId));
}
