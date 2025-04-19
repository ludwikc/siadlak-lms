
// This file will need to be updated once you connect Supabase
// For now, it serves as a placeholder for the client structure

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// These values will be populated once you connect Supabase to your Lovable project
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Export the supabase client with our database type definitions
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

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
