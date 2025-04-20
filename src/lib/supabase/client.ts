
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

// Simple authentication helpers
export const auth = {
  // Sign in with Discord OAuth
  signInWithDiscord: async () => {
    const discordAuthUrl = 'https://discord.com/oauth2/authorize?client_id=1363266006516105456&response_type=code&redirect_uri=https%3A%2F%2Ftaswmdahpcubiyrgsjki.supabase.co%2Fauth%2Fv1%2Fcallback&scope=identify+guilds+guilds.members.read';
    
    console.log("Starting Discord sign-in with redirect to:", discordAuthUrl);
    
    return supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: 'https://taswmdahpcubiyrgsjki.supabase.co/auth/v1/callback',
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
