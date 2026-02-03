
import { supabase } from '../client';
import type { User } from '../types';

export const userService = {
  getUserById: async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    return { data, error };
  },
  
  getUserByDiscordId: async (discordId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('discord_id', discordId)
      .single();
    
    return { data, error };
  },
  
  upsertUser: async (user: Omit<User, 'id' | 'created_at' | 'updated_at'>) => {
    // Check if user exists
    const { data: existingUser } = await userService.getUserByDiscordId(user.discord_id);
    
    if (existingUser) {
      // Update user
      const { data, error } = await supabase
        .from('users')
        .update({
          discord_username: user.discord_username,
          discord_avatar: user.discord_avatar,
          last_login: new Date().toISOString()
        })
        .eq('id', existingUser.id)
        .select()
        .single();
      
      return { data, error };
    } else {
      // Create new user
      const { data, error } = await supabase
        .from('users')
        .insert({
          ...user,
          last_login: new Date().toISOString()
        })
        .select()
        .single();
      
      return { data, error };
    }
  },
  
  getUserRoles: async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('discord_role_id')
      .eq('user_id', userId);
    
    return { data, error };
  },
  
  upsertUserRoles: async (userId: string, discordRoleIds: string[]) => {
    // First delete all existing roles from user_roles table
    await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);
    
    // Then insert new roles
    const rolesToInsert = discordRoleIds.map(roleId => ({
      user_id: userId,
      discord_role_id: roleId
    }));
    
    const { data, error } = await supabase
      .from('user_roles')
      .insert(rolesToInsert)
      .select();
    
    return { data, error };
  },

  /**
   * Update the roles array on the users table as well as user_roles table.
   * This ensures both role storage mechanisms are in sync for access control.
   */
  syncUserRoles: async (userId: string, discordRoleIds: string[]) => {
    // Update user_roles table
    const { error: deleteError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);
    
    if (deleteError) {
      console.error('Error deleting old user_roles:', deleteError);
    }
    
    if (discordRoleIds.length > 0) {
      const rolesToInsert = discordRoleIds.map(roleId => ({
        user_id: userId,
        discord_role_id: roleId
      }));
      
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert(rolesToInsert);
      
      if (insertError) {
        console.error('Error inserting user_roles:', insertError);
      }
    }
    
    // Also update the roles array on the users table
    const { data, error } = await supabase
      .from('users')
      .update({ roles: discordRoleIds, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();
    
    return { data, error };
  }
};
