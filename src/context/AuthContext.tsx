
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, auth } from '@/lib/supabase/client';
import { userService } from '@/lib/supabase/services';
import { toast } from 'sonner';
import { ExtendedUser } from '@/types/auth';

// Define the shape of our context with the ExtendedUser type
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

// Provider component to wrap our app and make auth object available
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // Calculate isAuthenticated
  const isAuthenticated = !!user;
  
  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        
        // First, get initial session
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
        
        // For initial load, fetch additional user data if session exists
        if (initialSession?.user) {
          // Create an extended user with our custom properties
          const extendedUser: ExtendedUser = initialSession.user;
          setUser(extendedUser);
          
          try {
            // Fetch user data from our database
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('*')
              .eq('id', initialSession.user.id)
              .single();
            
            if (userError && userError.code !== 'PGRST116') {
              console.error('Error fetching initial user data:', userError);
            } else if (userData) {
              // Update the extended user with our custom properties
              extendedUser.is_admin = userData.is_admin;
              extendedUser.discord_username = userData.discord_username;
              extendedUser.discord_avatar = userData.discord_avatar;
              setUser(extendedUser);
              setIsAdmin(userData.is_admin || false);
            }
          } catch (error) {
            console.error('Error fetching initial user data:', error);
          }
        }
        
        // Then, set up auth state change listener
        const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('Auth state changed:', event);
          setSession(session);
          
          if (session?.user) {
            // Create an extended user with our custom properties
            const extendedUser: ExtendedUser = session.user;
            setUser(extendedUser);
            
            // Skip the rest for sign out events
            if (event === 'SIGNED_OUT') {
              setIsAdmin(false);
              return;
            }
            
            // For login events, fetch additional user data from our database
            if (event === 'SIGNED_IN') {
              try {
                // Fetch user data from our database
                const { data: userData, error: userError } = await supabase
                  .from('users')
                  .select('*')
                  .eq('id', session.user.id)
                  .single();
                
                if (userError && userError.code !== 'PGRST116') {
                  console.error('Error fetching user data:', userError);
                } else if (userData) {
                  // Update the extended user with our custom properties
                  extendedUser.is_admin = userData.is_admin;
                  extendedUser.discord_username = userData.discord_username;
                  extendedUser.discord_avatar = userData.discord_avatar;
                  setUser(extendedUser);
                  setIsAdmin(userData.is_admin || false);
                }
              } catch (error) {
                console.error('Error processing auth change:', error);
              }
            }
          } else {
            setUser(null);
          }
        });
        
        setIsLoading(false);
        
        // Return cleanup function to unsubscribe
        return () => {
          data.subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Auth initialization error:', error);
        setIsLoading(false);
      }
    };
    
    initializeAuth();
  }, []);
  
  // Sign in with Discord
  const signIn = async () => {
    await auth.signInWithDiscord();
  };
  
  // Sign out
  const signOut = async () => {
    const { error } = await auth.signOut();
    if (error) {
      toast.error(error.message || 'Sign out failed');
    } else {
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      toast.success('You have been signed out successfully.');
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
