
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { ExtendedUser } from '@/types/auth';

// Constants
const SIADLAK_AUTH_URL = "https://siadlak-auth.lovable.app";
const AUTH_TOKEN_KEY = "siadlak_auth_token";
const AUTH_USER_KEY = "siadlak_auth_user";

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

  // Load user data from localStorage on initial load
  useEffect(() => {
    setIsLoading(true);
    
    // Check for stored auth data
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    const storedUser = localStorage.getItem(AUTH_USER_KEY);
    
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as ExtendedUser;
        setUser(parsedUser);
        setIsAdmin(!!parsedUser.is_admin);
        
        // Create a mock session object with the stored token
        const mockSession: Session = {
          access_token: storedToken,
          refresh_token: "",
          expires_in: 3600,
          expires_at: new Date().getTime() + 3600 * 1000,
          token_type: "bearer",
          user: parsedUser,
          provider_token: storedToken,
          provider_refresh_token: null
        };
        
        setSession(mockSession);
      } catch (error) {
        console.error("Error parsing stored auth data:", error);
        // Clear invalid storage data
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
      }
    }
    
    setIsLoading(false);
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
      
      // For the centralized auth, we need to redirect the user back to the auth service
      signOut();
      signIn();
      
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
      // Generate the full redirect URL including the current domain
      const redirectUrl = window.location.origin + '/auth/callback';
      const encodedRedirectUrl = encodeURIComponent(redirectUrl);
      
      // Redirect to the central auth service
      window.location.href = `${SIADLAK_AUTH_URL}/?redirect_to=${encodedRedirectUrl}`;
    } catch (error) {
      console.error("Sign in error:", error);
      toast.error("Failed to redirect to authentication service");
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Clear local storage auth data
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
      
      // Reset state
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
