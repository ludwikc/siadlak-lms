
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { GUILD_ID, CONTACT_URL } from '@/lib/discord/constants';
import { discordApi } from '@/lib/discord/api';

// Use the values from the src/integrations/supabase/client.ts file
const SUPABASE_URL = "https://taswmdahpcubiyrgsjki.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhc3dtZGFocGN1Yml5cmdzamtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwOTc2ODcsImV4cCI6MjA2MDY3MzY4N30.XxlShm2AeBwan9q-Nlf3r8lYiK0XXZGMT0wz-s1VY3g";

// Export the supabase client with our database type definitions
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true, // This is important for the OAuth callback
  }
});

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
  },

  // New helper function to handle post-authentication flow
  handleDiscordAuth: async (accessToken: string) => {
    try {
      // Check if user is a member of the required guild
      const member = await discordApi.fetchGuildMember(accessToken);
      
      if (!member) {
        throw new Error(`You must be a member of the Discord server to access this application. Please visit ${CONTACT_URL} for more information.`);
      }
      
      // Store user's Discord roles in Supabase
      const user = await auth.getUser();
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
      
      if (userError) throw userError;
      
      // Delete existing roles for this user
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', user.id);
      
      // Insert new roles
      const { error: rolesError } = await supabase
        .from('user_roles')
        .insert(
          member.roles.map(roleId => ({
            user_id: user.id,
            discord_role_id: roleId,
          }))
        );
      
      if (rolesError) throw rolesError;
      
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
