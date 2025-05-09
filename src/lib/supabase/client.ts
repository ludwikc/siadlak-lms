import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Supabase project constants
const SUPABASE_URL = "https://taswmdahpcubiyrgsjki.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhc3dtZGFocGN1Yml5cmdzamtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwOTc2ODcsImV4cCI6MjA2MDY3MzY4N30.XxlShm2AeBwan9q-Nlf3r8lYiK0XXZGMT0wz-s1VY3g";

// Create and export the supabase client with explicit configuration
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: localStorage
  }
});

// Function to set access token manually if needed
export const setSupabaseAccessToken = (accessToken: string) => {
  if (!accessToken) return;
  
  // Set the session manually using the correct properties as per Supabase types
  // This fixes the TS2353 error by only using properties that exist in the expected type
  supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: '',
  });
  
  console.log("Manually set Supabase access token");
};

// Simple authentication helpers
export const auth = {
  // Sign in with Discord OAuth
  signInWithDiscord: async () => {
    console.log("Starting Discord sign-in with redirect to Supabase auth endpoint");
    
    // Use the application URL for redirectTo - matching what's configured in Supabase
    const redirectTo = window.location.origin + '/auth/callback';
    console.log("Using redirectTo:", redirectTo);
    
    return supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: redirectTo,
        scopes: 'identify guilds guilds.members.read',
      }
    });
  },
  
  // Sign out
  signOut: async () => {
    return supabase.auth.signOut();
  },
  
  // Get current session
  getSession: async () => {
    return supabase.auth.getSession();
  },
  
  // Get current user
  getUser: async () => {
    const { data } = await supabase.auth.getUser();
    return data.user;
  }
};
