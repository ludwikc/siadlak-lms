
import { User as SupabaseUser } from '@supabase/supabase-js';
import { User as DatabaseUser } from '@/lib/supabase/types';

// Extended User type that includes our custom properties
export interface ExtendedUser extends SupabaseUser {
  is_admin?: boolean;
  discord_id?: string;
  discord_username?: string;
  discord_avatar?: string;
  roles?: string[];
  // Add any other custom fields that might be in the user object
}

// Union type that can be either the basic Supabase user or our extended user
export type AppUser = SupabaseUser | ExtendedUser;

// Admin-specific types
export const ADMIN_DISCORD_IDS = ['404038151565213696', '1040257455592050768', 'ab546fe3-358c-473e-b5a6-cdaf1a623cbf'];

export interface AdminContextType {
  isLoading: boolean;
  courses: number;
  recentlyUpdated: {
    courses: number;
    modules: number;
    lessons: number;
  };
  refreshData: () => Promise<void>;
  isUserAdmin?: boolean;
}
