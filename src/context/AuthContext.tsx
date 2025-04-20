import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, auth } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { ExtendedUser } from '@/types/auth';
import { userService } from '@/lib/supabase/services';

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
  
  const fetchUserData = async (userId: string) => {
    try {
      console.log('Fetching user data for ID:', userId);
      const { data: userData, error: userError } = await userService.getUserById(userId);
      
      if (userError) {
        console.error('Error fetching user data:', userError);
        return;
      }
      
      if (userData) {
        console.log('User data from database:', userData);
        console.log('Admin status:', userData.is_admin);
        
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
  
  useEffect(() => {
    console.log("Initializing auth state");
    setIsLoading(true);
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log("Auth state changed:", event);
      
      setSession(newSession);
      
      if (newSession?.user) {
        const basicUser = newSession.user as ExtendedUser;
        setUser(basicUser);
        
        setTimeout(() => {
          fetchUserData(newSession.user.id);
        }, 0);
      } else {
        setUser(null);
        setIsAdmin(false);
      }
    });
    
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      console.log("Initial session check:", initialSession ? "Session found" : "No session");
      
      setSession(initialSession);
      
      if (initialSession?.user) {
        const basicUser = initialSession.user as ExtendedUser;
        setUser(basicUser);
        
        fetchUserData(initialSession.user.id).finally(() => {
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
  
  const refreshSession = async () => {
    try {
      setIsLoading(true);
      
      const { data: { session: refreshedSession } } = await supabase.auth.getSession();
      
      if (refreshedSession?.user) {
        setSession(refreshedSession);
        
        const basicUser = refreshedSession.user as ExtendedUser;
        setUser(basicUser);
        
        await fetchUserData(refreshedSession.user.id);
      }
    } catch (error) {
      console.error("Error refreshing session:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
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
