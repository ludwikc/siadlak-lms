
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Use the values from the src/integrations/supabase/client.ts file
const SUPABASE_URL = "https://taswmdahpcubiyrgsjki.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhc3dtZGFocGN1Yml5cmdzamtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwOTc2ODcsImV4cCI6MjA2MDY3MzY4N30.XxlShm2AeBwan9q-Nlf3r8lYiK0XXZGMT0wz-s1VY3g";

// Export the supabase client with our database type definitions
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

// Authentication helper functions
export const auth = {
  signInWithDiscord: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        scopes: 'identify guilds guilds.members.read',
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    
    return { data, error };
  },
  
  signOut: async () => {
    return await supabase.auth.signOut();
  },
  
  getSession: async () => {
    return await supabase.auth.getSession();
  },
  
  getUser: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },
  
  onAuthStateChange: (callback: Function) => {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  }
};
