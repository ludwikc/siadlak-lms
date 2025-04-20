
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, auth } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { ExtendedUser } from '@/types/auth';
import { userService } from '@/lib/supabase/services';

// Define the shape of our context
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

// Create the context with default values
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

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component to wrap our app
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // Calculate isAuthenticated
  const isAuthenticated = !!user;
  
  // Function to fetch user data and roles from our database
  const fetchUserData = async (userId: string) => {
    try {
      // Fetch user data
      const { data: userData, error: userError } = await userService.getUserById(userId);
      
      if (userError) {
        console.error('Error fetching user data:', userError);
        return;
      }
      
      if (userData) {
        // Extend the current user object with additional data
        setUser(prevUser => {
          if (!prevUser) return null;
          
          const extendedUser: ExtendedUser = {
            ...prevUser,
            is_admin: userData.is_admin,
            discord_username: userData.discord_username,
            discord_avatar: userData.discord_avatar,
          };
          
          return extendedUser;
        });
        
        setIsAdmin(userData.is_admin || false);
      }
    } catch (error) {
      console.error('Error in fetchUserData:', error);
    }
  };
  
  // Initialize auth state
  useEffect(() => {
    console.log("Initializing auth state");
    setIsLoading(true);
    
    // Set up auth state change listener first
    const { data: authListener } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log("Auth state changed:", event);
      
      setSession(newSession);
      
      if (newSession?.user) {
        // Set basic user information immediately
        const basicUser = newSession.user as ExtendedUser;
        setUser(basicUser);
        
        // Fetch additional user data without blocking
        setTimeout(() => {
          fetchUserData(newSession.user.id);
        }, 0);
      } else {
        setUser(null);
        setIsAdmin(false);
      }
    });
    
    // Then, check for existing session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      console.log("Initial session check:", initialSession ? "Session found" : "No session");
      
      setSession(initialSession);
      
      if (initialSession?.user) {
        // Set basic user information immediately
        const basicUser = initialSession.user as ExtendedUser;
        setUser(basicUser);
        
        // Fetch additional user data
        fetchUserData(initialSession.user.id).finally(() => {
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });
    
    // Return cleanup function to unsubscribe
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);
  
  // Function to refresh the session and user data
  const refreshSession = async () => {
    try {
      setIsLoading(true);
      
      // Refresh the session
      const { data: { session: refreshedSession } } = await supabase.auth.getSession();
      
      if (refreshedSession?.user) {
        setSession(refreshedSession);
        
        // Set basic user info
        const basicUser = refreshedSession.user as ExtendedUser;
        setUser(basicUser);
        
        // Fetch additional user data
        await fetchUserData(refreshedSession.user.id);
      }
    } catch (error) {
      console.error("Error refreshing session:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Sign in with Discord
  const signIn = async () => {
    try {
      console.log("Starting sign-in process");
      await auth.signInWithDiscord();
    } catch (error) {
      console.error("Sign-in error:", error);
      toast.error("Failed to sign in with Discord");
      throw error;
    }
  };
  
  // Sign out
  const signOut = async () => {
    try {
      await auth.signOut();
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      toast.success('You have been signed out successfully.');
    } catch (error) {
      console.error("Sign-out error:", error);
      toast.error("Failed to sign out");
    }
  };
  
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
