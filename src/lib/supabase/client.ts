
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Supabase project constants
const SUPABASE_URL = "https://taswmdahpcubiyrgsjki.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhc3dtZGFocGN1Yml5cmdzamtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwOTc2ODcsImV4cCI6MjA2MDY3MzY4N30.XxlShm2AeBwan9q-Nlf3r8lYiK0XXZGMT0wz-s1VY3g";

// Create and export the supabase client
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Authentication helper functions
export const auth = {
  // Sign in with Discord OAuth
  signInWithDiscord: async () => {
    console.log("Starting Discord sign-in process");
    
    const redirectUrl = `${window.location.origin}/auth/callback`;
    console.log("Redirect URL:", redirectUrl);
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: redirectUrl,
        scopes: 'identify guilds guilds.members.read'
      }
    });
    
    if (error) {
      console.error("Discord sign-in error:", error);
      throw error;
    }
    
    return { data, error };
  },
  
  // Sign out
  signOut: async () => {
    return await supabase.auth.signOut();
  },
  
  // Get current session
  getSession: async () => {
    return await supabase.auth.getSession();
  },
  
  // Get current user
  getUser: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },
  
  // Set up auth state change listener
  onAuthStateChange: (callback: Function) => {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  }
};
