
import { supabase } from '../client';
import type { Module } from '../types';
import { courseService } from './course.service';
import { ADMIN_DISCORD_IDS } from '@/types/auth';
import type { ExtendedUser } from '@/types/auth';

export const moduleService = {
  getModulesByCourseId: async (courseId: string) => {
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });
    
    return { data, error };
  },
  
  getModuleById: async (moduleId: string) => {
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .eq('id', moduleId)
      .single();
    
    return { data, error };
  },
  
  getModuleBySlug: async (courseSlug: string, moduleSlug: string) => {
    // First get the course ID
    const { data: course } = await courseService.getCourseBySlug(courseSlug);
    
    if (!course) return { data: null, error: new Error('Course not found') };
    
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .eq('course_id', course.id)
      .eq('slug', moduleSlug)
      .single();
    
    return { data, error };
  },
  
  // Enhanced admin check to properly validate user permissions
  isUserAdmin: async () => {
    try {
      // Get the current user with their metadata
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('No user found during admin check');
        return false;
      }
      
      // Cast user to ExtendedUser type for TypeScript
      const extendedUser = user as ExtendedUser;
      
      // Extract all possible Discord ID locations
      const discordId = extendedUser.user_metadata?.discord_id || 
                       extendedUser.user_metadata?.provider_id || 
                       extendedUser.user_metadata?.sub ||
                       '';
      
      // Log the values for debugging
      console.log('Admin check details:', {
        user_id: user.id,
        discord_id: discordId,
        admin_ids: ADMIN_DISCORD_IDS,
        is_admin_flag: extendedUser.user_metadata?.is_admin
      });
      
      // Enhanced check using multiple sources
      const isAdmin = 
        // Check explicit admin flag
        !!extendedUser.user_metadata?.is_admin || 
        // Check if discord ID is in admin list
        (discordId && ADMIN_DISCORD_IDS.includes(discordId)) ||
        // Check if user ID is in admin list
        ADMIN_DISCORD_IDS.includes(user.id);
      
      console.log('Final isUserAdmin determination:', isAdmin);
      
      return isAdmin;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  },
  
  createModule: async (module: Omit<Module, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Check admin status
      const isAdmin = await moduleService.isUserAdmin();
      
      if (!isAdmin) {
        console.error('User is not an admin - cannot create module');
        return { 
          data: null, 
          error: new Error('Only admin users can create modules') 
        };
      }
      
      // Make sure all required fields are present
      if (!module.title || !module.slug || !module.course_id) {
        return { 
          data: null, 
          error: new Error('Missing required fields: title, slug, and course_id are required')
        };
      }

      // Add console.log to debug the module data
      console.log('Creating module with data:', module);
      
      // Use RPC call to bypass RLS
      const { data, error } = await supabase
        .rpc('create_module', { 
          module_title: module.title,
          module_slug: module.slug,
          module_course_id: module.course_id,
          module_order_index: module.order_index,
          module_discord_thread_url: module.discord_thread_url || null
        });
      
      if (error) {
        console.error('Error creating module:', error);
        return { data: null, error };
      }
      
      // Get the newly created module
      const { data: newModule, error: fetchError } = await supabase
        .from('modules')
        .select('*')
        .eq('id', data)
        .single();
        
      if (fetchError) {
        console.error('Error fetching new module:', fetchError);
      }
      
      return { data: newModule, error: fetchError };
    } catch (error) {
      console.error('Unexpected error in createModule:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error creating module') 
      };
    }
  },
  
  updateModule: async (id: string, updates: Partial<Omit<Module, 'id' | 'created_at' | 'updated_at'>>) => {
    try {
      // Check admin status
      const isAdmin = await moduleService.isUserAdmin();
      
      if (!isAdmin) {
        console.error('User is not an admin - cannot update module');
        return { 
          data: null, 
          error: new Error('Only admin users can update modules') 
        };
      }
      
      // Add console.log to debug the update data
      console.log('Updating module with ID:', id, 'and data:', updates);
      
      // Use RPC call to bypass RLS
      const { data, error } = await supabase
        .rpc('update_module', { 
          module_id: id,
          module_title: updates.title,
          module_slug: updates.slug,
          module_course_id: updates.course_id,
          module_order_index: updates.order_index,
          module_discord_thread_url: updates.discord_thread_url
        });
      
      if (error) {
        console.error('Error updating module:', error);
        return { data: null, error };
      }
      
      // Get the updated module
      const { data: updatedModule, error: fetchError } = await supabase
        .from('modules')
        .select('*')
        .eq('id', id)
        .single();
        
      if (fetchError) {
        console.error('Error fetching updated module:', fetchError);
      }
      
      return { data: updatedModule, error: fetchError };
    } catch (error) {
      console.error('Unexpected error in updateModule:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error updating module') 
      };
    }
  },
  
  deleteModule: async (id: string) => {
    try {
      // Check admin status
      const isAdmin = await moduleService.isUserAdmin();
      
      if (!isAdmin) {
        console.error('User is not an admin - cannot delete module');
        return { error: new Error('Only admin users can delete modules') };
      }
      
      // Use RPC call to bypass RLS
      const { error } = await supabase
        .rpc('delete_module', { module_id: id });
      
      return { error };
    } catch (error) {
      console.error('Unexpected error in deleteModule:', error);
      return { 
        error: error instanceof Error ? error : new Error('Unknown error deleting module') 
      };
    }
  },
  
  reorderModules: async (courseId: string, orderedIds: string[]) => {
    try {
      // Check admin status
      const isAdmin = await moduleService.isUserAdmin();
      
      if (!isAdmin) {
        console.error('User is not an admin - cannot reorder modules');
        return { 
          error: new Error('Only admin users can reorder modules') 
        };
      }
      
      // Use RPC call to bypass RLS
      const { error } = await supabase
        .rpc('reorder_modules', { 
          course_id: courseId,
          module_ids: orderedIds 
        });
      
      if (error) {
        console.error('Error reordering modules:', error);
      }
      
      return { error };
    } catch (error) {
      console.error('Error reordering modules:', error);
      return { 
        error: error instanceof Error ? error : new Error('Unknown error reordering modules') 
      };
    }
  }
};
