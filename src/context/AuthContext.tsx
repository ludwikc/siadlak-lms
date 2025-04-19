
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, supabase } from '@/lib/supabase/client';
import { userService } from '@/lib/supabase/services';
import type { User } from '@/lib/supabase/types';
import type { Session } from '@supabase/supabase-js';
import { toast } from 'sonner';

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
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    console.log("AuthProvider initialized");
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        
        // Listen for auth changes first
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            console.log("Auth state changed:", event, !!newSession);
            
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
              setSession(newSession);
              setIsAuthenticated(!!newSession);
              
              if (newSession?.user) {
                // Get user info after a short delay to avoid auth deadlock
                setTimeout(async () => {
                  try {
                    await loadUserData(newSession.user.id);
                  } catch (error) {
                    console.error("Error loading user data after auth change:", error);
                  }
                }, 0);
              }
            } else if (event === 'SIGNED_OUT') {
              setSession(null);
              setIsAuthenticated(false);
              setUser(null);
              setDiscordRoles([]);
            }
          }
        );
        
        // Then check for existing session
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        
        console.log("Existing session check:", !!existingSession);
        
        if (existingSession) {
          setSession(existingSession);
          setIsAuthenticated(true);
          
          // Load user data if we have a session
          if (existingSession.user) {
            await loadUserData(existingSession.user.id);
          }
        } else {
          setIsAuthenticated(false);
          setUser(null);
          setDiscordRoles([]);
        }
        
        // Cleanup subscription
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Auth check error:', error);
        toast.error('Failed to check authentication status');
      } finally {
        setIsLoading(false);
      }
    };

    const loadUserData = async (userId: string) => {
      try {
        console.log("Loading user data for ID:", userId);
        
        // We need to get the user from our database using the direct ID
        // Since userService doesn't have getUserById, we'll query it directly
        const { data: dbUser, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (error) {
          console.error("Error fetching user:", error);
          throw error;
        }
        
        if (dbUser) {
          console.log("User data retrieved:", dbUser);
          setUser(dbUser);
          
          // Get user's Discord roles
          const { data: userRoles } = await userService.getUserRoles(dbUser.id);
          if (userRoles) {
            const roles = userRoles.map(role => role.discord_role_id);
            console.log("User roles retrieved:", roles);
            setDiscordRoles(roles);
          } else {
            setDiscordRoles([]);
          }
        } else {
          console.warn("No user found with ID:", userId);
          setUser(null);
          setDiscordRoles([]);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        toast.error('Failed to load user data');
      }
    };

    // Run initial auth check
    checkAuth();
  }, []);

  const signIn = async () => {
    try {
      console.log("Signing in with Discord...");
      await auth.signInWithDiscord();
    } catch (error) {
      console.error('Sign in error:', error);
      toast.error('Failed to sign in with Discord');
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log("Signing out...");
      await auth.signOut();
      setIsAuthenticated(false);
      setSession(null);
      setUser(null);
      setDiscordRoles([]);
      toast.success('Successfully signed out');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
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
