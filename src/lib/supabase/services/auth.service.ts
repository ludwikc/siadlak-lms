
import { supabase } from '../client';
import { User } from '@supabase/supabase-js';

export const authService = {
  // Check if a user is an admin
  isAdmin: async (userId: string): Promise<boolean> => {
    try {
      // Check if the user is in the admin list
      const { data: userData, error } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error checking admin status:', error);
        return false;
      }
      
      return !!userData?.is_admin;
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
  }
};
