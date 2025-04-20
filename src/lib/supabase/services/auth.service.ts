
import { supabase } from '../client';
import { User } from '@supabase/supabase-js';

// Type for failed login data
interface FailedLoginData {
  discord_id: string;
  discord_username: string | null;
  discord_avatar: string | null;
  reason: string;
  ip_address: string | null;
}

export const authService = {
  // Check if a user is an admin
  isAdmin: async (userId: string): Promise<boolean> => {
    try {
      console.log('Checking admin status for userId:', userId);
      
      // Check if the user is in the admin list
      const { data: userData, error } = await supabase
        .from('users')
        .select('is_admin, discord_id')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error checking admin status:', error);
        return false;
      }
      
      // Check if user is flagged as admin in database OR has an admin Discord ID
      const isDbAdmin = !!userData?.is_admin;
      const hasAdminDiscordId = userData?.discord_id && 
        ['404038151565213696', '1040257455592050768'].includes(userData.discord_id);
      
      console.log('Database admin check result:', isDbAdmin);
      console.log('Discord ID admin check result:', hasAdminDiscordId);
      
      return isDbAdmin || !!hasAdminDiscordId;
    } catch (error) {
      console.error('Error in isAdmin check:', error);
      return false;
    }
  },
  
  // Get current user with admin check
  getCurrentUser: async (): Promise<{user: User | null; isAdmin: boolean}> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { user: null, isAdmin: false };
      }
      
      const isAdmin = await authService.isAdmin(user.id);
      
      return { user, isAdmin };
    } catch (error) {
      console.error('Error getting current user:', error);
      return { user: null, isAdmin: false };
    }
  },

  // Log failed login attempts
  logFailedLogin: async (data: FailedLoginData): Promise<{error: any}> => {
    try {
      const { error } = await supabase
        .from('failed_logins')
        .insert([data]);
      
      return { error };
    } catch (error) {
      console.error('Error logging failed login:', error);
      return { error };
    }
  },
  
  // Get recent failed login attempts
  getRecentFailedLogins: async (limit: number = 10): Promise<{data: any[]; error: any}> => {
    try {
      const { data, error } = await supabase
        .from('failed_logins')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      return { data: data || [], error };
    } catch (error) {
      console.error('Error getting failed logins:', error);
      return { data: [], error };
    }
  }
};
