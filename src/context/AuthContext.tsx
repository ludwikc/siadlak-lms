import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase, setSupabaseAccessToken } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { ExtendedUser } from '@/types/auth';
import { ENABLE_DEV_LOGIN } from '@/config/dev-auth.config';

// Constants
const SIADLAK_AUTH_URL = "https://siadlak-auth.lovable.app";
const AUTH_TOKEN_KEY = "siadlak_auth_token";
const AUTH_USER_KEY = "siadlak_auth_user";
const ADMIN_DISCORD_IDS = ['404038151565213696', '1040257455592050768', 'ab546fe3-358c-473e-b5a6-cdaf1a623cbf'];

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
        
        // Check if this is a dev login token
        const isDevelopmentUser = ENABLE_DEV_LOGIN && storedToken.startsWith('dev-token-');
        
        // Ensure the user object has all required fields
        // This handles potential differences in structure between old and new auth flows
        // Get Discord data
        const discordId = parsedUser.discord_id || parsedUser.user_metadata?.discord_id || parsedUser.user_metadata?.provider_id || '';
        const discordUsername = parsedUser.discord_username || parsedUser.user_metadata?.discord_username || '';
        const discordAvatarHash = parsedUser.discord_avatar || parsedUser.user_metadata?.discord_avatar || '';
        
        // Format Discord avatar URL properly if we have both ID and avatar hash
        let formattedAvatarUrl = '';
        if (discordId && discordAvatarHash && !isDevelopmentUser) {
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
        
        // IMPORTANT: Manually set the access token to the Supabase client
        // This ensures the token is available for all Supabase operations
        setSupabaseAccessToken(storedToken);
        
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
        
        // Verify the session with Supabase
        supabase.auth.getSession().then(({ data: { session: supabaseSession }, error }) => {
          console.log("Supabase session check:", { session: supabaseSession, error });
          
          // If there's no session but we have a stored token, 
          // this means the token might be invalid or expired
          if (!supabaseSession && storedToken && !isDevelopmentUser) {
            console.warn("Stored token exists but no active Supabase session found");
            // We'll keep the session active for now, but log a warning
          }
        });
      } catch (error) {
        console.error("Error parsing stored auth data:", error);
        // Clear invalid storage data
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
      }
    } else {
      // No stored auth data, check if there's an active Supabase session
      supabase.auth.getSession().then(({ data: { session: supabaseSession } }) => {
        if (supabaseSession) {
          // We have a valid Supabase session but no stored auth data
          console.log("Found active Supabase session but no stored auth data");
          
          // This shouldn't normally happen, but if it does, we can use the Supabase session
          const userFromSession = supabaseSession.user as ExtendedUser;
          setUser(userFromSession);
          setSession(supabaseSession);
          setIsAdmin(checkIsAdmin(userFromSession));
          
          // Store the session data for future use
          localStorage.setItem(AUTH_TOKEN_KEY, supabaseSession.access_token);
          localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userFromSession));
        }
      });
    }
    
    setIsLoading(false);
  }, []);

  // Set up auth state change listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log("Auth state changed:", { event, session: newSession });
        
        // Only update if the event is relevant
        if (["SIGNED_IN", "TOKEN_REFRESHED", "USER_UPDATED"].includes(event)) {
          if (newSession) {
            const newUser = newSession.user as ExtendedUser;
            setUser(newUser);
            setSession(newSession);
            setIsAdmin(checkIsAdmin(newUser));
            
            // Update stored auth data
            localStorage.setItem(AUTH_TOKEN_KEY, newSession.access_token);
            localStorage.setItem(AUTH_USER_KEY, JSON.stringify(newUser));
          }
        } else if (event === "SIGNED_OUT") {
          // Clear auth data
          setUser(null);
          setSession(null);
          setIsAdmin(false);
          localStorage.removeItem(AUTH_TOKEN_KEY);
          localStorage.removeItem(AUTH_USER_KEY);
        }
      }
    );
    
    // Clean up subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
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
      // For dev mode, we just redirect to the dev login page
      if (ENABLE_DEV_LOGIN) {
        window.location.href = '/dev-login';
        return;
      }
      
      // Normal Discord OAuth flow for production
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
      // Sign out from Supabase first
      await supabase.auth.signOut();
      
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
