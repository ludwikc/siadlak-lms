
import { supabase } from '../client';
import type { FailedLogin } from '../types';

export const authService = {
  // Log a failed login attempt
  logFailedLogin: async (data: Omit<FailedLogin, 'id' | 'created_at'>) => {
    try {
      const { data: result, error } = await supabase
        .from('failed_logins')
        .insert(data)
        .select()
        .single();
      
      if (error) {
        console.error('Error logging failed login:', error);
      }
      
      return { data: result, error };
    } catch (err) {
      console.error('Exception in logFailedLogin:', err);
      return { data: null, error: err };
    }
  },
  
  // Get recent failed login attempts (for admin dashboard)
  getRecentFailedLogins: async (limit: number = 50) => {
    try {
      const { data, error } = await supabase
        .from('failed_logins')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      return { data, error };
    } catch (err) {
      console.error('Exception in getRecentFailedLogins:', err);
      return { data: null, error: err };
    }
  },
  
  // Get count of failed logins grouped by reason
  getFailedLoginStats: async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_failed_login_stats'); // We'll create this function later
      
      return { data, error };
    } catch (err) {
      console.error('Exception in getFailedLoginStats:', err);
      return { data: null, error: err };
    }
  }
};
