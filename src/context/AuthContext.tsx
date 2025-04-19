
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, auth } from '@/lib/supabase/client';
import { userService } from '@/lib/supabase/services';
import { BYPASS_DISCORD_AUTH } from '@/lib/discord/constants';

// Define the shape of our context
type AuthContextType = {
  user: User | null;
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
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // Calculate isAuthenticated
  const isAuthenticated = !!user || BYPASS_DISCORD_AUTH;
  
  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        
        // First, set up auth state change listener
        const { data } = auth.onAuthStateChange(async (event, session) => {
          console.log('Auth state changed:', event);
          setSession(session);
          setUser(session?.user || null);
          
          // Skip the rest for sign out events
          if (event === 'SIGNED_OUT' || !session) {
            setIsAdmin(false);
            return;
          }
          
          // For login events, fetch additional user data from our database
          if (event === 'SIGNED_IN' && session?.user) {
            try {
              // Fetch user data from our database
              const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('id', session.user.id)
                .single();
              
              if (userError && userError.code !== 'PGRST116') {
                console.error('Error fetching user data:', userError);
              }
              
              // Set admin status if available
              setIsAdmin(userData?.is_admin || false);
            } catch (error) {
              console.error('Error processing auth change:', error);
            }
          }
        });
        
        // Then, get initial session
        const { data: { session: initialSession } } = await auth.getSession();
        setSession(initialSession);
        setUser(initialSession?.user || null);
        
        // For initial load, fetch additional user data if session exists
        if (initialSession?.user) {
          try {
            // Fetch user data from our database
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('*')
              .eq('id', initialSession.user.id)
              .single();
            
            if (userError && userError.code !== 'PGRST116') {
              console.error('Error fetching initial user data:', userError);
            }
            
            // Set admin status if available
            setIsAdmin(userData?.is_admin || false);
          } catch (error) {
            console.error('Error fetching initial user data:', error);
          }
        }
        
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
    await auth.signOut();
    setUser(null);
    setSession(null);
    setIsAdmin(false);
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
