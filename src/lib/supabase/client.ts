
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { GUILD_ID, CONTACT_URL, DEBUG_AUTH } from '@/lib/discord/constants';
import { discordApi } from '@/lib/discord/api';

// Use the values from the src/integrations/supabase/client.ts file
const SUPABASE_URL = "https://taswmdahpcubiyrgsjki.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhc3dtZGFocGN1Yml5cmdzamtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwOTc2ODcsImV4cCI6MjA2MDY3MzY4N30.XxlShm2AeBwan9q-Nlf3r8lYiK0XXZGMT0wz-s1VY3g";

// Export the supabase client with our database type definitions
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce', // Use PKCE flow for improved security
    storageKey: 'supabase.auth.token',
    storage: typeof window !== 'undefined' ? localStorage : undefined,
  }
});

// Authentication helper functions
export const auth = {
  signInWithDiscord: async () => {
    if (DEBUG_AUTH) {
      console.log("Initiating Discord sign in from:", window.location.href);
    }
    
    // Make sure we use the absolute URL with origin for the callback
    const redirectTo = `${window.location.origin}/auth/callback`;
    
    if (DEBUG_AUTH) {
      console.log("Using redirect URL:", redirectTo);
    }
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        scopes: 'identify guilds guilds.members.read',
        redirectTo: redirectTo,
      },
    });
    
    if (error) {
      console.error("Discord sign in error:", error);
      throw error; // Let the caller handle the error
    } else if (DEBUG_AUTH) {
      console.log("Discord sign in initiated, provider URL:", data?.url);
    }
    
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
  },
  
  handleDiscordAuth: async (accessToken: string) => {
    try {
      console.log("Handling Discord auth with token", !!accessToken);
      
      if (!accessToken) {
        throw new Error('No Discord access token provided');
      }
      
      // Check if user is a member of the required guild
      const member = await discordApi.fetchGuildMember(accessToken);
      
      if (!member) {
        console.error("User is not a member of the required Discord server");
        throw new Error(`You must be a member of the Discord server to access this application. Please visit ${CONTACT_URL} for more information.`);
      }
      
      console.log("Discord member verified, storing user info");
      
      // Store user's Discord roles in Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user found');
      
      // First, insert/update the user record
      const { error: userError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          discord_id: member.user.id,
          discord_username: member.user.username,
          discord_avatar: member.user.avatar 
            ? `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.png` 
            : null,
          last_login: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (userError) {
        console.error("Error updating user record:", userError);
        throw userError;
      }
      
      console.log("User record updated, storing roles");
      
      // Delete existing roles for this user
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', user.id);
      
      // Insert new roles
      if (member.roles && member.roles.length > 0) {
        const { error: rolesError } = await supabase
          .from('user_roles')
          .insert(
            member.roles.map(roleId => ({
              user_id: user.id,
              discord_role_id: roleId,
            }))
          );
        
        if (rolesError) {
          console.error("Error storing user roles:", rolesError);
          throw rolesError;
        }
      }
      
      console.log("Discord auth handling completed successfully");
      return { success: true };
    } catch (error) {
      console.error('Discord auth handling error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
      };
    }
  }
};
