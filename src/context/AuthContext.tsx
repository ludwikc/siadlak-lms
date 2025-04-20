
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, auth } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { ExtendedUser } from '@/types/auth';

// Define the shape of our context
type AuthContextType = {
  user: ExtendedUser | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
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
  
  // Initialize auth state
  useEffect(() => {
    console.log("Initializing auth state");
    setIsLoading(true);
    
    // First, set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log("Auth state changed:", event);
      
      setSession(newSession);
      
      if (newSession?.user) {
        const extendedUser: ExtendedUser = newSession.user;
        setUser(extendedUser);
        
        // For sign-in events, fetch additional user data
        if (event === 'SIGNED_IN') {
          try {
            // Safely fetch user data with setTimeout to avoid deadlocks
            setTimeout(async () => {
              const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('id', newSession.user.id)
                .single();
                
              if (!userError && userData) {
                extendedUser.is_admin = userData.is_admin;
                extendedUser.discord_username = userData.discord_username;
                extendedUser.discord_avatar = userData.discord_avatar;
                setUser(extendedUser);
                setIsAdmin(userData.is_admin || false);
              }
            }, 0);
          } catch (error) {
            console.error('Error processing auth change:', error);
          }
        }
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
        const extendedUser: ExtendedUser = initialSession.user;
        setUser(extendedUser);
        
        // Fetch additional user data
        supabase
          .from('users')
          .select('*')
          .eq('id', initialSession.user.id)
          .single()
          .then(({ data: userData, error: userError }) => {
            if (!userError && userData) {
              extendedUser.is_admin = userData.is_admin;
              extendedUser.discord_username = userData.discord_username;
              extendedUser.discord_avatar = userData.discord_avatar;
              setUser(extendedUser);
              setIsAdmin(userData.is_admin || false);
            }
            setIsLoading(false);
          })
          .catch(error => {
            console.error('Error fetching initial user data:', error);
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
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
