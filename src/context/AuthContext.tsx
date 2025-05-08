
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { ExtendedUser } from '@/types/auth';

// Constants
const SIADLAK_AUTH_URL = "https://siadlak-auth.lovable.app";
const AUTH_TOKEN_KEY = "siadlak_auth_token";
const AUTH_USER_KEY = "siadlak_auth_user";
const ADMIN_DISCORD_IDS = ['404038151565213696', '1040257455592050768'];

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

  // Function to check if a user is admin based on available data
  const checkIsAdmin = (userData: ExtendedUser | null): boolean => {
    if (!userData) return false;
    
    // Check for admin flag in user object
    if (userData.is_admin === true) return true;
    
    // Check for admin in user_metadata
    if (userData.user_metadata?.is_admin === true) return true;
    
    // Check Discord ID matches admin list
    const discordId = 
      userData.discord_id || 
      userData.user_metadata?.discord_id ||
      userData.user_metadata?.provider_id;
    
    if (discordId && ADMIN_DISCORD_IDS.includes(discordId)) return true;
    
    // Check user id against admin list as a last resort
    if (userData.id && ADMIN_DISCORD_IDS.includes(userData.id)) return true;
    
    return false;
  };

  // Load user data from localStorage on initial load
  useEffect(() => {
    setIsLoading(true);
    
    // Check for stored auth data
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    const storedUser = localStorage.getItem(AUTH_USER_KEY);
    
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as ExtendedUser;
        
        // Ensure the user object has all required fields
        // This handles potential differences in structure between old and new auth flows
        // Get Discord data
        const discordId = parsedUser.discord_id || parsedUser.user_metadata?.discord_id || parsedUser.user_metadata?.provider_id || '';
        const discordUsername = parsedUser.discord_username || parsedUser.user_metadata?.discord_username || '';
        const discordAvatarHash = parsedUser.discord_avatar || parsedUser.user_metadata?.discord_avatar || '';
        
        // Format Discord avatar URL properly if we have both ID and avatar hash
        let formattedAvatarUrl = '';
        if (discordId && discordAvatarHash) {
          // Discord CDN URL format: https://cdn.discordapp.com/avatars/[user_id]/[avatar_hash].png
          formattedAvatarUrl = `https://cdn.discordapp.com/avatars/${discordId}/${discordAvatarHash}.png`;
        }
        
        const normalizedUser: ExtendedUser = {
          ...parsedUser,
          // Ensure these fields exist with fallbacks
          discord_id: discordId,
          discord_username: discordUsername,
          discord_avatar: formattedAvatarUrl || discordAvatarHash, // Use formatted URL if available, otherwise use hash
          is_admin: !!parsedUser.is_admin || !!parsedUser.user_metadata?.is_admin,
          // Ensure user_metadata exists
          user_metadata: {
            ...(parsedUser.user_metadata || {}),
            discord_id: discordId,
            discord_username: discordUsername,
            discord_avatar: formattedAvatarUrl || discordAvatarHash,
            is_admin: !!parsedUser.is_admin || !!parsedUser.user_metadata?.is_admin,
            roles: parsedUser.roles || parsedUser.user_metadata?.roles || []
          }
        };
        
        console.log("Loaded user from localStorage:", normalizedUser);
        
        // Check admin status and update state
        const userIsAdmin = checkIsAdmin(normalizedUser);
        console.log("User admin status:", userIsAdmin);
        
        setUser(normalizedUser);
        setIsAdmin(userIsAdmin);
        
        // Create a mock session object with the stored token
        const mockSession: Session = {
          access_token: storedToken,
          refresh_token: "",
          expires_in: 3600,
          expires_at: new Date().getTime() + 3600 * 1000,
          token_type: "bearer",
          user: normalizedUser,
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
      
      // Add a timestamp to prevent caching issues
      const timestamp = Date.now();
      
      // Redirect to the central auth service with additional parameters
      window.location.href = `${SIADLAK_AUTH_URL}/?redirect_to=${encodedRedirectUrl}&client_id=lms.siadlak.com&t=${timestamp}`;
      
      console.log(`Redirecting to auth service: ${SIADLAK_AUTH_URL}/?redirect_to=${encodedRedirectUrl}&client_id=lms.siadlak.com&t=${timestamp}`);
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
